from fastapi.testclient import TestClient

from app.config import UPSC_DATA_DIR
from app.services.test_loader import load_test_paper_from_path

TEST_ID = "upsc-2026-gs-paper-1"


def test_paper_has_pilot_study_refs_and_explanations() -> None:
    paper = load_test_paper_from_path(UPSC_DATA_DIR / "2026" / "gs-paper-1.json")

    assert paper.total_questions == 100
    first = paper.questions[0]
    assert first.study_refs
    assert first.study_refs[0].subject == "INDIAN CULTURE"
    assert len(first.explanations) == 2
    sources = {item.source for item in first.explanations}
    assert sources == {"forumias", "vajiram"}

    # Pilot scope: Q6+ left empty for later full ingest.
    sixth = paper.questions[5]
    assert sixth.study_refs == []
    assert sixth.explanations == []


def test_notes_upsert_and_list(client: TestClient) -> None:
    listed = client.get(f"/api/tests/{TEST_ID}/notes")
    assert listed.status_code == 200
    assert listed.json() == []

    saved = client.put(
        f"/api/tests/{TEST_ID}/questions/1/notes",
        json={"body": "Revise Carnatic vs Hindustani ragas"},
    )
    assert saved.status_code == 200
    body = saved.json()
    assert body["question_number"] == 1
    assert body["body"] == "Revise Carnatic vs Hindustani ragas"
    assert body["updated_at"].endswith("Z")

    again = client.put(
        f"/api/tests/{TEST_ID}/questions/1/notes",
        json={"body": "Updated note"},
    )
    assert again.status_code == 200
    assert again.json()["body"] == "Updated note"

    listed = client.get(f"/api/tests/{TEST_ID}/notes")
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["body"] == "Updated note"


def test_review_includes_study_refs_and_explanations(client: TestClient) -> None:
    created = client.post("/api/attempts", json={"test_id": TEST_ID})
    attempt_id = created.json()["id"]
    client.post(f"/api/attempts/{attempt_id}/submit")

    review = client.get(f"/api/attempts/{attempt_id}/review")
    assert review.status_code == 200
    by_number = {item["number"]: item for item in review.json()["questions"]}
    q1 = by_number[1]
    assert q1["study_refs"]
    assert len(q1["explanations"]) == 2
    assert q1["explanations"][0]["explanation"]
    assert by_number[6]["study_refs"] == []
    assert by_number[6]["explanations"] == []
