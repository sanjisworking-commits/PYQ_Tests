#!/usr/bin/env python3
"""One-time ingest of 2025 ForumIAS + Vajiram explanations into gs-paper-1.json."""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

ROOT = Path(__file__).resolve().parents[1]
PAPER_PATH = ROOT / "backend/data/upsc/2025/gs-paper-1.json"
VAJIRAM_TXT = Path("/tmp/vajiram_2025.txt")
FORUM_TXT = Path("/tmp/forum_2025.txt")

FORUM_URL = (
    "https://forumias.com/blog/"  # Set-B explanation booklet used for stem match
)
VAJIRAM_URL = "https://vajiramandravi.com/upsc-exam/upsc-prelims-answer-key-2025/"

sys.path.insert(0, str(ROOT / "backend"))
from app.schemas.test_data import TestPaper  # noqa: E402


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def compact(text: str) -> str:
    return re.sub(r"\s+", "", normalize(text))


def clean_exp(text: str) -> str:
    text = text.replace("\u25cf", "-").replace("●", "-")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(
        r"(?i)^option\s+[a-d]\s+is the correct answer\.?\s*",
        "",
        text.strip(),
    )
    # Drop trailing Source: lines for forum
    text = re.split(r"(?i)\n\s*Source\s*:", text, maxsplit=1)[0]
    # Drop Vajiram page footers
    text = re.split(r"\nUPSC Preliminary Examination", text, maxsplit=1)[0]
    text = re.split(r"\nV\s*AJIRAM", text, maxsplit=1, flags=re.I)[0]
    return text.strip()


@dataclass
class Parsed:
    stem: str
    answer: Optional[str]
    explanation: str
    number: Optional[int] = None


def parse_vajiram(text: str) -> List[Parsed]:
    """Parse Set-A Vajiram explanations keyed by question number."""
    # Primary: Q1. / Q12.
    starts = list(re.finditer(r"(?m)^Q(\d+)\.\s+", text))
    # Also: Q83 without dot, and bare "90." Nature Restoration style
    starts += list(re.finditer(r"(?m)^Q(\d+)\s+(?=Consider|With|Which|Who|Suppose|Artificial|Regarding|India|Ashokan|Fa-hien|The |In |On |A |GPS|\"Sedition)", text))
    starts += list(
        re.finditer(
            r"(?m)^(\d{1,3})\.\s+(?=Which organization has enacted the Nature Restoration)",
            text,
        )
    )
    starts = sorted(starts, key=lambda m: m.start())
    out: List[Parsed] = []
    seen_nums: set[int] = set()
    for i, m in enumerate(starts):
        num = int(m.group(1))
        if num < 1 or num > 100 or num in seen_nums:
            continue
        end = len(text)
        for nxt in starts[i + 1 :]:
            if nxt.start() > m.start():
                end = nxt.start()
                break
        body = text[m.end() : end]
        if "Explanation" not in body:
            continue
        seen_nums.add(num)
        am = re.search(r"(?i)\nAnswer\s*:\s*([a-d])\b", body)
        ans = am.group(1).upper() if am else None
        exp_m = re.search(r"(?is)\nExplanation\s*:\s*(.*)$", body)
        exp = clean_exp(exp_m.group(1) if exp_m else "")
        # Sometimes explanation continues without header after answer key bleed —
        # require substance.
        if len(exp) < 40:
            continue
        stem = body[: am.start()] if am else body
        stem = re.sub(r"\s+", " ", stem).strip()
        stem_key = re.split(r"(?i)\s+[a-d]\)\s+", stem, maxsplit=1)[0].strip()
        if stem_key:
            out.append(Parsed(stem=stem_key, answer=ans, explanation=exp, number=num))
    return out


def parse_forum(text: str) -> List[Parsed]:
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Q.1) or Q.91 without closing paren
    parts = re.split(r"(?=Q\.\d+\)|Q\.\d+\s)", text)
    out: List[Parsed] = []
    for part in parts:
        m = re.match(r"Q\.(\d+)\)?\s*(.*)", part, re.S)
        if not m:
            continue
        num = int(m.group(1))
        if num < 1 or num > 100:
            continue
        body = m.group(2)
        am = re.search(r"(?i)\bAns\)\s*([a-d])\b", body)
        ans = am.group(1).upper() if am else None
        exp_m = re.search(
            r"(?is)\bExp\)\s*(.*?)(?:\n\s*Source:|\n\s*Q\.\d+\)?|\Z)",
            body,
        )
        exp = clean_exp(exp_m.group(1) if exp_m else "")
        stem = re.split(r"(?i)\bAns\)", body, maxsplit=1)[0]
        stem = re.split(r"(?i)\s+[a-d]\)\s+", stem, maxsplit=1)[0]
        stem = re.sub(r"\s+", " ", stem).strip()
        if stem and exp and len(exp) > 40:
            out.append(Parsed(stem=stem, answer=ans, explanation=exp, number=num))
    return out


def best_by_stem(target: str, candidates: List[Parsed], extra: str = "") -> Optional[Parsed]:
    blob = normalize(f"{target} {extra}")
    target_compact = compact(blob)
    target_tokens = [
        t
        for t in blob.split()
        if len(t) >= 7
        and t
        not in {
            "following",
            "statements",
            "consider",
            "regarding",
            "reference",
            "according",
            "select",
            "answer",
            "correct",
            "incorrect",
            "option",
            "statement",
        }
    ][:10]
    best = None
    best_score = 0.0
    for cand in candidates:
        cnorm = normalize(cand.stem)
        ccomp = compact(cand.stem)
        score = 0.0
        if not cnorm:
            continue
        # head overlap
        thead = " ".join(normalize(target).split()[:12])
        chead = " ".join(cnorm.split()[:12])
        if thead and (thead in cnorm or chead in normalize(target)):
            return cand
        hits = sum(1 for t in target_tokens if t in ccomp)
        score += hits * 0.35
        if target_compact[:40] and target_compact[:40] in ccomp:
            score += 0.8
        if score > best_score:
            best_score = score
            best = cand
    if best_score >= 0.7:
        return best
    return None


def main() -> None:
    paper = json.loads(PAPER_PATH.read_text(encoding="utf-8"))
    vaj = parse_vajiram(VAJIRAM_TXT.read_text(encoding="utf-8", errors="ignore"))
    forum = parse_forum(FORUM_TXT.read_text(encoding="utf-8", errors="ignore"))
    print(f"parsed vajiram={len(vaj)} forum={len(forum)}")

    vaj_by_num = {p.number: p for p in vaj if p.number}
    unmatched_forum = []
    unmatched_vaj = []

    for q in paper["questions"]:
        stem = q["stem"]
        extra = q.get("case_text") or ""
        if q.get("statements"):
            extra += " " + " ".join(s.get("text", "") for s in q["statements"])

        explanations = []

        # Vajiram: prefer Set-A question number
        v = vaj_by_num.get(q["number"])
        if not v:
            v = best_by_stem(stem, vaj, extra)
        if v:
            explanations.append(
                {
                    "source": "vajiram",
                    "source_label": "Vajiram & Ravi",
                    "source_answer": v.answer,
                    "explanation": v.explanation,
                    "source_url": VAJIRAM_URL,
                }
            )
        else:
            unmatched_vaj.append(q["number"])

        f = best_by_stem(stem, forum, extra)
        if f:
            explanations.append(
                {
                    "source": "forumias",
                    "source_label": "ForumIAS",
                    "source_answer": f.answer,
                    "explanation": f.explanation,
                    "source_url": FORUM_URL,
                }
            )
        else:
            unmatched_forum.append(q["number"])

        # Prefer ForumIAS tab first (UI defaults to forumias when present)
        explanations.sort(key=lambda e: 0 if e["source"] == "forumias" else 1)
        q["explanations"] = explanations
        q.setdefault("study_refs", [])
        # Clean option leakage from stems (e.g. "... of a) the Champaran")
        q["stem"] = re.split(r"(?i)\s+[a-d]\)\s+", q["stem"], maxsplit=1)[0].strip()

    TestPaper.model_validate(paper)
    PAPER_PATH.write_text(
        json.dumps(paper, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    with_both = sum(1 for q in paper["questions"] if len(q["explanations"]) == 2)
    with_one = sum(1 for q in paper["questions"] if len(q["explanations"]) == 1)
    print(f"Wrote {PAPER_PATH}")
    print(f"both={with_both} one={with_one} none={100 - with_both - with_one}")
    print(f"unmatched forum ({len(unmatched_forum)}): {unmatched_forum}")
    print(f"unmatched vajiram ({len(unmatched_vaj)}): {unmatched_vaj}")
    # spot check Q1 / Q47
    for n in (1, 47):
        q = next(x for x in paper["questions"] if x["number"] == n)
        print(
            f"Q{n} sources={[e['source'] for e in q['explanations']]} "
            f"heads={[e['explanation'][:60].replace(chr(10),' ') for e in q['explanations']]}"
        )


if __name__ == "__main__":
    main()
