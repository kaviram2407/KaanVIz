# KaanViz — Data Processing & Analytics Coding Standards

## 1. Purpose

This document defines coding standards for KaanViz data processing, profiling, preparation, and analytical execution.

The data layer must prioritize:

- Deterministic computation
- Data correctness
- Raw-data immutability
- Explicit transformations
- Traceable results
- Efficient analytical execution
- Controlled browser data transfer

AI may recommend transformations or analytical directions, but deterministic engines perform and validate the underlying data operations.

---

## 2. Core Processing Principle

The preferred data flow is:

```text
Source
  ↓
Ingestion
  ↓
Raw immutable data
  ↓
Profiling
  ↓
Type understanding
  ↓
Preparation
  ↓
Validation
  ↓
Processed version
  ↓
Analytical computation
  ↓
Aggregated result
  ↓
Visualization / Dashboard / AI
```

Each stage should have a clear responsibility.

---

## 3. Raw Data Immutability

Raw uploaded/source data must remain immutable.

Processing code must not silently overwrite the original dataset.

Prefer:

```text
Raw Dataset
   ↓
Transformation
   ↓
Derived Dataset Version
```

rather than:

```text
Raw Dataset
   ↓
In-place mutation
```

The system should retain enough lineage to identify how a processed version was produced.

---

## 4. Data Profiling

The profiler calculates facts before AI is involved.

### Dataset-level profiling

The profiler should calculate applicable:

- Row count
- Column count
- Size/memory usage
- Duplicate rows
- Missing values
- Missing-value percentages

### Column-level profiling

The profiler should calculate applicable:

- Original type
- Inferred type
- Null count
- Null percentage
- Unique count/cardinality
- Minimum
- Maximum
- Mean
- Median
- Standard deviation
- Quantiles
- Top values
- Value frequencies
- Potential outliers
- Invalid values
- Date range

Profiling output should represent computed facts rather than interpretations presented as facts.

---

## 5. Date Intelligence

Date and datetime handling is a first-class data capability.

The profiler should detect:

- Date columns
- Datetime columns
- Date-like strings

Where applicable, calculate:

- Date ranges
- Frequency patterns
- Missing values
- Invalid values

Do not assume every string that resembles a date is valid without validation.

---

## 6. Physical and Semantic Types

Data processing should distinguish between:

```text
Physical type
    +
Semantic type
```

Examples of semantic interpretation may include:

- Identifier
- Category
- Numeric measure
- Date
- Datetime
- Boolean
- Text

User overrides should be supported where defined by the product.

Processing logic should use the validated semantic interpretation rather than blindly relying on the original physical representation.

---

## 7. Type Inference

Type inference should be deterministic and explainable.

Inference should consider the actual values and available metadata.

The system should be able to distinguish:

- Original type
- Inferred type
- User-selected override

Where the product exposes an explanation for inference, the explanation should correspond to actual deterministic evidence.

Do not fabricate reasoning after the fact.

---

## 8. Data Preparation

Supported preparation operations include:

### Columns

- Rename
- Remove
- Reorder
- Change type

### Text

- Trim
- Lowercase
- Uppercase
- Replace
- Standardize categories

### Missing values

- Keep
- Replace with constant
- Replace with mean
- Replace with median
- Replace with mode
- Remove rows

### Duplicates

- Detect
- Remove
- Keep first
- Keep last

### Dates

- Parse
- Reformat
- Extract year
- Extract quarter
- Extract month
- Extract week
- Extract day
- Extract weekday

### Numeric

- Cast
- Handle invalid values
- Round
- Calculate new columns

### Rows

- Filter using validated conditions

The implementation should expose these operations as structured transformations rather than arbitrary executable code.

---

## 9. Deterministic Transformation Engine

The transformation engine performs the actual preparation operations.

AI may recommend a transformation:

```text
AI recommendation
      ↓
User review/approval
      ↓
Structured transformation
      ↓
Validation
      ↓
Deterministic transformation engine
      ↓
Derived dataset version
```

AI must not bypass the deterministic transformation engine.

---

## 10. Transformation Specifications

Each transformation should be represented as structured data.

Conceptually:

```text
Transformation
├── operation
├── target column(s)
├── parameters
├── input version
├── output version
├── validation status
└── metadata
```

The exact schema is defined by the implementation and database/API specifications.

Avoid storing transformations only as opaque text.

---

## 11. Transformation Validation

Before executing a transformation, validate:

- Referenced columns exist
- Operation is supported
- Parameters are valid
- Types are compatible
- Required values are present
- Conditions are syntactically and semantically valid

Invalid transformations must be rejected before they can corrupt a processed result.

---

## 12. Transformation Lineage

Preparation must remain traceable.

A user should be able to understand:

```text
Raw version
   ↓
Transformation A
   ↓
Version B
   ↓
Transformation B
   ↓
Version C
```

Lineage should identify the transformations responsible for a processed version.

This supports:

- Explainability
- Reproducibility
- Debugging
- User trust
- Recovery

---

## 13. Missing Values

Missing-value operations must be explicit.

Examples:

```text
Keep
Replace with constant
Replace with mean
Replace with median
Replace with mode
Remove row
```

Do not silently apply a missing-value strategy.

When a replacement changes analytical meaning, the transformation should remain visible in the lineage.

---

## 14. Duplicate Handling

Duplicate handling should distinguish between:

- Detection
- Removal
- Keep-first
- Keep-last

The system should not silently remove duplicates during ordinary profiling.

Profiling should report duplicate information; preparation should perform the user-selected operation.

---

## 15. Invalid Values

Invalid values should be identified before destructive correction where practical.

Examples:

- Invalid numeric values
- Invalid dates
- Unsupported category values
- Failed casts

The system should preserve enough information to explain what happened during preparation.

---

## 16. Filtering

Row filters should use validated structured conditions.

Conceptually:

```text
Column
Operator
Value
```

or a validated equivalent expression model.

Do not expose arbitrary executable expressions as the default user-facing filtering mechanism.

Filters used for preparation should remain distinguishable from temporary analytical/dashboard filters.

---

## 17. Analytical Engine

The recommended analytics technologies are:

- DuckDB
- Polars
- Pandas
- Parquet

Use the most appropriate engine for the operation.

The analytics engine should support:

- Filtering
- Aggregation
- Grouping
- Sorting
- Joins
- Descriptive statistics
- Time-series analysis
- Correlation
- Distinct counts
- KPI calculations

---

## 18. DuckDB Usage

DuckDB is appropriate for analytical querying, particularly when operating over Parquet-backed processed data.

Use DuckDB where SQL-style analytical execution is advantageous.

Keep queries:

- Structured
- Validated
- Bounded
- Workspace-aware
- Version-aware

Do not construct unrestricted queries directly from untrusted user input.

---

## 19. Polars Usage

Polars is appropriate for dataframe-oriented processing.

Potential uses include:

- Data preparation
- Type operations
- Profiling
- Transformations
- Dataframe calculations

Avoid unnecessary conversion between data engines when it creates significant overhead.

---

## 20. Pandas Usage

Pandas is supported as part of the analytical stack where it is appropriate for:

- Compatibility
- Specific dataframe operations
- Smaller analytical workloads
- Existing Python ecosystem integrations

Do not use Pandas automatically for every dataset regardless of size.

---

## 21. Parquet Usage

Processed datasets should use Parquet as the preferred analytical storage format.

Benefits relevant to the architecture include:

- Efficient analytical reads
- Column-oriented access
- Compatibility with DuckDB/Polars
- Better handling of larger datasets than repeatedly loading raw CSV

The raw source artifact remains separately protected and immutable.

---

## 22. Large Dataset Strategy

The preferred strategy is:

```text
Small:
CSV → Polars/Pandas → Analysis

Large:
CSV → Parquet → DuckDB/Polars → Aggregation → Frontend
```

Do not send millions of raw rows to the browser merely to draw a chart.

The analytical layer should reduce the data to the smallest useful result for the requested visualization or UI operation.

---

## 23. Browser Data Boundary

The browser should receive:

- Aggregated results
- Relevant filtered results
- Visualization-ready datasets
- Metadata required for interaction

Avoid transferring:

- Entire raw datasets unnecessarily
- Millions of unused rows
- Internal processing artifacts
- Sensitive metadata not required by the UI

This boundary is both a performance and security consideration.

---

## 24. Analytical Query Construction

Analytical requests should be represented as structured intent.

Conceptually:

```text
Dataset/version
Dimensions
Measures
Aggregations
Filters
Grouping
Sorting
Limit
```

The backend validates this structure before executing the analytical operation.

---

## 25. Aggregation

Aggregations should be explicit.

Supported examples include:

- Sum
- Count
- Distinct count
- Average
- Minimum
- Maximum
- Median
- Other approved statistical operations

The engine should verify that an aggregation is compatible with the selected field's semantic/physical type.

---

## 26. Grouping

Grouping should validate:

- Dataset/version
- Grouping columns
- Column existence
- Semantic compatibility

The result should have deterministic grouping behavior.

---

## 27. Sorting and Limits

Sorting should be explicit and bounded.

Validate:

- Sort field
- Direction
- Supported ordering semantics
- Maximum result size

Large analytical requests should use limits or aggregation rather than producing unnecessarily large result sets.

---

## 28. Joins

Joins should validate:

- Source datasets
- Workspace ownership
- Dataset versions
- Join columns
- Type compatibility
- Join configuration

The relationship/model layer should provide approved relationships where applicable.

Do not allow an analytical request to bypass workspace isolation through an arbitrary cross-workspace join.

---

## 29. Time-Series Analysis

Time-series operations should use validated date/datetime semantics.

Where applicable, support:

- Date ranges
- Time grouping
- Year
- Quarter
- Month
- Week
- Day
- Weekday

The implementation should distinguish date-like strings from validated date/datetime columns before performing date operations.

---

## 30. Statistical Operations

Descriptive statistics should be deterministic and clearly defined.

Potential operations include:

- Mean
- Median
- Standard deviation
- Quantiles
- Correlation
- Distinct counts

The system should avoid presenting statistically derived values as if they were raw source facts.

---

## 31. KPI Calculations

KPI calculations should be represented as structured analytical definitions.

Conceptually:

```text
Metric
 ↓
Measure
 ↓
Aggregation / calculation
 ↓
Filter context
 ↓
Result
```

The calculation should be reproducible from its stored definition.

---

## 32. Analytical Result Provenance

Analytical results should retain enough context to identify:

- Dataset
- Dataset version
- Analysis definition
- Filters
- Dimensions
- Measures
- Aggregations
- Relevant relationships
- Calculation definition where applicable

This supports visualization provenance and AI explanations.

---

## 33. Caching

Caching may be used for repeated analytical operations where appropriate.

Cached results must respect:

- Workspace
- Dataset
- Dataset version
- Query definition
- Relevant filters
- Permissions

A stale or cross-workspace result must never be returned merely because its query shape matches.

---

## 34. Performance

Performance-sensitive processing should:

- Avoid unnecessary data copies
- Avoid unnecessary engine conversions
- Use columnar processing where appropriate
- Aggregate before browser transfer
- Bound result sizes
- Prefer streaming/chunked processing where appropriate
- Use background jobs for expensive operations

Performance optimizations must not compromise correctness or lineage.

---

## 35. Memory Management

Large datasets should not be loaded into memory unnecessarily.

Where practical:

- Process incrementally
- Use Parquet
- Use DuckDB for analytical access
- Use Polars efficiently
- Limit browser payloads

Memory-intensive operations should be measurable and tested with representative data.

---

## 36. Error Handling

Data-processing errors should identify the affected operation without exposing unnecessary implementation details.

Examples:

```text
Invalid date conversion
Unsupported transformation
Missing column
Incompatible aggregation
Invalid analytical filter
Processing resource failure
```

A failed operation must not silently produce a result that appears valid.

---

## 37. Data Safety

Processing code must preserve:

- Raw-data immutability
- Workspace isolation
- Dataset-version integrity
- Transformation lineage
- Validated analytical boundaries

Do not use uploaded dataset contents as executable instructions.

---

## 38. AI Boundary

AI can assist with:

- Transformation recommendations
- Analytical intent
- Insight generation
- Visualization recommendations

AI does not directly perform trusted data mutations.

Preferred boundary:

```text
AI
 ↓
Structured recommendation / intent
 ↓
Validation
 ↓
Deterministic engine
 ↓
Result
```

This keeps the analytical system usable even when AI is unavailable.

---

## 39. Testing Standards

Data-processing tests should cover:

### Profiling

- Row counts
- Column counts
- Null metrics
- Cardinality
- Statistics
- Date detection
- Invalid values

### Preparation

- Column operations
- Text operations
- Missing values
- Duplicates
- Dates
- Numeric operations
- Row filtering

### Analytics

- Filtering
- Aggregation
- Grouping
- Sorting
- Joins
- Statistics
- KPI calculations
- Time-series operations

### Data safety

- Raw immutability
- Version lineage
- Workspace isolation
- Invalid transformation rejection
- Invalid analytical request rejection

---

## 40. Representative Test Data

Tests should include representative data with:

- Missing values
- Duplicate rows
- Invalid values
- Numeric columns
- Text columns
- Categories
- Dates
- Datetimes
- Date-like strings
- Outliers
- Multiple dataset versions

The Olist example may be used as a validation case, but processing logic must remain generic.

---

## 41. Data Processing Workflow

A standard processing workflow is:

```text
Load source
   ↓
Validate input
   ↓
Store raw artifact
   ↓
Profile
   ↓
Infer types
   ↓
Apply approved transformations
   ↓
Validate processed result
   ↓
Write processed Parquet
   ↓
Record version/lineage
   ↓
Expose analytical access
```

Each stage should produce a clear success or failure state.

---

## 42. Antigravity Implementation Rules

When modifying data processing or analytics:

1. Read the relevant data architecture specification first.
2. Preserve raw-data immutability.
3. Keep transformations deterministic.
4. Keep AI recommendations separate from execution.
5. Validate all transformation requests.
6. Validate all analytical requests.
7. Preserve dataset version lineage.
8. Respect workspace boundaries.
9. Avoid unnecessary browser data transfer.
10. Use appropriate analytical engines based on workload.
11. Add tests for important processing behavior.
12. Run the relevant tests.
13. Report failures honestly.
14. Document important performance or architecture decisions.

---

## 43. Definition of Done

A data-processing or analytics change is complete when:

- The operation is deterministic where required.
- Input validation is implemented.
- Raw data remains immutable.
- Version/lineage behavior is correct.
- Workspace isolation is preserved.
- Analytical result size is controlled.
- Relevant tests pass.
- Error paths are tested.
- Representative data has been considered.
- Browser transfer is appropriate for the workload.
- Documentation is updated when necessary.
- Verification status is reported honestly.

---

## 44. Final Principle

KaanViz data processing should follow a simple rule:

> Compute facts deterministically, preserve the source, record the transformation, and send only the useful result forward.

The analytical layer should remain reliable whether AI is enabled or completely unavailable.
