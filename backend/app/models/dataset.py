import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="Default Workspace")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    data_sources: Mapped[list["DataSource"]] = relationship("DataSource", back_populates="workspace", cascade="all, delete-orphan")
    datasets: Mapped[list["Dataset"]] = relationship("Dataset", back_populates="workspace", cascade="all, delete-orphan")


class DataSource(Base):
    __tablename__ = "data_sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False, default="csv")
    configuration: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="data_sources")
    datasets: Mapped[list["Dataset"]] = relationship("Dataset", back_populates="data_source")


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    data_source_id: Mapped[str] = mapped_column(String(36), ForeignKey("data_sources.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="ready")
    current_version_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="datasets")
    data_source: Mapped[Optional["DataSource"]] = relationship("DataSource", back_populates="datasets")
    versions: Mapped[list["DatasetVersion"]] = relationship("DatasetVersion", back_populates="dataset", cascade="all, delete-orphan")
    profiles: Mapped[list["DatasetProfile"]] = relationship("DatasetProfile", back_populates="dataset", cascade="all, delete-orphan")
    columns: Mapped[list["DatasetColumn"]] = relationship("DatasetColumn", back_populates="dataset", cascade="all, delete-orphan")


class DatasetVersion(Base):
    __tablename__ = "dataset_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    parent_version_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    storage_location: Mapped[str] = mapped_column(String(512), nullable=False)
    row_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    column_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    validation_status: Mapped[str] = mapped_column(String(50), nullable=False, default="valid")
    meta_info: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    dataset: Mapped["Dataset"] = relationship("Dataset", back_populates="versions")
    profiles: Mapped[list["DatasetProfile"]] = relationship("DatasetProfile", back_populates="dataset_version", cascade="all, delete-orphan")
    columns: Mapped[list["DatasetColumn"]] = relationship("DatasetColumn", back_populates="dataset_version", cascade="all, delete-orphan")


class DatasetProfile(Base):
    __tablename__ = "dataset_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    dataset_version_id: Mapped[str] = mapped_column(String(36), ForeignKey("dataset_versions.id", ondelete="CASCADE"), nullable=False)
    row_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    column_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    duplicate_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    missing_cells: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    missing_percentage: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    quality_score: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    summary_metadata: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="completed")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    dataset: Mapped["Dataset"] = relationship("Dataset", back_populates="profiles")
    dataset_version: Mapped["DatasetVersion"] = relationship("DatasetVersion", back_populates="profiles")


class DatasetColumn(Base):
    __tablename__ = "dataset_columns"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    dataset_version_id: Mapped[str] = mapped_column(String(36), ForeignKey("dataset_versions.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    ordinal_position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    physical_type: Mapped[str] = mapped_column(String(50), nullable=False, default="VARCHAR")
    semantic_type: Mapped[str] = mapped_column(String(50), nullable=False, default="Text")
    type_source: Mapped[str] = mapped_column(String(50), nullable=False, default="inferred")
    null_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    null_percentage: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    distinct_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_unique: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    stats: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    dataset: Mapped["Dataset"] = relationship("Dataset", back_populates="columns")
    dataset_version: Mapped["DatasetVersion"] = relationship("DatasetVersion", back_populates="columns")


class Transformation(Base):
    __tablename__ = "transformations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    source_version_id: Mapped[str] = mapped_column(String(36), ForeignKey("dataset_versions.id", ondelete="CASCADE"), nullable=False)
    target_version_id: Mapped[str] = mapped_column(String(36), ForeignKey("dataset_versions.id", ondelete="CASCADE"), nullable=False)
    operation_type: Mapped[str] = mapped_column(String(100), nullable=False)
    operation_spec: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    execution_status: Mapped[str] = mapped_column(String(50), nullable=False, default="completed")
    execution_metadata: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    dataset: Mapped["Dataset"] = relationship("Dataset", foreign_keys=[dataset_id])
    source_version: Mapped["DatasetVersion"] = relationship("DatasetVersion", foreign_keys=[source_version_id])
    target_version: Mapped["DatasetVersion"] = relationship("DatasetVersion", foreign_keys=[target_version_id])


class DataModel(Base):
    __tablename__ = "data_models"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="Default Data Model")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    workspace: Mapped["Workspace"] = relationship("Workspace", foreign_keys=[workspace_id])
    model_datasets: Mapped[list["ModelDataset"]] = relationship("ModelDataset", back_populates="data_model", cascade="all, delete-orphan")
    relationships: Mapped[list["Relationship"]] = relationship("Relationship", back_populates="data_model", cascade="all, delete-orphan")


class ModelDataset(Base):
    __tablename__ = "model_datasets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("data_models.id", ondelete="CASCADE"), nullable=False)
    dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    dataset_version_id: Mapped[str] = mapped_column(String(36), ForeignKey("dataset_versions.id", ondelete="CASCADE"), nullable=False)
    alias: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    data_model: Mapped["DataModel"] = relationship("DataModel", back_populates="model_datasets")
    dataset: Mapped["Dataset"] = relationship("Dataset", foreign_keys=[dataset_id])
    dataset_version: Mapped["DatasetVersion"] = relationship("DatasetVersion", foreign_keys=[dataset_version_id])


class Relationship(Base):
    __tablename__ = "relationships"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    model_id: Mapped[str] = mapped_column(String(36), ForeignKey("data_models.id", ondelete="CASCADE"), nullable=False)
    source_dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    source_dataset_version_id: Mapped[str] = mapped_column(String(36), ForeignKey("dataset_versions.id", ondelete="CASCADE"), nullable=False)
    source_field: Mapped[str] = mapped_column(String(255), nullable=False)
    target_dataset_id: Mapped[str] = mapped_column(String(36), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    target_dataset_version_id: Mapped[str] = mapped_column(String(36), ForeignKey("dataset_versions.id", ondelete="CASCADE"), nullable=False)
    target_field: Mapped[str] = mapped_column(String(255), nullable=False)
    cardinality: Mapped[str] = mapped_column(String(50), nullable=False, default="one_to_many")
    relationship_type: Mapped[str] = mapped_column(String(50), nullable=False, default="explicit")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="approved")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    workspace: Mapped["Workspace"] = relationship("Workspace", foreign_keys=[workspace_id])
    data_model: Mapped["DataModel"] = relationship("DataModel", back_populates="relationships")
    source_dataset: Mapped["Dataset"] = relationship("Dataset", foreign_keys=[source_dataset_id])
    source_dataset_version: Mapped["DatasetVersion"] = relationship("DatasetVersion", foreign_keys=[source_dataset_version_id])
    target_dataset: Mapped["Dataset"] = relationship("Dataset", foreign_keys=[target_dataset_id])
    target_dataset_version: Mapped["DatasetVersion"] = relationship("DatasetVersion", foreign_keys=[target_dataset_version_id])


class Dashboard(Base):
    __tablename__ = "dashboards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    workspace_id: Mapped[str] = mapped_column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    filters: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    workspace: Mapped["Workspace"] = relationship("Workspace", foreign_keys=[workspace_id])
    items: Mapped[list["DashboardItem"]] = relationship("DashboardItem", back_populates="dashboard", cascade="all, delete-orphan")


class DashboardItem(Base):
    __tablename__ = "dashboard_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    dashboard_id: Mapped[str] = mapped_column(String(36), ForeignKey("dashboards.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    visualization_spec: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    dataset_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    layout: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    dashboard: Mapped["Dashboard"] = relationship("Dashboard", back_populates="items")



