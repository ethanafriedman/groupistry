
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from threading import Lock
from uuid import uuid4

from models import Participant


@dataclass
class UploadSession:
    upload_id: str
    source_path: Path
    participants: list[Participant] = field(default_factory=list)
    unresolved_preferences: list[dict] = field(default_factory=list)
    duplicate_names: list[str] = field(default_factory=list)


class SessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, UploadSession] = {}
        self._lock = Lock()

    def create(self, source_path: Path) -> UploadSession:
        upload_id = uuid4().hex

        session = UploadSession(
            upload_id=upload_id,
            source_path=source_path,
        )

        with self._lock:
            self._sessions[upload_id] = session

        return session

    def get(self, upload_id: str) -> UploadSession | None:
        with self._lock:
            return self._sessions.get(upload_id)

    def delete(self, upload_id: str) -> None:
        with self._lock:
            self._sessions.pop(upload_id, None)


store = SessionStore()
