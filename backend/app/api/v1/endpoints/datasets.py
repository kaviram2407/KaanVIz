import logging
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.dataset import Dataset, DatasetVersion, DataSource
from app.schemas.dataset import DatasetUploadResponse, DatasetListResponse, DatasetItem
from app.services.ingestion_service import CSVIngestionService, DEFAULT_WORKSPACE_ID

router = APIRouter()
logger = logger = logging.getLogger(__name__)


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
    summary="Upload and register a raw CSV dataset"
)
async def upload_dataset_in_workspace(
    workspace_id: str,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "MISSING_FILENAME", "message": "No file uploaded."}}
        )

    try:
        content = await file.read()
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

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": {"code": "INVALID_FILE", "message": str(e)}}
        )
    except Exception as e:
        logger.error(f"Unexpected upload failure: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": {"code": "INGESTION_ERROR", "message": "An error occurred during dataset ingestion."}}
        )


@router.post(
    "/datasets/upload",
    response_model=DatasetUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and register a CSV dataset (Default Workspace)"
)
async def upload_dataset_default(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    return await upload_dataset_in_workspace(
        workspace_id=DEFAULT_WORKSPACE_ID,
        file=file,
        name=name,
        db=db
    )


@router.get(
    "/workspaces/{workspace_id}/datasets",
    response_model=DatasetListResponse,
    summary="List datasets in a workspace"
)
def list_workspace_datasets(workspace_id: str, db: Session = Depends(get_db)):
    datasets = db.query(Dataset).filter(Dataset.workspace_id == workspace_id).order_by(Dataset.created_at.desc()).all()
    items = []
    for d in datasets:
        version = db.query(DatasetVersion).filter(DatasetVersion.id == d.current_version_id).first()
        source = db.query(DataSource).filter(DataSource.id == d.data_source_id).first()
        
        orig_name = source.configuration.get("original_filename", d.name) if source else d.name
        file_size = source.configuration.get("file_size_bytes", 0) if source else 0

        items.append(
            DatasetItem(
                id=d.id,
                workspace_id=d.workspace_id,
                data_source_id=d.data_source_id,
                name=d.name,
                status=d.status,
                original_filename=orig_name,
                file_size_bytes=file_size,
                row_count=version.row_count if version else None,
                column_count=version.column_count if version else None,
                created_at=d.created_at,
                updated_at=d.updated_at
            )
        )
    return DatasetListResponse(items=items, total=len(items))


@router.get(
    "/datasets",
    response_model=DatasetListResponse,
    summary="List datasets (Default Workspace)"
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
