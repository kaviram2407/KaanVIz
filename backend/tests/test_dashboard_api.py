import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.services.ingestion_service import CSVIngestionService

client = TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def api_dataset(db):
    csv_content = "item,price\nPhone,500\nLaptop,1000\n".encode("utf-8")
    ingestion = CSVIngestionService(db)
    return ingestion.ingest_csv(
        file_bytes=csv_content,
        original_filename="api_dash.csv",
        workspace_id="default",
        dataset_name="API Dash Dataset"
    )


def test_dashboard_api_crud(api_dataset):
    # 1. Create Dashboard
    create_payload = {
        "name": "Revenue Overview",
        "description": "Main revenue KPIs",
        "items": [
            {
                "title": "Item Price Sum",
                "visualization_spec": {
                    "chart_type": "bar",
                    "dimensions": [{"field": "item"}],
                    "measures": [{"field": "price", "aggregation": "sum"}]
                },
                "dataset_id": api_dataset.id,
                "layout": {"x": 0, "y": 0, "w": 6, "h": 4}
            }
        ]
    }

    response = client.post("/api/v1/workspaces/default/dashboards", json=create_payload)
    assert response.status_code == 201
    dash_data = response.json()
    dash_id = dash_data["id"]
    assert dash_data["name"] == "Revenue Overview"
    assert len(dash_data["items"]) == 1

    # 2. List Dashboards
    list_res = client.get("/api/v1/workspaces/default/dashboards")
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1

    # 3. Get Dashboard
    get_res = client.get(f"/api/v1/workspaces/default/dashboards/{dash_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == dash_id

    # 4. Workspace Isolation Test (other workspace should get 404)
    iso_res = client.get(f"/api/v1/workspaces/other_workspace/dashboards/{dash_id}")
    assert iso_res.status_code == 404

    # 5. Delete Dashboard
    del_res = client.delete(f"/api/v1/workspaces/default/dashboards/{dash_id}")
    assert del_res.status_code == 200

    # 6. Verify Deleted
    get_del = client.get(f"/api/v1/workspaces/default/dashboards/{dash_id}")
    assert get_del.status_code == 404
