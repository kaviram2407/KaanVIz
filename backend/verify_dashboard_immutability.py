import os
import hashlib
import requests

RAW_DIR = "/Users/kavismac/Desktop/KaanVIz/storage/raw"
BASE_URL = "http://localhost:8000/api/v1"

def get_file_info(filepath):
    size = os.path.getsize(filepath)
    with open(filepath, "rb") as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()
    return size, sha256

def run_immutability_test():
    # Find a non-empty raw CSV file in storage/raw
    raw_files = [f for f in os.listdir(RAW_DIR) if f.endswith(".csv") and os.path.getsize(os.path.join(RAW_DIR, f)) > 0]
    if not raw_files:
        print("NO_RAW_FILES")
        return

    target_filename = raw_files[0]
    target_filepath = os.path.join(RAW_DIR, target_filename)

    size_before, sha_before = get_file_info(target_filepath)

    # Perform Dashboard API operations (List dashboards, Create dashboard, Add widget, Query aggregated analytics, Delete dashboard)
    # 1. Create Dashboard
    res = requests.post(f"{BASE_URL}/workspaces/default/dashboards", json={"name": "Immutability Audit Dashboard"})
    dash_id = res.json()["id"]

    # 2. Get Dashboard
    requests.get(f"{BASE_URL}/workspaces/default/dashboards/{dash_id}")

    # 3. Add Dashboard Item
    item_payload = {
        "title": "Immutability Test Widget",
        "visualization_spec": {
            "chart_type": "bar",
            "dimensions": [{"field": "category"}],
            "measures": [{"field": "revenue", "aggregation": "sum"}]
        },
        "layout": {"x": 0, "y": 0, "w": 6, "h": 4}
    }
    requests.post(f"{BASE_URL}/workspaces/default/dashboards/{dash_id}/items", json=item_payload)

    # 4. Update Dashboard Layout & Filters
    requests.put(f"{BASE_URL}/workspaces/default/dashboards/{dash_id}", json={"filters": {"category": "Electronics"}})

    # 5. Execute Analytics Query through dashboard query engine
    query_payload = {
        "dataset_id": "test",
        "dimensions": [{"field": "category"}],
        "measures": [{"field": "revenue", "aggregation": "sum"}],
        "filters": [{"field": "category", "operator": "equals", "value": "Electronics"}]
    }
    requests.post(f"{BASE_URL}/workspaces/default/analytics/query", json=query_payload)

    # 6. Delete Dashboard
    requests.delete(f"{BASE_URL}/workspaces/default/dashboards/{dash_id}")

    size_after, sha_after = get_file_info(target_filepath)

    print(f"FILE_PATH: {target_filepath}")
    print(f"SIZE_BEFORE: {size_before}")
    print(f"SHA256_BEFORE: {sha_before}")
    print(f"SIZE_AFTER: {size_after}")
    print(f"SHA256_AFTER: {sha_after}")
    print(f"BYTE_FOR_BYTE_MATCH: {size_before == size_after and sha_before == sha_after}")

if __name__ == "__main__":
    run_immutability_test()
