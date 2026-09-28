import os
import hashlib
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.db.session import Base
from app.services.ingestion_service import CSVIngestionService, get_or_create_workspace
from app.services.profiling_service import ProfilingService
from app.services.preparation_service import PreparationService, PreparationOperation
from app.services.modeling_service import ModelingService
from app.services.analytics_service import AnalyticsService
from app.services.dataset_cleanup_service import DatasetCleanupService
from app.models.dataset import Dataset, DatasetVersion, Workspace

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_file_sha256(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        hasher.update(f.read())
    return hasher.hexdigest()

def get_file_size(filepath: str) -> int:
    return os.path.getsize(filepath)

def run_verification():
    print("=== KAANVIZ DELETION & RAW IMMUTABILITY VERIFICATION ===")
    
    # Initialize DB schema
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()


    try:
        # 1. Setup Workspaces
        ws_default = get_or_create_workspace(db, "default")
        ws_other = get_or_create_workspace(db, "workspace_other")

        csv_content_1 = b"id,product,price\n101,Widget A,19.99\n102,Widget B,29.99\n103,Widget C,39.99\n"
        csv_content_2 = b"id,category,revenue\n201,Electronics,1500\n202,Home,2500\n"
        csv_other = b"id,user,score\n1,Alice,95\n2,Bob,88\n"

        ingestion = CSVIngestionService(db)

        # Dataset A (Default workspace)
        ds_a = ingestion.ingest_csv(csv_content_1, "sales_a.csv", "default", "Sales A")
        # Dataset B (Default workspace)
        ds_b = ingestion.ingest_csv(csv_content_2, "sales_b.csv", "default", "Sales B")
        # Dataset Other (Workspace Other)
        ds_other = ingestion.ingest_csv(csv_other, "users_other.csv", "workspace_other", "Users Other")

        storage = ingestion.storage

        # Get file paths on disk for Raw files
        v1_a = db.query(DatasetVersion).filter(DatasetVersion.id == ds_a.current_version_id).first()
        v1_b = db.query(DatasetVersion).filter(DatasetVersion.id == ds_b.current_version_id).first()
        v1_other = db.query(DatasetVersion).filter(DatasetVersion.id == ds_other.current_version_id).first()

        path_a_raw = os.path.abspath(os.path.join(storage.storage_base_dir, v1_a.storage_location))
        path_b_raw = os.path.abspath(os.path.join(storage.storage_base_dir, v1_b.storage_location))
        path_other_raw = os.path.abspath(os.path.join(storage.storage_base_dir, v1_other.storage_location))

        print(f"[RAW FILE CREATED] Dataset A Raw: {path_a_raw}")
        print(f"[RAW FILE CREATED] Dataset B Raw: {path_b_raw}")
        print(f"[RAW FILE CREATED] Dataset Other Raw: {path_other_raw}")

        # Compute initial hash & size for Dataset A raw file
        initial_a_size = get_file_size(path_a_raw)
        initial_a_sha = get_file_sha256(path_a_raw)

        print(f"\n--- 1. TESTING ORDINARY OPERATIONS RAW IMMUTABILITY ---")
        print(f"Dataset A Raw Size Before Ops: {initial_a_size} bytes")
        print(f"Dataset A Raw SHA256 Before Ops: {initial_a_sha}")

        # Profiling
        profiler = ProfilingService(db)
        profiler.profile_dataset_version(ds_a.id, ds_a.current_version_id)

        # Preparation (Creates Prepared Version 2)
        prep_svc = PreparationService(db)
        prep_ver, _, _ = prep_svc.prepare_dataset(
            dataset_id=ds_a.id,
            operations=[PreparationOperation(operation_type="convert_type", target_column="price", parameters={"target_type": "float"})],
            source_version_id=ds_a.current_version_id
        )

        v2_a = db.query(DatasetVersion).filter(DatasetVersion.id == prep_ver.id).first()
        path_a_proc = os.path.abspath(os.path.join(storage.storage_base_dir, v2_a.storage_location))
        print(f"[PROCESSED FILE CREATED] Dataset A Version 2: {path_a_proc}")

        # Data Modeling & Analytics
        model_svc = ModelingService(db)
        model = model_svc.get_or_create_model("default")
        model_svc.bind_dataset_to_model(model.id, ds_a.id, prep_ver.id)

        from app.schemas.analytics import AnalyticsQueryRequest, DimensionSpec
        analytics_svc = AnalyticsService(db)
        analytics_svc.execute_query(workspace_id="default", request=AnalyticsQueryRequest(dataset_id=ds_a.id, dimensions=[DimensionSpec(field="product")]))



        # Verify Dataset A Raw File Immutability after all ordinary operations
        post_ops_a_size = get_file_size(path_a_raw)
        post_ops_a_sha = get_file_sha256(path_a_raw)

        print(f"Dataset A Raw Size After Ops: {post_ops_a_size} bytes")
        print(f"Dataset A Raw SHA256 After Ops: {post_ops_a_sha}")
        assert initial_a_size == post_ops_a_size, "Raw file byte size changed during normal operations!"
        assert initial_a_sha == post_ops_a_sha, "Raw file SHA256 changed during normal operations!"
        print("✓ RAW FILE IMMUTABILITY CONFIRMED FOR ORDINARY OPERATIONS")

        print(f"\n--- 2. TESTING SINGLE DATASET DELETION ---")
        print(f"Target dataset to delete: {ds_a.id} ({ds_a.name})")
        print(f"Files expected to be deleted: {path_a_raw}, {path_a_proc}")
        print(f"Files expected to remain: {path_b_raw}, {path_other_raw}")

        cleanup_svc = DatasetCleanupService(db)
        del_result = cleanup_svc.delete_dataset(dataset_id=ds_a.id, workspace_id="default")
        print(f"Delete result summary: {del_result}")

        # Physical file assertions
        assert not os.path.exists(path_a_raw), "Dataset A Raw file was not deleted!"
        assert not os.path.exists(path_a_proc), "Dataset A Processed file was not deleted!"
        assert os.path.exists(path_b_raw), "Unrelated Dataset B Raw file was incorrectly deleted!"
        assert os.path.exists(path_other_raw), "Other Workspace Dataset Raw file was incorrectly deleted!"

        print("✓ SINGLE DATASET DELETION PHYSICALLY VERIFIED")
        print("  - Deleted dataset files present before deletion: True")
        print("  - Deleted dataset files present after deletion: False")
        print("  - Unrelated dataset B file present after deletion: True")
        print("  - Other workspace dataset file present after deletion: True")

        print(f"\n--- 3. TESTING CLEAR WORKSPACE DATA ---")
        print(f"Clearing all workspace data for workspace 'default'...")
        print(f"Expected to delete Dataset B file: {path_b_raw}")
        print(f"Expected to preserve Workspace Other file: {path_other_raw}")

        clear_result = cleanup_svc.clear_workspace_data("default")
        print(f"Clear workspace result: {clear_result}")

        assert not os.path.exists(path_b_raw), "Dataset B file was not deleted during workspace clear!"
        assert os.path.exists(path_other_raw), "Workspace Other dataset file was incorrectly deleted!"

        print("✓ CLEAR WORKSPACE DATA PHYSICALLY VERIFIED")
        print("  - Workspace default files present after clear: False")
        print("  - Workspace other files present after clear: True")

        print("\n=== ALL IMMUTABILITY AND DELETION PHYSICAL STORAGE VERIFICATIONS PASSED ===")

    finally:
        db.close()

if __name__ == "__main__":
    run_verification()
