import os
import hashlib
import pytest
from app.db.session import SessionLocal
from app.services.ingestion_service import CSVIngestionService
from app.services.analytics_service import AnalyticsService
from app.schemas.analytics import (
    AnalyticsQueryRequest,
    DimensionSpec,
    MeasureSpec,
    SortSpec,
    FilterSpec,
    VisualizationSpec,
)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def analytics_dataset(db):
    csv_content = (
        "category,region,sales,orders\n"
        "Electronics,North,1000,10\n"
        "Electronics,South,1500,15\n"
        "Furniture,North,800,8\n"
        "Furniture,South,1200,12\n"
        "Clothing,North,500,5\n"
    ).encode("utf-8")

    ingestion = CSVIngestionService(db)
    dataset = ingestion.ingest_csv(
        file_bytes=csv_content,
        original_filename="sales_matrix.csv",
        workspace_id="default",
        dataset_name="Sales Matrix"
    )
    return dataset


def test_analytics_group_by_sum_avg_count(db, analytics_dataset):
    service = AnalyticsService(db)

    req = AnalyticsQueryRequest(
        dataset_id=analytics_dataset.id,
        dimensions=[DimensionSpec(field="category")],
        measures=[
            MeasureSpec(field="sales", aggregation="sum", alias="total_sales"),
            MeasureSpec(field="sales", aggregation="avg", alias="avg_sales"),
            MeasureSpec(field="orders", aggregation="count", alias="total_orders"),
        ],
        sort=SortSpec(field="total_sales", direction="desc"),
        limit=10,
    )

    res = service.execute_query(request=req, workspace_id="default")

    assert res.row_count == 3
    assert len(res.data) == 3

    # Electronics should be first due to desc sort (1000 + 1500 = 2500)
    top_row = res.data[0]
    assert top_row["category"] == "Electronics"
    assert top_row["total_sales"] == 2500.0
    assert top_row["avg_sales"] == 1250.0
    assert top_row["total_orders"] == 2


def test_analytics_min_max_distinct_count(db, analytics_dataset):
    service = AnalyticsService(db)

    req = AnalyticsQueryRequest(
        dataset_id=analytics_dataset.id,
        dimensions=[DimensionSpec(field="category")],
        measures=[
            MeasureSpec(field="sales", aggregation="min", alias="min_sales"),
            MeasureSpec(field="sales", aggregation="max", alias="max_sales"),
            MeasureSpec(field="region", aggregation="distinct_count", alias="distinct_regions"),
        ],
        sort=SortSpec(field="category", direction="asc"),
    )

    res = service.execute_query(request=req, workspace_id="default")
    assert res.row_count == 3

    clothing_row = [r for r in res.data if r["category"] == "Clothing"][0]
    assert clothing_row["min_sales"] == 500.0
    assert clothing_row["max_sales"] == 500.0
    assert clothing_row["distinct_regions"] == 1


def test_analytics_invalid_aggregation_type(db, analytics_dataset):
    service = AnalyticsService(db)

    # SUM on string column 'category' should fail deterministically
    req = AnalyticsQueryRequest(
        dataset_id=analytics_dataset.id,
        dimensions=[DimensionSpec(field="region")],
        measures=[MeasureSpec(field="category", aggregation="sum")],
    )

    with pytest.raises(ValueError, match="not supported for non-numeric field"):
        service.execute_query(request=req, workspace_id="default")


def test_analytics_invalid_field(db, analytics_dataset):
    service = AnalyticsService(db)

    req = AnalyticsQueryRequest(
        dataset_id=analytics_dataset.id,
        dimensions=[DimensionSpec(field="non_existent_column")],
        measures=[MeasureSpec(field="sales", aggregation="sum")],
    )

    with pytest.raises(ValueError, match="does not exist in dataset schema"):
        service.execute_query(request=req, workspace_id="default")


def test_analytics_raw_immutability(db, analytics_dataset):
    version = analytics_dataset.versions[0]
    rel_path = version.storage_location
    abs_path = os.path.join("storage", rel_path) if not os.path.isabs(rel_path) else rel_path

    with open(abs_path, "rb") as f:
        before_bytes = f.read()
    before_hash = hashlib.sha256(before_bytes).hexdigest()

    service = AnalyticsService(db)
    req = AnalyticsQueryRequest(
        dataset_id=analytics_dataset.id,
        dimensions=[DimensionSpec(field="category")],
        measures=[MeasureSpec(field="sales", aggregation="sum")],
    )
    service.execute_query(request=req, workspace_id="default")

    with open(abs_path, "rb") as f:
        after_bytes = f.read()
    after_hash = hashlib.sha256(after_bytes).hexdigest()

    assert before_bytes == after_bytes
    assert before_hash == after_hash


def test_visualization_spec_validation(db, analytics_dataset):
    service = AnalyticsService(db)

    # Valid Bar Spec
    bar_spec = VisualizationSpec(
        chart_type="bar",
        dimensions=[DimensionSpec(field="category")],
        measures=[MeasureSpec(field="sales", aggregation="sum")],
    )
    val_bar = service.validate_visualization_spec(bar_spec, dataset_id=analytics_dataset.id)
    assert val_bar.is_valid is True
    assert len(val_bar.issues) == 0

    # Invalid Bar Spec (missing measures)
    bad_bar = VisualizationSpec(
        chart_type="bar",
        dimensions=[DimensionSpec(field="category")],
        measures=[],
    )
    val_bad = service.validate_visualization_spec(bad_bar, dataset_id=analytics_dataset.id)
    assert val_bad.is_valid is False
    assert any("requires at least 1 measure" in issue for issue in val_bad.issues)

    # Invalid Chart Type
    bad_type = VisualizationSpec(
        chart_type="3d_cube",
        dimensions=[DimensionSpec(field="category")],
        measures=[MeasureSpec(field="sales", aggregation="sum")],
    )
    val_type = service.validate_visualization_spec(bad_type, dataset_id=analytics_dataset.id)
    assert val_type.is_valid is False
    assert any("Unsupported chart type" in issue for issue in val_type.issues)
