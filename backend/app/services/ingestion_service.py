import csv
import io
import logging
from typing import Tuple, Optional
from sqlalchemy.orm import Session

from app.models.dataset import Workspace, DataSource, Dataset, DatasetVersion
from app.services.storage_service import StorageProvider, get_storage_provider

logger = logging.getLogger(__name__)

DEFAULT_WORKSPACE_ID = "default"
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB limit
ALLOWED_EXTENSIONS = {".csv", ".txt"}


def validate_csv_content(content: bytes) -> Tuple[int, int]:
    """
    Validates CSV file content safely without altering content or executing code.
    Returns (row_count, column_count).
    """
    if not content or len(content.strip()) == 0:
        raise ValueError("Uploaded file is empty.")

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise ValueError(f"File size exceeds maximum limit of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.")

    # Binary check: CSV text files must not contain NUL bytes
    if b"\x00" in content:
        raise ValueError("File content is binary or contains NUL bytes, not a valid CSV text document.")

    # Decode bytes strictly with latin-1 fallback for legacy CSVs
    try:
        text_content = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        try:
            text_content = content.decode("latin-1")
        except Exception as e:
            raise ValueError("Unable to read text encoding of uploaded file.") from e
    except Exception as e:
        raise ValueError("Unable to read text encoding of uploaded file.") from e

    # Parse CSV header and rows safely
    stream = io.StringIO(text_content)
    try:
        reader = csv.reader(stream)
        first_row = next(reader, None)
        if first_row is None or len(first_row) == 0 or all(c.strip() == "" for c in first_row):
            raise ValueError("Uploaded CSV file contains no valid header or rows.")

        col_count = len(first_row)

        # Count remaining rows
        row_count = 1 + sum(1 for _ in reader)
        data_rows = row_count - 1

        return data_rows, col_count
    except Exception as e:
        if isinstance(e, ValueError):
            raise e
        logger.warning(f"CSV validation failed: {e}")
        raise ValueError("File content is not a valid CSV formatted document.") from e


def get_or_create_workspace(db: Session, workspace_id: str = DEFAULT_WORKSPACE_ID) -> Workspace:
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        workspace = Workspace(
            id=workspace_id,
            name="Default Workspace",
            description="Default workspace created during setup",
            status="active"
        )
        db.add(workspace)
        db.commit()
        db.refresh(workspace)
    return workspace


class CSVIngestionService:
    def __init__(self, db: Session, storage: Optional[StorageProvider] = None):
        self.db = db
        self.storage = storage or get_storage_provider()

    def ingest_csv(
        self,
        file_bytes: bytes,
        original_filename: str,
        workspace_id: str = DEFAULT_WORKSPACE_ID,
        dataset_name: Optional[str] = None,
    ) -> Dataset:
        """
        Executes Phase 2 CSV Ingestion:
        1. Validate extension and CSV structure safely
        2. Store raw immutable file
        3. Transactionally register Workspace, DataSource, Dataset, and DatasetVersion records
        4. Provide cleanup rollback if database registration fails
        """
        # Extension Check
        lower_name = original_filename.lower()
        if not any(lower_name.endswith(ext) for ext in ALLOWED_EXTENSIONS):
            raise ValueError(f"Invalid file extension. Only {', '.join(ALLOWED_EXTENSIONS)} files are supported.")

        # Content & Structure Validation
        row_count, col_count = validate_csv_content(file_bytes)

        # Storage Phase: Write raw bytes to storage/raw/
        storage_key, rel_storage_path, file_size = self.storage.save_raw_file(
            file_bytes, original_filename
        )

        try:
            # DB Registration Phase
            workspace = get_or_create_workspace(self.db, workspace_id)

            display_name = dataset_name or original_filename.rsplit(".", 1)[0].replace("_", " ").title()

            # Create Data Source record
            data_source = DataSource(
                workspace_id=workspace.id,
                name=f"CSV Source: {original_filename}",
                source_type="csv",
                configuration={
                    "original_filename": original_filename,
                    "storage_key": storage_key,
                    "storage_path": rel_storage_path,
                    "file_size_bytes": file_size,
                },
                status="active"
            )
            self.db.add(data_source)
            self.db.flush()

            # Create Dataset record
            dataset = Dataset(
                workspace_id=workspace.id,
                data_source_id=data_source.id,
                name=display_name,
                description=f"Raw dataset uploaded from {original_filename}",
                status="ready",
            )
            self.db.add(dataset)
            self.db.flush()

            # Create Raw Version 1
            version = DatasetVersion(
                dataset_id=dataset.id,
                version_number=1,
                parent_version_id=None,
                storage_location=rel_storage_path,
                row_count=row_count,
                column_count=col_count,
                validation_status="valid",
                meta_info={
                    "original_filename": original_filename,
                    "file_size_bytes": file_size,
                    "storage_key": storage_key,
                    "source_type": "csv",
                }
            )
            self.db.add(version)
            self.db.flush()

            # Set current version
            dataset.current_version_id = version.id
            self.db.commit()
            self.db.refresh(dataset)

            logger.info(f"Dataset '{dataset.name}' ({dataset.id}) successfully registered.")
            return dataset

        except Exception as e:
            self.db.rollback()
            # Rollback storage: remove raw file if DB registration failed
            self.storage.delete_file(rel_storage_path)
            logger.error(f"Ingestion transaction failed, rolled back raw storage file: {e}")
            raise RuntimeError(f"Failed to register dataset in database: {str(e)}") from e
