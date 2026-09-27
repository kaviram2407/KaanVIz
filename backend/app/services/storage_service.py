import os
import re
import uuid
import logging
from abc import ABC, abstractmethod

from app.core.config import settings

logger = logging.getLogger(__name__)


def sanitize_filename(filename: str) -> str:
    """Sanitize original filename to prevent directory traversal or unsafe path characters."""
    normalized = filename.replace("\\", "/")
    base_name = os.path.basename(normalized)
    # Remove directory separators or path traversal sequences
    clean_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', base_name)
    clean_name = clean_name.lstrip(".")
    return clean_name or "file.csv"


class StorageProvider(ABC):
    @abstractmethod
    def save_raw_file(self, content: bytes, original_filename: str) -> tuple[str, str, int]:
        """Saves raw file content and returns (storage_key, storage_path, file_size_bytes)."""
        pass

    @abstractmethod
    def save_processed_file(self, content: bytes, dataset_id: str, version_id: str) -> tuple[str, str, int]:
        """Saves processed/prepared file content and returns (storage_key, storage_path, file_size_bytes)."""
        pass

    @abstractmethod
    def get_file_bytes(self, storage_path: str) -> bytes:
        """Retrieves file bytes from storage."""
        pass

    @abstractmethod
    def delete_file(self, storage_path: str) -> bool:
        """Deletes file from storage."""
        pass


class LocalStorageProvider(StorageProvider):
    def __init__(self, raw_base_dir: str = settings.STORAGE_RAW_PATH):
        self.raw_base_dir = os.path.abspath(raw_base_dir)
        self.storage_base_dir = os.path.dirname(self.raw_base_dir)
        os.makedirs(self.raw_base_dir, exist_ok=True)

    def save_raw_file(self, content: bytes, original_filename: str) -> tuple[str, str, int]:
        clean_name = sanitize_filename(original_filename)
        unique_id = uuid.uuid4().hex[:12]
        storage_key = f"raw_{unique_id}_{clean_name}"
        
        target_path = os.path.abspath(os.path.join(self.raw_base_dir, storage_key))

        # Path Traversal Check: ensure target_path starts with raw_base_dir
        if not target_path.startswith(self.raw_base_dir):
            logger.error(f"Security Alert: Path traversal attempt detected: {original_filename}")
            raise ValueError("Invalid storage path: Path traversal prohibited.")

        # Save raw bytes without modifying content
        with open(target_path, "wb") as f:
            f.write(content)

        file_size = len(content)
        # Store relative or normalized path
        rel_path = os.path.relpath(target_path, start=self.storage_base_dir)
        logger.info(f"Successfully stored raw immutable dataset: {storage_key} ({file_size} bytes)")
        return storage_key, rel_path, file_size

    def save_processed_file(self, content: bytes, dataset_id: str, version_id: str) -> tuple[str, str, int]:
        processed_dir = os.path.abspath(os.path.join(self.storage_base_dir, "processed"))
        os.makedirs(processed_dir, exist_ok=True)
        storage_key = f"proc_{dataset_id[:8]}_{version_id[:8]}.csv"
        target_path = os.path.abspath(os.path.join(processed_dir, storage_key))

        if not target_path.startswith(processed_dir):
            raise ValueError("Invalid storage path: Path traversal prohibited.")

        with open(target_path, "wb") as f:
            f.write(content)

        file_size = len(content)
        rel_path = os.path.relpath(target_path, start=self.storage_base_dir)
        logger.info(f"Successfully stored prepared dataset version: {storage_key} ({file_size} bytes)")
        return storage_key, rel_path, file_size


    def get_file_bytes(self, storage_path: str) -> bytes:
        full_path = os.path.abspath(os.path.join(self.storage_base_dir, storage_path))
        if not full_path.startswith(self.storage_base_dir):
            raise ValueError("Invalid file access path.")
        with open(full_path, "rb") as f:
            return f.read()

    def delete_file(self, storage_path: str) -> bool:
        try:
            full_path = os.path.abspath(os.path.join(self.storage_base_dir, storage_path))
            if full_path.startswith(self.storage_base_dir) and os.path.exists(full_path):
                os.remove(full_path)
                return True
        except Exception as e:
            logger.warning(f"Failed to delete file at {storage_path}: {e}")
        return False


def get_storage_provider() -> StorageProvider:
    return LocalStorageProvider()
