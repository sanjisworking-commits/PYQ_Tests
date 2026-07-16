import os
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_ROOT / "data"
UPSC_DATA_DIR = DATA_DIR / "upsc"

DEFAULT_DATABASE_URL = f"sqlite:///{BACKEND_ROOT / 'pyq.db'}"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
