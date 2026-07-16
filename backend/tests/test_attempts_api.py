from datetime import timedelta

from fastapi.testclient import TestClient

from app.models.attempt import Attempt
from app.utils.time import utc_now


TEST_ID = "upsc-2026-gs-paper-1"


def test_list_exams_and_years(client: TestClient) -> None:
    exams = client.get("/api/exams")
    assert exams.status_code == 200
    assert exams.json()[0]["id"] == "upsc"

    years = client.get("/api/exams/upsc/years")
    assert years.status_code == 200
    payload = years.json()
    assert payload[0] == {"year": 2026, "status": "available"}
    assert payload[1]["status"] == "coming_soon"


def test_list_and_get_tests_hide_answer_key(client: TestClient) -> None:
    listed = client.get("/api/exams/upsc/2026/tests")
    assert listed.status_code == 200
    assert listed.json()[0]["id"] == TEST_ID

    detail = client.get(f"/api/tests/{TEST_ID}")
    assert detail.status_code == 200
    body = detail.json()
    assert body["total_questions"] == 5
    assert "correct_option" not in body["questions"][0]
    assert body["questions"][0]["number"] == 1


def test_attempt_lifecycle_score_and_review(client: TestClient) -> None:
    created = client.post("/api/attempts", json={"test_id": TEST_ID})
    assert created.status_code == 201
    attempt = created.json()
    attempt_id = attempt["id"]
    assert attempt["status"] == "in_progress"
    assert len(attempt["responses"]) == 5
    assert attempt["expires_at"] > attempt["started_at"]

    patched = client.patch(
        f"/api/attempts/{attempt_id}/responses",
        json={
            "responses": [
                {
                    "question_number": 1,
                    "selected_option": "D",
                    "is_marked_for_review": False,
                    "is_visited": True,
                },
                {
                    "question_number": 2,
                    "selected_option": "B",
                    "is_visited": True,
                },
                {
                    "question_number": 3,
                    "selected_option": "C",
                    "is_marked_for_review": True,
                    "is_visited": True,
                },
                {
                    "question_number": 64,
                    "selected_option": "A",
                    "is_visited": True,
                },
            ]
        },
    )
    assert patched.status_code == 200
    responses = {
        item["question_number"]: item for item in patched.json()["responses"]
    }
    assert responses[1]["selected_option"] == "D"
    assert responses[3]["is_marked_for_review"] is True
    assert responses[4]["selected_option"] is None

    submitted = client.post(f"/api/attempts/{attempt_id}/submit")
    assert submitted.status_code == 200
    result = submitted.json()
    assert result["status"] == "submitted"
    assert result["correct_count"] == 2
    assert result["incorrect_count"] == 1
    assert result["unattempted_count"] == 1
    assert result["dropped_count"] == 1
    assert result["score"] == 3.33
    assert result["maximum_marks"] == 200

    # Idempotent submit
    again = client.post(f"/api/attempts/{attempt_id}/submit")
    assert again.status_code == 200
    assert again.json()["score"] == 3.33

    review = client.get(f"/api/attempts/{attempt_id}/review")
    assert review.status_code == 200
    review_body = review.json()
    by_number = {item["number"]: item for item in review_body["questions"]}
    assert by_number[1]["correct_option"] == "D"
    assert by_number[1]["is_correct"] is True
    assert by_number[2]["is_correct"] is False
    assert by_number[64]["is_dropped"] is True
    assert by_number[64]["is_correct"] is None


def test_create_attempt_emits_utc_expiry_and_stays_in_progress(
    client: TestClient,
) -> None:
    from datetime import datetime, timezone

    created = client.post("/api/attempts", json={"test_id": TEST_ID})
    assert created.status_code == 201
    body = created.json()

    assert body["status"] == "in_progress"
    assert body["started_at"].endswith("Z")
    assert body["expires_at"].endswith("Z")

    started = datetime.fromisoformat(body["started_at"].replace("Z", "+00:00"))
    expires = datetime.fromisoformat(body["expires_at"].replace("Z", "+00:00"))
    assert expires - started == timedelta(minutes=120)
    assert expires > datetime.now(timezone.utc) + timedelta(minutes=110)

    fetched = client.get(f"/api/attempts/{body['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["status"] == "in_progress"
    assert fetched.json()["expires_at"].endswith("Z")


def test_patch_after_submit_rejected(client: TestClient) -> None:
    created = client.post("/api/attempts", json={"test_id": TEST_ID})
    attempt_id = created.json()["id"]
    client.post(f"/api/attempts/{attempt_id}/submit")

    response = client.patch(
        f"/api/attempts/{attempt_id}/responses",
        json={"responses": [{"question_number": 1, "selected_option": "A"}]},
    )
    assert response.status_code == 409


def test_invalid_option_and_unknown_test(client: TestClient) -> None:
    bad_test = client.post("/api/attempts", json={"test_id": "missing-test"})
    assert bad_test.status_code == 404

    created = client.post("/api/attempts", json={"test_id": TEST_ID})
    attempt_id = created.json()["id"]

    bad_option = client.patch(
        f"/api/attempts/{attempt_id}/responses",
        json={"responses": [{"question_number": 1, "selected_option": "E"}]},
    )
    assert bad_option.status_code == 422

    bad_question = client.patch(
        f"/api/attempts/{attempt_id}/responses",
        json={"responses": [{"question_number": 999, "selected_option": "A"}]},
    )
    assert bad_question.status_code == 422


def test_auto_submit_on_expired_get(client: TestClient) -> None:
    from app import database as db_module

    created = client.post("/api/attempts", json={"test_id": TEST_ID})
    attempt_id = created.json()["id"]

    db = db_module.SessionLocal()
    try:
        attempt = db.query(Attempt).filter(Attempt.id == attempt_id).one()
        attempt.expires_at = utc_now() - timedelta(seconds=1)
        db.commit()
    finally:
        db.close()

    fetched = client.get(f"/api/attempts/{attempt_id}")
    assert fetched.status_code == 200
    body = fetched.json()
    assert body["status"] == "auto_submitted"
    assert body["submitted_at"] is not None
    assert body["score"] is not None


def test_review_before_submit_rejected(client: TestClient) -> None:
    created = client.post("/api/attempts", json={"test_id": TEST_ID})
    attempt_id = created.json()["id"]
    review = client.get(f"/api/attempts/{attempt_id}/review")
    assert review.status_code == 409


def test_clear_response_and_dropped_selection_ignored(client: TestClient) -> None:
    created = client.post("/api/attempts", json={"test_id": TEST_ID})
    attempt_id = created.json()["id"]

    selected = client.patch(
        f"/api/attempts/{attempt_id}/responses",
        json={
            "responses": [
                {"question_number": 1, "selected_option": "D", "is_visited": True},
                {"question_number": 64, "selected_option": "A", "is_visited": True},
            ]
        },
    )
    assert selected.status_code == 200
    by_number = {
        item["question_number"]: item for item in selected.json()["responses"]
    }
    assert by_number[1]["selected_option"] == "D"
    assert by_number[64]["selected_option"] is None

    cleared = client.patch(
        f"/api/attempts/{attempt_id}/responses",
        json={
            "responses": [
                {"question_number": 1, "selected_option": None, "is_visited": True}
            ]
        },
    )
    assert cleared.status_code == 200
    cleared_map = {
        item["question_number"]: item for item in cleared.json()["responses"]
    }
    assert cleared_map[1]["selected_option"] is None

    submitted = client.post(f"/api/attempts/{attempt_id}/submit")
    assert submitted.status_code == 200
    body = submitted.json()
    assert body["correct_count"] == 0
    assert body["incorrect_count"] == 0
    assert body["unattempted_count"] == 4
    assert body["dropped_count"] == 1
    assert body["score"] == 0.0


def test_expired_patch_auto_submits(client: TestClient) -> None:
    from app import database as db_module

    created = client.post("/api/attempts", json={"test_id": TEST_ID})
    attempt_id = created.json()["id"]

    db = db_module.SessionLocal()
    try:
        attempt = db.query(Attempt).filter(Attempt.id == attempt_id).one()
        attempt.expires_at = utc_now() - timedelta(seconds=1)
        db.commit()
    finally:
        db.close()

    response = client.patch(
        f"/api/attempts/{attempt_id}/responses",
        json={"responses": [{"question_number": 1, "selected_option": "D"}]},
    )
    assert response.status_code == 409
    fetched = client.get(f"/api/attempts/{attempt_id}")
    assert fetched.json()["status"] == "auto_submitted"
