import io
import time
import logging
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.models.dataset import Dataset, DatasetVersion, DatasetColumn, DataModel, ModelDataset
from app.schemas.analytics import (
    AnalyticsQueryRequest,
    AnalyticsQueryResponse,
    ColumnMetadata,
    DimensionSpec,
    MeasureSpec,
    SortSpec,
    FilterSpec,
    VisualizationSpec,
    VisualizationValidateResponse,
)
from app.services.storage_service import StorageProvider, get_storage_provider

logger = logging.getLogger(__name__)

NUMERIC_TYPES = {"INTEGER", "BIGINT", "FLOAT", "DECIMAL", "NUMBER", "DOUBLE", "REAL", "INT"}
DATE_TYPES = {"DATE", "DATETIME", "TIMESTAMP"}


class AnalyticsService:
    def __init__(self, db: Session, storage: Optional[StorageProvider] = None):
        self.db = db
        self.storage = storage or get_storage_provider()

    def validate_visualization_spec(
        self,
        spec: VisualizationSpec,
        dataset_id: Optional[str] = None
    ) -> VisualizationValidateResponse:
        """
        Validates a visualization specification against deterministic rules.
        """
        issues: List[str] = []
        chart_type = spec.chart_type.lower()
        dims = spec.dimensions or []
        measures = spec.measures or []

        valid_chart_types = {"bar", "line", "area", "pie", "donut", "scatter", "table", "kpi"}
        if chart_type not in valid_chart_types:
            issues.append(f"Unsupported chart type '{spec.chart_type}'. Supported types: {', '.join(sorted(valid_chart_types))}.")

        if chart_type in {"bar", "line", "area"}:
            if len(dims) < 1:
                issues.append(f"Chart type '{chart_type}' requires at least 1 dimension.")
            if len(measures) < 1:
                issues.append(f"Chart type '{chart_type}' requires at least 1 measure.")
        elif chart_type in {"pie", "donut"}:
            if len(dims) != 1:
                issues.append(f"Chart type '{chart_type}' requires exactly 1 dimension.")
            if len(measures) != 1:
                issues.append(f"Chart type '{chart_type}' requires exactly 1 measure.")
        elif chart_type == "scatter":
            if len(measures) < 1:
                issues.append("Scatter chart requires at least 1 measure.")
            if len(dims) < 1 and len(measures) < 2:
                issues.append("Scatter chart requires at least 2 numeric measures or 1 dimension + 1 measure.")
        elif chart_type == "kpi":
            effective_measures = list(measures)
            if spec.kpi_measure:
                effective_measures.append(spec.kpi_measure)
            if len(effective_measures) != 1:
                issues.append("KPI visual requires exactly 1 measure.")
            if len(dims) > 0:
                issues.append("KPI visual does not support dimension grouping.")
        elif chart_type == "table":
            if len(dims) == 0 and len(measures) == 0 and not spec.kpi_measure:
                issues.append("Table visual requires at least 1 dimension or 1 measure.")

        # Check aggregation validity
        valid_aggregations = {"sum", "avg", "count", "distinct_count", "min", "max"}
        for m in measures:
            if m.aggregation.lower() not in valid_aggregations:
                issues.append(f"Unsupported aggregation '{m.aggregation}'. Supported aggregations: {', '.join(sorted(valid_aggregations))}.")
        if spec.kpi_measure and spec.kpi_measure.aggregation.lower() not in valid_aggregations:
            issues.append(f"Unsupported aggregation '{spec.kpi_measure.aggregation}'. Supported aggregations: {', '.join(sorted(valid_aggregations))}.")

        # Check field compatibility if dataset_id provided
        if dataset_id and (dims or measures or spec.kpi_measure):
            dataset = self.db.query(Dataset).filter(Dataset.id == dataset_id).first()
            if not dataset:
                issues.append(f"Dataset '{dataset_id}' not found.")
            else:
                col_map = {
                    c.name: c.physical_type
                    for c in self.db.query(DatasetColumn).filter(
                        DatasetColumn.dataset_id == dataset_id,
                        DatasetColumn.dataset_version_id == dataset.current_version_id
                    ).all()
                }

                for d in dims:
                    if d.field not in col_map:
                        issues.append(f"Dimension field '{d.field}' does not exist in dataset.")

                check_measures = list(measures)
                if spec.kpi_measure:
                    check_measures.append(spec.kpi_measure)

                for m in check_measures:
                    if m.field not in col_map:
                        issues.append(f"Measure field '{m.field}' does not exist in dataset.")
                    else:
                        phys_type = (col_map[m.field] or "VARCHAR").upper()
                        agg = m.aggregation.lower()
                        if agg in {"sum", "avg"} and phys_type not in NUMERIC_TYPES:
                            issues.append(
                                f"Aggregation '{m.aggregation}' cannot be applied to non-numeric field '{m.field}' ({phys_type})."
                            )

        return VisualizationValidateResponse(is_valid=len(issues) == 0, issues=issues)

    def execute_query(
        self,
        request: AnalyticsQueryRequest,
        workspace_id: str = "default"
    ) -> AnalyticsQueryResponse:
        """
        Executes a deterministic server-side analytics query.
        Validates request, loads bounded dataset into pandas, executes aggregations,
        and returns aggregated response without sending raw data to the browser.
        """
        start_time = time.time()

        # Resolve target dataset & version
        dataset_id = request.dataset_id
        version_id = request.version_id

        if request.model_id:
            model = self.db.query(DataModel).filter(
                DataModel.id == request.model_id,
                DataModel.workspace_id == workspace_id
            ).first()
            if not model:
                raise KeyError(f"Data model '{request.model_id}' not found in workspace.")
            
            # Find bound dataset
            model_ds = self.db.query(ModelDataset).filter(ModelDataset.model_id == model.id).first()
            if not model_ds:
                raise ValueError(f"Data model '{request.model_id}' has no bound datasets.")
            dataset_id = model_ds.dataset_id
            version_id = version_id or model_ds.dataset_version_id

        if not dataset_id:
            raise ValueError("Analytics query requires either 'dataset_id' or 'model_id'.")

        dataset = self.db.query(Dataset).filter(
            Dataset.id == dataset_id,
            Dataset.workspace_id == workspace_id
        ).first()
        if not dataset:
            raise KeyError(f"Dataset '{dataset_id}' not found in workspace '{workspace_id}'.")

        target_version_id = version_id or dataset.current_version_id
        if not target_version_id:
            raise ValueError(f"Dataset '{dataset_id}' has no active version.")

        version = self.db.query(DatasetVersion).filter(DatasetVersion.id == target_version_id).first()
        if not version:
            raise KeyError(f"Dataset version '{target_version_id}' not found.")

        # Fetch column schema
        db_columns = self.db.query(DatasetColumn).filter(
            DatasetColumn.dataset_id == dataset_id,
            DatasetColumn.dataset_version_id == target_version_id
        ).all()
        col_type_map = {c.name: (c.physical_type or "VARCHAR").upper() for c in db_columns}

        # Validate request fields against dataset schema
        dimensions = request.dimensions or []
        measures = request.measures or []
        filters = request.filters or []

        if not dimensions and not measures:
            raise ValueError("Analytics query must specify at least one dimension or measure.")

        for d in dimensions:
            if d.field not in col_type_map:
                raise ValueError(f"Dimension field '{d.field}' does not exist in dataset schema.")

        for m in measures:
            if m.field not in col_type_map:
                raise ValueError(f"Measure field '{m.field}' does not exist in dataset schema.")

            col_type = col_type_map[m.field]
            agg = m.aggregation.lower()

            if agg in {"sum", "avg"} and col_type not in NUMERIC_TYPES:
                raise ValueError(
                    f"Aggregation '{m.aggregation}' is not supported for non-numeric field '{m.field}' ({col_type})."
                )
            if agg in {"min", "max"} and col_type not in NUMERIC_TYPES and col_type not in DATE_TYPES:
                raise ValueError(
                    f"Aggregation '{m.aggregation}' is not supported for field '{m.field}' ({col_type})."
                )

        for f in filters:
            if f.field not in col_type_map:
                raise ValueError(f"Filter field '{f.field}' does not exist in dataset schema.")

        # Load dataset file bytes from storage
        try:
            source_bytes = self.storage.get_file_bytes(version.storage_location)
        except Exception as e:
            logger.error(f"Failed to read storage file for dataset {dataset_id}: {e}")
            raise FileNotFoundError(f"Source dataset storage file missing at '{version.storage_location}'.") from e

        # Read into pandas DataFrame
        text_stream = io.BytesIO(source_bytes)
        try:
            df = pd.read_csv(text_stream, encoding="utf-8-sig")
        except UnicodeDecodeError:
            text_stream.seek(0)
            df = pd.read_csv(text_stream, encoding="latin-1")

        # Apply Filters
        for f in filters:
            col_name = f.field
            op = f.operator.lower()
            val = f.value

            if op == "eq":
                df = df[df[col_name].astype(str) == str(val)]
            elif op == "neq":
                df = df[df[col_name].astype(str) != str(val)]
            elif op == "gt":
                df = df[pd.to_numeric(df[col_name], errors="coerce") > float(val)]
            elif op == "gte":
                df = df[pd.to_numeric(df[col_name], errors="coerce") >= float(val)]
            elif op == "lt":
                df = df[pd.to_numeric(df[col_name], errors="coerce") < float(val)]
            elif op == "lte":
                df = df[pd.to_numeric(df[col_name], errors="coerce") <= float(val)]
            elif op == "contains":
                df = df[df[col_name].astype(str).str.contains(str(val), case=False, na=False)]
            elif op == "in" and isinstance(val, list):
                val_strs = [str(v) for v in val]
                df = df[df[col_name].astype(str).isin(val_strs)]
            elif op == "is_null":
                df = df[df[col_name].isna() | (df[col_name] == "")]
            elif op == "is_not_null":
                df = df[df[col_name].notna() & (df[col_name] != "")]

        # Prepare dimensions & measures
        dim_fields = [d.field for d in dimensions]

        # Construct aggregation rules
        agg_spec = {}
        output_cols_meta: List[ColumnMetadata] = []

        # Add dimension metadata
        for d in dimensions:
            col_name = d.alias or d.field
            output_cols_meta.append(
                ColumnMetadata(
                    name=col_name,
                    physical_type=col_type_map.get(d.field, "VARCHAR"),
                    role="dimension"
                )
            )

        # Process measures
        measure_agg_tuples = []
        for m in measures:
            agg_func = m.aggregation.lower()
            target_col = m.field
            alias = m.alias or f"{m.aggregation.upper()}({m.field})"
            
            # Map function name for pandas
            if agg_func == "distinct_count":
                pd_func = "nunique"
            elif agg_func == "avg":
                pd_func = "mean"
            else:
                pd_func = agg_func

            # Convert column to numeric if needed for sum/avg
            if agg_func in {"sum", "avg", "min", "max"} and col_type_map.get(target_col) in NUMERIC_TYPES:
                df[target_col] = pd.to_numeric(df[target_col], errors="coerce")

            measure_agg_tuples.append((alias, target_col, pd_func, agg_func, col_type_map.get(target_col, "FLOAT")))

            output_cols_meta.append(
                ColumnMetadata(
                    name=alias,
                    physical_type="FLOAT" if agg_func in {"avg", "sum"} else "INTEGER",
                    role="measure",
                    aggregation=m.aggregation.upper()
                )
            )

        # Execute grouped aggregation
        if dim_fields:
            if measure_agg_tuples:
                # Grouped aggregation with measures
                grouped = df.groupby(dim_fields, as_index=False)
                agg_dict = {}
                for alias, target_col, pd_func, _, _ in measure_agg_tuples:
                    if target_col not in agg_dict:
                        agg_dict[target_col] = []
                    agg_dict[target_col].append((alias, pd_func))

                # Custom aggregation dictionary execution
                res_df = df.groupby(dim_fields).agg(
                    **{alias: (target_col, pd_func) for alias, target_col, pd_func, _, _ in measure_agg_tuples}
                ).reset_index()
            else:
                # Grouped distinct dimensions only
                res_df = df[dim_fields].drop_duplicates().reset_index(drop=True)
        else:
            # Global aggregation without dimensions
            agg_results = {}
            for alias, target_col, pd_func, _, _ in measure_agg_tuples:
                if pd_func == "count":
                    agg_results[alias] = [int(df[target_col].count())]
                elif pd_func == "nunique":
                    agg_results[alias] = [int(df[target_col].nunique())]
                elif pd_func == "sum":
                    val = df[target_col].sum()
                    agg_results[alias] = [float(val) if pd.notna(val) else 0.0]
                elif pd_func == "mean":
                    val = df[target_col].mean()
                    agg_results[alias] = [float(val) if pd.notna(val) else 0.0]
                elif pd_func == "min":
                    val = df[target_col].min()
                    agg_results[alias] = [float(val) if pd.notna(val) else None]
                elif pd_func == "max":
                    val = df[target_col].max()
                    agg_results[alias] = [float(val) if pd.notna(val) else None]
            res_df = pd.DataFrame(agg_results)

        # Apply Sorting
        if request.sort:
            sort_field = request.sort.field
            sort_asc = request.sort.direction.lower() == "asc"

            # Check if sort field exists in res_df
            if sort_field in res_df.columns:
                res_df = res_df.sort_values(by=sort_field, ascending=sort_asc)

        # Apply Limit
        limit = min(request.limit or 100, 1000)
        res_df = res_df.head(limit)

        # Format NaN / Inf values to None for clean JSON serialization
        res_df = res_df.replace({np.nan: None, np.inf: None, -np.inf: None})
        records = res_df.to_dict(orient="records")

        exec_ms = round((time.time() - start_time) * 1000, 2)

        return AnalyticsQueryResponse(
            dataset_id=dataset_id,
            version_id=target_version_id,
            row_count=len(records),
            columns=output_cols_meta,
            data=records,
            execution_time_ms=exec_ms
        )
