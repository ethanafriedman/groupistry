
from difflib import SequenceMatcher

from models import Preference


def normalize_name(name):
    return " ".join(name.lower().strip().split())


def build_name_map(participants):
    result = {}

    for participant in participants:
        key = normalize_name(participant.name)
        result.setdefault(key, []).append(participant)

    return result


def find_suggestions(requested_name, participants, limit=3, minimum_score=0.65):
    requested = normalize_name(requested_name)
    matches = []

    for participant in participants:
        candidate = normalize_name(participant.name)
        score = SequenceMatcher(None, requested, candidate).ratio()

        if score >= minimum_score:
            matches.append({
                "participant_id": participant.participant_id,
                "name": participant.name,
                "score": round(score, 3),
            })

    matches.sort(key=lambda item: item["score"], reverse=True)
    return matches[:limit]


def resolve_preferences(participants, raw_preferences, ranked=True):
    by_id = {p.participant_id: p for p in participants}
    names = build_name_map(participants)
    unresolved = []

    for participant_id, requested_names in raw_preferences.items():
        participant = by_id[participant_id]

        for rank, requested_name in enumerate(requested_names, start=1):
            matches = names.get(normalize_name(requested_name), [])

            if len(matches) == 1:
                participant.preferences.append(
                    Preference(
                        target_id=matches[0].participant_id,
                        rank=rank if ranked else None,
                    )
                )
                continue

            unresolved.append({
                "participant_id": participant_id,
                "participant_name": participant.name,
                "requested_name": requested_name,
                "rank": rank if ranked else None,
                "reason": "duplicate_name" if len(matches) > 1 else "no_exact_match",
                "suggestions": find_suggestions(requested_name, participants),
            })

    return unresolved
