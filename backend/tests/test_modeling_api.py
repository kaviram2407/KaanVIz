import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_modeling_api_full_flow():
    # 1. Upload two CSV datasets
    csv1 = b"order_id,cust_id,total\n1,10,100\n2,20,200\n"
    csv2 = b"cust_id,cust_name\n10,Alice\n20,Bob\n"

    res1 = client.post("/api/v1/workspaces/default/datasets/upload", files={"file": ("orders.csv", io.BytesIO(csv1), "text/csv")})
    assert res1.status_code == 201
    ds1_id = res1.json()["dataset_id"]

    res2 = client.post("/api/v1/workspaces/default/datasets/upload", files={"file": ("customers.csv", io.BytesIO(csv2), "text/csv")})
    assert res2.status_code == 201
    ds2_id = res2.json()["dataset_id"]

    # 2. Get workspace data model
    m_res = client.get("/api/v1/workspaces/default/models")
    assert m_res.status_code == 200
    model_data = m_res.json()
    model_id = model_data["id"]

    # 3. Validate Relationship Proposal
    val_req = {
        "source_dataset_id": ds1_id,
        "source_field": "cust_id",
        "target_dataset_id": ds2_id,
        "target_field": "cust_id",
        "cardinality": "many_to_one"
    }
    val_res = client.post(f"/api/v1/workspaces/default/models/{model_id}/relationships/validate", json=val_req)
    assert val_res.status_code == 200
    assert val_res.json()["is_valid"] is True

    # 4. Create Relationship
    create_res = client.post(f"/api/v1/workspaces/default/models/{model_id}/relationships", json=val_req)
    assert create_res.status_code == 201
    rel_data = create_res.json()
    rel_id = rel_data["id"]
    assert rel_data["cardinality"] == "many_to_one"

    # 5. List Relationships
    list_res = client.get(f"/api/v1/workspaces/default/models/{model_id}/relationships")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # 6. Delete Relationship
    del_res = client.delete(f"/api/v1/workspaces/default/models/{model_id}/relationships/{rel_id}")
    assert del_res.status_code == 204


def test_modeling_api_error_cases():
    csv = b"id,val\n1,a\n"
    res = client.post("/api/v1/workspaces/default/datasets/upload", files={"file": ("test.csv", io.BytesIO(csv), "text/csv")})
    assert res.status_code == 201

    # Model not found
    res = client.get("/api/v1/workspaces/default/models/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404

    # Invalid Relationship Creation (Non-existent datasets)
    val_req = {
        "source_dataset_id": "00000000-0000-0000-0000-000000000000",
        "source_field": "id",
        "target_dataset_id": "00000000-0000-0000-0000-000000000001",
        "target_field": "id",
        "cardinality": "one_to_one"
    }
    m_res = client.get("/api/v1/workspaces/default/models")
    assert m_res.status_code == 200
    model_id = m_res.json()["id"]

    create_res = client.post(f"/api/v1/workspaces/default/models/{model_id}/relationships", json=val_req)
    assert create_res.status_code == 400
