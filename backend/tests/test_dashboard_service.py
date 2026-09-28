import os
import hashlib
import pytest
from app.db.session import SessionLocal
from app.services.ingestion_service import CSVIngestionService
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import (
    DashboardCreate,
    DashboardUpdate,
    DashboardItemCreate,
    LayoutItem,
)
from app.schemas.analytics import VisualizationSpec, DimensionSpec, MeasureSpec





@pytest.fixture
def test_dataset(db):
    csv_content = "category,sales\nTech,100\nHome,200\n".encode("utf-8")
    ingestion = CSVIngestionService(db)
    return ingestion.ingest_csv(
        file_bytes=csv_content,
        original_filename="test_dash.csv",
        workspace_id="default",
        dataset_name="Test Dash Dataset"
    )


def test_dashboard_crud(db, test_dataset):
    service = DashboardService(db)

    # 1. Create Dashboard
    create_spec = DashboardCreate(
        name="Executive Sales Dashboard",
        description="High level KPI sales summary",
        items=[
            DashboardItemCreate(
                title="Category Sales",
                visualization_spec=VisualizationSpec(
                    chart_type="bar",
                    dimensions=[DimensionSpec(field="category")],
                    measures=[MeasureSpec(field="sales", aggregation="sum")]
                ),
                dataset_id=test_dataset.id,
                layout=LayoutItem(x=0, y=0, w=6, h=4)
            )
        ]
    )

    dash = service.create_dashboard("default", create_spec)
    assert dash.name == "Executive Sales Dashboard"
    assert len(dash.items) == 1
    assert dash.items[0].layout["w"] == 6

    # 2. Get Dashboard
    fetched = service.get_dashboard(dash.id, "default")
    assert fetched.id == dash.id

    # 3. Update Dashboard & Layout
    update_spec = DashboardUpdate(
        name="Updated Sales Dashboard",
        filters={"category": "Tech"},
        items=[
            DashboardItemCreate(
                title="Category Sales Updated",
                visualization_spec=VisualizationSpec(
                    chart_type="bar",
                    dimensions=[DimensionSpec(field="category")],
                    measures=[MeasureSpec(field="sales", aggregation="sum")]
                ),
                dataset_id=test_dataset.id,
                layout=LayoutItem(x=0, y=0, w=12, h=6)
            )
        ]
    )
    updated = service.update_dashboard(dash.id, "default", update_spec)
    assert updated.name == "Updated Sales Dashboard"
    assert updated.filters["category"] == "Tech"
    assert updated.items[0].layout["w"] == 12

    # 4. Workspace Isolation
    with pytest.raises(KeyError):
        service.get_dashboard(dash.id, "other_workspace")

    # 5. Delete Dashboard (leaves dataset intact)
    ds_id = test_dataset.id
    service.delete_dashboard(dash.id, "default")

    with pytest.raises(KeyError):
        service.get_dashboard(dash.id, "default")

    # Dataset remains intact
    assert db.query(type(test_dataset)).filter_by(id=ds_id).first() is not None


def test_dashboard_raw_immutability(db, test_dataset):
    version = test_dataset.versions[0]
    rel_path = version.storage_location
    abs_path = os.path.join("storage", rel_path) if not os.path.isabs(rel_path) else rel_path

    with open(abs_path, "rb") as f:
        before_bytes = f.read()
    before_sha = hashlib.sha256(before_bytes).hexdigest()

    service = DashboardService(db)
    dash = service.create_dashboard("default", DashboardCreate(name="Immutability Dash"))
    service.add_item_to_dashboard(
        dash.id,
        "default",
        DashboardItemCreate(
            title="Item 1",
            visualization_spec=VisualizationSpec(
                chart_type="bar",
                dimensions=[DimensionSpec(field="category")],
                measures=[MeasureSpec(field="sales", aggregation="sum")]
            ),
            dataset_id=test_dataset.id,
            layout=LayoutItem(x=0, y=0, w=6, h=4)
        )
    )
    service.delete_dashboard(dash.id, "default")

    with open(abs_path, "rb") as f:
        after_bytes = f.read()
    after_sha = hashlib.sha256(after_bytes).hexdigest()

    assert before_bytes == after_bytes
    assert before_sha == after_sha


def test_dashboard_measure_validation(db, test_dataset):
    from app.schemas.analytics import SimpleMeasure
    service = DashboardService(db)
    dash = service.create_dashboard("default", DashboardCreate(name="Measure Test Dash"))

    # 1. Valid SimpleMeasure KPI Item
    valid_item = service.add_item_to_dashboard(
        dash.id,
        "default",
        DashboardItemCreate(
            title="Total Sales KPI",
            visualization_spec=VisualizationSpec(
                chart_type="kpi",
                kpi_measure=SimpleMeasure(field="sales", aggregation="sum", display_name="Total Sales", format="currency")
            ),
            dataset_id=test_dataset.id,
            layout=LayoutItem(x=0, y=0, w=4, h=3)
        )
    )
    assert valid_item.title == "Total Sales KPI"
    assert valid_item.visualization_spec["kpi_measure"]["format"] == "currency"

    # 2. Invalid Aggregation Rejection
    with pytest.raises(ValueError, match="Unsupported aggregation"):
        service.add_item_to_dashboard(
            dash.id,
            "default",
            DashboardItemCreate(
                title="Bad Agg Item",
                visualization_spec=VisualizationSpec(
                    chart_type="kpi",
                    kpi_measure=SimpleMeasure(field="sales", aggregation="invalid_agg")
                ),
                dataset_id=test_dataset.id,
                layout=LayoutItem(x=0, y=0, w=4, h=3)
            )
        )

    # 3. Non-numeric sum aggregation rejection
    with pytest.raises(ValueError, match="cannot be applied to non-numeric"):
        service.add_item_to_dashboard(
            dash.id,
            "default",
            DashboardItemCreate(
                title="Non Numeric Sum Item",
                visualization_spec=VisualizationSpec(
                    chart_type="bar",
                    dimensions=[DimensionSpec(field="sales")],
                    measures=[MeasureSpec(field="category", aggregation="sum")]
                ),
                dataset_id=test_dataset.id,
                layout=LayoutItem(x=0, y=0, w=6, h=4)
            )
        )
