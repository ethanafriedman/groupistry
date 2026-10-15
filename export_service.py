
from pathlib import Path
import pandas as pd


def export_assignments(result, participants, path):
    path = Path(path)
    by_id = {p.participant_id: p for p in participants}
    rows = []

    for room in result.assignments:
        for participant_id in room["participants"]:
            rows.append({
                "room_id": room["room_id"],
                "room_name": room["room_name"],
                "participant_id": participant_id,
                "participant_name": by_id[participant_id].name,
            })

    frame = pd.DataFrame(rows)

    if path.suffix.lower() == ".csv":
        frame.to_csv(path, index=False)
    elif path.suffix.lower() == ".xlsx":
        frame.to_excel(path, index=False)
    else:
        raise ValueError("Export must be CSV or XLSX.")
