
import io
import unittest

from fastapi.testclient import TestClient

from api.main import app


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health(self):
        response = self.client.get("/api/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_rejects_wrong_upload_type(self):
        response = self.client.post(
            "/api/uploads",
            files={
                "file": (
                    "people.txt",
                    io.BytesIO(b"hello"),
                    "text/plain",
                )
            },
        )

        self.assertEqual(response.status_code, 400)

    def test_upload_and_import_csv(self):
        csv_data = (
            "Name,Preference 1,Preference 2\n"
            "Alex,Jordan,\n"
            "Jordan,Alex,\n"
        )

        upload = self.client.post(
            "/api/uploads",
            files={
                "file": (
                    "people.csv",
                    io.BytesIO(csv_data.encode()),
                    "text/csv",
                )
            },
        )

        self.assertEqual(upload.status_code, 200)

        upload_id = upload.json()["upload_id"]

        imported = self.client.post(
            f"/api/uploads/{upload_id}/import?ranked=true",
            json={
                "name_column": "Name",
                "preference_columns": [
                    "Preference 1",
                    "Preference 2",
                ],
                "attribute_columns": {},
            },
        )

        self.assertEqual(imported.status_code, 200)
        self.assertEqual(
            len(imported.json()["participants"]),
            2,
        )
        self.assertEqual(
            imported.json()["unresolved_preferences"],
            [],
        )

        deleted = self.client.delete(
            f"/api/uploads/{upload_id}"
        )

        self.assertEqual(deleted.status_code, 200)


if __name__ == "__main__":
    unittest.main()
