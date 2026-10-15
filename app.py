
from import_service import import_participants
from models import Constraint, EventSettings, ImportMapping
from optimizer import optimize_assignments
from room_service import make_equal_rooms


def main():
    mapping = ImportMapping(
        name_column="Name",
        preference_columns=[
            "Preference 1",
            "Preference 2",
            "Preference 3",
        ],
        attribute_columns={
            "group": "Group",
        },
    )

    settings = EventSettings(
        event_name="Example Event",
        requests_ranked=True,
        fairness_mode="coverage_first",
    )

    imported = import_participants(
        "data/sample_requests.xlsx",
        mapping,
        ranked=settings.requests_ranked,
    )

    participants = imported["participants"]

    if imported["unresolved_preferences"]:
        print("Unresolved preferences:")
        for item in imported["unresolved_preferences"]:
            print(
                f"- {item['participant_name']} -> "
                f"{item['requested_name']}"
            )
        print()

    rooms = make_equal_rooms(
        participant_count=len(participants),
        room_capacity=3,
    )

    # These are private admin rules. Add as many or as few as needed.
    constraints = [
        # Constraint("must_be_with", "P0001", "P0002"),
        # Constraint("cannot_be_with", "P0003", "P0004"),
        # Constraint("locked_room", "P0005", "R001"),
    ]

    result = optimize_assignments(
        participants,
        rooms,
        constraints=constraints,
        settings=settings,
        time_limit_seconds=10,
    )

    print("Status:", result.status)
    print()

    by_id = {p.participant_id: p for p in participants}

    for room in result.assignments:
        names = [
            by_id[participant_id].name
            for participant_id in room["participants"]
        ]

        print(
            f"{room['room_name']} "
            f"({len(names)}/{room['capacity']}): "
            + ", ".join(names)
        )

    print()
    print("Coverage:", f"{result.stats['coverage_rate']:.1%}")
    print(
        "People with at least one requested person:",
        result.stats["participants_with_a_match"],
    )
    print(
        "People with no requested person:",
        result.stats["participants_without_a_match"],
    )
    print(
        "Top choices honored:",
        result.stats["top_choices_honored"],
    )
    print(
        "Mutual pairs honored:",
        result.stats["mutual_pairs_honored"],
    )


if __name__ == "__main__":
    main()
