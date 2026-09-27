import logging
from typing import Tuple, List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.dataset import (
    Workspace,
    Dataset,
    DatasetVersion,
    DatasetColumn,
    DataModel,
    ModelDataset,
    Relationship
)

logger = logging.getLogger(__name__)

ALLOWED_CARDINALITIES = {"one_to_one", "one_to_many", "many_to_one", "many_to_many"}

# Deterministic Type Compatibility Matrix
COMPATIBLE_TYPE_GROUPS = [
    {"INTEGER", "INT", "INT64", "INT32", "BIGINT", "SMALLINT", "DECIMAL", "FLOAT", "FLOAT64", "DOUBLE", "NUMERIC", "NUMBER"},
    {"VARCHAR", "STRING", "TEXT", "CHAR"},
    {"DATE"},
    {"DATETIME", "TIMESTAMP", "TIMESTAMP_TZ"},
    {"BOOLEAN", "BOOL"}
]


def are_types_compatible(type1: str, type2: str) -> bool:
    t1 = type1.upper()
    t2 = type2.upper()
    if t1 == t2:
        return True
    for group in COMPATIBLE_TYPE_GROUPS:
        if t1 in group and t2 in group:
            return True
    return False


class ModelingService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_model(self, workspace_id: str, name: Optional[str] = None) -> DataModel:
        """Retrieves or creates the primary DataModel for a workspace."""
        workspace = self.db.query(Workspace).filter(Workspace.id == workspace_id).first()
        if not workspace:
            raise KeyError(f"Workspace '{workspace_id}' not found.")

        model = self.db.query(DataModel).filter(DataModel.workspace_id == workspace.id).first()
        if not model:
            model_name = name or f"{workspace.name} Data Model"
            model = DataModel(
                workspace_id=workspace.id,
                name=model_name,
                description="Logical data model managing datasets and analytical relationships.",
                status="active"
            )
            self.db.add(model)
            self.db.commit()
            self.db.refresh(model)

        return model

    def bind_dataset_to_model(
        self,
        model_id: str,
        dataset_id: str,
        version_id: Optional[str] = None,
        alias: Optional[str] = None
    ) -> ModelDataset:
        """Binds a dataset and explicit DatasetVersion to a DataModel."""
        model = self.db.query(DataModel).filter(DataModel.id == model_id).first()
        if not model:
            raise KeyError(f"DataModel '{model_id}' not found.")

        dataset = self.db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise KeyError(f"Dataset '{dataset_id}' not found.")

        # Workspace Isolation Enforcement
        if dataset.workspace_id != model.workspace_id:
            raise ValueError("Workspace isolation error: dataset belongs to a different workspace.")

        target_ver_id = version_id or dataset.current_version_id
        if not target_ver_id:
            raise ValueError(f"Dataset '{dataset_id}' has no active version to bind to model.")

        version = self.db.query(DatasetVersion).filter(DatasetVersion.id == target_ver_id).first()
        if not version:
            raise KeyError(f"Dataset version '{target_ver_id}' not found.")

        # Check existing binding
        binding = self.db.query(ModelDataset).filter(
            ModelDataset.model_id == model.id,
            ModelDataset.dataset_id == dataset.id
        ).first()

        if binding:
            binding.dataset_version_id = version.id
            if alias:
                binding.alias = alias
        else:
            binding = ModelDataset(
                model_id=model.id,
                dataset_id=dataset.id,
                dataset_version_id=version.id,
                alias=alias or dataset.name
            )
            self.db.add(binding)

        self.db.commit()
        self.db.refresh(binding)
        return binding

    def validate_relationship(
        self,
        workspace_id: str,
        model_id: str,
        source_dataset_id: str,
        source_field: str,
        target_dataset_id: str,
        target_field: str,
        cardinality: str = "one_to_many",
        source_version_id: Optional[str] = None,
        target_version_id: Optional[str] = None
    ) -> Tuple[bool, List[str]]:
        """
        Validates relationship proposal deterministically without AI:
        1. Workspace isolation
        2. Model & dataset existence
        3. Field existence in dataset version
        4. Physical type compatibility
        5. Cardinality rule check
        6. Self-referential prohibition
        7. Duplicate relationship prohibition
        """
        issues: List[str] = []

        model = self.db.query(DataModel).filter(DataModel.id == model_id, DataModel.workspace_id == workspace_id).first()
        if not model:
            return False, [f"DataModel '{model_id}' not found in workspace '{workspace_id}'."]

        src_ds = self.db.query(Dataset).filter(Dataset.id == source_dataset_id).first()
        tgt_ds = self.db.query(Dataset).filter(Dataset.id == target_dataset_id).first()

        if not src_ds or not tgt_ds:
            return False, ["One or both referenced datasets do not exist."]

        # 1. Workspace Isolation
        if src_ds.workspace_id != workspace_id or tgt_ds.workspace_id != workspace_id:
            issues.append("Workspace isolation error: cross-workspace relationships are prohibited.")
            return False, issues

        src_ver_id = source_version_id or src_ds.current_version_id
        tgt_ver_id = target_version_id or tgt_ds.current_version_id

        if not src_ver_id or not tgt_ver_id:
            issues.append("One or both datasets have no active version.")
            return False, issues

        # 2. Self-referential check
        if source_dataset_id == target_dataset_id:
            issues.append("Self-referential dataset relationships are prohibited.")

        # 3. Cardinality check
        if cardinality not in ALLOWED_CARDINALITIES:
            issues.append(f"Invalid cardinality '{cardinality}'. Allowed: {', '.join(ALLOWED_CARDINALITIES)}.")

        # 4. Field existence & Type compatibility
        src_col = self.db.query(DatasetColumn).filter(
            DatasetColumn.dataset_version_id == src_ver_id,
            DatasetColumn.name == source_field
        ).first()

        tgt_col = self.db.query(DatasetColumn).filter(
            DatasetColumn.dataset_version_id == tgt_ver_id,
            DatasetColumn.name == target_field
        ).first()

        if not src_col:
            issues.append(f"Source field '{source_field}' not found in dataset version '{src_ver_id}'.")
        if not tgt_col:
            issues.append(f"Target field '{target_field}' not found in dataset version '{tgt_ver_id}'.")

        if src_col and tgt_col:
            if not are_types_compatible(src_col.physical_type, tgt_col.physical_type):
                issues.append(
                    f"Incompatible field types: '{src_col.name}' ({src_col.physical_type}) and "
                    f"'{tgt_col.name}' ({tgt_col.physical_type}) cannot be linked."
                )

        # 5. Duplicate relationship check
        existing = self.db.query(Relationship).filter(
            Relationship.model_id == model.id,
            Relationship.source_dataset_id == source_dataset_id,
            Relationship.source_field == source_field,
            Relationship.target_dataset_id == target_dataset_id,
            Relationship.target_field == target_field
        ).first()

        if existing:
            issues.append("A relationship between these fields already exists in the data model.")

        is_valid = len(issues) == 0
        return is_valid, issues

    def create_relationship(
        self,
        workspace_id: str,
        model_id: str,
        source_dataset_id: str,
        source_field: str,
        target_dataset_id: str,
        target_field: str,
        cardinality: str = "one_to_many",
        source_version_id: Optional[str] = None,
        target_version_id: Optional[str] = None
    ) -> Relationship:
        """Validates and creates an explicit Relationship metadata record."""
        is_valid, issues = self.validate_relationship(
            workspace_id=workspace_id,
            model_id=model_id,
            source_dataset_id=source_dataset_id,
            source_field=source_field,
            target_dataset_id=target_dataset_id,
            target_field=target_field,
            cardinality=cardinality,
            source_version_id=source_version_id,
            target_version_id=target_version_id
        )

        if not is_valid:
            raise ValueError(f"Relationship validation failed: {'; '.join(issues)}")

        src_ds = self.db.query(Dataset).filter(Dataset.id == source_dataset_id).first()
        tgt_ds = self.db.query(Dataset).filter(Dataset.id == target_dataset_id).first()

        src_ver_id = source_version_id or src_ds.current_version_id
        tgt_ver_id = target_version_id or tgt_ds.current_version_id

        # Ensure datasets are bound to model
        self.bind_dataset_to_model(model_id, source_dataset_id, src_ver_id)
        self.bind_dataset_to_model(model_id, target_dataset_id, tgt_ver_id)

        rel = Relationship(
            workspace_id=workspace_id,
            model_id=model_id,
            source_dataset_id=source_dataset_id,
            source_dataset_version_id=src_ver_id,
            source_field=source_field,
            target_dataset_id=target_dataset_id,
            target_dataset_version_id=tgt_ver_id,
            target_field=target_field,
            cardinality=cardinality,
            relationship_type="explicit",
            status="approved"
        )

        self.db.add(rel)
        self.db.commit()
        self.db.refresh(rel)

        logger.info(f"Created relationship '{source_field}' -> '{target_field}' ({cardinality}) in model {model_id}.")
        return rel

    def get_model_relationships(self, model_id: str) -> List[Relationship]:
        return self.db.query(Relationship).filter(Relationship.model_id == model_id).order_by(Relationship.created_at.desc()).all()

    def delete_relationship(self, model_id: str, relationship_id: str) -> bool:
        rel = self.db.query(Relationship).filter(Relationship.model_id == model_id, Relationship.id == relationship_id).first()
        if not rel:
            return False
        self.db.delete(rel)
        self.db.commit()
        return True
