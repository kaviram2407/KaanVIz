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
