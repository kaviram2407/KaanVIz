import os
import pytest
from app.services.ingestion_service import CSVIngestionService, get_or_create_workspace
from app.services.preparation_service import PreparationService
from app.services.modeling_service import ModelingService
from app.services.dashboard_service import DashboardService
from app.services.dataset_cleanup_service import DatasetCleanupService
from app.schemas.dataset import PrepareDatasetRequest, PreparationOperation
from app.schemas.dashboard import DashboardCreate, DashboardItemCreate, LayoutItem
from app.schemas.analytics import VisualizationSpec, MeasureSpec, DimensionSpec
from app.models.dataset import (
    Dataset,
    DatasetVersion,
    DatasetProfile,
    DatasetColumn,
    Transformation,
    ModelDataset,
    Relationship,
    DashboardItem
)

CSV_DATA = b"id,name,value\n1,Alpha,100\n2,Beta,200\n3,Gamma,300\n"


def test_delete_single_dataset(db, client):
    # 1. Ingest dataset in workspace default
    ingestion = CSVIngestionService(db)
    dataset = ingestion.ingest_csv(
        file_bytes=CSV_DATA,
        original_filename="sample_delete.csv",
        workspace_id="default",
        dataset_name="Sample Delete"
    )

    dataset_id = dataset.id
    version_1 = dataset.current_version_id

    # Create prepared version
    prep_svc = PreparationService(db)
    prep_ver, _, _ = prep_svc.prepare_dataset(
        dataset_id=dataset_id,
        operations=[PreparationOperation(operation_type="remove_duplicates", target_column="id")],
        source_version_id=version_1
    )

    # Bind dataset to model
    model_svc = ModelingService(db)
    model = model_svc.get_or_create_model("default")
    model_svc.bind_dataset_to_model(model.id, dataset_id, prep_ver.id)

    # Create dashboard item referencing dataset
    dash_svc = DashboardService(db)
    dash = dash_svc.create_dashboard("default", DashboardCreate(name="Delete Test Dash"))
    dash_svc.add_item_to_dashboard(
        dash.id,
        "default",
        DashboardItemCreate(
            title="Widget 1",
            visualization_spec=VisualizationSpec(
                chart_type="bar",
                measures=[MeasureSpec(field="value", aggregation="sum")],
                dimensions=[DimensionSpec(field="name")]
            ),
            dataset_id=dataset_id,
            layout=LayoutItem(x=0, y=0, w=4, h=4)
        )
    )

    # Verify files exist in storage before deletion
    storage = ingestion.storage
    v1_obj = db.query(DatasetVersion).filter(DatasetVersion.id == version_1).first()
    v2_obj = db.query(DatasetVersion).filter(DatasetVersion.id == prep_ver.id).first()

    v1_path = os.path.abspath(os.path.join(storage.storage_base_dir, v1_obj.storage_location))
    v2_path = os.path.abspath(os.path.join(storage.storage_base_dir, v2_obj.storage_location))

    assert os.path.exists(v1_path), "Raw version 1 file must exist before deletion"
    assert os.path.exists(v2_path), "Prepared version 2 file must exist before deletion"

    # Execute DELETE endpoint
    resp = client.delete(f"/api/v1/datasets/{dataset_id}")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["status"] == "success"

    # Verify physical storage files are absent after deletion
    assert not os.path.exists(v1_path), "Raw file must be deleted after dataset deletion"
    assert not os.path.exists(v2_path), "Prepared file must be deleted after dataset deletion"

    # Verify metadata is deleted
    assert db.query(Dataset).filter(Dataset.id == dataset_id).first() is None
    assert db.query(DatasetVersion).filter(DatasetVersion.dataset_id == dataset_id).count() == 0
    assert db.query(DatasetProfile).filter(DatasetProfile.dataset_id == dataset_id).count() == 0
    assert db.query(DatasetColumn).filter(DatasetColumn.dataset_id == dataset_id).count() == 0
    assert db.query(Transformation).filter(Transformation.dataset_id == dataset_id).count() == 0
    assert db.query(ModelDataset).filter(ModelDataset.dataset_id == dataset_id).count() == 0
    assert db.query(DashboardItem).filter(DashboardItem.dataset_id == dataset_id).count() == 0


def test_delete_nonexistent_dataset(client):
    resp = client.delete("/api/v1/datasets/nonexistent-uuid-1234")
    assert resp.status_code == 404
    assert resp.json()["detail"]["error"]["code"] == "DATASET_NOT_FOUND"


def test_unauthorized_workspace_isolation_deletion(db, client):
    # Dataset created in workspace A
    get_or_create_workspace(db, "workspace_A")
    get_or_create_workspace(db, "workspace_B")

    ingestion = CSVIngestionService(db)
    ds = ingestion.ingest_csv(
        file_bytes=CSV_DATA,
        original_filename="ws_a_file.csv",
        workspace_id="workspace_A",
        dataset_name="WS A Dataset"
    )

    # Workspace B attempts to delete Workspace A's dataset
    resp = client.delete(f"/api/v1/workspaces/workspace_B/datasets/{ds.id}")
    assert resp.status_code == 404
    assert resp.json()["detail"]["error"]["code"] == "DATASET_NOT_FOUND"

    # Verify dataset still exists in workspace_A
    assert db.query(Dataset).filter(Dataset.id == ds.id).first() is not None


def test_clear_all_workspace_data(db, client):
    get_or_create_workspace(db, "workspace_clean")
    get_or_create_workspace(db, "workspace_other")

    ingestion = CSVIngestionService(db)
    ds1 = ingestion.ingest_csv(CSV_DATA, "ds1.csv", workspace_id="workspace_clean", dataset_name="DS 1")
    ds2 = ingestion.ingest_csv(CSV_DATA, "ds2.csv", workspace_id="workspace_clean", dataset_name="DS 2")
    ds_other = ingestion.ingest_csv(CSV_DATA, "other.csv", workspace_id="workspace_other", dataset_name="Other DS")

    # Attempt to clear without "CLEAR" text
    resp_invalid = client.delete("/api/v1/workspaces/workspace_clean/data?confirm_text=NOPE")
    assert resp_invalid.status_code == 400

    # Clear workspace_clean with confirm_text=CLEAR
    resp = client.delete("/api/v1/workspaces/workspace_clean/data?confirm_text=CLEAR")
    assert resp.status_code == 200
    res = resp.json()
    assert res["status"] == "success"

    # Verify workspace_clean datasets are deleted
    assert db.query(Dataset).filter(Dataset.workspace_id == "workspace_clean").count() == 0

    # Verify workspace_other dataset remains completely untouched
    assert db.query(Dataset).filter(Dataset.workspace_id == "workspace_other").count() == 1
    assert db.query(Dataset).filter(Dataset.id == ds_other.id).first() is not None


def test_repeated_deletion(db, client):
    ingestion = CSVIngestionService(db)
    ds = ingestion.ingest_csv(CSV_DATA, "repeat.csv", workspace_id="default", dataset_name="Repeat Delete")

    # First deletion
    resp1 = client.delete(f"/api/v1/datasets/{ds.id}")
    assert resp1.status_code == 200

    # Second deletion
    resp2 = client.delete(f"/api/v1/datasets/{ds.id}")
    assert resp2.status_code == 404
