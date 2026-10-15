
import re
from collections import Counter

from models import Participant


def clean_text(value):
    if value is None:
        return None

    text = str(value).strip()
    return text or None


def clean_name(value):
    text = clean_text(value)

    if not text:
        return None

    return re.sub(r"\s+", " ", text)


def make_participant_id(row_number):
    return f"P{row_number:04d}"


def normalize_participants(frame, mapping):
    columns = [mapping.name_column, *mapping.preference_columns]

    if mapping.id_column:
        columns.append(mapping.id_column)

    if mapping.notes_column:
        columns.append(mapping.notes_column)

    columns.extend(mapping.attribute_columns.values())

    missing = [column for column in columns if column not in frame.columns]

    if missing:
        raise ValueError(
            "Missing mapped columns: " + ", ".join(sorted(set(missing)))
        )

    participants = []
    raw_preferences = {}
    seen_ids = set()

    for index, row in frame.iterrows():
        name = clean_name(row[mapping.name_column])

        if not name:
            continue

        participant_id = (
            clean_text(row[mapping.id_column])
            if mapping.id_column
            else make_participant_id(index + 1)
        )

        if not participant_id:
            participant_id = make_participant_id(index + 1)

        if participant_id in seen_ids:
            raise ValueError(f"Duplicate participant ID: {participant_id}")

        seen_ids.add(participant_id)

        attributes = {}

        for field_name, column_name in mapping.attribute_columns.items():
            value = clean_text(row[column_name])

            if value is not None:
                attributes[field_name] = value

        requests = []

        for column in mapping.preference_columns:
            request_name = clean_name(row[column])

            if request_name and request_name.lower() != name.lower():
                requests.append(request_name)

        participant = Participant(
            participant_id=participant_id,
            name=name,
            attributes=attributes,
            notes=clean_text(row[mapping.notes_column])
            if mapping.notes_column
            else None,
        )

        participants.append(participant)
        raw_preferences[participant_id] = requests

    return participants, raw_preferences


def duplicate_names(participants):
    counts = Counter(p.name.lower() for p in participants)

    return sorted({
        p.name
        for p in participants
        if counts[p.name.lower()] > 1
    })
