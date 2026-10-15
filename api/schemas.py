
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


PriorityLevel = Literal["off", "low", "medium", "high"]
FairnessMode = Literal[
    "coverage_first",
    "balanced",
    "top_choices",
    "total_satisfaction",
]
ConstraintKind = Literal[
    "must_be_with",
    "cannot_be_with",
    "locked_room",
]


class ImportMappingRequest(BaseModel):
    name_column: str
    preference_columns: list[str]
    id_column: str | None = None
    notes_column: str | None = None
    attribute_columns: dict[str, str] = Field(default_factory=dict)

    @field_validator("preference_columns")
    @classmethod
    def preference_columns_must_be_unique(cls, value: list[str]) -> list[str]:
        if len(value) != len(set(value)):
            raise ValueError("Preference columns must be unique.")
        return value


class EventSettingsRequest(BaseModel):
    event_name: str = Field(min_length=1, max_length=200)
    requests_ranked: bool = True
    fairness_mode: FairnessMode = "coverage_first"
    allow_underfilled_rooms: bool = True
    minimum_room_size: int = Field(default=1, ge=0)
    priorities: dict[str, PriorityLevel] = Field(default_factory=lambda: {
        "avoid_unmatched": "high",
        "top_choices": "high",
        "mutual_preferences": "high",
        "lower_ranked_preferences": "medium",
        "fairness": "high",
        "even_room_sizes": "low",
    })


class RoomRequest(BaseModel):
    room_id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    capacity: int = Field(gt=0)
    attributes: dict[str, str] = Field(default_factory=dict)


class EqualRoomSetupRequest(BaseModel):
    room_capacity: int = Field(gt=0)


class ConstraintRequest(BaseModel):
    kind: ConstraintKind
    participant_id: str = Field(min_length=1)
    target_id: str = Field(min_length=1)


class ResolvePreferenceRequest(BaseModel):
    participant_id: str
    rank: int | None = Field(default=None, ge=1)
    target_id: str


class DismissPreferenceRequest(BaseModel):
    participant_id: str
    rank: int | None = Field(default=None, ge=1)
    requested_name: str | None = None


class OptimizeRequest(BaseModel):
    settings: EventSettingsRequest
    rooms: list[RoomRequest]
    constraints: list[ConstraintRequest] = Field(default_factory=list)
    time_limit_seconds: float = Field(default=30, gt=0, le=300)


class ParticipantResponse(BaseModel):
    participant_id: str
    name: str
    attributes: dict[str, str]
    notes: str | None
    preferences: list[dict[str, Any]]


class ImportResponse(BaseModel):
    upload_id: str
    participants: list[ParticipantResponse]
    unresolved_preferences: list[dict[str, Any]]
    duplicate_names: list[str]


class OptimizeResponse(BaseModel):
    status: str
    assignments: list[dict[str, Any]]
    participant_assignments: dict[str, str]
    stats: dict[str, Any]
    objective_value: float | None


class HealthResponse(BaseModel):
    status: str
