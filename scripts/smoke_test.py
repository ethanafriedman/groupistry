"""End-to-end API smoke test for a running local Groupistry backend.

Run the backend first:
    uvicorn api.main:app --reload

Then, in another terminal from the project root:
    python scripts/smoke_test.py
"""

from pathlib import Path
import sys

import httpx

BASE_URL = "http://127.0.0.1:8000/api"
SAMPLE = Path(__file__).resolve().parents[1] / "data" / "sample_requests.csv"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def main() -> None:
    print("Groupistry API smoke test")
    print("=" * 28)

    with httpx.Client(base_url=BASE_URL, timeout=30) as client:
        health = client.get("/health")
        require(health.status_code == 200, f"Health check failed: {health.text}")
        print("✓ Backend health check")

        with SAMPLE.open("rb") as handle:
            uploaded = client.post(
                "/uploads",
                files={"file": (SAMPLE.name, handle, "text/csv")},
            )
        require(uploaded.status_code == 200, f"Upload failed: {uploaded.text}")
        upload_id = uploaded.json()["upload_id"]
        print("✓ Sample CSV upload")

        imported = client.post(
            f"/uploads/{upload_id}/import?ranked=true",
            json={
                "name_column": "Name",
                "preference_columns": [
                    "Preference 1",
                    "Preference 2",
                    "Preference 3",
                ],
                "attribute_columns": {"group": "Group"},
            },
        )
        require(imported.status_code == 200, f"Import failed: {imported.text}")
        payload = imported.json()
        require(not payload["unresolved_preferences"], "Sample data should resolve cleanly.")
        participants = payload["participants"]
        require(len(participants) == 6, "Expected 6 sample participants.")
        ids = {person["name"]: person["participant_id"] for person in participants}
        print("✓ Column mapping and preference import")

        generated = client.post(
            f"/uploads/{upload_id}/rooms/equal",
            json={"room_capacity": 3},
        )
        require(generated.status_code == 200, f"Room generation failed: {generated.text}")
        rooms = generated.json()["rooms"]
        require(sum(room["capacity"] for room in rooms) >= 6, "Not enough generated capacity.")
        print("✓ Fixed-capacity group generation")

        settings = {
            "event_name": "Smoke Test",
            "requests_ranked": True,
            "fairness_mode": "coverage_first",
            "allow_underfilled_rooms": True,
            "minimum_room_size": 1,
            "priorities": {
                "avoid_unmatched": "high",
                "top_choices": "high",
                "mutual_preferences": "high",
                "lower_ranked_preferences": "medium",
                "fairness": "high",
                "even_room_sizes": "low",
            },
        }

        def optimize(constraints: list[dict]) -> dict:
            response = client.post(
                f"/uploads/{upload_id}/optimize",
                json={
                    "settings": settings,
                    "rooms": rooms,
                    "constraints": constraints,
                    "time_limit_seconds": 10,
                },
            )
            require(response.status_code == 200, f"Optimization failed: {response.text}")
            result = response.json()
            require(result["participant_assignments"], "No assignments returned.")
            return result

        baseline = optimize([])
        assignments = baseline["participant_assignments"]
        require(len(assignments) == 6, "Every participant should be assigned exactly once.")
        for room_id, count in baseline["stats"]["room_sizes"].items():
            room_capacity = next(room["capacity"] for room in rooms if room["room_id"] == room_id)
            require(count <= room_capacity, f"Capacity exceeded in {room_id}.")
        print("✓ Baseline optimization and capacity enforcement")

        cannot = optimize([
            {
                "kind": "cannot_be_with",
                "participant_id": ids["Alex Morgan"],
                "target_id": ids["Jordan Lee"],
            }
        ])
        require(
            cannot["participant_assignments"][ids["Alex Morgan"]]
            != cannot["participant_assignments"][ids["Jordan Lee"]],
            "cannot_be_with was not enforced.",
        )
        print("✓ cannot_be_with hard constraint")

        must = optimize([
            {
                "kind": "must_be_with",
                "participant_id": ids["Alex Morgan"],
                "target_id": ids["Jordan Lee"],
            }
        ])
        require(
            must["participant_assignments"][ids["Alex Morgan"]]
            == must["participant_assignments"][ids["Jordan Lee"]],
            "must_be_with was not enforced.",
        )
        print("✓ must_be_with hard constraint")

        deleted = client.delete(f"/uploads/{upload_id}")
        require(deleted.status_code == 200, f"Cleanup failed: {deleted.text}")
        print("✓ Temporary session cleanup")

    print("\nAll smoke tests passed.")


if __name__ == "__main__":
    try:
        main()
    except (httpx.ConnectError, httpx.ConnectTimeout):
        print("Could not reach the backend at http://127.0.0.1:8000.")
        print("Start it first with: uvicorn api.main:app --reload")
        sys.exit(1)
    except AssertionError as exc:
        print(f"\nFAILED: {exc}")
        sys.exit(1)
