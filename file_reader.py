
from pathlib import Path
import pandas as pd

SUPPORTED_EXTENSIONS = {".csv", ".xlsx", ".xlsm"}


def read_file(path, sheet_name=None):
    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    suffix = path.suffix.lower()

    if suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError("Use CSV, XLSX, or XLSM.")

    if suffix == ".csv":
        return pd.read_csv(path, dtype=str).fillna("")

    return pd.read_excel(
        path,
        sheet_name=0 if sheet_name is None else sheet_name,
        dtype=str,
    ).fillna("")


def preview_file(path, sheet_name=None, rows=5):
    frame = read_file(path, sheet_name)
    return {
        "columns": list(frame.columns),
        "row_count": len(frame),
        "preview": frame.head(rows).to_dict(orient="records"),
    }
