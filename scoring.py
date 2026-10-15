
PRIORITY_WEIGHTS = {
    "off": 0,
    "low": 1,
    "medium": 3,
    "high": 7,
}


def priority_value(level):
    key = str(level).strip().lower()

    if key not in PRIORITY_WEIGHTS:
        raise ValueError(
            f"Unknown priority '{level}'. "
            "Use off, low, medium, or high."
        )

    return PRIORITY_WEIGHTS[key]


def rank_value(rank, priorities):
    top = priority_value(priorities.get("top_choices", "high"))
    later = priority_value(
        priorities.get("lower_ranked_preferences", "medium")
    )

    if rank is None:
        return 7 * max(1, later)

    if rank == 1:
        return 12 * top

    # Later requests still matter but gradually fall in value.
    return max(1, (10 - min(rank, 9)) * max(1, later))
