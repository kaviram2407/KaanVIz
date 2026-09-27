# KaanViz — Connector & Data Source Integration Standards

## 1. Purpose

This document defines the coding and architecture standards for KaanViz data sources and future connectors.

The initial KaanViz data source is CSV upload. The architecture must nevertheless support future sources such as:

- Excel
- Databricks
- Snowflake
- Cloud warehouses
- Object storage
- APIs
- Databases

The central requirement is that new connectors can be added without redesigning the analytics engine.

---

## 2. Core Principle

A data source is not the same thing as a dataset.

Conceptually:

```text
Data Source
    |
    | ingestion / query
    v
Dataset
    |
    v
Dataset Version
    |
    v
Profiling / Preparation / Modeling / Analytics
```

A connector is responsible for accessing a source.

The core KaanViz data engine is responsible for:

- Profiling
- Type understanding
- Preparation
- Validation
- Lineage
- Modeling
- Analytics
- Visualization

Connector-specific behavior must not leak into these core domains.

---

## 3. Initial and Future Sources

### Initial

```text
CSV upload
```

### Future

```text
Excel
Databricks
Snowflake
Cloud warehouses
Object storage
APIs
Databases
```

The implementation should avoid creating a CSV-specific architecture that makes future connectors expensive to introduce.

---

## 4. Data Source Abstraction

A conceptual source abstraction should expose normalized operations rather than provider-specific objects throughout the application.

Example conceptual interface:

```text
DataSourceProvider
├── validate_connection()
├── discover()
├── inspect_schema()
├── read()
└── health()
```

The exact interface may evolve during implementation.

The important rule is:

> Provider-specific connection logic stays behind the data-source boundary.

---

## 5. Source Types

A source record should identify the kind of external or uploaded source.

Conceptual examples:

```text
csv_upload
excel_file
databricks
snowflake
object_storage
api
database
```

The exact enum can evolve.

New source types should be additive rather than requiring changes throughout analytics, visualization, or dashboard code.

---

## 6. Data Source Metadata

A data source may need metadata such as:

- Source ID
- Workspace ID
- Source type
- Display name
- Configuration reference
- Connection status
- Created time
- Updated time
- Last successful access
- Last failure
- Source-specific metadata

Secrets must not be stored as ordinary unprotected metadata.

Connection credentials must use the application's secret-management approach.

---

## 7. Dataset vs Data Source

### Data Source

Represents where data comes from.

Examples:

```text
Sales Snowflake account
Company S3 bucket
Uploaded CSV
Customer database
External API
```

### Dataset

Represents a logical analytical data asset used by KaanViz.

Examples:

```text
Orders
Customers
Sales by Month
Product Performance
```

A dataset may originate from a data source and can have versions.

This separation allows future connector replacement without redesigning dataset, preparation, modeling, and visualization concepts.

---

## 8. CSV Upload Adapter

The initial CSV implementation should behave like a connector/source adapter rather than creating special-case behavior throughout the product.

Conceptually:

```text
CSV Upload
    |
    v
CSV Source Adapter
    |
    v
Normalized Ingestion Contract
    |
    v
Dataset
```

CSV-specific parsing belongs in the adapter/ingestion boundary.

Profiling, type inference, preparation, and analytics should consume normalized data rather than depend directly on CSV parser details.

---

## 9. Ingestion Contract

A source adapter should provide enough information for the ingestion pipeline to establish:

- Source identity
- Dataset identity
- Schema
- Column names
- Physical types where known
- Row/record access
- Source metadata
- Provenance information

The core engine should not need to know whether the rows originated from CSV, Snowflake, or another provider.

---

## 10. Schema Discovery

Connectors may expose source schemas differently.

KaanViz should normalize schema information into a common representation.

A normalized column description may include:

```text
name
physical_type
nullable
ordinal_position
source_name
source_type
```

Semantic type inference remains a KaanViz responsibility.

For example:

```text
source type: VARCHAR
semantic type: categorical
```

or:

```text
source type: TIMESTAMP
semantic type: datetime
```

The connector should report source facts rather than decide KaanViz analytical semantics.

---

## 11. Physical vs Semantic Types

Connector integrations must preserve the distinction between:

```text
Physical Type
```

and:

```text
Semantic Type
```

Examples:

```text
VARCHAR -> categorical
VARCHAR -> text
INTEGER -> measure
DATE -> datetime
TIMESTAMP -> datetime
```

The connector supplies what the source knows.

KaanViz profiling and type inference determine the analytical interpretation.

User overrides remain authoritative where supported.

---

## 12. Reading Data

Connectors should expose controlled data access.

Possible modes include:

```text
Full ingestion
Sample
Preview
Filtered read
Aggregated query
Incremental read
```

The appropriate mode depends on the source.

The core engine must not assume that every source can or should be fully downloaded into memory.

---

## 13. Browser Data Boundary

The browser should not become the primary analytical engine for large connected datasets.

Preferred flow:

```text
Data Source
    |
    v
Backend / Analytics Layer
    |
    v
DuckDB / Polars / Provider Query
    |
    v
Aggregated / bounded result
    |
    v
Browser
```

Large raw datasets should not be unnecessarily transferred to the browser.

---

## 14. Pushdown Strategy

Future warehouse/database connectors may support query pushdown.

Conceptually:

```text
KaanViz Analysis
      |
      v
Query Planner
      |
      +--> Local DuckDB / Polars
      |
      +--> Provider-side query
```

Pushdown is an optimization and architecture capability, not a requirement for the initial CSV implementation.

The resulting analytical contract must remain consistent regardless of execution location.

---

## 15. Provider Isolation

Provider-specific details must remain inside connector modules.

Avoid code such as:

```python
if source.type == "snowflake":
    ...
elif source.type == "databricks":
    ...
elif source.type == "csv":
    ...
```

spread throughout business logic.

Prefer:

```text
DataSourceProvider
        |
        +--> CSVProvider
        +--> SnowflakeProvider
        +--> DatabricksProvider
        +--> DatabaseProvider
```

The core services should depend on the abstraction.

---

## 16. Connection Lifecycle

For external connectors, define explicit lifecycle states.

Conceptually:

```text
Configured
   |
   v
Testing
   |
   +--> Failed
   |
   v
Connected
   |
   v
Degraded / Unavailable
```

A failed connection should not corrupt existing datasets or processed versions.

Existing validated data should remain usable where the architecture permits.

---

## 17. Connection Testing

A connection-test operation should be lightweight.

It should verify the minimum capability required to establish that the configured source is reachable and usable.

Do not perform an expensive full-table scan merely to test connectivity unless the provider requires it.

Return structured results such as:

```text
status
provider
latency
capabilities
safe_error
```

Do not expose credentials or sensitive provider diagnostics to the client.

---

## 18. Discovery

Future connectors may support discovery of:

- Databases
- Schemas
- Tables
- Sheets
- Buckets
- Objects
- API resources

Discovery results should be normalized.

The UI should consume a KaanViz discovery model rather than provider-specific response shapes.

---

## 19. Source-to-Dataset Creation

A user may select a source resource and create a dataset from it.

Conceptually:

```text
Select Source
      |
      v
Discover Resource
      |
      v
Inspect Schema
      |
      v
Create Dataset
      |
      v
Create Dataset Version
      |
      v
Profile
```

The source resource identity must be retained as provenance.

---

## 20. Provenance

Every dataset created from a connector should retain enough provenance to understand:

- Which source produced it
- Which resource/table/file produced it
- When it was ingested or queried
- Which source configuration was used
- Which dataset version resulted

Provenance must not expose connection secrets.

---

## 21. Snapshot vs Live Sources

Future connectors may support different dataset behaviors.

### Snapshot

Data is copied into KaanViz-managed storage.

```text
Source -> KaanViz raw/processed storage
```

### Live / query-backed

KaanViz retains metadata while querying the source when needed.

```text
Source -> Analytics query -> Result
```

The initial CSV implementation is naturally snapshot-oriented.

The architecture should permit future live/query-backed sources without forcing the visualization and dashboard layers to understand connector-specific details.

---

## 22. Raw and Processed Storage

For snapshot-oriented ingestion:

```text
/raw/original_file.csv
/processed/dataset.parquet
/metadata/profiling.json
/metadata/transformations.json
/metadata/lineage.json
```

Raw source data is immutable.

Processed Parquet is the analytical representation used by modeling and visualization.

Storage should remain behind the storage-provider abstraction.

---

## 23. Connector Security

Connector credentials are sensitive.

Never place credentials in:

- Frontend state
- Browser local storage
- Dataset values
- Visualization specifications
- Dashboard JSON
- AI prompts
- Client-visible API responses
- Source control

Connector access must be server-side.

The connector must also respect workspace authorization.

---

## 24. Workspace Isolation

A source belongs to a workspace context.

Conceptually:

```text
Workspace
   |
   +--> Data Sources
   |
   +--> Datasets
   |
   +--> Models
   |
   +--> Visualizations
   |
   +--> Dashboards
```

A connector operation must validate that the requested source belongs to the current workspace and that the authenticated principal is allowed to use it.

Cross-workspace source access must fail closed.

---

## 25. Rate and Resource Controls

External sources may be expensive or rate-limited.

Connector implementations should account for:

- Request limits
- Query cost
- Connection limits
- Timeout limits
- Result-size limits
- Retry behavior
- Provider throttling

A connector must not retry indefinitely.

---

## 26. Timeout and Retry Standards

Every external operation should have explicit timeout behavior.

Retries should be:

- Bounded
- Appropriate to the operation
- Safe for the operation's idempotency characteristics
- Observable

Do not blindly retry mutations.

For expensive analytical operations, retry behavior should avoid multiplying provider cost unexpectedly.

---

## 27. Caching

Connector responses may be cached where useful.

Caching must not violate:

- Workspace isolation
- Authorization
- Data freshness requirements
- Source permissions

Cache keys must include sufficient source/resource/context identity.

Sensitive connector responses should not be cached in browser-visible storage.

---

## 28. Connector Errors

Normalize provider failures into KaanViz-safe error categories.

Examples:

```text
AUTHENTICATION_FAILED
AUTHORIZATION_FAILED
SOURCE_UNAVAILABLE
TIMEOUT
RATE_LIMITED
INVALID_CONFIGURATION
RESOURCE_NOT_FOUND
SCHEMA_UNAVAILABLE
QUERY_FAILED
UNSUPPORTED_OPERATION
```

The UI should not need to understand provider-specific exception classes.

Internal logs may retain provider-specific diagnostic details subject to security rules.

---

## 29. AI Independence

Connector functionality must work without AI.

AI may later assist with:

- Resource discovery
- Dataset description
- Query suggestions
- Schema interpretation
- Visualization recommendations

But AI must not be required for:

- Connecting to a source
- Reading a source
- Profiling
- Preparing data
- Validating data
- Saving a dataset
- Running deterministic analytics

---

## 30. Connector and Preparation Boundary

Connectors should provide source access.

Preparation should remain a KaanViz deterministic capability.

For example:

```text
Snowflake
   |
   v
Source Adapter
   |
   v
Dataset
   |
   v
Preparation Engine
   |
   v
Validated Version
```

Do not embed cleaning rules inside individual connectors unless they are strictly required for source decoding.

---

## 31. Connector and Modeling Boundary

Relationships belong to the KaanViz semantic/modeling layer.

A connector should not silently create application-level relationships merely because a provider exposes foreign keys.

Provider metadata may be used as a recommendation/input, but relationship creation must follow KaanViz modeling rules and user approval where required.

---

## 32. Connector and Visualization Boundary

Visualization code must consume analytical results or normalized data contracts.

It must not contain:

```text
SnowflakeChart
DatabricksChart
CSVChart
```

Instead:

```text
Dataset / Analysis Result
        |
        v
Visualization Specification
        |
        v
Renderer
```

The same visualization should work regardless of its source where the resulting analytical contract is compatible.

---

## 33. Metadata Database

PostgreSQL stores application metadata rather than large raw analytical rows.

Relevant metadata may include:

```text
data_sources
datasets
dataset_columns
dataset_versions
transformations
relationships
analysis_sessions
analysis_results
visualizations
dashboards
chat_sessions
chat_messages
```

The source document originally describes a single-user/single-workspace product while requiring an extensible model for future multi-user workspaces.

Connector metadata must fit into this metadata architecture rather than creating a separate provider-specific metadata store.

---

## 34. Testing Strategy

Every connector should have tests at several levels.

### Unit

Test:

- Configuration parsing
- Schema normalization
- Type mapping
- Error normalization
- Filename/resource normalization
- Provider capability detection

### Integration

Test:

- Connection
- Discovery
- Schema inspection
- Data retrieval
- Failure handling
- Timeout behavior

### Contract

Verify that the connector satisfies the common source abstraction.

### Security

Test:

- Invalid credentials
- Unauthorized workspace access
- Secret redaction
- Invalid resource identifiers
- Oversized result handling

### Regression

Ensure that adding a connector does not alter:

- CSV behavior
- Profiling
- Preparation
- Modeling
- Visualization
- Dashboard behavior

---

## 35. Antigravity Connector Rules

Antigravity must:

1. Keep provider-specific logic inside connector boundaries.
2. Preserve the common data-source abstraction.
3. Never redesign the analytics engine for one connector.
4. Never expose connector credentials to the browser.
5. Never bypass workspace authorization.
6. Never treat provider data as trusted merely because it came from a configured source.
7. Preserve the untrusted-data model.
8. Normalize schemas before core analytics consumes them.
9. Keep physical and semantic type responsibilities separate.
10. Keep preparation deterministic and connector-independent.
11. Keep visualization connector-independent.
12. Add connector tests before declaring a connector complete.
13. Document provider-specific limitations.
14. Preserve AI-optional behavior.
15. Do not introduce a new connector into the MVP merely because the architecture supports it; implement only the requested phase.

---

## 36. Definition of Done

A connector/data-source implementation is complete only when:

- [ ] A clear source abstraction exists.
- [ ] Provider-specific logic is isolated.
- [ ] Configuration is validated.
- [ ] Credentials remain server-side.
- [ ] Workspace authorization is enforced.
- [ ] Connection testing works.
- [ ] Errors are normalized.
- [ ] Schema discovery is normalized where supported.
- [ ] Physical types are preserved.
- [ ] Provenance is retained.
- [ ] Resource and query limits are defined.
- [ ] Timeout behavior is defined.
- [ ] Retry behavior is bounded.
- [ ] Connector data can enter the standard dataset lifecycle.
- [ ] Profiling remains connector-independent.
- [ ] Preparation remains connector-independent.
- [ ] Modeling remains connector-independent.
- [ ] Visualization remains connector-independent.
- [ ] AI remains optional.
- [ ] Unit/integration/contract/security tests pass.
- [ ] Documentation reflects actual provider capabilities.

---

## 37. Source Alignment

This document operationalizes the KaanViz requirement that CSV is the initial data source while future support should include Excel, Databricks, Snowflake, cloud warehouses, object storage, APIs, and databases, using source abstractions so connectors can be added without redesigning the analytics engine.

It also follows the defined separation between metadata storage, raw immutable data, processed Parquet, profiling, preparation, modeling, analytics, visualization, and AI.

Where the source document does not prescribe exact connector interfaces, authentication mechanisms, query-pushdown rules, or live-vs-snapshot behavior, those remain implementation decisions and must be finalized without breaking the source abstraction or core product principles.
