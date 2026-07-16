from fastapi.testclient import TestClient


TEST_ID = "upsc-2026-gs-paper-1"


def _submit_attempt(client: TestClient) -> str:
    created = client.post("/api/attempts", json={"test_id": TEST_ID})
    assert created.status_code == 201
    attempt_id = created.json()["id"]

    patched = client.patch(
        f"/api/attempts/{attempt_id}/responses",
        json={
            "responses": [
                {"question_number": 1, "selected_option": "D", "is_visited": True},
                {"question_number": 2, "selected_option": "A", "is_visited": True},
            ]
        },
    )
    assert patched.status_code == 200

    submitted = client.post(f"/api/attempts/{attempt_id}/submit")
    assert submitted.status_code == 200
    return attempt_id


def test_dashboard_empty_state(client: TestClient) -> None:
    response = client.get("/api/dashboard/attempts")
    assert response.status_code == 200
    body = response.json()
    assert body["total_attempts"] == 0
    assert body["tests"] == []


def test_dashboard_lists_submitted_attempts_grouped_by_test(
    client: TestClient,
) -> None:
    first_id = _submit_attempt(client)
    second_id = _submit_attempt(client)

    # In-progress attempt should be excluded.
    in_progress = client.post("/api/attempts", json={"test_id": TEST_ID})
    assert in_progress.status_code == 201

    response = client.get("/api/dashboard/attempts")
    assert response.status_code == 200
    body = response.json()

    assert body["total_attempts"] == 2
    assert len(body["tests"]) == 1

    group = body["tests"][0]
    assert group["test_id"] == TEST_ID
    assert group["paper"] == "General Studies Paper I"
    assert group["year"] == 2026
    assert len(group["attempts"]) == 2

    attempt_ids = {item["attempt_id"] for item in group["attempts"]}
    assert attempt_ids == {first_id, second_id}
    assert all(item["score"] is not None for item in group["attempts"])
    assert all(item["time_taken_seconds"] is not None for item in group["attempts"])
    assert all(
        item["status"] in {"submitted", "auto_submitted"}
        for item in group["attempts"]
    )


def test_dashboard_filter_by_test_id(client: TestClient) -> None:
    attempt_id = _submit_attempt(client)

    filtered = client.get(f"/api/dashboard/attempts?test_id={TEST_ID}")
    assert filtered.status_code == 200
    assert filtered.json()["total_attempts"] == 1
    assert filtered.json()["tests"][0]["attempts"][0]["attempt_id"] == attempt_id

    empty = client.get("/api/dashboard/attempts?test_id=does-not-exist")
    assert empty.status_code == 200
    assert empty.json()["total_attempts"] == 0
    assert empty.json()["tests"] == []
