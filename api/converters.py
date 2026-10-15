
from models import (
    Constraint,
    EventSettings,
    ImportMapping,
    Preference,
    Room,
)

from api.schemas import (
    ConstraintRequest,
    EventSettingsRequest,
    ImportMappingRequest,
    RoomRequest,
)


def to_import_mapping(data: ImportMappingRequest) -> ImportMapping:
    return ImportMapping(
        name_column=data.name_column,
        preference_columns=data.preference_columns,
        id_column=data.id_column,
        notes_column=data.notes_column,
        attribute_columns=data.attribute_columns,
    )


def to_event_settings(data: EventSettingsRequest) -> EventSettings:
    return EventSettings(
        event_name=data.event_name,
        requests_ranked=data.requests_ranked,
        fairness_mode=data.fairness_mode,
        allow_underfilled_rooms=data.allow_underfilled_rooms,
        minimum_room_size=data.minimum_room_size,
        priorities=data.priorities,
    )


def to_rooms(data: list[RoomRequest]) -> list[Room]:
    return [
        Room(
            room_id=room.room_id,
            name=room.name,
            capacity=room.capacity,
            attributes=room.attributes,
        )
        for room in data
    ]


def to_constraints(data: list[ConstraintRequest]) -> list[Constraint]:
    return [
        Constraint(
            kind=item.kind,
            participant_id=item.participant_id,
            target_id=item.target_id,
        )
        for item in data
    ]
