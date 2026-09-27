import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.dataset import Workspace, DataSource, Dataset, DatasetVersion, DatasetProfile, DatasetColumn
from app.schemas.dataset import (
    DatasetUploadResponse,
    DatasetItem,
    DatasetListResponse,
    DatasetProfileResponse,
    DatasetProfileSummary,
    ColumnProfileItem
)
from app.services.ingestion_service import CSVIngestionService, DEFAULT_WORKSPACE_ID
from app.services.profiling_service import ProfilingService

router = APIRouter()
logger = logging.getLogger(__name__)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/workspaces/{workspace_id}/datasets/upload",
    response_model=DatasetUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload CSV Dataset"
)
def upload_dataset_in_workspace(
    workspace_id: str,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "MISSING_FILE", "message": "No file payload provided in upload request."}}
        )

    try:
        content = file.file.read()
        service = CSVIngestionService(db)
        dataset = service.ingest_csv(
            file_bytes=content,
            original_filename=file.filename,
            workspace_id=workspace_id,
            dataset_name=name
        )

        version = db.query(DatasetVersion).filter(DatasetVersion.id == dataset.current_version_id).first()
        source = db.query(DataSource).filter(DataSource.id == dataset.data_source_id).first()

        orig_filename = source.configuration.get("original_filename", file.filename) if source else file.filename
        file_size = source.configuration.get("file_size_bytes", len(content)) if source else len(content)

        return DatasetUploadResponse(
            dataset_id=dataset.id,
            workspace_id=dataset.workspace_id,
            data_source_id=dataset.data_source_id or "",
            version_id=dataset.current_version_id or "",
            name=dataset.name,
            original_filename=orig_filename,
            file_size_bytes=file_size,
            row_count=version.row_count if version else None,
            column_count=version.column_count if version else None,
            status=dataset.status,
            created_at=dataset.created_at
        )

    except ValueError as ve:
        logger.warning(f"Dataset upload validation error: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_FILE", "message": str(ve)}}
        )
    except Exception as e:
        logger.error(f"Unexpected dataset upload failure: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "INGESTION_ERROR", "message": "Failed to process and register dataset."}}
        )


@router.post(
    "/datasets/upload",
    response_model=DatasetUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload CSV Dataset (Default Workspace)"
)
def upload_dataset_default(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    return upload_dataset_in_workspace(
        workspace_id=DEFAULT_WORKSPACE_ID,
        file=file,
        name=name,
        db=db
    )


@router.get(
    "/workspaces/{workspace_id}/datasets",
    response_model=DatasetListResponse,
    summary="List workspace datasets"
)
def list_workspace_datasets(workspace_id: str, db: Session = Depends(get_db)):
    datasets = db.query(Dataset).filter(Dataset.workspace_id == workspace_id).order_by(Dataset.created_at.desc()).all()
    items: List[DatasetItem] = []

    for ds in datasets:
        version = db.query(DatasetVersion).filter(DatasetVersion.id == ds.current_version_id).first()
        source = db.query(DataSource).filter(DataSource.id == ds.data_source_id).first()
        orig_name = source.configuration.get("original_filename", ds.name) if source else ds.name
        file_size = source.configuration.get("file_size_bytes", 0) if source else 0

        items.append(DatasetItem(
            id=ds.id,
            workspace_id=ds.workspace_id,
            data_source_id=ds.data_source_id,
            name=ds.name,
            status=ds.status,
            original_filename=orig_name,
            file_size_bytes=file_size,
            row_count=version.row_count if version else None,
            column_count=version.column_count if version else None,
            created_at=ds.created_at,
            updated_at=ds.updated_at
        ))

    return DatasetListResponse(items=items, total=len(items))


@router.get(
    "/datasets",
    response_model=DatasetListResponse,
    summary="List default workspace datasets"
)
def list_default_datasets(db: Session = Depends(get_db)):
    return list_workspace_datasets(workspace_id=DEFAULT_WORKSPACE_ID, db=db)


@router.get(
    "/datasets/{dataset_id}",
    response_model=DatasetItem,
    summary="Get dataset details by ID"
)
@router.get(
    "/workspaces/{workspace_id}/datasets/{dataset_id}",
    response_model=DatasetItem,
    summary="Get dataset details"
)
def get_dataset(dataset_id: str, workspace_id: str = DEFAULT_WORKSPACE_ID, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.workspace_id == workspace_id, Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "DATASET_NOT_FOUND", "message": "Requested dataset does not exist."}}
        )

    version = db.query(DatasetVersion).filter(DatasetVersion.id == dataset.current_version_id).first()
    source = db.query(DataSource).filter(DataSource.id == dataset.data_source_id).first()
    orig_name = source.configuration.get("original_filename", dataset.name) if source else dataset.name
    file_size = source.configuration.get("file_size_bytes", 0) if source else 0

    return DatasetItem(
        id=dataset.id,
        workspace_id=dataset.workspace_id,
        data_source_id=dataset.data_source_id,
        name=dataset.name,
        status=dataset.status,
        original_filename=orig_name,
        file_size_bytes=file_size,
        row_count=version.row_count if version else None,
        column_count=version.column_count if version else None,
        created_at=dataset.created_at,
        updated_at=dataset.updated_at
    )


@router.get(
    "/datasets/{dataset_id}/profile",
    response_model=DatasetProfileResponse,
    summary="Get dataset profile"
)
@router.get(
    "/workspaces/{workspace_id}/datasets/{dataset_id}/profile",
    response_model=DatasetProfileResponse,
    summary="Get dataset profile in workspace"
)
def get_dataset_profile(dataset_id: str, workspace_id: str = DEFAULT_WORKSPACE_ID, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.workspace_id == workspace_id, Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "DATASET_NOT_FOUND", "message": "Requested dataset does not exist."}}
        )

    if not dataset.current_version_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "NO_VERSION", "message": "Dataset has no active version."}}
        )

    # Fetch existing profile or generate on demand
    profile = db.query(DatasetProfile).filter(DatasetProfile.dataset_version_id == dataset.current_version_id).first()
    columns = db.query(DatasetColumn).filter(DatasetColumn.dataset_version_id == dataset.current_version_id).order_by(DatasetColumn.ordinal_position.asc()).all()

    if not profile or not columns:
        try:
            profiler = ProfilingService(db)
            profile, columns = profiler.profile_dataset_version(dataset.id, dataset.current_version_id)
        except Exception as e:
            logger.error(f"Failed to calculate dataset profile for {dataset_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={"error": {"code": "PROFILING_ERROR", "message": f"Failed to compute dataset profile: {str(e)}"}}
            )

    summary = DatasetProfileSummary.model_validate(profile)
    col_items = [ColumnProfileItem.model_validate(col) for col in columns]

    return DatasetProfileResponse(
        dataset_id=dataset.id,
        workspace_id=dataset.workspace_id,
        version_id=dataset.current_version_id,
        dataset_name=dataset.name,
        summary=summary,
        columns=col_items
    )


@router.post(
    "/datasets/{dataset_id}/profile/generate",
    response_model=DatasetProfileResponse,
    summary="Generate / re-generate dataset profile"
)
@router.post(
    "/workspaces/{workspace_id}/datasets/{dataset_id}/profile/generate",
    response_model=DatasetProfileResponse,
    summary="Generate / re-generate dataset profile in workspace"
)
def generate_dataset_profile(dataset_id: str, workspace_id: str = DEFAULT_WORKSPACE_ID, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.workspace_id == workspace_id, Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "DATASET_NOT_FOUND", "message": "Requested dataset does not exist."}}
        )

    try:
        profiler = ProfilingService(db)
        profile, columns = profiler.profile_dataset_version(dataset.id, dataset.current_version_id)
        summary = DatasetProfileSummary.model_validate(profile)
        col_items = [ColumnProfileItem.model_validate(col) for col in columns]

        return DatasetProfileResponse(
            dataset_id=dataset.id,
            workspace_id=dataset.workspace_id,
            version_id=dataset.current_version_id or "",
            dataset_name=dataset.name,
            summary=summary,
            columns=col_items
        )
    except Exception as e:
        logger.error(f"Failed to generate dataset profile for {dataset_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "PROFILING_ERROR", "message": f"Failed to generate profile: {str(e)}"}}
        )


# Phase 4 Preparation & Transformation Endpoints

from app.schemas.dataset import (
    PrepareDatasetRequest,
    PreparedDatasetResponse,
    TransformationHistoryResponse,
    TransformationItem,
    ValidateDatasetRequest,
    ValidateDatasetResponse,
    ValidationIssueItem,
    DatasetSampleResponse,
    PreviewPreparationResponse
)
from app.services.preparation_service import PreparationService
from app.models.dataset import Transformation


@router.get(
    "/datasets/{dataset_id}/sample",
    response_model=DatasetSampleResponse,
    summary="Get representative dataset sample rows and column header types"
)
@router.get(
    "/workspaces/{workspace_id}/datasets/{dataset_id}/sample",
    response_model=DatasetSampleResponse,
    summary="Get dataset sample rows in workspace"
)
def get_dataset_sample_endpoint(
    dataset_id: str,
    limit: int = 20,
    version_id: Optional[str] = None,
    workspace_id: str = DEFAULT_WORKSPACE_ID,
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.workspace_id == workspace_id, Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "DATASET_NOT_FOUND", "message": "Requested dataset does not exist."}}
        )

    try:
        prep_service = PreparationService(db)
        return prep_service.get_dataset_sample(
            dataset_id=dataset.id,
            version_id=version_id,
            limit=limit
        )
    except KeyError as ke:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "RESOURCE_NOT_FOUND", "message": str(ke)}}
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "SAMPLE_ERROR", "message": str(ve)}}
        )


@router.post(
    "/datasets/{dataset_id}/prepare/preview",
    response_model=PreviewPreparationResponse,
    summary="Preview preparation plan (dry-run without disk modification)"
)
@router.post(
    "/workspaces/{workspace_id}/datasets/{dataset_id}/prepare/preview",
    response_model=PreviewPreparationResponse,
    summary="Preview preparation plan in workspace"
)
def preview_preparation_endpoint(
    dataset_id: str,
    req: PrepareDatasetRequest,
    limit: int = 20,
    workspace_id: str = DEFAULT_WORKSPACE_ID,
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.workspace_id == workspace_id, Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "DATASET_NOT_FOUND", "message": "Requested dataset does not exist."}}
        )

    if not req.operations or len(req.operations) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_OPERATIONS", "message": "At least one preparation operation must be provided for preview."}}
        )

    try:
        prep_service = PreparationService(db)
        return prep_service.preview_preparation(
            dataset_id=dataset.id,
            operations=req.operations,
            source_version_id=req.source_version_id,
            limit=limit
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "PREVIEW_ERROR", "message": str(ve)}}
        )
    except KeyError as ke:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "RESOURCE_NOT_FOUND", "message": str(ke)}}
        )


@router.post(
    "/datasets/{dataset_id}/prepare",
    response_model=PreparedDatasetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Prepare / clean dataset version"
)
@router.post(
    "/workspaces/{workspace_id}/datasets/{dataset_id}/prepare",
    response_model=PreparedDatasetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Prepare / clean dataset version in workspace"
)
def prepare_dataset_endpoint(
    dataset_id: str,
    req: PrepareDatasetRequest,
    workspace_id: str = DEFAULT_WORKSPACE_ID,
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.workspace_id == workspace_id, Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "DATASET_NOT_FOUND", "message": "Requested dataset does not exist."}}
        )

    if not req.operations or len(req.operations) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_OPERATIONS", "message": "At least one preparation operation must be provided."}}
        )

    try:
        prep_service = PreparationService(db)
        prep_ver, metrics, transformations = prep_service.prepare_dataset(
            dataset_id=dataset.id,
            operations=req.operations,
            source_version_id=req.source_version_id
        )

        return PreparedDatasetResponse(
            dataset_id=dataset.id,
            workspace_id=dataset.workspace_id,
            source_version_id=prep_ver.parent_version_id or "",
            prepared_version_id=prep_ver.id,
            version_number=prep_ver.version_number,
            metrics_comparison=metrics,
            created_at=prep_ver.created_at
        )
    except ValueError as ve:
        logger.warning(f"Preparation operation validation error for dataset {dataset_id}: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "PREPARATION_ERROR", "message": str(ve)}}
        )
    except KeyError as ke:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "RESOURCE_NOT_FOUND", "message": str(ke)}}
        )
    except Exception as e:
        logger.error(f"Unexpected dataset preparation failure: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "PREPARATION_FAILED", "message": f"Failed to execute preparation operations: {str(e)}"}}
        )


@router.get(
    "/datasets/{dataset_id}/transformations",
    response_model=TransformationHistoryResponse,
    summary="Get dataset transformation history / lineage"
)
@router.get(
    "/workspaces/{workspace_id}/datasets/{dataset_id}/transformations",
    response_model=TransformationHistoryResponse,
    summary="Get dataset transformation history in workspace"
)
def get_dataset_transformations(
    dataset_id: str,
    workspace_id: str = DEFAULT_WORKSPACE_ID,
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.workspace_id == workspace_id, Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "DATASET_NOT_FOUND", "message": "Requested dataset does not exist."}}
        )

    tr_records = db.query(Transformation).filter(Transformation.dataset_id == dataset.id).order_by(Transformation.created_at.asc()).all()
    items = [TransformationItem.model_validate(tr) for tr in tr_records]

    return TransformationHistoryResponse(
        dataset_id=dataset.id,
        transformations=items,
        total=len(items)
    )


@router.post(
    "/datasets/{dataset_id}/validate",
    response_model=ValidateDatasetResponse,
    summary="Validate dataset version and preparation operations"
)
@router.post(
    "/workspaces/{workspace_id}/datasets/{dataset_id}/validate",
    response_model=ValidateDatasetResponse,
    summary="Validate dataset version and operations in workspace"
)
def validate_dataset_endpoint(
    dataset_id: str,
    req: ValidateDatasetRequest,
    workspace_id: str = DEFAULT_WORKSPACE_ID,
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.workspace_id == workspace_id, Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "DATASET_NOT_FOUND", "message": "Requested dataset does not exist."}}
        )

    target_ver_id = req.version_id or dataset.current_version_id
    version = db.query(DatasetVersion).filter(DatasetVersion.id == target_ver_id).first()
    if not version:
        return ValidateDatasetResponse(
            status="invalid",
            issues=[ValidationIssueItem(code="NO_VERSION", message="Dataset version not found.")]
        )

    issues: List[ValidationIssueItem] = []

    # Validate operations if provided
    if req.operations:
        for idx, op in enumerate(req.operations):
            if op.operation_type not in ("fill_missing", "remove_duplicates", "convert_type", "text_normalization", "column_operation", "date_transform"):
                issues.append(ValidationIssueItem(code="INVALID_OPERATION_TYPE", message=f"Unsupported operation type '{op.operation_type}' at index {idx}."))

    return ValidateDatasetResponse(
        status="valid" if len(issues) == 0 else "invalid",
        issues=issues
    )


# Phase 5 Data Modeling & Relationship Endpoints

from app.schemas.dataset import (
    DataModelItem,
    DataModelDetailsResponse,
    ModelDatasetItem,
    RelationshipItem,
    BindDatasetToModelRequest,
    CreateRelationshipRequest,
    ValidateRelationshipRequest,
    ValidateRelationshipResponse
)
from app.services.modeling_service import ModelingService
from app.models.dataset import DataModel, ModelDataset, Relationship


@router.get(
    "/models",
    response_model=DataModelDetailsResponse,
    summary="Get workspace data model details"
)
@router.get(
    "/workspaces/{workspace_id}/models",
    response_model=DataModelDetailsResponse,
    summary="Get data model details for workspace"
)
def get_workspace_data_model(workspace_id: str = DEFAULT_WORKSPACE_ID, db: Session = Depends(get_db)):
    service = ModelingService(db)
    try:
        model = service.get_or_create_model(workspace_id)
        datasets = db.query(ModelDataset).filter(ModelDataset.model_id == model.id).all()
        relationships = db.query(Relationship).filter(Relationship.model_id == model.id).all()

        return DataModelDetailsResponse(
            id=model.id,
            workspace_id=model.workspace_id,
            name=model.name,
            description=model.description,
            status=model.status,
            datasets=[ModelDatasetItem.model_validate(ds) for ds in datasets],
            relationships=[RelationshipItem.model_validate(rel) for rel in relationships],
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    except KeyError as ke:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "WORKSPACE_NOT_FOUND", "message": str(ke)}}
        )


@router.get(
    "/models/{model_id}",
    response_model=DataModelDetailsResponse,
    summary="Get model details by ID"
)
@router.get(
    "/workspaces/{workspace_id}/models/{model_id}",
    response_model=DataModelDetailsResponse,
    summary="Get model details by ID in workspace"
)
def get_data_model_by_id(model_id: str, workspace_id: str = DEFAULT_WORKSPACE_ID, db: Session = Depends(get_db)):
    model = db.query(DataModel).filter(DataModel.workspace_id == workspace_id, DataModel.id == model_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "MODEL_NOT_FOUND", "message": "Requested data model does not exist."}}
        )

    datasets = db.query(ModelDataset).filter(ModelDataset.model_id == model.id).all()
    relationships = db.query(Relationship).filter(Relationship.model_id == model.id).all()

    return DataModelDetailsResponse(
        id=model.id,
        workspace_id=model.workspace_id,
        name=model.name,
        description=model.description,
        status=model.status,
        datasets=[ModelDatasetItem.model_validate(ds) for ds in datasets],
        relationships=[RelationshipItem.model_validate(rel) for rel in relationships],
        created_at=model.created_at,
        updated_at=model.updated_at
    )


@router.post(
    "/models/{model_id}/datasets",
    response_model=ModelDatasetItem,
    status_code=status.HTTP_201_CREATED,
    summary="Bind dataset version to model"
)
@router.post(
    "/workspaces/{workspace_id}/models/{model_id}/datasets",
    response_model=ModelDatasetItem,
    status_code=status.HTTP_201_CREATED,
    summary="Bind dataset version to model in workspace"
)
def bind_dataset_to_model_endpoint(
    model_id: str,
    req: BindDatasetToModelRequest,
    workspace_id: str = DEFAULT_WORKSPACE_ID,
    db: Session = Depends(get_db)
):
    service = ModelingService(db)
    try:
        binding = service.bind_dataset_to_model(
            model_id=model_id,
            dataset_id=req.dataset_id,
            version_id=req.dataset_version_id,
            alias=req.alias
        )
        return ModelDatasetItem.model_validate(binding)
    except KeyError as ke:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "RESOURCE_NOT_FOUND", "message": str(ke)}}
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "BINDING_ERROR", "message": str(ve)}}
        )


@router.post(
    "/models/{model_id}/relationships/validate",
    response_model=ValidateRelationshipResponse,
    summary="Validate relationship proposal"
)
@router.post(
    "/workspaces/{workspace_id}/models/{model_id}/relationships/validate",
    response_model=ValidateRelationshipResponse,
    summary="Validate relationship proposal in workspace"
)
def validate_relationship_endpoint(
    model_id: str,
    req: ValidateRelationshipRequest,
    workspace_id: str = DEFAULT_WORKSPACE_ID,
    db: Session = Depends(get_db)
):
    service = ModelingService(db)
    is_valid, issues = service.validate_relationship(
        workspace_id=workspace_id,
        model_id=model_id,
        source_dataset_id=req.source_dataset_id,
        source_field=req.source_field,
        target_dataset_id=req.target_dataset_id,
        target_field=req.target_field,
        cardinality=req.cardinality,
        source_version_id=req.source_version_id,
        target_version_id=req.target_version_id
    )

    return ValidateRelationshipResponse(is_valid=is_valid, issues=issues)


@router.post(
    "/models/{model_id}/relationships",
    response_model=RelationshipItem,
    status_code=status.HTTP_201_CREATED,
    summary="Create relationship in model"
)
@router.post(
    "/workspaces/{workspace_id}/models/{model_id}/relationships",
    response_model=RelationshipItem,
    status_code=status.HTTP_201_CREATED,
    summary="Create relationship in model in workspace"
)
def create_relationship_endpoint(
    model_id: str,
    req: CreateRelationshipRequest,
    workspace_id: str = DEFAULT_WORKSPACE_ID,
    db: Session = Depends(get_db)
):
    service = ModelingService(db)
    try:
        rel = service.create_relationship(
            workspace_id=workspace_id,
            model_id=model_id,
            source_dataset_id=req.source_dataset_id,
            source_field=req.source_field,
            target_dataset_id=req.target_dataset_id,
            target_field=req.target_field,
            cardinality=req.cardinality,
            source_version_id=req.source_version_id,
            target_version_id=req.target_version_id
        )
        return RelationshipItem.model_validate(rel)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_RELATIONSHIP", "message": str(ve)}}
        )
    except KeyError as ke:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "RESOURCE_NOT_FOUND", "message": str(ke)}}
        )


@router.get(
    "/models/{model_id}/relationships",
    response_model=List[RelationshipItem],
    summary="List model relationships"
)
@router.get(
    "/workspaces/{workspace_id}/models/{model_id}/relationships",
    response_model=List[RelationshipItem],
    summary="List model relationships in workspace"
)
def list_relationships_endpoint(
    model_id: str,
    workspace_id: str = DEFAULT_WORKSPACE_ID,
    db: Session = Depends(get_db)
):
    model = db.query(DataModel).filter(DataModel.workspace_id == workspace_id, DataModel.id == model_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "MODEL_NOT_FOUND", "message": "Requested data model does not exist."}}
        )

    service = ModelingService(db)
    rels = service.get_model_relationships(model.id)
    return [RelationshipItem.model_validate(r) for r in rels]


@router.delete(
    "/models/{model_id}/relationships/{relationship_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete relationship from model"
)
@router.delete(
    "/workspaces/{workspace_id}/models/{model_id}/relationships/{relationship_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete relationship from model in workspace"
)
def delete_relationship_endpoint(
    model_id: str,
    relationship_id: str,
    workspace_id: str = DEFAULT_WORKSPACE_ID,
    db: Session = Depends(get_db)
):
    model = db.query(DataModel).filter(DataModel.workspace_id == workspace_id, DataModel.id == model_id).first()
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "MODEL_NOT_FOUND", "message": "Requested data model does not exist."}}
        )

    service = ModelingService(db)
    success = service.delete_relationship(model.id, relationship_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": {"code": "RELATIONSHIP_NOT_FOUND", "message": "Requested relationship does not exist in model."}}
        )
    return None


