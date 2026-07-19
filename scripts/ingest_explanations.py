#!/usr/bin/env python3
"""One-time ingest: ForumIAS + Vajiram explanations + syllabus study_refs.

Writes into backend/data/upsc/2026/gs-paper-1.json.
Not used at runtime.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parents[1]
PAPER_PATH = ROOT / "backend/data/upsc/2026/gs-paper-1.json"
SYLLABUS_PATH = ROOT / "backend/data/upsc/syllabus.json"
UPLOAD_SYLLABUS = Path(
    "/home/ubuntu/.cursor/projects/workspace/uploads/input_clean_c5bd.json"
)

FORUM_URL_BULK = (
    "https://forumias.com/blog/download-official-upsc-2026-answer-key-forumias/"
)
VAJIRAM_URL = "https://vajiramandravi.com/upsc-exam/upsc-prelims-answer-key-2026/"


def normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


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


@dataclass
class ParsedExplanation:
    stem: str
    answer: Optional[str]
    explanation: str


def parse_forum_bulk(text: str) -> List[ParsedExplanation]:
    parts = re.split(r"(?=Q\.\d+\))", text)
    out: List[ParsedExplanation] = []
    for part in parts:
        m = re.match(r"Q\.(\d+)\)\s*(.*)", part, re.S)
        if not m:
            continue
        body = m.group(2)
        stem = re.split(r"\n\s*[a-d]\)", body, maxsplit=1)[0]
        stem = re.sub(r"\s+", " ", stem).strip()
        am = re.search(r"Ans\)\s*([a-d])", body, re.I)
        exp_m = re.search(
            r"Exp\)\s*(.*?)(?:\n\s*Source:|\n\s*Q\.\d+\)|$)",
            body,
            re.S | re.I,
        )
        raw = exp_m.group(1) if exp_m else ""
        om = re.match(
            r"option\s+([a-d])\s+is the correct answer",
            raw.strip(),
            re.I,
        )
        ans = (om.group(1) if om else (am.group(1) if am else "")).upper() or None
        exp = clean_exp(raw)
        if stem and exp:
            out.append(ParsedExplanation(stem=stem, answer=ans, explanation=exp))
    return out


def strip_vajiram_boilerplate(exp: str) -> str:
    exp = re.split(r"\nAnswer Key", exp, maxsplit=1)[0]
    exp = re.split(r"\nV\s*AJIRAM", exp, maxsplit=1, flags=re.I)[0]
    exp = re.split(r"\nUPSC Preliminary Examination", exp, maxsplit=1, flags=re.I)[0]
    exp = re.split(r"\nGeneral Studies Paper", exp, maxsplit=1, flags=re.I)[0]
    exp = re.sub(r"(?i)\bSet-?[ABCD]\b", "", exp)
    exp = re.sub(r"\n\d{1,3}\s*$", "", exp.strip())
    return exp.strip()


def parse_vajiram(text: str) -> List[ParsedExplanation]:
    """Parse using Answer/Explanation anchors; cut at the next anchor to avoid bleed."""
    anchors = list(
        re.finditer(r"Answer\s*:\s*([a-d])\s*\nExplanation\s*:\s*", text, re.I)
    )
    out: List[ParsedExplanation] = []
    for idx, anchor in enumerate(anchors):
        ans = anchor.group(1).upper()
        # Only search between previous explanation and this Answer — otherwise
        # stems like "At the United Nations…" inherit the prior question opener.
        region_start = anchors[idx - 1].end() if idx > 0 else 0
        before = text[region_start : anchor.start()]
        opt_matches = list(re.finditer(r"\n\(a\)\s+", before))
        if not opt_matches:
            opt_matches = list(re.finditer(r"\(a\)\s+", before))
        if not opt_matches:
            continue
        opt_a = opt_matches[-1]
        pre = before[: opt_a.start()]
        # Prefer strong question openers. Weak openers like "The "/"In " also
        # match statement lines ("3. The presence of…"), which caused bleed.
        strong = list(
            re.finditer(
                r"(?:^|\n)(\d{1,3})\.\s+"
                r"(?=Which|Consider|With|Match|Among|Regarding|"
                r"Assert|Given|Based|Identify|Select|Of the|"
                r"According|Why |When |Where |Examine|Discuss|"
                r"How|What |Who )",
                pre,
            )
        )
        if strong:
            q_start = strong[-1]
        else:
            weak = list(
                re.finditer(
                    r"(?:^|\n)(\d{1,3})\.\s+(?=The |In |At |During |India |"
                    r"Under |After |Before |Among |From |For )",
                    pre,
                )
            )
            if not weak:
                weak = list(re.finditer(r"(?:^|\n)(\d{1,3})\.\s+", pre))
            if not weak:
                continue
            # Skip short numbered statement lines just above (a)/(b)/(c)/(d).
            q_start = weak[-1]
            for cand in reversed(weak):
                candidate_stem = pre[cand.end() :].strip()
                if len(re.sub(r"\s+", " ", candidate_stem)) >= 80:
                    q_start = cand
                    break
        stem = pre[q_start.end() :].strip()
        # Drop any leftover previous-explanation bullets before the stem.
        stem = re.sub(
            r"^.*?(?=(?:Which|Consider|With|Match|Among|The |In |At |"
            r"During|India|Under|How|What|Who|Regarding|Assert|Given|"
            r"Based|Identify|Select|Of the|According)\b)",
            "",
            stem,
            count=1,
            flags=re.S | re.I,
        ).strip()
        stem = re.sub(r"\s+", " ", stem)
        if len(stem) < 20 or stem.startswith("("):
            continue

        exp_start = anchor.end()
        exp_end = anchors[idx + 1].start() if idx + 1 < len(anchors) else len(text)
        exp = text[exp_start:exp_end]
        # Also stop if a new numbered question opener appears before next anchor
        next_q = re.search(
            r"\n\d{1,3}\.\s+(?:Which|Consider|With|Match|Among|The |In |"
            r"At |During |India |How|Regarding|What |Who |Assert|Given|"
            r"Based|Identify|Select)",
            exp,
        )
        if next_q:
            exp = exp[: next_q.start()]
        exp = strip_vajiram_boilerplate(exp)
        exp = clean_exp(exp)
        # Drop blocks that still look like multi-question bleed
        if re.search(r"(?i)\bAnswer\s*:\s*[a-d]\b", exp) and "Explanation" in exp:
            exp = re.split(r"(?i)\bAnswer\s*:\s*[a-d]\b", exp, maxsplit=1)[0].strip()
        if stem and exp and len(exp) > 40:
            out.append(ParsedExplanation(stem=stem, answer=ans, explanation=exp))
    return out


_STOPWORDS = {
    "following",
    "statements",
    "consider",
    "regarding",
    "reference",
    "according",
    "select",
    "answer",
    "which",
    "about",
    "below",
    "using",
    "given",
    "above",
    "correct",
    "incorrect",
    "option",
    "statement",
    "programme",
    "program",
    "government",
    "india",
    "indian",
    "economic",
    "through",
    "effective",
    "systems",
    "system",
    "presence",
    "species",
    "between",
    "without",
    "because",
    "during",
    "within",
    "country",
    "countries",
    "project",
    "supported",
    "international",
    "national",
    "development",
    "important",
    "provided",
    "mentioned",
    "described",
    "related",
    "various",
}


def explanation_matches_question(stem: str, explanation: str, extra: str = "") -> bool:
    """Require distinctive token overlap to reject wrong attachments."""
    blob = normalize(f"{stem} {extra}")
    tokens = [t for t in blob.split() if len(t) >= 7 and t not in _STOPWORDS]
    if not tokens:
        return True
    exp_compact = compact(explanation)
    hits = sum(1 for t in tokens[:14] if t in exp_compact)
    strong = sum(1 for t in tokens[:14] if len(t) >= 9 and t in exp_compact)
    return hits >= 2 or strong >= 1


def stem_key(stem: str) -> str:
    """Stable key from leading meaningful tokens of a stem."""
    n = normalize(stem)
    # Drop common prefixes
    for prefix in (
        "which one of the following ",
        "which of the following ",
        "consider the following statements ",
        "consider the following ",
        "with reference to ",
        "match list i with list ii ",
    ):
        if n.startswith(prefix):
            n = n[len(prefix) :]
    tokens = n.split()
    return " ".join(tokens[:14])


def compact(text: str) -> str:
    """Normalize and drop spaces — helps PDF OCR like 'V olcano'."""
    return re.sub(r"\s+", "", normalize(text))


def best_match(
    target_stem: str,
    candidates: List[ParsedExplanation],
    extra_text: str = "",
) -> Optional[ParsedExplanation]:
    match = best_match_scored(target_stem, candidates, extra_text=extra_text)
    return match[0] if match else None


def best_match_scored(
    target_stem: str,
    candidates: List[ParsedExplanation],
    extra_text: str = "",
) -> Optional[Tuple[ParsedExplanation, float]]:
    blob = f"{target_stem}\n{extra_text}".strip()
    target_norm = normalize(blob)
    target_compact = compact(blob)
    target_head = " ".join(normalize(target_stem).split()[:18])
    target_key = stem_key(target_stem)
    # Distinctive tokens for OCR-tolerant lookup
    distinctive = [
        t
        for t in normalize(blob).split()
        if len(t) >= 8 and t not in _STOPWORDS
    ][:6]

    best: Optional[ParsedExplanation] = None
    best_score = 0.0
    for cand in candidates:
        cand_norm = normalize(cand.stem)
        if not cand_norm or cand_norm.startswith("select the answer"):
            continue
        cand_compact = compact(cand.stem + " " + cand.explanation[:280])
        cand_head = " ".join(cand_norm.split()[:18])
        if target_head and (
            target_head in cand_norm
            or cand_head in target_norm
            or normalize(target_stem)[:60] in cand_norm
            or cand_norm[:60] in normalize(target_stem)
        ):
            return cand, 1.0
        # OCR-tolerant: distinctive token appears in compacted candidate
        hit = sum(1 for t in distinctive if t in cand_compact)
        key = stem_key(cand.stem)
        tset = set(target_key.split()) - _STOPWORDS
        cset = set(key.split()) - _STOPWORDS
        score = 0.0
        if tset and cset:
            score = len(tset & cset) / max(len(tset), len(cset))
        score += 0.15 * hit
        # Strong unique tokens (proper nouns / rare words)
        for t in distinctive:
            if len(t) >= 9 and t in cand_compact:
                score += 0.4
            if len(t) >= 9 and t in compact(cand.explanation):
                score += 0.25
        if target_key.split()[:5] == key.split()[:5]:
            score += 0.35
        if target_head.split()[:4] == cand_head.split()[:4]:
            score += 0.25
        if score > best_score:
            best_score = score
            best = cand
    if best is not None and best_score >= 0.45:
        return best, best_score
    return None


KEYWORD_RULES: List[Tuple[List[str], str, str, str]] = [
    # keywords, subject, topic, subtopic (subtopic may be partial match)
    (["carnatic", "raga", "bilawal", "hindustani music"], "INDIAN CULTURE", "Music in India", "Forms of Indian Music"),
    (["hilton-young", "rupee-sterling", "exchange rate"], "MODERN HISTORY", "Scenario before 1857", "The British conquest of India"),
    (["pali texts", "kahapana", "punch-marked"], "ANCIENT HISTORY", "Pre Mauryan-Period", "Evolution of Coins"),
    (["nagara-style", "shikhara", "malegitti", "huchimalligudi"], "ARCHITECTURE", "General", "Indian Temple Architecture"),
    (["jainism", "tiryancha", "yaksha", "deva (gods)"], "ANCIENT HISTORY", "Pre Mauryan-Period", "Jainism"),
    (["hallisalasya", "bagh caves"], "INDIAN CULTURE", "Indian Paintings", "Paintings"),
    (["place-value", "mankani"], "ANCIENT HISTORY", "Imperial Guptas", "Development of Art"),
    (["harappan", "spindle", "baked bricks"], "ANCIENT HISTORY", "Indus Valley Civilization", "Harappan"),
    (["eka movement", "bardoli"], "MODERN HISTORY", "Scenario before 1857", "British"),
    (["rigvedic", "ashma chakra", "irrigation"], "ANCIENT HISTORY", "Vedic Society", "Economic"),
    (["buddhism", "buddhist"], "ANCIENT HISTORY", "Pre Mauryan-Period", "Buddhism"),
    (["maurya", "ashoka", "arthasastra"], "ANCIENT HISTORY", "The Mauryan Empire", "Ashoka"),
    (["gupta"], "ANCIENT HISTORY", "Imperial Guptas", "Political"),
    (["constitution", "article ", "fundamental rights", "dpsp", "parliament", "president", "judiciary", "supreme court", "federal"], "POLITY", "Historical Evolution & Features", ""),
    (["gdp", "inflation", "rbi", "monetary", "fiscal", "budget", "gst", "banking", "nbfc", "mpi", "poverty"], "BASIC ECONOMY", "General", ""),
    (["monsoon", "climate", "soil", "river", "himalaya", "plateau", "ocean", "cyclone"], "PHYSICAL GEOGRAPHY", "General Geography", ""),
    (["biodiversity", "ecosystem", "pollution", "climate change", "wildlife", "protected area", "convention"], "ENVIRONMENT & ECOLOGY", "Ecology", ""),
    (["isro", "satellite", "space", "missile", "defence", "nanotech", "biotech", "ai ", "robot"], "SCIENCE & TECHNOLOGY", "General", ""),
    (["international", "un ", "wto", "imf", "world bank", "bilateral", "saarc", "bimstec"], "INTERNATIONAL RELATIONS", "General", ""),
    (["ethics", "integrity", "probity", "civil service values"], "ETHICS, INTEGRITY & APTITUDE", "General", ""),
    (["disaster", "ndma", "flood", "earthquake"], "DISASTER MANAGEMENT", "General", ""),
    (["internal security", "terrorism", "border", "cyber"], "INTERNAL SECURITY", "General", ""),
    (["agriculture", "msp", "farmer", "crop"], "AGRICULTURE", "General", ""),
    (["infrastructure", "railway", "port", "energy"], "INFRASTRUCTURE", "General", ""),
    (["crowdfunding"], "BASIC ECONOMY", "General", ""),
    (["committee", "malhotra", "urjit", "malegam"], "BASIC ECONOMY", "General", ""),
    (["multidimensional poverty", "alkire"], "BASIC ECONOMY", "General", ""),
    (["interpellation", "motion", "lok sabha", "rajya sabha"], "POLITY", "Historical Evolution & Features", ""),
    (["cag", "comptroller"], "POLITY", "Historical Evolution & Features", ""),
    (["election commission", "delimitation"], "POLITY", "Historical Evolution & Features", ""),
    (["panchayat", "municipal", "local government"], "POLITY", "Historical Evolution & Features", ""),
    (["directive principles", "fundamental duties"], "POLITY", "Historical Evolution & Features", ""),
    (["indus", "saraswati", "yamuna", "pleistocene"], "PHYSICAL GEOGRAPHY", "General Geography", ""),
    (["vedic", "rigveda", "upanishad"], "ANCIENT HISTORY", "Vedic Society", ""),
    (["mughal", "delhi sultanate", "medieval"], "MEDIEVAL HISTORY", "General", ""),
    (["congress", "gandhi", "national movement", "swadeshi", "non-cooperation"], "MODERN HISTORY", "Scenario before 1857", ""),
    (["painting", "mural", "miniature"], "INDIAN CULTURE", "Indian Paintings", ""),
    (["temple", "stupa", "architecture"], "ARCHITECTURE", "General", ""),
    (["biosphere", "ramsar", "cites", "kyoto", "paris agreement"], "ENVIRONMENT & ECOLOGY", "Ecology", ""),
    (["vaccine", "virus", "dna", "rna", "genome"], "SCIENCE & TECHNOLOGY", "General", ""),
    (["intellectual property", "patent", "trademark"], "SCIENCE & TECHNOLOGY", "General", ""),
    (["sugamya", "disability", "rpwd"], "GOVERNANCE & SOCIAL JUSTICE", "General", ""),
    (["waste", "tribal", "contractor", "ethics case", "ms. x", "ms x"], "ETHICS, INTEGRITY & APTITUDE", "General", ""),
    (["tamilakam", "chera", "chola", "pandya", "sangam"], "ANCIENT HISTORY", "Imperial Guptas", "Sangam"),
    (["awadh", "taluqdar", "annexation"], "MODERN HISTORY", "Scenario before 1857", ""),
    (["kshetra", "mistress of the field"], "ANCIENT HISTORY", "Vedic Society", "Religion"),
    (["orchid", "rhynchostylis", "foxtail"], "ENVIRONMENT & ECOLOGY", "Ecology", ""),
    (["turkana"], "PHYSICAL GEOGRAPHY", "General Geography", ""),
    (["plan vivo", "redd", "deforestation"], "ENVIRONMENT & ECOLOGY", "Ecology", ""),
    (["large language", "llm", "machine learning"], "SCIENCE & TECHNOLOGY", "General", ""),
    (["black box", "aircraft", "flight recorder"], "SCIENCE & TECHNOLOGY", "General", ""),
    (["drone swarm"], "SCIENCE & TECHNOLOGY", "General", ""),
    (["quantum mission", "nqm"], "SCIENCE & TECHNOLOGY", "General", ""),
    (["public administration", "principle"], "GOVERNANCE", "General", ""),
    (["tungurahua", "geopark", "volcano"], "PHYSICAL GEOGRAPHY", "General Geography", ""),
    (["bomb disposal", "bureau of indian standard", "bis "], "SCIENCE & TECHNOLOGY", "General", ""),
    (["nobel prize", "un organisations", "un agencies"], "INTERNATIONAL RELATIONS", "General", ""),
    (["convention", "ratified by india", "statelessness"], "INTERNATIONAL RELATIONS", "General", ""),
    (["article 13", "meaning of law"], "POLITY", "Historical Evolution & Features", ""),
]


def import_syllabus(source: Path, dest: Path) -> dict:
    raw = json.loads(source.read_text(encoding="utf-8"))
    noise = re.compile(r"UPSC SYLLABUS|\d+\s+UPSC", re.I)
    subjects = []
    for s in raw.get("subjects", []):
        if noise.search(s.get("subject") or ""):
            continue
        subjects.append(
            {
                "subject": s["subject"],
                "topics": [
                    {
                        "topic": t["topic"],
                        "subtopics": list(t.get("subtopics") or []),
                    }
                    for t in (s.get("topics") or [])
                ],
            }
        )
    payload = {"document": "upsc-syllabus", "subjects": subjects}
    dest.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return payload


def resolve_study_ref(
    syllabus: dict, subject: str, topic: str, subtopic: str
) -> Optional[dict]:
    subjects = {s["subject"]: s for s in syllabus["subjects"]}
    if subject not in subjects:
        # fuzzy subject
        matches = [k for k in subjects if subject.lower() in k.lower() or k.lower() in subject.lower()]
        if not matches:
            return None
        subject = matches[0]
    topics = {t["topic"]: t["subtopics"] for t in subjects[subject]["topics"]}
    if topic not in topics:
        tm = [t for t in topics if topic.lower() in t.lower() or t.lower() in topic.lower()]
        if not tm:
            tm = list(topics.keys())[:1]
        if not tm:
            return None
        topic = tm[0]
    subs = topics.get(topic, [])
    chosen = subtopic
    if subs and subtopic:
        sm = [x for x in subs if subtopic.lower() in x.lower() or x.lower() in subtopic.lower()]
        if sm:
            chosen = sm[0]
        elif any(subtopic.lower() in x.lower() for x in subs):
            chosen = next(x for x in subs if subtopic.lower() in x.lower())
        else:
            # keep first subtopic if partial empty
            chosen = subtopic if not subtopic else (subs[0] if not sm else sm[0])
            # Prefer keeping a readable label even if not exact
            if subtopic and subtopic not in subs:
                # try token overlap
                tokens = [w for w in re.split(r"\W+", subtopic) if len(w) > 3]
                scored = []
                for x in subs:
                    xl = x.lower()
                    scored.append((sum(1 for t in tokens if t.lower() in xl), x))
                scored.sort(reverse=True)
                if scored and scored[0][0] > 0:
                    chosen = scored[0][1]
                else:
                    chosen = subs[0]
    elif subs and not subtopic:
        chosen = subs[0]
    return {
        "subject": subject,
        "topic": topic,
        "subtopic": chosen or topic,
        "ncert_hint": None,
    }


def map_study_refs(
    stem: str,
    statements: List[dict],
    syllabus: dict,
    case_text: str = "",
) -> List[dict]:
    blob = normalize(
        f"{case_text} {stem} " + " ".join(s.get("text", "") for s in statements)
    )
    refs: List[dict] = []
    seen = set()
    for keywords, subject, topic, subtopic in KEYWORD_RULES:
        if any(k in blob for k in keywords):
            ref = resolve_study_ref(syllabus, subject, topic, subtopic)
            if not ref:
                continue
            key = (ref["subject"], ref["topic"], ref["subtopic"])
            if key in seen:
                continue
            seen.add(key)
            refs.append(ref)
            if len(refs) >= 2:
                break
    return refs


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--forum-bulk-txt", required=True)
    parser.add_argument("--vajiram-txt", required=True)
    parser.add_argument("--syllabus-source", default=str(UPLOAD_SYLLABUS))
    args = parser.parse_args()

    syllabus = import_syllabus(Path(args.syllabus_source), SYLLABUS_PATH)
    forum_items = parse_forum_bulk(
        Path(args.forum_bulk_txt).read_text(encoding="utf-8", errors="ignore")
    )
    vaj_items = parse_vajiram(
        Path(args.vajiram_txt).read_text(encoding="utf-8", errors="ignore")
    )
    print(f"Parsed forum={len(forum_items)} vajiram={len(vaj_items)} syllabus_subjects={len(syllabus['subjects'])}")

    paper = json.loads(PAPER_PATH.read_text(encoding="utf-8"))
    unmatched_forum: List[int] = []
    unmatched_vaj: List[int] = []
    mapped_refs = 0

    rejected_forum = 0
    rejected_vaj = 0

    for q in paper["questions"]:
        stem = q["stem"]
        extra = q.get("case_text") or ""
        # Include statement text for matching multi-part stems.
        if q.get("statements"):
            extra += " " + " ".join(s.get("text", "") for s in q["statements"])
        forum_hit = best_match_scored(stem, forum_items, extra_text=extra)
        vaj_hit = best_match_scored(stem, vaj_items, extra_text=extra)
        explanations = []
        if forum_hit:
            forum, forum_score = forum_hit
            if forum_score >= 0.7 or explanation_matches_question(
                stem, forum.explanation, extra
            ):
                explanations.append(
                    {
                        "source": "forumias",
                        "source_label": "ForumIAS",
                        "source_answer": forum.answer,
                        "explanation": forum.explanation,
                        "source_url": FORUM_URL_BULK,
                    }
                )
            else:
                rejected_forum += 1
                print(
                    f"Rejected ForumIAS match for Q{q['number']}: "
                    f"explanation failed stem sanity check (score={forum_score:.2f})"
                )
                unmatched_forum.append(q["number"])
        else:
            unmatched_forum.append(q["number"])
        if vaj_hit:
            vaj, vaj_score = vaj_hit
            if vaj_score >= 0.7 or explanation_matches_question(
                stem, vaj.explanation, extra
            ):
                explanations.append(
                    {
                        "source": "vajiram",
                        "source_label": "Vajiram & Ravi",
                        "source_answer": vaj.answer,
                        "explanation": vaj.explanation,
                        "source_url": VAJIRAM_URL,
                    }
                )
            else:
                rejected_vaj += 1
                print(
                    f"Rejected Vajiram match for Q{q['number']}: "
                    f"explanation failed stem sanity check (score={vaj_score:.2f})"
                )
                unmatched_vaj.append(q["number"])
        else:
            unmatched_vaj.append(q["number"])

        refs = map_study_refs(
            stem,
            q.get("statements") or [],
            syllabus,
            case_text=q.get("case_text") or "",
        )
        # Preserve previously curated study_refs when keyword mapping finds nothing.
        if not refs and q.get("study_refs"):
            refs = q["study_refs"]
        if refs:
            mapped_refs += 1
        q["study_refs"] = refs
        q["explanations"] = explanations

    PAPER_PATH.write_text(
        json.dumps(paper, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Wrote {PAPER_PATH}")
    print(f"study_refs filled: {mapped_refs}/100")
    print(f"forum unmatched ({len(unmatched_forum)}): {unmatched_forum}")
    print(f"vajiram unmatched ({len(unmatched_vaj)}): {unmatched_vaj}")
    print(f"rejected sanity forum={rejected_forum} vajiram={rejected_vaj}")


if __name__ == "__main__":
    main()
