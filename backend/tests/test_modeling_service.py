import hashlib
import pytest
from app.services.ingestion_service import CSVIngestionService
from app.services.preparation_service import PreparationService
from app.services.profiling_service import ProfilingService
from app.services.modeling_service import ModelingService
from app.services.storage_service import LocalStorageProvider
from app.schemas.dataset import PreparationOperation


@pytest.fixture
def test_storage(tmp_path):
    raw_dir = tmp_path / "storage" / "raw"
    return LocalStorageProvider(raw_base_dir=str(raw_dir))


def test_model_creation_and_dataset_binding(db, test_storage):
    csv1 = b"id,name\n1,Alice\n2,Bob\n"
    ingest = CSVIngestionService(db, storage=test_storage)
    ds1 = ingest.ingest_csv(csv1, "users.csv", "test-ws-1", "Users")

    modeling = ModelingService(db)
    model = modeling.get_or_create_model("test-ws-1")
    assert model.workspace_id == "test-ws-1"

    binding = modeling.bind_dataset_to_model(model.id, ds1.id)
    assert binding.dataset_id == ds1.id
    assert binding.dataset_version_id == ds1.current_version_id

    # Workspace Isolation check: bind dataset from ws2 to model of ws1 must fail
    ds_other = ingest.ingest_csv(csv1, "other.csv", "test-ws-2", "Other")
    with pytest.raises(ValueError) as exc:
        modeling.bind_dataset_to_model(model.id, ds_other.id)
    assert "Workspace isolation error" in str(exc.value)


def test_relationship_validation_and_creation(db, test_storage):
    orders_csv = b"order_id,cust_id,order_date,amount\n101,1,2026-05-10,150.00\n102,2,2026-05-11,200.50\n"
    customers_csv = b"id,name,is_vip\n1,Alice,true\n2,Bob,false\n"

    ingest = CSVIngestionService(db, storage=test_storage)
    ds_orders = ingest.ingest_csv(orders_csv, "orders.csv", "ws-rel", "Orders")
    ds_customers = ingest.ingest_csv(customers_csv, "customers.csv", "ws-rel", "Customers")

    modeling = ModelingService(db)
    model = modeling.get_or_create_model("ws-rel")

    # 1. Valid Relationship: Orders.cust_id (INTEGER) -> Customers.id (INTEGER)
    is_valid, issues = modeling.validate_relationship(
        workspace_id="ws-rel",
        model_id=model.id,
        source_dataset_id=ds_orders.id,
        source_field="cust_id",
        target_dataset_id=ds_customers.id,
        target_field="id",
        cardinality="many_to_one"
    )
    assert is_valid is True
    assert len(issues) == 0

    rel = modeling.create_relationship(
        workspace_id="ws-rel",
        model_id=model.id,
        source_dataset_id=ds_orders.id,
        source_field="cust_id",
        target_dataset_id=ds_customers.id,
        target_field="id",
        cardinality="many_to_one"
    )
    assert rel.cardinality == "many_to_one"

    # 2. Incompatible Types: Orders.order_date (DATE) -> Customers.is_vip (BOOLEAN)
    is_valid_inc, issues_inc = modeling.validate_relationship(
        workspace_id="ws-rel",
        model_id=model.id,
        source_dataset_id=ds_orders.id,
        source_field="order_date",
        target_dataset_id=ds_customers.id,
        target_field="is_vip"
    )
    assert is_valid_inc is False
    assert any("Incompatible field types" in i for i in issues_inc)

    # 3. Non-existent field: Orders.non_existent -> Customers.id
    is_valid_nf, issues_nf = modeling.validate_relationship(
        workspace_id="ws-rel",
        model_id=model.id,
        source_dataset_id=ds_orders.id,
        source_field="non_existent",
        target_dataset_id=ds_customers.id,
        target_field="id"
    )
    assert is_valid_nf is False
    assert any("not found" in i for i in issues_nf)

    # 4. Duplicate relationship
    with pytest.raises(ValueError) as exc_dup:
        modeling.create_relationship(
            workspace_id="ws-rel",
            model_id=model.id,
            source_dataset_id=ds_orders.id,
            source_field="cust_id",
            target_dataset_id=ds_customers.id,
            target_field="id"
        )
    assert "already exists" in str(exc_dup.value)


def test_relationship_workspace_isolation(db, test_storage):
    csv1 = b"id,val\n1,10\n"
    ingest = CSVIngestionService(db, storage=test_storage)
    ds1 = ingest.ingest_csv(csv1, "d1.csv", "ws-iso-1", "D1")
    ds2 = ingest.ingest_csv(csv1, "d2.csv", "ws-iso-2", "D2")

    modeling = ModelingService(db)
    model1 = modeling.get_or_create_model("ws-iso-1")

    is_valid, issues = modeling.validate_relationship(
        workspace_id="ws-iso-1",
        model_id=model1.id,
        source_dataset_id=ds1.id,
        source_field="id",
        target_dataset_id=ds2.id,
        target_field="id"
    )
    assert is_valid is False
    assert any("cross-workspace" in i for i in issues)


def test_relationship_deletion(db, test_storage):
    csv1 = b"id,val\n1,10\n"
    csv2 = b"id,val\n1,10\n"
    ingest = CSVIngestionService(db, storage=test_storage)
    ds1 = ingest.ingest_csv(csv1, "a.csv", "ws-del", "A")
    ds2 = ingest.ingest_csv(csv2, "b.csv", "ws-del", "B")

    modeling = ModelingService(db)
    model = modeling.get_or_create_model("ws-del")

    rel = modeling.create_relationship(
        workspace_id="ws-del",
        model_id=model.id,
        source_dataset_id=ds1.id,
        source_field="id",
        target_dataset_id=ds2.id,
        target_field="id"
    )

    rels_before = modeling.get_model_relationships(model.id)
    assert len(rels_before) == 1

    success = modeling.delete_relationship(model.id, rel.id)
    assert success is True

    rels_after = modeling.get_model_relationships(model.id)
    assert len(rels_after) == 0


def test_modeling_raw_and_prepared_file_immutability(db, test_storage):
    raw_csv = b"id,val\n1,10\n2,20\n"
    pre_raw_size = len(raw_csv)
    pre_raw_hash = hashlib.sha256(raw_csv).hexdigest()

    ingest = CSVIngestionService(db, storage=test_storage)
    ds = ingest.ingest_csv(raw_csv, "immut.csv", "ws-immut", "Immut")
    raw_ver = ds.versions[0]

    # Prepare version
    prep_service = PreparationService(db, storage=test_storage)
    prep_ver, _, _ = prep_service.prepare_dataset(
        dataset_id=ds.id,
        operations=[PreparationOperation(operation_type="text_normalization", target_column="val", params={"action": "trim"})]
    )

    prep_bytes_before = test_storage.get_file_bytes(prep_ver.storage_location)
    pre_prep_size = len(prep_bytes_before)
    pre_prep_hash = hashlib.sha256(prep_bytes_before).hexdigest()

    # Perform modeling operation
    modeling = ModelingService(db)
    model = modeling.get_or_create_model("ws-immut")
    modeling.bind_dataset_to_model(model.id, ds.id, prep_ver.id)

    # Verify Raw file on disk
    raw_bytes_after = test_storage.get_file_bytes(raw_ver.storage_location)
    assert len(raw_bytes_after) == pre_raw_size
    assert hashlib.sha256(raw_bytes_after).hexdigest() == pre_raw_hash

    # Verify Prepared file on disk
    prep_bytes_after = test_storage.get_file_bytes(prep_ver.storage_location)
    assert len(prep_bytes_after) == pre_prep_size
    assert hashlib.sha256(prep_bytes_after).hexdigest() == pre_prep_hash
