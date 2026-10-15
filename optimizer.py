
from dataclasses import dataclass
import math

from ortools.sat.python import cp_model

from constraint_service import validate_constraints
from models import EventSettings
from scoring import priority_value, rank_value


@dataclass
class OptimizationResult:
    status: str
    assignments: list[dict]
    participant_assignments: dict[str, str]
    stats: dict
    objective_value: float | None = None


def optimize_assignments(
    participants,
    rooms,
    constraints=None,
    settings=None,
    time_limit_seconds=30,
):
    constraints = constraints or []
    settings = settings or EventSettings(event_name="Untitled")

    if not participants:
        raise ValueError("At least one participant is required.")

    if not rooms:
        raise ValueError("At least one room is required.")

    if sum(room.capacity for room in rooms) < len(participants):
        raise ValueError("There is not enough total room capacity.")

    validate_constraints(constraints, participants, rooms)

    participant_ids = {p.participant_id for p in participants}
    participant_by_id = {p.participant_id: p for p in participants}

    for participant in participants:
        for preference in participant.preferences:
            if preference.target_id not in participant_ids:
                raise ValueError(
                    f"{participant.name} has a preference for unknown "
                    f"participant '{preference.target_id}'."
                )

    model = cp_model.CpModel()

    # x[(participant, room)] = 1 only when that participant is in that room.
    x = {}

    for participant in participants:
        for room in rooms:
            x[(participant.participant_id, room.room_id)] = (
                model.new_bool_var(
                    f"x_{participant.participant_id}_{room.room_id}"
                )
            )

    # Structural rule 1: everyone must be assigned exactly once.
    for participant in participants:
        model.add(
            sum(
                x[(participant.participant_id, room.room_id)]
                for room in rooms
            ) == 1
        )

    room_sizes = {}

    # Structural rule 2: capacity can never be exceeded.
    for room in rooms:
        size = model.new_int_var(
            0,
            room.capacity,
            f"size_{room.room_id}",
        )

        model.add(
            size == sum(
                x[(participant.participant_id, room.room_id)]
                for participant in participants
            )
        )

        room_sizes[room.room_id] = size

        if not settings.allow_underfilled_rooms:
            model.add(size == room.capacity)

        elif settings.minimum_room_size > 1:
            used = model.new_bool_var(f"used_{room.room_id}")

            model.add(size == 0).only_enforce_if(used.Not())
            model.add(size >= 1).only_enforce_if(used)
            model.add(
                size >= settings.minimum_room_size
            ).only_enforce_if(used)

    same_room_cache = {}

    def same_room(first_id, second_id):
        key = tuple(sorted((first_id, second_id)))

        if key in same_room_cache:
            return same_room_cache[key]

        together_by_room = []

        for room in rooms:
            both = model.new_bool_var(
                f"both_{key[0]}_{key[1]}_{room.room_id}"
            )

            first = x[(key[0], room.room_id)]
            second = x[(key[1], room.room_id)]

            model.add(both <= first)
            model.add(both <= second)
            model.add(both >= first + second - 1)

            together_by_room.append(both)

        together = model.new_bool_var(
            f"together_{key[0]}_{key[1]}"
        )

        model.add(together == sum(together_by_room))
        same_room_cache[key] = together
        return together

    # Admin-only hard rules.
    for constraint in constraints:
        if constraint.kind == "locked_room":
            model.add(
                x[(constraint.participant_id, constraint.target_id)] == 1
            )

        elif constraint.kind == "must_be_with":
            model.add(
                same_room(
                    constraint.participant_id,
                    constraint.target_id,
                ) == 1
            )

        elif constraint.kind == "cannot_be_with":
            model.add(
                same_room(
                    constraint.participant_id,
                    constraint.target_id,
                ) == 0
            )

    priorities = settings.priorities
    has_match = {}
    preference_terms = []
    requested_pairs = set()

    # Soft preferences.
    for participant in participants:
        matches = []
        seen_targets = set()

        for preference in participant.preferences:
            target_id = preference.target_id

            if target_id == participant.participant_id:
                continue

            if target_id in seen_targets:
                continue

            seen_targets.add(target_id)

            matched = same_room(
                participant.participant_id,
                target_id,
            )

            matches.append(matched)
            requested_pairs.add(
                (participant.participant_id, target_id)
            )

            preference_terms.append(
                rank_value(preference.rank, priorities) * matched
            )

        any_match = model.new_bool_var(
            f"has_match_{participant.participant_id}"
        )

        if matches:
            model.add_max_equality(any_match, matches)
        else:
            model.add(any_match == 0)

        has_match[participant.participant_id] = any_match

    coverage_total = sum(has_match.values())
    preference_total = sum(preference_terms) if preference_terms else 0

    # Reward mutual requests once per pair.
    mutual_weight = (
        8 * priority_value(
            priorities.get("mutual_preferences", "high")
        )
    )

    mutual_pairs = set()

    for first_id, second_id in requested_pairs:
        if (second_id, first_id) in requested_pairs:
            mutual_pairs.add(tuple(sorted((first_id, second_id))))

    mutual_terms = [
        mutual_weight * same_room(first_id, second_id)
        for first_id, second_id in sorted(mutual_pairs)
        if mutual_weight
    ]

    mutual_total = sum(mutual_terms) if mutual_terms else 0

    # Soft room-balance penalty.
    room_balance_weight = priority_value(
        priorities.get("even_room_sizes", "low")
    )

    room_balance_terms = []

    if room_balance_weight and len(rooms) > 1:
        low_target = len(participants) // len(rooms)
        high_target = math.ceil(len(participants) / len(rooms))

        for room in rooms:
            below = model.new_int_var(
                0,
                room.capacity,
                f"below_{room.room_id}",
            )

            above = model.new_int_var(
                0,
                room.capacity,
                f"above_{room.room_id}",
            )

            model.add(
                below >= low_target - room_sizes[room.room_id]
            )
            model.add(
                above >= room_sizes[room.room_id] - high_target
            )

            room_balance_terms.extend([below, above])

    room_balance_penalty = (
        room_balance_weight * sum(room_balance_terms)
        if room_balance_terms
        else 0
    )

    coverage_weight = (
        25 * priority_value(
            priorities.get("avoid_unmatched", "high")
        )
    )

    fairness_weight = (
        4 * priority_value(
            priorities.get("fairness", "high")
        )
    )

    quality_score = (
        preference_total
        + mutual_total
        + fairness_weight * coverage_total
        - room_balance_penalty
    )

    mode = settings.fairness_mode.strip().lower()

    valid_modes = {
        "coverage_first",
        "balanced",
        "top_choices",
        "total_satisfaction",
    }

    if mode not in valid_modes:
        raise ValueError(
            "fairness_mode must be one of: "
            + ", ".join(sorted(valid_modes))
        )

    def new_solver():
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = time_limit_seconds
        solver.parameters.num_search_workers = 8
        return solver

    solver = new_solver()

    # coverage_first is lexicographic:
    # 1. maximize number of people with >=1 requested person
    # 2. lock that best coverage
    # 3. improve rank quality and mutual requests
    if mode == "coverage_first":
        model.maximize(coverage_total)
        status = solver.solve(model)

        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            return OptimizationResult(
                solver.status_name(status), [], {}, {}
            )

        best_coverage = int(solver.value(coverage_total))
        model.add(coverage_total == best_coverage)

        model.maximize(quality_score)
        solver = new_solver()
        status = solver.solve(model)

    elif mode == "top_choices":
        top_choice_vars = []

        for participant in participants:
            for preference in participant.preferences:
                if preference.rank == 1:
                    top_choice_vars.append(
                        same_room(
                            participant.participant_id,
                            preference.target_id,
                        )
                    )

        top_choice_total = (
            sum(top_choice_vars)
            if top_choice_vars
            else 0
        )

        model.maximize(top_choice_total)
        status = solver.solve(model)

        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            return OptimizationResult(
                solver.status_name(status), [], {}, {}
            )

        best_top = int(solver.value(top_choice_total))
        model.add(top_choice_total == best_top)

        model.maximize(
            coverage_weight * coverage_total + quality_score
        )
        solver = new_solver()
        status = solver.solve(model)

    elif mode == "total_satisfaction":
        model.maximize(
            preference_total
            + mutual_total
            - room_balance_penalty
        )
        status = solver.solve(model)

    else:
        model.maximize(
            coverage_weight * coverage_total
            + quality_score
        )
        status = solver.solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return OptimizationResult(
            solver.status_name(status), [], {}, {}
        )

    participant_assignments = {}
    rooms_out = {room.room_id: [] for room in rooms}

    for participant in participants:
        for room in rooms:
            if solver.value(
                x[(participant.participant_id, room.room_id)]
            ):
                participant_assignments[
                    participant.participant_id
                ] = room.room_id
                rooms_out[room.room_id].append(
                    participant.participant_id
                )
                break

    assignments = [
        {
            "room_id": room.room_id,
            "room_name": room.name,
            "capacity": room.capacity,
            "participants": rooms_out[room.room_id],
        }
        for room in rooms
    ]

    stats = evaluate_assignments(
        participants,
        rooms,
        participant_assignments,
        mutual_pairs,
    )

    stats["fairness_mode"] = mode

    return OptimizationResult(
        status=solver.status_name(status),
        assignments=assignments,
        participant_assignments=participant_assignments,
        stats=stats,
        objective_value=solver.objective_value,
    )


def evaluate_assignments(
    participants,
    rooms,
    participant_assignments,
    mutual_pairs=None,
):
    mutual_pairs = mutual_pairs or set()

    matched_people = 0
    people_with_preferences = 0
    total_preferences_honored = 0
    top_choices_honored = 0
    per_person = {}

    for participant in participants:
        if participant.preferences:
            people_with_preferences += 1

        room_id = participant_assignments.get(
            participant.participant_id
        )

        matched = []

        for preference in participant.preferences:
            if (
                room_id is not None
                and room_id
                == participant_assignments.get(preference.target_id)
            ):
                matched.append(preference)

        if matched:
            matched_people += 1

        total_preferences_honored += len(matched)

        if any(p.rank == 1 for p in matched):
            top_choices_honored += 1

        per_person[participant.participant_id] = {
            "name": participant.name,
            "room_id": room_id,
            "matched_preference_ids": [
                p.target_id for p in matched
            ],
            "matched_ranks": [
                p.rank for p in matched
            ],
            "preference_count": len(participant.preferences),
        }

    room_sizes = {
        room.room_id: sum(
            1
            for assigned_room in participant_assignments.values()
            if assigned_room == room.room_id
        )
        for room in rooms
    }

    mutual_honored = sum(
        1
        for first_id, second_id in mutual_pairs
        if participant_assignments.get(first_id)
        == participant_assignments.get(second_id)
    )

    return {
        "participant_count": len(participants),
        "people_with_preferences": people_with_preferences,
        "participants_with_a_match": matched_people,
        "participants_without_a_match": len(participants) - matched_people,
        "coverage_rate": (
            matched_people / len(participants)
            if participants
            else 0
        ),
        "total_preferences_honored": total_preferences_honored,
        "top_choices_honored": top_choices_honored,
        "mutual_pairs_honored": mutual_honored,
        "room_sizes": room_sizes,
        "per_person": per_person,
    }
