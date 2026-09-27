import io
import logging
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.models.dataset import Dataset, DatasetVersion, Transformation
from app.schemas.dataset import PreparationOperation, PreparedMetricsSummary
from app.services.storage_service import StorageProvider, get_storage_provider
from app.services.profiling_service import ProfilingService

logger = logging.getLogger(__name__)


def apply_single_operation(df: pd.DataFrame, op: PreparationOperation) -> pd.DataFrame:
    """
    Executes a single deterministic preparation operation on a pandas DataFrame.
    Raises ValueError on invalid operations or parameters.
    """
    op_type = op.operation_type
    params = op.params or {}
    col = op.target_column
    cols = op.target_columns or ([col] if col else [])

    if op_type == "fill_missing":
        strategy = params.get("strategy", "constant")
        fill_val = params.get("fill_value", "")

        if strategy == "remove_rows":
            if cols:
                for c in cols:
                    if c in df.columns:
                        df = df[df[c].notna() & (df[c].astype(str).str.strip() != "")]
            else:
                # Remove rows with any missing value
                mask = df.isna() | (df.astype(str).apply(lambda s: s.str.strip()) == "")
                df = df[~mask.any(axis=1)]
        elif strategy == "constant":
            target_cols = cols if cols else df.columns
            for c in target_cols:
                if c in df.columns:
                    # Treat empty strings as missing
                    df[c] = df[c].replace(r"^\s*$", np.nan, regex=True).fillna(str(fill_val))
        elif strategy in ("mean", "median"):
            target_cols = cols if cols else df.columns
            for c in target_cols:
                if c in df.columns:
                    num_series = pd.to_numeric(df[c], errors="coerce")
                    val = num_series.mean() if strategy == "mean" else num_series.median()
                    if pd.notna(val):
                        df[c] = df[c].replace(r"^\s*$", np.nan, regex=True).fillna(round(float(val), 4))
        elif strategy == "mode":
            target_cols = cols if cols else df.columns
            for c in target_cols:
                if c in df.columns:
                    clean_s = df[c].replace(r"^\s*$", np.nan, regex=True).dropna()
                    if not clean_s.empty:
                        mode_val = clean_s.mode().iloc[0]
                        df[c] = df[c].replace(r"^\s*$", np.nan, regex=True).fillna(mode_val)

    elif op_type == "remove_duplicates":
        subset = [c for c in cols if c in df.columns] if cols else None
        keep_param = params.get("keep", "first")
        keep_val = False if keep_param == "none" or keep_param is False else keep_param
        df = df.drop_duplicates(subset=subset, keep=keep_val)

    elif op_type == "convert_type":
        if not col or col not in df.columns:
            raise ValueError(f"Target column '{col}' for type conversion not found in dataset.")
        target_type = params.get("target_type", "string").lower()
        series = df[col].replace(r"^\s*$", np.nan, regex=True)
        non_null_s = series.dropna()

        try:
            if target_type in ("integer", "int"):
                for v in non_null_s:
                    try:
                        int(float(v))
                    except Exception:
                        raise ValueError(f"Cannot convert column '{col}' to integer: invalid value '{v}'.")
                df[col] = series.apply(lambda v: str(int(float(v))) if pd.notna(v) else "")
            elif target_type in ("decimal", "float", "numeric"):
                for v in non_null_s:
                    try:
                        float(v)
                    except Exception:
                        raise ValueError(f"Cannot convert column '{col}' to decimal: invalid value '{v}'.")
                df[col] = series.apply(lambda v: str(float(v)) if pd.notna(v) else "")
            elif target_type in ("boolean", "bool"):
                bool_map = {"true": "true", "false": "false", "1": "true", "0": "false", "yes": "true", "no": "false", "t": "true", "f": "false"}
                for v in non_null_s:
                    if str(v).strip().lower() not in bool_map:
                        raise ValueError(f"Cannot convert column '{col}' to boolean: invalid value '{v}'.")
                df[col] = series.apply(lambda v: bool_map[str(v).strip().lower()] if pd.notna(v) else "")
            elif target_type in ("date", "datetime"):
                fmt = params.get("date_format")
                converted = pd.to_datetime(series, format=fmt, errors="coerce")
                if non_null_s.size > 0 and converted.dropna().size < non_null_s.size:
                    raise ValueError(f"Cannot convert column '{col}' to date: unparseable date values present.")
                if target_type == "date":
                    df[col] = converted.dt.strftime("%Y-%m-%d").fillna("")
                else:
                    df[col] = converted.dt.strftime("%Y-%m-%d %H:%M:%S").fillna("")
            elif target_type in ("string", "text", "varchar"):
                df[col] = series.fillna("").astype(str)
            else:
                raise ValueError(f"Unsupported target type '{target_type}'.")
        except Exception as e:
            if isinstance(e, ValueError):
                raise e
            raise ValueError(f"Type conversion failed for column '{col}': {str(e)}") from e

    elif op_type == "text_normalization":
        target_cols = cols if cols else df.columns
        action = params.get("action", "trim")
        find_val = params.get("find_val", "")
        replace_val = params.get("replace_val", "")

        for c in target_cols:
            if c in df.columns:
                if action == "trim":
                    df[c] = df[c].astype(str).str.strip()
                elif action == "lowercase":
                    df[c] = df[c].astype(str).str.lower()
                elif action == "uppercase":
                    df[c] = df[c].astype(str).str.upper()
                elif action == "replace":
                    df[c] = df[c].astype(str).str.replace(find_val, replace_val, regex=False)

    elif op_type == "column_operation":
        action = params.get("action", "rename")
        if action == "rename" and col and col in df.columns:
            new_name = params.get("new_name")
            if not new_name or not new_name.strip():
                raise ValueError("New column name must be a non-empty string.")
            df = df.rename(columns={col: new_name.strip()})
        elif action == "remove":
            target_cols = cols if cols else ([col] if col else [])
            valid_remove = [c for c in target_cols if c in df.columns]
            if len(valid_remove) == len(df.columns):
                raise ValueError("Cannot remove all columns from dataset.")
            df = df.drop(columns=valid_remove)
        elif action == "reorder":
            order = params.get("columns_order", [])
            if order and all(c in df.columns for c in order):
                remaining = [c for c in df.columns if c not in order]
                df = df[order + remaining]

    elif op_type == "date_transform":
        if not col or col not in df.columns:
            raise ValueError(f"Target column '{col}' for date transformation not found in dataset.")
        action = params.get("action", "extract_year")
        series = pd.to_datetime(df[col], errors="coerce")

        if action == "extract_year":
            df[f"{col}_year"] = series.dt.year.fillna("").astype(str).str.replace(".0", "", regex=False)
        elif action == "extract_month":
            df[f"{col}_month"] = series.dt.month.fillna("").astype(str).str.replace(".0", "", regex=False)
        elif action == "extract_day":
            df[f"{col}_day"] = series.dt.day.fillna("").astype(str).str.replace(".0", "", regex=False)
        elif action == "extract_quarter":
            df[f"{col}_quarter"] = series.dt.quarter.fillna("").astype(str).str.replace(".0", "", regex=False)
        elif action == "extract_weekday":
            df[f"{col}_weekday"] = series.dt.day_name().fillna("")

    return df


class PreparationService:
    def __init__(self, db: Session, storage: Optional[StorageProvider] = None):
        self.db = db
        self.storage = storage or get_storage_provider()

    def prepare_dataset(
        self,
        dataset_id: str,
        operations: List[PreparationOperation],
        source_version_id: Optional[str] = None
    ) -> Tuple[DatasetVersion, PreparedMetricsSummary, List[Transformation]]:
        """
        Executes Phase 4 Data Preparation Pipeline:
        1. Reads source DatasetVersion raw/prepared CSV from storage
        2. Applies deterministic preparation operations in order
        3. Writes output to storage/processed/ (raw data remains untouched)
        4. Creates new DatasetVersion record with parent_version_id
        5. Logs Transformation lineage records in PostgreSQL
        6. Automatically profiles the new prepared version
        """
        dataset = self.db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise KeyError(f"Dataset '{dataset_id}' not found.")

        target_src_version_id = source_version_id or dataset.current_version_id
        if not target_src_version_id:
            raise ValueError(f"Dataset '{dataset_id}' has no active version to prepare.")

        source_version = self.db.query(DatasetVersion).filter(DatasetVersion.id == target_src_version_id).first()
        if not source_version:
            raise KeyError(f"Dataset version '{target_src_version_id}' not found.")

        # Read source version file bytes
        try:
            source_bytes = self.storage.get_file_bytes(source_version.storage_location)
        except Exception as e:
            logger.error(f"Failed to read source storage file for dataset {dataset_id}: {e}")
            raise FileNotFoundError(f"Source storage file missing at '{source_version.storage_location}'.") from e

        # Load into DataFrame
        try:
            text_stream = io.BytesIO(source_bytes)
            try:
                df = pd.read_csv(text_stream, encoding="utf-8-sig", dtype=str)
            except UnicodeDecodeError:
                text_stream.seek(0)
                df = pd.read_csv(text_stream, encoding="latin-1", dtype=str)
        except Exception as e:
            raise ValueError(f"Unable to parse dataset for preparation: {str(e)}") from e

        # Before metrics
        before_row_count = len(df)
        before_col_count = len(df.columns)
        null_mask_before = df.isna() | (df == "")
        before_missing_cells = int(null_mask_before.sum().sum())
        before_total_cells = max(before_row_count * before_col_count, 1)
        before_missing_pct = (before_missing_cells / before_total_cells) * 100.0
        before_dup_rows = int(df.duplicated().sum()) if before_row_count > 0 else 0
        before_quality_score = max(0.0, round(100.0 - (before_missing_pct * 0.5) - ((before_dup_rows / max(before_row_count, 1)) * 20.0), 2))

        # Apply operations sequentially
        transformed_df = df.copy()
        for idx, op in enumerate(operations):
            try:
                transformed_df = apply_single_operation(transformed_df, op)
            except Exception as op_err:
                logger.error(f"Preparation operation #{idx+1} ({op.operation_type}) failed: {op_err}")
                raise ValueError(f"Preparation operation '{op.operation_type}' failed: {str(op_err)}") from op_err

        # After metrics
        after_row_count = len(transformed_df)
        after_col_count = len(transformed_df.columns)
        null_mask_after = transformed_df.isna() | (transformed_df == "")
        after_missing_cells = int(null_mask_after.sum().sum())
        after_total_cells = max(after_row_count * after_col_count, 1)
        after_missing_pct = (after_missing_cells / after_total_cells) * 100.0
        after_dup_rows = int(transformed_df.duplicated().sum()) if after_row_count > 0 else 0
        after_quality_score = max(0.0, round(100.0 - (after_missing_pct * 0.5) - ((after_dup_rows / max(after_row_count, 1)) * 20.0), 2))

        # Convert transformed DataFrame to CSV bytes
        out_stream = io.StringIO()
        transformed_df.to_csv(out_stream, index=False)
        prepared_bytes = out_stream.getvalue().encode("utf-8")

        # Determine next version number
        latest_v = self.db.query(DatasetVersion).filter(DatasetVersion.dataset_id == dataset.id).order_by(DatasetVersion.version_number.desc()).first()
        next_ver_num = (latest_v.version_number + 1) if latest_v else 1

        # Write to storage/processed/ (without modifying raw)
        dummy_ver_id = f"v{next_ver_num}_{dataset.id[:8]}"
        storage_key, rel_storage_path, file_size = self.storage.save_processed_file(
            prepared_bytes, dataset_id=dataset.id, version_id=dummy_ver_id
        )

        try:
            # Register Prepared DatasetVersion
            prepared_version = DatasetVersion(
                dataset_id=dataset.id,
                version_number=next_ver_num,
                parent_version_id=source_version.id,
                storage_location=rel_storage_path,
                row_count=after_row_count,
                column_count=after_col_count,
                validation_status="valid",
                meta_info={
                    "file_size_bytes": file_size,
                    "storage_key": storage_key,
                    "source_version_id": source_version.id,
                    "operations_count": len(operations),
                    "created_by": "user",
                }
            )
            self.db.add(prepared_version)
            self.db.flush()

            # Record Lineage Transformations
            transformations: List[Transformation] = []
            for op in operations:
                tr = Transformation(
                    workspace_id=dataset.workspace_id,
                    dataset_id=dataset.id,
                    source_version_id=source_version.id,
                    target_version_id=prepared_version.id,
                    operation_type=op.operation_type,
                    operation_spec={
                        "target_column": op.target_column,
                        "target_columns": op.target_columns,
                        "params": op.params,
                    },
                    execution_status="completed",
                    execution_metadata={
                        "before_row_count": before_row_count,
                        "after_row_count": after_row_count,
                        "before_missing_cells": before_missing_cells,
                        "after_missing_cells": after_missing_cells,
                        "before_quality_score": before_quality_score,
                        "after_quality_score": after_quality_score,
                    }
                )
                self.db.add(tr)
                transformations.append(tr)

            # Update dataset current version pointer
            dataset.current_version_id = prepared_version.id
            self.db.commit()
            self.db.refresh(prepared_version)

            # Auto-profile newly created prepared version
            try:
                profiler = ProfilingService(self.db, storage=self.storage)
                profiler.profile_dataset_version(dataset.id, prepared_version.id)
            except Exception as pe:
                logger.warning(f"Auto-profiling prepared version failed non-fatally: {pe}")

            metrics_summary = PreparedMetricsSummary(
                before_row_count=before_row_count,
                after_row_count=after_row_count,
                before_missing_cells=before_missing_cells,
                after_missing_cells=after_missing_cells,
                before_quality_score=before_quality_score,
                after_quality_score=after_quality_score,
                operations_applied=len(operations)
            )

            logger.info(f"Successfully prepared dataset '{dataset.name}' (Version {next_ver_num}). Quality: {before_quality_score}% -> {after_quality_score}%")
            return prepared_version, metrics_summary, transformations

        except Exception as e:
            self.db.rollback()
            self.storage.delete_file(rel_storage_path)
            logger.error(f"Failed to persist prepared version in database: {e}")
            raise RuntimeError(f"Failed to record prepared dataset version: {str(e)}") from e
