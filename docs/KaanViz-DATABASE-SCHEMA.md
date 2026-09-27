# KaanViz Database Schema

**Status:** Planning / Pre-Implementation  
**Purpose:** Define the Workspace-centered PostgreSQL metadata model for KaanViz before API implementation.

---

# 1. Database Principles

KaanViz uses PostgreSQL for **application and analytical metadata**, not as the primary storage location for large raw analytical datasets.

The architecture separates:

```text
PostgreSQL
    ↓
Metadata / Relationships / Configuration / State

Parquet / Object Storage
    ↓
Raw and processed analytical data
```

Core rules:

1. Workspace is the primary product boundary.
2. Workspace-scoped objects must belong to a Workspace.
3. Raw source data is immutable.
4. Dataset versions represent analytical states.
5. Transformations provide lineage.
6. Relationships belong to the Workspace/model context.
7. Dashboards and visualizations are Workspace-scoped.
8. AI sessions and messages are Workspace-scoped.
9. Foreign keys should prevent orphaned analytical objects.
10. Authorization must be enforced at the application layer and supported by the data model.

---

# 2. High-Level Entity Model

```text
users
  │
  ├──────────────┐
  │              │
  ▼              ▼
workspace_members
        │
        ▼
    workspaces
        │
        ├────────────── data_sources
        │
        ├────────────── datasets
        │                  │
        │                  ├── dataset_columns
        │                  │
        │                  └── dataset_versions
        │                           │
        │                           └── transformations
        │
        ├────────────── relationships
        │
        ├────────────── analysis_sessions
        │                  │
        │                  └── analysis_results
        │
        ├────────────── visualizations
        │
        ├────────────── dashboards
        │                  │
        │                  └── dashboard_visuals
        │
        └────────────── chat_sessions
                           │
                           └── chat_messages
```

---

# 3. Entity Inventory

The proposed MVP metadata model contains:

```text
users
workspaces
workspace_members

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
dashboard_visuals

chat_sessions
chat_messages
```

This expands the original project metadata list by making Workspace and data-source concepts explicit.

---

# 4. users

Represents a KaanViz user.

Conceptual fields:

```text
users
├── id
├── email
├── display_name
├── avatar_url
├── created_at
└── updated_at
```

### Responsibilities

The user record identifies a person interacting with KaanViz.

It should not contain Workspace-specific permissions directly.

Workspace membership belongs in `workspace_members`.

---

# 5. workspaces

Represents the primary KaanViz analytical environment.

Conceptual fields:

```text
workspaces
├── id
├── name
├── description
├── owner_user_id
├── status
├── created_at
└── updated_at
```

### Owner

`owner_user_id` references `users.id`.

The owner is the primary accountable user for the Workspace.

### Status

The model should support lifecycle states such as:

```text
active
archived
```

Exact lifecycle values can be finalized during implementation.

---

# 6. workspace_members

Represents a user's membership in a Workspace.

Conceptual fields:

```text
workspace_members
├── id
├── workspace_id
├── user_id
├── role
├── status
├── joined_at
└── updated_at
```

### Role

Initial roles:

```text
owner
contributor
viewer
```

The exact permission matrix belongs in the Security document.

### Important constraint

A user should have at most one active membership record for a given Workspace.

Conceptually:

```text
UNIQUE(workspace_id, user_id)
```

---

# 7. Workspace Ownership Relationship

The ownership model is:

```text
users
  │
  └── owns ──> workspaces
```

and:

```text
users
  │
  └── member of ──> workspace_members ──> workspaces
```

This separates:

- Ownership
- Membership
- Role

and leaves room for future role expansion.

---

# 8. data_sources

Represents where data originates.

Examples:

```text
orders.csv
PostgreSQL connection
Snowflake connection
API
S3
```

Conceptual fields:

```text
data_sources
├── id
├── workspace_id
├── name
├── source_type
├── configuration
├── status
├── created_by
├── created_at
└── updated_at
```

### source_type

Initial value:

```text
csv
```

Future values may include:

```text
excel
postgresql
mysql
snowflake
databricks
s3
api
```

The exact connector list is intentionally extensible.

---

# 9. Data Source Credentials

Credentials must not be stored as ordinary plaintext configuration.

The database model should distinguish:

```text
Non-secret configuration
```

from:

```text
Secrets / credentials
```

Secret storage strategy should be finalized in the Security document.

The database should not become a casual secret store.

---

# 10. datasets

Represents an analytical dataset inside a Workspace.

Conceptual fields:

```text
datasets
├── id
├── workspace_id
├── data_source_id
├── name
├── description
├── status
├── current_version_id
├── created_by
├── created_at
└── updated_at
```

### Workspace relationship

Every dataset belongs to exactly one Workspace.

```text
workspaces 1 ──── N datasets
```

### Data source relationship

A dataset may originate from a data source:

```text
data_sources 1 ──── N datasets
```

---

# 11. Dataset Status

Possible conceptual states:

```text
uploading
processing
ready
error
archived
```

The exact state machine should be finalized during API and implementation planning.

---

# 12. dataset_columns

Represents the column metadata associated with a dataset.

Conceptual fields:

```text
dataset_columns
├── id
├── dataset_id
├── name
├── display_name
├── ordinal_position
├── physical_type
├── semantic_type
├── nullable
├── description
├── inference_metadata
├── created_at
└── updated_at
```

The distinction between:

```text
physical_type
```

and:

```text
semantic_type
```

is important.

Example:

```text
physical_type = VARCHAR
semantic_type = Date
```

---

# 13. Type Overrides

If the user overrides an inferred semantic type, the database should preserve enough information to distinguish:

```text
inferred value
```

from:

```text
user-selected value
```

Conceptually:

```text
physical_type
inferred_semantic_type
semantic_type
type_source
```

where `type_source` may represent:

```text
inferred
user
system
```

The exact representation should be finalized during implementation.

---

# 14. dataset_versions

Dataset versions represent different analytical states of a dataset.

Conceptual fields:

```text
dataset_versions
├── id
├── dataset_id
├── version_number
├── parent_version_id
├── storage_location
├── row_count
├── column_count
├── schema_metadata
├── validation_status
├── created_by
├── created_at
└── metadata
```

Conceptually:

```text
Dataset
  │
  ├── Version 1 — Raw
  │
  ├── Version 2 — Prepared
  │
  └── Version 3 — Validated
```

---

# 15. Raw Data Immutability

Raw data must remain immutable.

The model should make it possible to identify the original source version.

Conceptually:

```text
Dataset
  ↓
Raw Version
  ↓
Transformation
  ↓
Prepared Version
  ↓
Validation
  ↓
Validated Version
```

Preparation should create a new analytical version rather than overwrite the original raw data.

---

# 16. Version Lineage

Dataset versions should support parent-child lineage:

```text
version 1
   ↓
version 2
   ↓
version 3
```

A `parent_version_id` can represent the immediate source version.

This allows KaanViz to reconstruct how an analytical version was produced.

---

# 17. transformations

Represents a deterministic data-preparation operation.

Conceptual fields:

```text
transformations
├── id
├── workspace_id
├── dataset_id
├── source_version_id
├── target_version_id
├── operation_type
├── operation_spec
├── execution_status
├── created_by
├── created_at
└── execution_metadata
```

Examples:

```text
rename_column
remove_column
convert_type
fill_missing
remove_duplicates
filter_rows
trim_text
split_column
combine_columns
```

---

# 18. Transformation Specification

The actual transformation should be stored as structured metadata rather than arbitrary executable code.

Example conceptual object:

```text
{
  operation: "convert_type",
  column: "order_date",
  target_type: "date"
}
```

The deterministic transformation engine executes this specification.

---

# 19. Transformation Lineage

The relationship is:

```text
source_version
      ↓
transformation
      ↓
target_version
```

This provides an audit-friendly analytical history.

---

# 20. relationships

Represents analytical relationships between datasets/tables.

Conceptual fields:

```text
relationships
├── id
├── workspace_id
├── source_dataset_id
├── source_column_id
├── target_dataset_id
├── target_column_id
├── relationship_type
├── status
├── evidence
├── created_by
├── approved_by
├── created_at
└── updated_at
```

---

# 21. Relationship Status

Potential states:

```text
suggested
approved
rejected
inactive
```

A suggested relationship must not silently become an approved relationship.

---

# 22. Relationship Evidence

When KaanViz infers a relationship, metadata can record evidence such as:

```text
Matching column names
Compatible types
Key uniqueness
Value overlap
Cardinality evidence
```

This allows the UI to explain why a relationship was suggested.

The exact inference model belongs in the Modeling/Analytics design.

---

# 23. analysis_sessions

Represents an analytical session or context.

Conceptual fields:

```text
analysis_sessions
├── id
├── workspace_id
├── dataset_id
├── dataset_version_id
├── created_by
├── session_type
├── context
├── created_at
└── updated_at
```

Potential session types:

```text
manual
visualization
dashboard
ai
```

Exact usage should be finalized during analytics/API design.

---

# 24. analysis_results

Represents the output of a deterministic analytical operation.

Conceptual fields:

```text
analysis_results
├── id
├── workspace_id
├── analysis_session_id
├── dataset_version_id
├── query_spec
├── result_metadata
├── storage_location
├── row_count
├── execution_status
├── created_at
└── expires_at
```

The exact result-storage strategy can vary depending on result size and caching requirements.

---

# 25. Why Analysis Results Are Separate

A visualization should not necessarily execute directly against the entire dataset.

Instead:

```text
Dataset
   ↓
Analysis
   ↓
Analysis Result
   ↓
Visualization
```

This supports:

- Reuse
- Performance
- Validation
- Explainability
- AI interpretation

---

# 26. visualizations

Represents a saved visualization specification.

Conceptual fields:

```text
visualizations
├── id
├── workspace_id
├── dataset_id
├── dataset_version_id
├── analysis_result_id
├── name
├── visualization_type
├── specification
├── created_by
├── created_at
└── updated_at
```

The `specification` contains structured visualization configuration.

It must not contain arbitrary executable frontend code.

---

# 27. Visualization Specification

Conceptually:

```text
{
  chart_type: "bar",
  dimensions: ["category"],
  measures: ["revenue"],
  aggregation: {
    revenue: "sum"
  },
  filters: [],
  configuration: {}
}
```

The final schema belongs in the Visualization Specification document.

---

# 28. dashboards

Represents a saved Workspace dashboard.

Conceptual fields:

```text
dashboards
├── id
├── workspace_id
├── name
├── description
├── layout
├── theme
├── created_by
├── created_at
└── updated_at
```

A dashboard belongs to one Workspace.

---

# 29. dashboard_visuals

Represents the relationship between a dashboard and its visual components.

Conceptual fields:

```text
dashboard_visuals
├── id
├── dashboard_id
├── visualization_id
├── component_type
├── position
├── size
├── configuration
├── display_order
├── created_at
└── updated_at
```

A dashboard can contain:

```text
KPI
Chart
Table
Text
Filter
```

The exact component schema should be finalized in the Dashboard/Visualization specification.

---

# 30. Dashboard Layout

The dashboard layout should be stored as structured metadata.

Conceptually:

```text
dashboard_visual
    x
    y
    width
    height
```

This aligns with the planned grid-layout approach.

---

# 31. chat_sessions

Represents an AI Analyst conversation within a Workspace.

Conceptual fields:

```text
chat_sessions
├── id
├── workspace_id
├── created_by
├── title
├── context
├── created_at
└── updated_at
```

A chat session should be associated with its Workspace.

---

# 32. chat_messages

Represents individual messages in an AI Analyst session.

Conceptual fields:

```text
chat_messages
├── id
├── chat_session_id
├── role
├── content
├── structured_intent
├── analysis_result_id
├── metadata
├── created_at
└── status
```

Roles may include:

```text
user
assistant
system
```

The exact storage rules for system messages and sensitive context should be finalized in the Security/AI documents.

---

# 33. AI Structured Intent

Where AI generates structured intent, the database may preserve it for traceability.

Example:

```text
{
  intent: "top_category_by_revenue",
  dimensions: ["category"],
  measures: ["revenue"],
  aggregation: "sum"
}
```

The stored intent is not itself considered a trusted analytical result.

It must pass validation and deterministic computation.

---

# 34. Workspace Foreign-Key Rule

The major architectural rule is:

> Every workspace-scoped entity must be traceable to exactly one Workspace.

For direct Workspace-owned entities:

```text
datasets.workspace_id
data_sources.workspace_id
relationships.workspace_id
analysis_sessions.workspace_id
visualizations.workspace_id
dashboards.workspace_id
chat_sessions.workspace_id
```

For child entities:

```text
dataset_columns → datasets → workspace
dataset_versions → datasets → workspace
transformations → datasets/workspace
analysis_results → analysis_sessions/workspace
dashboard_visuals → dashboards → workspace
chat_messages → chat_sessions → workspace
```

---

# 35. Cross-Workspace Isolation

The database/application must prevent situations such as:

```text
Workspace A
    ↓
Dashboard A
    ↓
Visualization from Workspace B
```

unless an explicit future cross-workspace sharing feature is introduced.

For MVP:

```text
Cross-workspace analytical references = Not allowed
```

---

# 36. Referential Integrity

Foreign keys should be used for core relationships.

Examples:

```text
workspace_members.workspace_id
    → workspaces.id

datasets.workspace_id
    → workspaces.id

dataset_columns.dataset_id
    → datasets.id

dataset_versions.dataset_id
    → datasets.id

transformations.dataset_id
    → datasets.id

relationships.workspace_id
    → workspaces.id

dashboards.workspace_id
    → workspaces.id

dashboard_visuals.dashboard_id
    → dashboards.id

chat_sessions.workspace_id
    → workspaces.id

chat_messages.chat_session_id
    → chat_sessions.id
```

Exact cascade behavior must be deliberately defined rather than relying on defaults.

---

# 37. Delete Strategy

Not every entity should be physically deleted immediately.

Potential approaches:

```text
Workspace → archive first
Dataset → archive/delete according to lifecycle
Dataset Version → preserve for lineage
Transformation → preserve where needed for lineage
Dashboard → soft-delete or explicit delete
Chat Session → lifecycle policy
```

The exact retention policy belongs in the Security/Data Architecture documents.

---

# 38. Timestamps

Core tables should use timestamps such as:

```text
created_at
updated_at
```

Where lifecycle events matter, additional timestamps may be appropriate:

```text
archived_at
deleted_at
completed_at
approved_at
```

All timestamps should use a consistent timezone strategy.

---

# 39. IDs

The implementation should use stable non-sequential identifiers suitable for distributed application behavior.

The exact ID strategy—UUID, UUIDv7, or another supported approach—should be finalized before migration creation.

Do not use user-visible numeric ordering as an identity mechanism.

---

# 40. Indexing Strategy

Indexes should prioritize common access patterns.

Likely important indexes:

```text
workspace_members(workspace_id, user_id)

datasets(workspace_id)

data_sources(workspace_id)

dataset_versions(dataset_id)

dataset_columns(dataset_id)

transformations(dataset_id)

relationships(workspace_id)

analysis_sessions(workspace_id)

visualizations(workspace_id)

dashboards(workspace_id)

dashboard_visuals(dashboard_id)

chat_sessions(workspace_id)

chat_messages(chat_session_id)
```

Additional indexes should be based on actual query patterns rather than created indiscriminately.

---

# 41. Current Dataset Version

The `datasets.current_version_id` concept can provide a convenient pointer to the active analytical version.

Conceptually:

```text
datasets
    │
    └── current_version_id
             ↓
      dataset_versions
```

This avoids repeatedly searching for the latest version while preserving the full version history.

The implementation must ensure the referenced version belongs to the same dataset.

---

# 42. Dataset and Version Responsibilities

### Dataset

Describes the persistent analytical object.

Examples:

```text
Orders
Customers
Products
```

### Dataset Version

Describes a particular state of that dataset.

Examples:

```text
Orders v1 — raw
Orders v2 — cleaned
Orders v3 — validated
```

This distinction is essential for lineage and reproducibility.

---

# 43. Storage Location Metadata

`dataset_versions.storage_location` should reference where the analytical representation exists.

Examples:

```text
local path
object-storage key
R2 object
S3 object
Azure Blob object
```

The application should use a storage abstraction rather than making domain logic dependent on the physical provider.

---

# 44. Metadata vs Raw Content

The database should not store large CSV/Parquet contents directly in ordinary metadata rows.

Instead:

```text
PostgreSQL
    → metadata

Object / local storage
    → raw files
    → processed Parquet
    → large analytical results where appropriate
```

Small metadata objects may be stored as JSON/JSONB where justified.

---

# 45. JSON / JSONB Usage

Structured fields may use JSON/JSONB for flexible specifications such as:

```text
schema_metadata
inference_metadata
operation_spec
execution_metadata
evidence
query_spec
result_metadata
visualization specification
dashboard configuration
AI structured intent
chat context
```

JSON should not be used to hide core relational entities that need referential integrity and frequent querying.

---

# 46. Example Workspace Data Tree

A single Workspace might look like:

```text
Workspace: E-Commerce Analytics
│
├── Data Sources
│   └── orders.csv
│
├── Dataset
│   └── Orders
│       ├── Columns
│       ├── v1 Raw
│       ├── v2 Cleaned
│       └── v3 Validated
│
├── Transformations
│   ├── Convert order_date
│   └── Remove duplicates
│
├── Relationships
│   └── Orders → Customers
│
├── Analysis
│   ├── Revenue by Month
│   └── Revenue by Category
│
├── Visualizations
│   ├── Revenue Trend
│   └── Category Revenue
│
├── Dashboards
│   └── Executive Dashboard
│
└── AI Sessions
    └── Sales Analysis
```

---

# 47. Complete Relationship Map

```text
USER
 │
 ├───────────────┐
 │               │
 ▼               ▼
WORKSPACE     WORKSPACE_MEMBER
 │
 ├── DATA_SOURCE
 │
 ├── DATASET
 │    │
 │    ├── DATASET_COLUMN
 │    │
 │    └── DATASET_VERSION
 │            │
 │            └── TRANSFORMATION
 │
 ├── RELATIONSHIP
 │
 ├── ANALYSIS_SESSION
 │       │
 │       └── ANALYSIS_RESULT
 │
 ├── VISUALIZATION
 │
 ├── DASHBOARD
 │       │
 │       └── DASHBOARD_VISUAL
 │
 └── CHAT_SESSION
         │
         └── CHAT_MESSAGE
```

---

# 48. Important Integrity Rules

The implementation should enforce rules such as:

### Rule 1

A dataset must belong to a Workspace.

### Rule 2

A dataset column must belong to its dataset.

### Rule 3

A dataset version must belong to its dataset.

### Rule 4

A transformation must reference valid source/target versions.

### Rule 5

A relationship cannot connect datasets from different Workspaces.

### Rule 6

A visualization cannot reference a dataset from another Workspace.

### Rule 7

A dashboard cannot contain a visualization from another Workspace.

### Rule 8

A dashboard visual must belong to the dashboard it references.

### Rule 9

A chat message must belong to a chat session.

### Rule 10

A chat session belongs to exactly one Workspace.

---

# 49. Authorization and Database Design

Database structure alone is not sufficient for authorization.

The application must still perform:

```text
User
 ↓
Membership
 ↓
Role
 ↓
Permission
 ↓
Requested object
```

before performing a workspace-scoped operation.

The database provides structural integrity; the authorization layer provides access control.

---

# 50. MVP vs Future

## MVP

Implement the core model:

```text
users
workspaces
workspace_members
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
dashboard_visuals
chat_sessions
chat_messages
```

## Future

Potential additions:

```text
organizations
teams
invitations
permission_policies
audit_events
data_source_credentials
scheduled_refreshes
exports
saved_queries
comments
activity_feed
```

These should not be added simply because they may be useful later.

---

# 51. Suggested Migration Order

Database migrations should follow dependency order.

```text
1. users
2. workspaces
3. workspace_members
4. data_sources
5. datasets
6. dataset_columns
7. dataset_versions
8. transformations
9. relationships
10. analysis_sessions
11. analysis_results
12. visualizations
13. dashboards
14. dashboard_visuals
15. chat_sessions
16. chat_messages
```

This ordering follows the conceptual dependency graph.

---

# 52. Example End-to-End Record Chain

When a user uploads `orders.csv`:

```text
User
 ↓
Workspace
 ↓
Data Source
 ↓
Dataset
 ↓
Dataset Columns
 ↓
Raw Dataset Version
 ↓
Profile
 ↓
Transformation
 ↓
Prepared Dataset Version
 ↓
Validation
 ↓
Validated Dataset Version
 ↓
Analysis Session
 ↓
Analysis Result
 ↓
Visualization
 ↓
Dashboard
 ↓
AI Session
```

This chain should remain traceable.

---

# 53. Database Definition of Done

Before implementation:

- Workspace ownership is defined.
- Workspace membership is defined.
- Dataset ownership is defined.
- Data sources are separated from datasets.
- Dataset versions are defined.
- Raw-data immutability is represented.
- Transformation lineage is represented.
- Relationships are Workspace-scoped.
- Analysis results are represented.
- Visualizations are Workspace-scoped.
- Dashboards are Workspace-scoped.
- Dashboard components are represented.
- AI sessions are Workspace-scoped.
- Cross-workspace references are prohibited.
- Referential integrity rules are defined.
- Indexing strategy is defined.
- Delete/archive strategy is defined.
- ID strategy is selected.
- Timestamp strategy is selected.

---

# 54. Final Database Principle

> **Workspace is the root context for KaanViz analytical work. PostgreSQL describes and governs that analytical world; raw and processed analytical data remain in dedicated storage; dataset versions and transformations preserve reproducibility; deterministic results feed visualizations, dashboards, and optional AI.**

The schema should remain understandable and extensible without prematurely implementing enterprise complexity.
