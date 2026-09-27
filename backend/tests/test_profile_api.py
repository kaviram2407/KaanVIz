import io
import pytest


def test_get_dataset_profile_api(client):
    # 1. Upload valid CSV dataset
    csv_content = b"id,name,score,is_valid\n101,Alice,95.5,true\n102,Bob,88.0,false\n103,Charlie,92.3,true\n"
    files = {"file": ("students.csv", io.BytesIO(csv_content), "text/csv")}

    upload_resp = client.post("/api/v1/datasets/upload", files=files)
    assert upload_resp.status_code == 201
    dataset_id = upload_resp.json()["dataset_id"]

    # 2. Get dataset profile via API
    profile_resp = client.get(f"/api/v1/datasets/{dataset_id}/profile")
    assert profile_resp.status_code == 200
    data = profile_resp.json()

    assert data["dataset_id"] == dataset_id
    assert data["dataset_name"] == "Students"
    assert "summary" in data
    assert "columns" in data

    summary = data["summary"]
    assert summary["row_count"] == 3
    assert summary["column_count"] == 4
    assert summary["quality_score"] == 100.0

    columns = data["columns"]
    assert len(columns) == 4
    col_names = [col["name"] for col in columns]
    assert col_names == ["id", "name", "score", "is_valid"]


def test_generate_dataset_profile_api(client):
    csv_content = b"x,y\n1,10\n2,20\n"
    files = {"file": ("coords.csv", io.BytesIO(csv_content), "text/csv")}

    upload_resp = client.post("/api/v1/datasets/upload", files=files)
    dataset_id = upload_resp.json()["dataset_id"]

    gen_resp = client.post(f"/api/v1/datasets/{dataset_id}/profile/generate")
    assert gen_resp.status_code == 200
    data = gen_resp.json()
    assert data["summary"]["row_count"] == 2
    assert len(data["columns"]) == 2


def test_get_profile_nonexistent_dataset_api(client):
    response = client.get("/api/v1/datasets/00000000-0000-0000-0000-000000000000/profile")
    assert response.status_code == 404
