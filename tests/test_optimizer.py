
import unittest

from models import Constraint, EventSettings, Participant, Preference, Room
from optimizer import optimize_assignments


class OptimizerTests(unittest.TestCase):
    def people(self):
        return [
            Participant("P1", "Alex", [Preference("P2", 1)]),
            Participant("P2", "Jordan", [Preference("P1", 1)]),
            Participant("P3", "Taylor", [Preference("P4", 1)]),
            Participant("P4", "Casey", [Preference("P3", 1)]),
        ]

    def rooms(self):
        return [
            Room("R1", "Room 1", 2),
            Room("R2", "Room 2", 2),
        ]

    def test_everyone_gets_assigned(self):
        result = optimize_assignments(
            self.people(),
            self.rooms(),
            settings=EventSettings(event_name="Test"),
            time_limit_seconds=5,
        )
        self.assertEqual(len(result.participant_assignments), 4)

    def test_capacity_is_respected(self):
        result = optimize_assignments(
            self.people(),
            self.rooms(),
            settings=EventSettings(event_name="Test"),
            time_limit_seconds=5,
        )
        self.assertLessEqual(result.stats["room_sizes"]["R1"], 2)
        self.assertLessEqual(result.stats["room_sizes"]["R2"], 2)

    def test_must_be_with(self):
        result = optimize_assignments(
            self.people(),
            self.rooms(),
            constraints=[
                Constraint("must_be_with", "P1", "P3"),
            ],
            settings=EventSettings(event_name="Test"),
            time_limit_seconds=5,
        )
        self.assertEqual(
            result.participant_assignments["P1"],
            result.participant_assignments["P3"],
        )

    def test_cannot_be_with(self):
        result = optimize_assignments(
            self.people(),
            self.rooms(),
            constraints=[
                Constraint("cannot_be_with", "P1", "P2"),
            ],
            settings=EventSettings(event_name="Test"),
            time_limit_seconds=5,
        )
        self.assertNotEqual(
            result.participant_assignments["P1"],
            result.participant_assignments["P2"],
        )

    def test_locked_room(self):
        result = optimize_assignments(
            self.people(),
            self.rooms(),
            constraints=[
                Constraint("locked_room", "P1", "R2"),
            ],
            settings=EventSettings(event_name="Test"),
            time_limit_seconds=5,
        )
        self.assertEqual(result.participant_assignments["P1"], "R2")


if __name__ == "__main__":
    unittest.main()
