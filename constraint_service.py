
VALID_CONSTRAINTS = {
    "must_be_with",
    "cannot_be_with",
    "locked_room",
}


def validate_constraints(constraints, participants, rooms):
    participant_ids = {p.participant_id for p in participants}
    room_ids = {r.room_id for r in rooms}
    must_pairs = set()
    cannot_pairs = set()
    locked = {}

    for constraint in constraints:
        if constraint.kind not in VALID_CONSTRAINTS:
            raise ValueError(f"Unknown constraint: {constraint.kind}")

        if constraint.participant_id not in participant_ids:
            raise ValueError(
                f"Unknown participant: {constraint.participant_id}"
            )

        if constraint.kind == "locked_room":
            if constraint.target_id not in room_ids:
                raise ValueError(f"Unknown room: {constraint.target_id}")

            existing = locked.get(constraint.participant_id)

            if existing and existing != constraint.target_id:
                raise ValueError(
                    f"{constraint.participant_id} is locked to multiple rooms."
                )

            locked[constraint.participant_id] = constraint.target_id
            continue

        if constraint.target_id not in participant_ids:
            raise ValueError(f"Unknown participant: {constraint.target_id}")

        if constraint.participant_id == constraint.target_id:
            raise ValueError("A participant cannot constrain themselves.")

        pair = tuple(sorted((
            constraint.participant_id,
            constraint.target_id,
        )))

        if constraint.kind == "must_be_with":
            must_pairs.add(pair)
        else:
            cannot_pairs.add(pair)

    conflict = must_pairs & cannot_pairs

    if conflict:
        first, second = next(iter(conflict))
        raise ValueError(
            f"{first} and {second} cannot be both must-be-with "
            "and cannot-be-with."
        )

    for first, second in must_pairs:
        if (
            first in locked
            and second in locked
            and locked[first] != locked[second]
        ):
            raise ValueError(
                f"{first} and {second} must be together but are locked "
                "to different rooms."
            )
