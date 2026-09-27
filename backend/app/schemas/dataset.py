from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class DatasetUploadResponse(BaseModel):
    dataset_id: str
    workspace_id: str
    data_source_id: str
    version_id: str
    name: str
    original_filename: str
    file_size_bytes: int
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    status: str
    created_at: datetime


class DatasetItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workspace_id: str
    data_source_id: Optional[str] = None
    name: str
    status: str
    original_filename: str
    file_size_bytes: int
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class DatasetListResponse(BaseModel):
    items: List[DatasetItem]
    total: int
