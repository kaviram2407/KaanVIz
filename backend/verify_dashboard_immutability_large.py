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

def run_large_immutability_test():
    target_filename = "raw_e18b7036c97f_gold_inward_billing_in1725.csv"
    target_filepath = os.path.join(RAW_DIR, target_filename)

    size_before, sha_before = get_file_info(target_filepath)

    # 1. Create Dashboard
    res = requests.post(f"{BASE_URL}/workspaces/default/dashboards", json={"name": "Large Dataset Immutability Dashboard"})
    dash_id = res.json()["id"]

    # 2. Add Item
    item_payload = {
        "title": "Large Dataset Widget",
        "visualization_spec": {
            "chart_type": "bar",
            "dimensions": [{"field": "category"}],
            "measures": [{"field": "amount", "aggregation": "sum"}]
        },
        "layout": {"x": 0, "y": 0, "w": 6, "h": 4}
    }
    requests.post(f"{BASE_URL}/workspaces/default/dashboards/{dash_id}/items", json=item_payload)

    # 3. Update Dashboard Layout & Filters
    requests.put(f"{BASE_URL}/workspaces/default/dashboards/{dash_id}", json={"filters": {"category": "Billing"}})

    # 4. Delete Dashboard
    requests.delete(f"{BASE_URL}/workspaces/default/dashboards/{dash_id}")

    size_after, sha_after = get_file_info(target_filepath)

    print(f"LARGE_FILE_PATH: {target_filepath}")
    print(f"LARGE_SIZE_BEFORE: {size_before}")
    print(f"LARGE_SHA256_BEFORE: {sha_before}")
    print(f"LARGE_SIZE_AFTER: {size_after}")
    print(f"LARGE_SHA256_AFTER: {sha_after}")
    print(f"LARGE_BYTE_FOR_BYTE_MATCH: {size_before == size_after and sha_before == sha_after}")

if __name__ == "__main__":
    run_large_immutability_test()
