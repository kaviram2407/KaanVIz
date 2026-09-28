import os
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.dataset import (
    Dataset,
    DatasetVersion,
    DatasetProfile,
    DatasetColumn,
    Transformation,
    ModelDataset,
    Relationship,
    DashboardItem,
    DataSource
)
from app.services.storage_service import StorageProvider, get_storage_provider

logger = logging.getLogger(__name__)


class DatasetCleanupService:
    def __init__(self, db: Session, storage: Optional[StorageProvider] = None):
        self.db = db
        self.storage = storage or get_storage_provider()

    def delete_dataset(self, dataset_id: str, workspace_id: str) -> Dict[str, Any]:
        """
        Permanently deletes a single dataset and all of its associated data/artifacts:
        1. Verifies dataset exists and belongs to the specified workspace_id.
        2. Identifies all physical storage files (raw and processed) associated with the dataset.
        3. Transactionally cleans up database metadata (versions, profiles, columns, transformations,
           model bindings, relationships, dashboard items).
        4. Removes physical storage files via storage provider.
        5. Returns details of deleted items.
        """
        # Workspace isolation check
        dataset = self.db.query(Dataset).filter(
            Dataset.id == dataset_id,
            Dataset.workspace_id == workspace_id
        ).first()

        if not dataset:
            logger.warning(f"Dataset '{dataset_id}' not found in workspace '{workspace_id}'.")
            raise KeyError(f"Dataset '{dataset_id}' not found in workspace '{workspace_id}'.")

        data_source_id = dataset.data_source_id

        # 1. Collect physical file paths to delete
        storage_paths_to_delete: set[str] = set()

        versions = self.db.query(DatasetVersion).filter(DatasetVersion.dataset_id == dataset_id).all()
        for ver in versions:
            if ver.storage_location:
                storage_paths_to_delete.add(ver.storage_location)

        if data_source_id:
            ds_obj = self.db.query(DataSource).filter(DataSource.id == data_source_id).first()
            if ds_obj and isinstance(ds_obj.configuration, dict):
                raw_path = ds_obj.configuration.get("storage_path")
                if raw_path:
                    storage_paths_to_delete.add(raw_path)

        # Check if DataSource is shared with any other dataset
        data_source_shared = False
        if data_source_id:
            other_ds_count = self.db.query(Dataset).filter(
                Dataset.data_source_id == data_source_id,
                Dataset.id != dataset_id
            ).count()
            if other_ds_count > 0:
                data_source_shared = True

        deleted_counts = {
            "dataset_id": dataset_id,
            "dataset_name": dataset.name,
            "versions": len(versions),
            "columns": 0,
            "profiles": 0,
            "transformations": 0,
            "model_bindings": 0,
            "relationships": 0,
            "dashboard_items": 0,
            "storage_files": len(storage_paths_to_delete)
        }

        # 2. Database transaction for referential metadata cleanup
        try:
            # Delete Dashboard items referencing this dataset
            db_items = self.db.query(DashboardItem).filter(
                (DashboardItem.dataset_id == dataset_id)
            ).all()
            deleted_counts["dashboard_items"] = len(db_items)
            for item in db_items:
                self.db.delete(item)

            # Also check dashboard items where dataset_id is stored inside visualization_spec JSON
            all_items = self.db.query(DashboardItem).all()
            for item in all_items:
                if item.visualization_spec and item.visualization_spec.get("dataset_id") == dataset_id:
                    if item not in db_items:
                        self.db.delete(item)
                        deleted_counts["dashboard_items"] += 1

            # Delete relationships involving this dataset as source or target
            relationships = self.db.query(Relationship).filter(
                (Relationship.source_dataset_id == dataset_id) |
                (Relationship.target_dataset_id == dataset_id)
            ).all()
            deleted_counts["relationships"] = len(relationships)
            for rel in relationships:
                self.db.delete(rel)

            # Delete model bindings for this dataset
            model_datasets = self.db.query(ModelDataset).filter(ModelDataset.dataset_id == dataset_id).all()
            deleted_counts["model_bindings"] = len(model_datasets)
            for md in model_datasets:
                self.db.delete(md)

            # Delete transformations
            transformations = self.db.query(Transformation).filter(Transformation.dataset_id == dataset_id).all()
            deleted_counts["transformations"] = len(transformations)
            for tr in transformations:
                self.db.delete(tr)

            # Delete dataset columns
            columns = self.db.query(DatasetColumn).filter(DatasetColumn.dataset_id == dataset_id).all()
            deleted_counts["columns"] = len(columns)
            for col in columns:
                self.db.delete(col)

            # Delete dataset profiles
            profiles = self.db.query(DatasetProfile).filter(DatasetProfile.dataset_id == dataset_id).all()
            deleted_counts["profiles"] = len(profiles)
            for prof in profiles:
                self.db.delete(prof)

            # Delete dataset versions
            for ver in versions:
                self.db.delete(ver)

            # Delete dataset record
            self.db.delete(dataset)

            # Delete DataSource if not shared
            if data_source_id and not data_source_shared:
                ds_obj = self.db.query(DataSource).filter(DataSource.id == data_source_id).first()
                if ds_obj:
                    self.db.delete(ds_obj)

            # Flush changes within transaction
            self.db.flush()

            # 3. Perform storage file cleanup
            files_deleted = 0
            for path in storage_paths_to_delete:
                success = self.storage.delete_file(path)
                if success:
                    files_deleted += 1

            deleted_counts["files_actually_deleted"] = files_deleted

            # Commit the database transaction
            self.db.commit()
            logger.info(f"Successfully deleted dataset '{dataset_id}' and all associated metadata/files.")
            return deleted_counts

        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to delete dataset '{dataset_id}', database transaction rolled back: {e}")
            raise RuntimeError(f"Failed to delete dataset '{dataset_id}': {str(e)}") from e

    def clear_workspace_data(self, workspace_id: str) -> Dict[str, Any]:
        """
        Permanently deletes ALL datasets and associated data/artifacts belonging to the specified workspace.
        Does NOT delete the workspace itself, user account, app config, or unrelated workspaces.
        """
        datasets = self.db.query(Dataset).filter(Dataset.workspace_id == workspace_id).all()

        total_datasets = len(datasets)
        dataset_ids = [d.id for d in datasets]

        # 1. Collect all physical file paths across all workspace datasets
        storage_paths_to_delete: set[str] = set()

        for d in datasets:
            versions = self.db.query(DatasetVersion).filter(DatasetVersion.dataset_id == d.id).all()
            for ver in versions:
                if ver.storage_location:
                    storage_paths_to_delete.add(ver.storage_location)

            if d.data_source_id:
                ds_obj = self.db.query(DataSource).filter(DataSource.id == d.data_source_id).first()
                if ds_obj and isinstance(ds_obj.configuration, dict):
                    raw_path = ds_obj.configuration.get("storage_path")
                    if raw_path:
                        storage_paths_to_delete.add(raw_path)

        data_sources = self.db.query(DataSource).filter(DataSource.workspace_id == workspace_id).all()
        for ds in data_sources:
            if isinstance(ds.configuration, dict):
                raw_path = ds.configuration.get("storage_path")
                if raw_path:
                    storage_paths_to_delete.add(raw_path)

        summary = {
            "workspace_id": workspace_id,
            "datasets_deleted": total_datasets,
            "storage_files_deleted": len(storage_paths_to_delete)
        }

        # 2. Database transaction for workspace dataset metadata cleanup
        try:
            # Delete workspace relationships
            self.db.query(Relationship).filter(Relationship.workspace_id == workspace_id).delete(synchronize_session=False)

            # Delete model bindings for datasets in workspace
            if dataset_ids:
                self.db.query(ModelDataset).filter(ModelDataset.dataset_id.in_(dataset_ids)).delete(synchronize_session=False)

            # Delete workspace dashboard items referencing workspace datasets
            if dataset_ids:
                self.db.query(DashboardItem).filter(DashboardItem.dataset_id.in_(dataset_ids)).delete(synchronize_session=False)
                # Also delete items where visualization_spec dataset_id matches
                all_items = self.db.query(DashboardItem).all()
                for item in all_items:
                    if item.visualization_spec and item.visualization_spec.get("dataset_id") in dataset_ids:
                        self.db.delete(item)

            # Delete transformations
            if dataset_ids:
                self.db.query(Transformation).filter(Transformation.dataset_id.in_(dataset_ids)).delete(synchronize_session=False)

            # Delete dataset columns
            if dataset_ids:
                self.db.query(DatasetColumn).filter(DatasetColumn.dataset_id.in_(dataset_ids)).delete(synchronize_session=False)

            # Delete dataset profiles
            if dataset_ids:
                self.db.query(DatasetProfile).filter(DatasetProfile.dataset_id.in_(dataset_ids)).delete(synchronize_session=False)

            # Delete dataset versions
            if dataset_ids:
                self.db.query(DatasetVersion).filter(DatasetVersion.dataset_id.in_(dataset_ids)).delete(synchronize_session=False)

            # Delete datasets
            self.db.query(Dataset).filter(Dataset.workspace_id == workspace_id).delete(synchronize_session=False)

            # Delete DataSources
            self.db.query(DataSource).filter(DataSource.workspace_id == workspace_id).delete(synchronize_session=False)

            self.db.flush()

            # 3. File storage cleanup
            files_deleted = 0
            for path in storage_paths_to_delete:
                success = self.storage.delete_file(path)
                if success:
                    files_deleted += 1

            summary["files_actually_deleted"] = files_deleted

            self.db.commit()
            logger.info(f"Successfully cleared all data for workspace '{workspace_id}'.")
            return summary

        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to clear workspace data for workspace '{workspace_id}': {e}")
            raise RuntimeError(f"Failed to clear workspace data: {str(e)}") from e
