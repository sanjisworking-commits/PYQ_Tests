from datetime import datetime, timezone
from typing import Optional


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def to_utc_iso(value: Optional[datetime]) -> Optional[str]:
    """Serialize datetimes as UTC ISO-8601 with a trailing Z.

    SQLite often returns naive datetimes. Emitting Z prevents browsers from
    treating expiry timestamps as local time (which caused instant auto-submit).
    """
    if value is None:
        return None
    aware = ensure_utc(value)
    return aware.isoformat(timespec="milliseconds").replace("+00:00", "Z")
