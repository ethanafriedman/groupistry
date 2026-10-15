
from __future__ import annotations

from pathlib import Path
from tempfile import NamedTemporaryFile
import os

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import FileResponse

from api.converters import (
    to_constraints,
    to_event_settings,
    to_import_mapping,
    to_rooms,
)
from api.errors import bad_request, not_found
from api.schemas import (
    DismissPreferenceRequest,
    EqualRoomSetupRequest,
    HealthResponse,
    ImportMappingRequest,
    ImportResponse,
    OptimizeRequest,
    OptimizeResponse,
    ResolvePreferenceRequest,
)
from api.store import store
from export_service import export_assignments
from file_reader import preview_file
from import_service import import_participants
from matching import normalize_name
from models import Preference
from optimizer import optimize_assignments
from room_service import make_equal_rooms


router = APIRouter()


def _participant_payload(participant):
    return {
        "participant_id": participant.participant_id,
        "name": participant.name,
        "attributes": participant.attributes,
        "notes": participant.notes,
        "preferences": [
            {
                "target_id": preference.target_id,
                "rank": preference.rank,
            }
            for preference in participant.preferences
        ],
    }


def _session_or_404(upload_id: str):
    session = store.get(upload_id)

    if session is None:
        raise not_found(f"Upload session '{upload_id}' was not found.")

    return session


@router.get("/health", response_model=HealthResponse)
def health():
    return {"status": "ok"}


@router.post("/uploads")
async def upload_file(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()

    if suffix not in {".csv", ".xlsx", ".xlsm"}:
        raise bad_request("Upload must be CSV, XLSX, or XLSM.")

    with NamedTemporaryFile(
        delete=False,
        suffix=suffix,
        prefix="group_assignment_",
    ) as temp:
        while chunk := await file.read(1024 * 1024):
            temp.write(chunk)

        temp_path = Path(temp.name)

    try:
        preview = preview_file(temp_path)
    except Exception as exc:
        temp_path.unlink(missing_ok=True)
        raise bad_request(str(exc)) from exc

    session = store.create(temp_path)

    return {
        "upload_id": session.upload_id,
        "filename": file.filename,
        **preview,
    }


@router.post(
    "/uploads/{upload_id}/import",
    response_model=ImportResponse,
)
def import_upload(
    upload_id: str,
    mapping: ImportMappingRequest,
    ranked: bool = True,
):
    session = _session_or_404(upload_id)

    try:
        result = import_participants(
            session.source_path,
            to_import_mapping(mapping),
            ranked=ranked,
        )
    except Exception as exc:
        raise bad_request(str(exc)) from exc

    session.participants = result["participants"]
    session.unresolved_preferences = result["unresolved_preferences"]
    session.duplicate_names = result["duplicate_names"]

    return {
        "upload_id": upload_id,
        "participants": [
            _participant_payload(participant)
            for participant in session.participants
        ],
        "unresolved_preferences": session.unresolved_preferences,
        "duplicate_names": session.duplicate_names,
    }


@router.get("/uploads/{upload_id}/participants")
def get_participants(upload_id: str):
    session = _session_or_404(upload_id)

    return {
        "participants": [
            _participant_payload(participant)
            for participant in session.participants
        ]
    }


@router.post("/uploads/{upload_id}/resolve-preference")
def resolve_preference(
    upload_id: str,
    data: ResolvePreferenceRequest,
):
    session = _session_or_404(upload_id)

    participants_by_id = {
        participant.participant_id: participant
        for participant in session.participants
    }

    participant = participants_by_id.get(data.participant_id)

    if participant is None:
        raise bad_request(
            f"Unknown participant '{data.participant_id}'."
        )

    if data.target_id not in participants_by_id:
        raise bad_request(
            f"Unknown target participant '{data.target_id}'."
        )

    if data.participant_id == data.target_id:
        raise bad_request("A participant cannot request themselves.")

    existing = {
        preference.target_id
        for preference in participant.preferences
    }

    if data.target_id not in existing:
        participant.preferences.append(
            Preference(
                target_id=data.target_id,
                rank=data.rank,
            )
        )

    remaining = []

    for item in session.unresolved_preferences:
        same_person = item["participant_id"] == data.participant_id
        same_rank = data.rank is None or item.get("rank") == data.rank

        if same_person and same_rank:
            continue

        remaining.append(item)

    session.unresolved_preferences = remaining

    return {
        "participant": _participant_payload(participant),
        "unresolved_preferences": session.unresolved_preferences,
    }


@router.post("/uploads/{upload_id}/dismiss-preference")
def dismiss_preference(
    upload_id: str,
    data: DismissPreferenceRequest,
):
    session = _session_or_404(upload_id)

    remaining = []
    removed = []

    for item in session.unresolved_preferences:
        same_person = item["participant_id"] == data.participant_id
        same_rank = data.rank is None or item.get("rank") == data.rank
        same_name = (
            data.requested_name is None
            or item.get("requested_name") == data.requested_name
        )

        if same_person and same_rank and same_name:
            removed.append(item)
        else:
            remaining.append(item)

    if not removed:
        raise bad_request("No matching unresolved preference was found.")

    session.unresolved_preferences = remaining

    return {
        "dismissed": removed,
        "unresolved_preferences": session.unresolved_preferences,
    }


@router.post("/uploads/{upload_id}/rooms/equal")
def build_equal_rooms(
    upload_id: str,
    setup: EqualRoomSetupRequest,
):
    session = _session_or_404(upload_id)

    if not session.participants:
        raise bad_request(
            "Import participants before generating rooms."
        )

    rooms = make_equal_rooms(
        participant_count=len(session.participants),
        room_capacity=setup.room_capacity,
    )

    return {
        "rooms": [
            {
                "room_id": room.room_id,
                "name": room.name,
                "capacity": room.capacity,
                "attributes": room.attributes,
            }
            for room in rooms
        ]
    }


@router.post(
    "/uploads/{upload_id}/optimize",
    response_model=OptimizeResponse,
)
def optimize_upload(
    upload_id: str,
    request: OptimizeRequest,
):
    session = _session_or_404(upload_id)

    if not session.participants:
        raise bad_request(
            "Import participants before running the optimizer."
        )

    if session.unresolved_preferences:
        raise bad_request(
            "Resolve or dismiss unresolved preferences before optimizing."
        )

    try:
        result = optimize_assignments(
            participants=session.participants,
            rooms=to_rooms(request.rooms),
            constraints=to_constraints(request.constraints),
            settings=to_event_settings(request.settings),
            time_limit_seconds=request.time_limit_seconds,
        )
    except Exception as exc:
        raise bad_request(str(exc)) from exc

    return {
        "status": result.status,
        "assignments": result.assignments,
        "participant_assignments": result.participant_assignments,
        "stats": result.stats,
        "objective_value": result.objective_value,
    }


@router.post("/uploads/{upload_id}/export")
def export_upload(
    upload_id: str,
    request: OptimizeRequest,
    file_type: str = "xlsx",
):
    session = _session_or_404(upload_id)

    if file_type not in {"xlsx", "csv"}:
        raise bad_request("file_type must be 'xlsx' or 'csv'.")

    if session.unresolved_preferences:
        raise bad_request(
            "Resolve or dismiss unresolved preferences before exporting."
        )

    try:
        result = optimize_assignments(
            participants=session.participants,
            rooms=to_rooms(request.rooms),
            constraints=to_constraints(request.constraints),
            settings=to_event_settings(request.settings),
            time_limit_seconds=request.time_limit_seconds,
        )
    except Exception as exc:
        raise bad_request(str(exc)) from exc

    if not result.assignments:
        raise bad_request(
            f"No assignment was produced. Solver status: {result.status}"
        )

    suffix = f".{file_type}"

    with NamedTemporaryFile(
        delete=False,
        suffix=suffix,
        prefix="group_assignments_",
    ) as temp:
        output_path = Path(temp.name)

    export_assignments(
        result,
        session.participants,
        output_path,
    )

    media_type = (
        "text/csv"
        if file_type == "csv"
        else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    return FileResponse(
        path=output_path,
        filename=f"assignments.{file_type}",
        media_type=media_type,
    )


@router.delete("/uploads/{upload_id}")
def delete_upload(upload_id: str):
    session = _session_or_404(upload_id)

    session.source_path.unlink(missing_ok=True)
    store.delete(upload_id)

    return {"deleted": True}
