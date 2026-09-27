import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_prepare_api_success_and_transformations_lineage():
    raw_csv = (
        b"id,city,sales\n"
        b"1, New York ,1000\n"
        b"2, London ,1500\n"
        b"1, New York ,1000\n"
    )
    files = {"file": ("city_sales.csv", io.BytesIO(raw_csv), "text/csv")}

    # 1. Upload dataset via API
    upload_res = client.post("/api/v1/workspaces/default/datasets/upload", files=files)
    assert upload_res.status_code == 201
    dataset_id = upload_res.json()["dataset_id"]

    # 2. Post prepare request
    payload = {
        "operations": [
            {
                "operation_type": "text_normalization",
                "target_column": "city",
                "params": {"action": "trim"}
            },
            {
                "operation_type": "remove_duplicates",
                "params": {"keep": "first"}
            }
        ]
    }

    res = client.post(f"/api/v1/workspaces/default/datasets/{dataset_id}/prepare", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["dataset_id"] == dataset_id
    assert data["version_number"] == 2
    assert data["metrics_comparison"]["before_row_count"] == 3
    assert data["metrics_comparison"]["after_row_count"] == 2

    # 3. Get transformations lineage
    tr_res = client.get(f"/api/v1/workspaces/default/datasets/{dataset_id}/transformations")
    assert tr_res.status_code == 200
    tr_data = tr_res.json()
    assert tr_data["total"] == 2
    assert tr_data["transformations"][0]["operation_type"] == "text_normalization"
    assert tr_data["transformations"][1]["operation_type"] == "remove_duplicates"


def test_validate_api_endpoint():
    raw_csv = b"id,val\n1,10\n"
    files = {"file": ("val.csv", io.BytesIO(raw_csv), "text/csv")}
    upload_res = client.post("/api/v1/workspaces/default/datasets/upload", files=files)
    dataset_id = upload_res.json()["dataset_id"]

    payload = {
        "operations": [
            {"operation_type": "fill_missing", "params": {"strategy": "constant", "fill_value": "0"}}
        ]
    }
    res = client.post(f"/api/v1/workspaces/default/datasets/{dataset_id}/validate", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "valid"


def test_prepare_api_error_handling():
    # Dataset not found
    res = client.post("/api/v1/workspaces/default/datasets/00000000-0000-0000-0000-000000000000/prepare", json={"operations": [{"operation_type": "remove_duplicates"}]})
    assert res.status_code == 404

    # Empty operations list
    raw_csv = b"id,val\n1,10\n"
    files = {"file": ("empty_ops.csv", io.BytesIO(raw_csv), "text/csv")}
    upload_res = client.post("/api/v1/workspaces/default/datasets/upload", files=files)
    dataset_id = upload_res.json()["dataset_id"]

    res_empty = client.post(f"/api/v1/workspaces/default/datasets/{dataset_id}/prepare", json={"operations": []})
    assert res_empty.status_code == 400
