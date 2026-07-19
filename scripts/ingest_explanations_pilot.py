#!/usr/bin/env python3
"""One-time pilot ingest for Q1-5 ForumIAS + Vajiram explanations.

Not used at runtime. Re-run only when refreshing stored backend content.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAPER_PATH = ROOT / "backend/data/upsc/2026/gs-paper-1.json"


def clean_exp(text: str) -> str:
    text = text.replace("\u25cf", "-").replace("●", "-")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(
        r"^option\s+[a-d]\s+is the correct answer\.\s*",
        "",
        text,
        flags=re.I,
    ).strip()
    return text.strip()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--forum-bulk-txt", required=True)
    parser.add_argument("--vajiram-txt", required=True)
    args = parser.parse_args()
    forum = Path(args.forum_bulk_txt).read_text(encoding="utf-8", errors="ignore")
    vaj = Path(args.vajiram_txt).read_text(encoding="utf-8", errors="ignore")

    print("Pilot helper only — Q1-5 already stored in gs-paper-1.json.")
    print(f"Forum text chars: {len(forum)}; Vajiram text chars: {len(vaj)}")
    print(f"Paper path: {PAPER_PATH}")


if __name__ == "__main__":
    main()
