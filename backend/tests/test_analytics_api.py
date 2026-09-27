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
    csv_content = (
        "city,revenue\n"
        "Berlin,2000\n"
        "Tokyo,3000\n"
        "Berlin,1500\n"
    ).encode("utf-8")

    ingestion = CSVIngestionService(db)
    dataset = ingestion.ingest_csv(
        file_bytes=csv_content,
        original_filename="city_sales.csv",
        workspace_id="default",
        dataset_name="City Sales"
    )
    return dataset


def test_analytics_api_query_success(api_dataset):
    payload = {
        "dataset_id": api_dataset.id,
        "dimensions": [{"field": "city"}],
        "measures": [{"field": "revenue", "aggregation": "sum", "alias": "total_revenue"}],
        "sort": {"field": "total_revenue", "direction": "desc"},
        "limit": 10
    }

    response = client.post("/api/v1/workspaces/default/analytics/query", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["dataset_id"] == api_dataset.id
    assert data["row_count"] == 2
    assert data["data"][0]["city"] == "Berlin"
    assert data["data"][0]["total_revenue"] == 3500.0


def test_analytics_api_query_invalid_field(api_dataset):
    payload = {
        "dataset_id": api_dataset.id,
        "dimensions": [{"field": "non_existent"}],
        "measures": [{"field": "revenue", "aggregation": "sum"}]
    }

    response = client.post("/api/v1/workspaces/default/analytics/query", json=payload)
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert detail["error"]["code"] == "INVALID_QUERY"
    assert "does not exist in dataset schema" in detail["error"]["message"]


def test_analytics_api_query_unknown_dataset():
    payload = {
        "dataset_id": "00000000-0000-0000-0000-000000000000",
        "dimensions": [{"field": "city"}],
        "measures": [{"field": "revenue", "aggregation": "sum"}]
    }

    response = client.post("/api/v1/workspaces/default/analytics/query", json=payload)
    assert response.status_code == 404
    detail = response.json()["detail"]
    assert detail["error"]["code"] == "NOT_FOUND"


def test_analytics_api_visualization_validate_success(api_dataset):
    payload = {
        "spec": {
            "chart_type": "bar",
            "dimensions": [{"field": "city"}],
            "measures": [{"field": "revenue", "aggregation": "sum"}]
        },
        "dataset_id": api_dataset.id
    }

    response = client.post("/api/v1/workspaces/default/analytics/visualize/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert len(data["issues"]) == 0
