
from file_reader import read_file, preview_file
from matching import resolve_preferences
from normalizer import duplicate_names, normalize_participants


def inspect_upload(path, sheet_name=None):
    return preview_file(path, sheet_name)


def import_participants(path, mapping, ranked=True, sheet_name=None):
    frame = read_file(path, sheet_name)
    participants, raw_preferences = normalize_participants(frame, mapping)
    unresolved = resolve_preferences(
        participants,
        raw_preferences,
        ranked=ranked,
    )

    return {
        "participants": participants,
        "unresolved_preferences": unresolved,
        "duplicate_names": duplicate_names(participants),
    }
