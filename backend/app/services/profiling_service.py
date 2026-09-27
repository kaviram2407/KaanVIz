import csv
import io
import math
import logging
from datetime import datetime
from typing import Tuple, List, Optional, Dict, Any
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.models.dataset import Dataset, DatasetVersion, DatasetProfile, DatasetColumn
from app.services.storage_service import StorageProvider, get_storage_provider

logger = logging.getLogger(__name__)

DATE_FORMATS = [
    "%Y-%m-%d",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S",
    "%m/%d/%Y",
    "%d/%m/%Y",
    "%Y/%m/%d"
]

BOOLEAN_STRINGS = {"true", "false", "1", "0", "yes", "no", "y", "n", "t", "f"}


def infer_column_types_and_stats(col_name: str, series: pd.Series) -> Tuple[str, str, Dict[str, Any]]:
    """
    Deterministically infers physical type, semantic type, and calculates metrics.
    No LLM or AI involved.
    """
    total_len = len(series)
    non_null_series = series.dropna()
    non_null_count = len(non_null_series)

    # Convert values to strings for string inspections
    str_vals = [str(v).strip() for v in non_null_series]

    sample_values = str_vals[:5]
    distinct_count = len(set(str_vals))
    
    # Calculate top frequencies (max 5)
    freq_map = {}
    if non_null_count > 0:
        vc = non_null_series.astype(str).value_counts().head(5)
        freq_map = {str(k): int(v) for k, v in vc.items()}

    stats: Dict[str, Any] = {
        "sample_values": sample_values,
        "top_frequencies": freq_map
    }

    if non_null_count == 0:
        return "VARCHAR", "Text", stats

    # 1. Check Integer
    try:
        int_vals = [int(v) for v in str_vals]
        physical_type = "INTEGER"
        semantic_type = "Identifier" if col_name.lower().endswith("id") or col_name.lower() == "id" else "Numeric"
        
        arr = np.array(int_vals)
        stats.update({
            "min": int(np.min(arr)),
            "max": int(np.max(arr)),
            "mean": round(float(np.mean(arr)), 4),
            "median": round(float(np.median(arr)), 4),
            "std_dev": round(float(np.std(arr)), 4) if non_null_count > 1 else 0.0,
            "zero_count": int(np.sum(arr == 0)),
            "negative_count": int(np.sum(arr < 0))
        })
        return physical_type, semantic_type, stats
    except (ValueError, TypeError):
        pass

    # 2. Check Float / Decimal
    try:
        float_vals = [float(v) for v in str_vals if not math.isnan(float(v))]
        if len(float_vals) == non_null_count:
            physical_type = "DECIMAL"
            semantic_type = "Numeric"
            
            arr = np.array(float_vals)
            stats.update({
                "min": round(float(np.min(arr)), 4),
                "max": round(float(np.max(arr)), 4),
                "mean": round(float(np.mean(arr)), 4),
                "median": round(float(np.median(arr)), 4),
                "std_dev": round(float(np.std(arr)), 4) if non_null_count > 1 else 0.0,
                "zero_count": int(np.sum(arr == 0)),
                "negative_count": int(np.sum(arr < 0))
            })
            return physical_type, semantic_type, stats
    except (ValueError, TypeError):
        pass

    # 3. Check Boolean
    if all(s.lower() in BOOLEAN_STRINGS for s in str_vals):
        physical_type = "BOOLEAN"
        semantic_type = "Boolean"
        true_count = sum(1 for s in str_vals if s.lower() in {"true", "1", "yes", "y", "t"})
        false_count = non_null_count - true_count
        stats.update({
            "true_count": true_count,
            "false_count": false_count
        })
        return physical_type, semantic_type, stats

    # 4. Check Date / Datetime
    parsed_dates = []
    is_date = True
    matched_fmt = None

    for fmt in DATE_FORMATS:
        try:
            dates = [datetime.strptime(s, fmt) for s in str_vals]
            parsed_dates = dates
            matched_fmt = fmt
            break
        except (ValueError, TypeError):
            continue

    if parsed_dates and len(parsed_dates) == non_null_count:
        is_datetime = " " in str_vals[0] or "T" in str_vals[0] or ":" in str_vals[0]
        physical_type = "DATETIME" if is_datetime else "DATE"
        semantic_type = "Datetime" if is_datetime else "Date"
        
        min_d = min(parsed_dates)
        max_d = max(parsed_dates)
        stats.update({
            "min_date": min_d.isoformat(),
            "max_date": max_d.isoformat(),
            "date_format": matched_fmt
        })
        return physical_type, semantic_type, stats

    # 5. Default Text / Categorical
    physical_type = "VARCHAR"
    is_category = (distinct_count <= 20) or (total_len > 0 and (distinct_count / total_len) < 0.2)
    semantic_type = "Category" if is_category else "Text"

    return physical_type, semantic_type, stats


class ProfilingService:
    def __init__(self, db: Session, storage: Optional[StorageProvider] = None):
        self.db = db
        self.storage = storage or get_storage_provider()

    def profile_dataset_version(
        self, dataset_id: str, version_id: Optional[str] = None
    ) -> Tuple[DatasetProfile, List[DatasetColumn]]:
        """
        Executes Phase 3 Deterministic Profiling:
        1. Reads raw dataset version from storage
        2. Calculates dataset & column profile metrics
        3. Persists DatasetProfile and DatasetColumn records idempotently
        """
        dataset = self.db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise KeyError(f"Dataset '{dataset_id}' not found.")

        target_version_id = version_id or dataset.current_version_id
        if not target_version_id:
            raise ValueError(f"Dataset '{dataset_id}' has no active version to profile.")

        version = self.db.query(DatasetVersion).filter(DatasetVersion.id == target_version_id).first()
        if not version:
            raise KeyError(f"Dataset version '{target_version_id}' not found.")

        # Read raw stored CSV bytes
        try:
            raw_bytes = self.storage.get_file_bytes(version.storage_location)
        except Exception as e:
            logger.error(f"Failed to load raw storage file for dataset {dataset_id}: {e}")
            raise FileNotFoundError(f"Raw storage file missing at '{version.storage_location}'.") from e

        file_size_bytes = len(raw_bytes)

        # Parse CSV into Pandas DataFrame safely
        try:
            text_stream = io.BytesIO(raw_bytes)
            # Try decoding utf-8-sig or latin-1
            try:
                df = pd.read_csv(text_stream, encoding="utf-8-sig", dtype=str)
            except UnicodeDecodeError:
                text_stream.seek(0)
                df = pd.read_csv(text_stream, encoding="latin-1", dtype=str)
        except Exception as e:
            logger.error(f"Profiling failed to parse CSV document: {e}")
            raise ValueError(f"Unable to parse dataset for profiling: {str(e)}") from e

        row_count = len(df)
        col_count = len(df.columns)
        total_cells = row_count * col_count

        # Calculate duplicate rows
        duplicate_rows = int(df.duplicated().sum()) if row_count > 0 else 0

        # Calculate missing values
        null_mask = df.isna() | (df == "") | (df.isna())
        missing_cells = int(null_mask.sum().sum())
        missing_percentage = round((missing_cells / total_cells * 100.0), 2) if total_cells > 0 else 0.0

        # Quality score formula (100 - missing penalty - duplicate penalty)
        dup_penalty = (min(duplicate_rows, row_count) / max(row_count, 1)) * 20.0
        missing_penalty = missing_percentage * 0.5
        quality_score = max(0.0, round(100.0 - missing_penalty - dup_penalty, 2))

        # Delete existing profile records for this dataset version to ensure idempotency
        self.db.query(DatasetColumn).filter(DatasetColumn.dataset_version_id == version.id).delete()
        self.db.query(DatasetProfile).filter(DatasetProfile.dataset_version_id == version.id).delete()
        self.db.flush()

        # Create Profile Summary
        summary_metadata = {
            "duplicate_rows": duplicate_rows,
            "total_cells": total_cells,
            "missing_cells": missing_cells,
            "file_size_bytes": file_size_bytes,
            "profiled_at": datetime.utcnow().isoformat()
        }

        profile = DatasetProfile(
            dataset_id=dataset.id,
            dataset_version_id=version.id,
            row_count=row_count,
            column_count=col_count,
            file_size_bytes=file_size_bytes,
            duplicate_rows=duplicate_rows,
            missing_cells=missing_cells,
            missing_percentage=missing_percentage,
            quality_score=quality_score,
            summary_metadata=summary_metadata,
            status="completed"
        )
        self.db.add(profile)
        self.db.flush()

        # Compute Column-level Profiles
        column_records: List[DatasetColumn] = []
        for idx, col_name in enumerate(df.columns):
            series = df[col_name]
            non_null_s = series.dropna()

            # Null statistics
            col_null_count = int(series.isna().sum() + (series == "").sum())
            col_null_pct = round((col_null_count / max(row_count, 1)) * 100.0, 2)
            
            clean_vals = [v for v in series if pd.notna(v) and str(v).strip() != ""]
            col_distinct_count = len(set(clean_vals))
            col_is_unique = (col_distinct_count == len(clean_vals)) and len(clean_vals) > 0

            # Infer physical/semantic types and stats
            phys_type, sem_type, stats = infer_column_types_and_stats(str(col_name), pd.Series(clean_vals))

            col_record = DatasetColumn(
                dataset_id=dataset.id,
                dataset_version_id=version.id,
                name=str(col_name),
                ordinal_position=idx,
                physical_type=phys_type,
                semantic_type=sem_type,
                type_source="inferred",
                null_count=col_null_count,
                null_percentage=col_null_pct,
                distinct_count=col_distinct_count,
                is_unique=col_is_unique,
                stats=stats
            )
            self.db.add(col_record)
            column_records.append(col_record)

        self.db.commit()
        self.db.refresh(profile)
        for col in column_records:
            self.db.refresh(col)

        logger.info(f"Dataset '{dataset.name}' ({dataset.id}) successfully profiled. Quality Score: {quality_score}%")
        return profile, column_records
