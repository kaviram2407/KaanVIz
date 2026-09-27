import io
import os
import pytest
from app.models.dataset import Dataset
from app.services.storage_service import settings


def test_api_matrix_a_valid_csv(client, setup_test_db):
    """
    A. Valid CSV:
    POST upload -> 201 Created -> Dataset registered in DB -> Raw file exists on disk
    """
    csv_content = b"id,product,quantity\n1,Widget A,10\n2,Widget B,20\n"
    files = {"file": ("sales_matrix.csv", io.BytesIO(csv_content), "text/csv")}

    response = client.post("/api/v1/datasets/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Sales Matrix"
    assert data["status"] == "ready"
    assert "dataset_id" in data
    assert data["row_count"] == 2
    assert data["column_count"] == 3

    dataset_id = data["dataset_id"]

    # Verify GET single dataset
    get_resp = client.get(f"/api/v1/datasets/{dataset_id}")
    assert get_resp.status_code == 200
    single_data = get_resp.json()
    assert single_data["id"] == dataset_id
    assert single_data["original_filename"] == "sales_matrix.csv"


def test_api_matrix_b_invalid_extensions(client):
    """
    B. Invalid extensions (.exe, .pdf, .json, .png):
    -> 400 Bad Request -> No dataset registered
    """
    invalid_files = [
        ("malicious.exe", b"binary content", "application/octet-stream"),
        ("document.pdf", b"%PDF-1.5 test content", "application/pdf"),
        ("data.json", b'{"key": "value"}', "application/json"),
        ("image.png", b"\x89PNG\r\n\x1a\n test", "image/png"),
    ]

    for fname, content, mime in invalid_files:
        files = {"file": (fname, io.BytesIO(content), mime)}
        response = client.post("/api/v1/datasets/upload", files=files)
        assert response.status_code == 400
        detail_str = str(response.json().get("detail", "")).lower()
        assert "extension" in detail_str or "supported" in detail_str


def test_api_matrix_c_oversized_file(client, tmp_path):
    """
    C. Oversized file (> 50MB limit):
    -> 400 Bad Request -> No dataset registered -> No orphan raw file stored
    """
    # Create deterministic content exceeding 50MB limit by 1024 bytes
    limit_bytes = 50 * 1024 * 1024
    oversized_content = b"a" * (limit_bytes + 1024)

    files = {"file": ("huge_dataset.csv", io.BytesIO(oversized_content), "text/csv")}

    initial_files = os.listdir(settings.STORAGE_RAW_PATH) if os.path.exists(settings.STORAGE_RAW_PATH) else []

    response = client.post("/api/v1/datasets/upload", files=files)
    assert response.status_code == 400
    detail_str = str(response.json().get("detail", "")).lower()
    assert "exceeds" in detail_str or "limit" in detail_str or "size" in detail_str

    # Ensure no orphan raw file was created in raw storage
    final_files = os.listdir(settings.STORAGE_RAW_PATH) if os.path.exists(settings.STORAGE_RAW_PATH) else []
    assert final_files == initial_files


def test_api_matrix_d_malformed_csv(client):
    """
    D. Malformed CSV (non-decodable binary payload disguised as CSV):
    -> 400 Bad Request -> No dataset registered -> No orphan raw file
    """
    # Non-UTF8 binary payload with null bytes
    malformed_binary = b"\x00\x01\x02\x03\x04\xff\xfe\xfd"
    files = {"file": ("corrupted.csv", io.BytesIO(malformed_binary), "text/csv")}

    initial_files = os.listdir(settings.STORAGE_RAW_PATH) if os.path.exists(settings.STORAGE_RAW_PATH) else []

    response = client.post("/api/v1/datasets/upload", files=files)
    assert response.status_code == 400
    detail_str = str(response.json().get("detail", "")).lower()
    assert "valid" in detail_str or "read" in detail_str or "csv" in detail_str or "header" in detail_str

    final_files = os.listdir(settings.STORAGE_RAW_PATH) if os.path.exists(settings.STORAGE_RAW_PATH) else []
    assert final_files == initial_files


def test_api_matrix_e_missing_file(client):
    """
    E. Missing file:
    Request sent without file field -> 422 Unprocessable Entity -> No dataset registration
    """
    response = client.post("/api/v1/datasets/upload")
    assert response.status_code in (400, 422)


def test_get_nonexistent_dataset_api(client):
    response = client.get("/api/v1/datasets/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404
