
from math import ceil

from models import Room


def make_equal_rooms(participant_count, room_capacity):
    if participant_count < 0:
        raise ValueError("Participant count cannot be negative.")

    if room_capacity <= 0:
        raise ValueError("Room capacity must be greater than zero.")

    room_count = ceil(participant_count / room_capacity)

    return [
        Room(
            room_id=f"R{number:03d}",
            name=f"Room {number}",
            capacity=room_capacity,
        )
        for number in range(1, room_count + 1)
    ]


def validate_rooms(participant_count, rooms):
    total_capacity = sum(room.capacity for room in rooms)

    if total_capacity < participant_count:
        raise ValueError(
            f"Not enough capacity: {participant_count} participants, "
            f"{total_capacity} available spaces."
        )

    for room in rooms:
        if room.capacity <= 0:
            raise ValueError(f"{room.name} has invalid capacity.")
