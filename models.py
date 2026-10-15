
from dataclasses import dataclass, field


@dataclass
class Preference:
    target_id: str
    rank: int | None = None


@dataclass
class Participant:
    participant_id: str
    name: str
    preferences: list[Preference] = field(default_factory=list)
    attributes: dict[str, str] = field(default_factory=dict)
    notes: str | None = None


@dataclass
class Room:
    room_id: str
    name: str
    capacity: int
    attributes: dict[str, str] = field(default_factory=dict)


@dataclass
class Constraint:
    kind: str
    participant_id: str
    target_id: str


@dataclass
class ImportMapping:
    name_column: str
    preference_columns: list[str]
    id_column: str | None = None
    notes_column: str | None = None
    attribute_columns: dict[str, str] = field(default_factory=dict)


@dataclass
class EventSettings:
    event_name: str
    requests_ranked: bool = True
    fairness_mode: str = "coverage_first"
    allow_underfilled_rooms: bool = True
    minimum_room_size: int = 1
    priorities: dict[str, str] = field(default_factory=lambda: {
        "avoid_unmatched": "high",
        "top_choices": "high",
        "mutual_preferences": "high",
        "lower_ranked_preferences": "medium",
        "fairness": "high",
        "even_room_sizes": "low",
    })
