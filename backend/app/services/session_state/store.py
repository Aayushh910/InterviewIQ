from typing import Dict, Any, Optional


class SessionRuntimeStore:
    """
    In-memory runtime store for transient session metadata, active topic overrides,
    and runtime state caches to complement durable PostgreSQL persistence.
    """
    _store: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def get_meta(cls, session_id: str) -> Dict[str, Any]:
        return cls._store.get(session_id, {})

    @classmethod
    def set_meta(cls, session_id: str, key: str, value: Any) -> None:
        cls._store.setdefault(session_id, {})[key] = value

    @classmethod
    def update_meta(cls, session_id: str, data: Dict[str, Any]) -> None:
        cls._store.setdefault(session_id, {}).update(data)

    @classmethod
    def clear(cls, session_id: Optional[str] = None) -> None:
        if session_id:
            cls._store.pop(session_id, None)
        else:
            cls._store.clear()


runtime_store = SessionRuntimeStore()
