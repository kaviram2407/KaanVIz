# KaanViz System Architecture

**Status:** Planning / Pre-Implementation  
**Purpose:** Define the technical architecture of KaanViz after the Workspace-first UX and user flows have been established.

---

# 1. Architecture Goals

KaanViz must provide a reliable analytics workspace where users can move from raw data to validated analysis, visualizations, dashboards, and optional AI assistance.

The architecture must preserve these principles:

1. **AI is optional, not foundational.**
2. **Raw data is immutable.**
3. **Deterministic computation happens before AI interpretation.**
4. **Uploaded data is untrusted content.**
5. **LLMs produce structured intent/specifications rather than arbitrary application code.**
6. **Workspace is the primary product boundary.**
7. **Large analytical data should not depend on browser memory.**
8. **Frontend, API, metadata, analytical computation, storage, and AI providers remain separated.**
9. **Each major phase can be tested independently.**
10. **The architecture must support future multi-user workspaces and additional data sources.**

These principles align with the existing KaanViz project definition and its requirement that core functionality continue operating when AI is unavailable. 

---

# 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │       Browser       │
                         │   Next.js / React   │
                         └──────────┬──────────┘
                                    │
                              HTTPS / API
                                    │
                         ┌──────────▼──────────┐
                         │     FastAPI API     │
                         │   Application Layer │
                         └─────┬────┬────┬─────┘
                               │    │    │
              ┌────────────────┘    │    └─────────────────┐
              │                     │                      │
       ┌──────▼──────┐      ┌──────▼──────┐       ┌──────▼──────┐
       │ PostgreSQL  │      │ Data Engine │       │ AI Provider │
       │  Metadata   │      │ DuckDB /    │       │ Abstraction │
       │             │      │ Polars      │       │             │
       └─────────────┘      └──────┬──────┘       └─────────────┘
                                   │
                            ┌──────▼──────┐
                            │   Parquet   │
                            │  Analytical │
                            │   Storage   │
                            └──────┬──────┘
                                   │
                            ┌──────▼──────┐
                            │ Raw Storage  │
                            │ Immutable    │
                            └─────────────┘
```

The browser is responsible primarily for interaction and presentation.

The backend is responsible for authorization, orchestration, validation, analytical execution, metadata management, and controlled integration with AI providers.

---

# 3. Workspace as the Architectural Boundary

Workspace is the first-class product context.

Conceptually:

```text
User
 │
 ├── Workspace A
 │    ├── Data Sources
 │    ├── Datasets
 │    ├── Dataset Versions
 │    ├── Transformations
 │    ├── Relationships
 │    ├── Analysis Results
 │    ├── Visualizations
 │    ├── Dashboards
 │    └── AI Sessions
 │
 └── Workspace B
      ├── Data Sources
      ├── Datasets
      ├── Models
      ├── Visualizations
      └── Dashboards
```

Every workspace-scoped operation must have a Workspace context.

The backend must enforce this boundary rather than relying only on frontend routing.

---

# 4. Frontend Architecture

## Technology Direction

The existing project specifies:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Grid Layout
- Apache ECharts

The frontend should be organized around product domains rather than a collection of unrelated screens.

Suggested structure:

```text
frontend/
├── app/
│   ├── workspaces/
│   └── ...
│
├── components/
│   ├── ui/
│   ├── workspace/
│   ├── data/
│   ├── prepare/
│   ├── model/
│   ├── visualize/
│   ├── dashboards/
│   └── ai/
│
├── features/
│   ├── workspace/
│   ├── datasets/
│   ├── preparation/
│   ├── modeling/
│   ├── visualization/
│   ├── dashboards/
│   └── ai/
│
├── lib/
├── hooks/
├── stores/
└── types/
```

Exact folder names can be finalized during implementation.

---

# 5. Frontend State Architecture

State should remain separated into three categories.

## Server State

Examples:

```text
Workspaces
Members
Datasets
Dataset Profiles
Dataset Versions
Relationships
Analysis Results
Visualizations
Dashboards
AI Sessions
```

This state comes from the backend and should not be treated as permanent local UI state.

## UI State

Examples:

```text
Open panel
Selected visual
Dialog state
Theme
Sidebar state
Chart configuration panel
```

## Workspace State

Examples:

```text
activeWorkspaceId
activeDatasetId
activeDatasetVersionId
activeModelId
activeDashboardId
activeFilters
```

Zustand may be used where complex client-side workspace state is required.

---

# 6. Backend Architecture

FastAPI is the application/API layer.

Suggested logical layers:

```text
API Routes
    ↓
Request / Response Validation
    ↓
Authorization
    ↓
Application Services
    ↓
Domain Services
    ↓
Data / Metadata Repositories
    ↓
Infrastructure
```

The goal is to avoid placing business logic directly inside HTTP route handlers.

---

# 7. Backend Domain Areas

Suggested domain boundaries:

```text
Workspace
Data Ingestion
Dataset
Profiling
Preparation
Validation
Modeling
Analytics
Visualization
Dashboard
AI
Storage
```

Each domain should have a clear responsibility.

For example:

```text
Workspace Service
- create workspace
- retrieve workspace
- manage members
- enforce workspace access

Dataset Service
- create dataset
- retrieve dataset
- manage versions

Preparation Service
- validate transformations
- execute transformations
- create lineage records
```

---

# 8. Workspace Request Context

Every workspace-scoped API request should conceptually resolve:

```text
Authenticated User
        ↓
Requested Workspace
        ↓
Membership / Permission
        ↓
Workspace Context
        ↓
Domain Operation
```

Example:

```text
POST /api/workspaces/{workspaceId}/datasets/upload

        ↓

Authenticate user

        ↓

Check workspace membership

        ↓

Check upload permission

        ↓

Create dataset in that workspace

        ↓

Start ingestion
```

This prevents accidental cross-workspace access.

---

# 9. Data Ingestion Architecture

Initial source:

```text
CSV Upload
```

Future sources:

```text
Excel
Databases
Cloud Storage
APIs
Snowflake
Databricks
```

The source abstraction should allow these to be introduced without redesigning the rest of the analytical pipeline.

Conceptually:

```text
Data Source Adapter
        ↓
Ingestion
        ↓
Raw Storage
        ↓
Dataset Metadata
        ↓
Profiling
```

---

# 10. Raw Data Layer

Raw data is immutable.

```text
Source
  ↓
Raw Storage
```

No preparation operation should overwrite the raw source.

The raw layer is the original source of truth for the imported dataset.

---

# 11. Processed Analytical Layer

After preparation and validation:

```text
Raw Dataset
    ↓
Transformations
    ↓
Validation
    ↓
Processed Dataset Version
    ↓
Parquet
```

Parquet is the analytical storage format specified by the project direction.

This layer is designed for efficient analytical querying.

---

# 12. Metadata vs Analytical Data

PostgreSQL stores application metadata.

It should not be used as the primary store for large analytical rows.

Conceptually:

```text
PostgreSQL
    ├── Workspace metadata
    ├── Dataset metadata
    ├── Columns
    ├── Versions
    ├── Transformations
    ├── Relationships
    ├── Visualizations
    ├── Dashboards
    └── AI session metadata

Parquet
    └── Analytical dataset rows
```

This separation is important for scalability.

---

# 13. Data Profiling Architecture

Profiling should be deterministic.

```text
Dataset
    ↓
Profiler
    ↓
Dataset-level statistics
    +
Column-level statistics
    +
Type inference
    +
Date intelligence
```

The profile should be stored as metadata/results that can be reused by the frontend and later analytical workflows.

AI can explain or recommend based on profile information, but it should not be the source of truth for the profile.

---

# 14. Type System Architecture

KaanViz should distinguish:

```text
Physical Type
```

from:

```text
Semantic Type
```

Example:

```text
Physical:
VARCHAR

Semantic:
Date
```

User overrides must be represented explicitly.

Conceptually:

```text
Raw Physical Type
        ↓
Type Inference
        ↓
Semantic Type
        ↓
User Override
        ↓
Validated Type
```

---

# 15. Preparation Architecture

Preparation is deterministic.

```text
User / AI Recommendation
        ↓
Transformation Specification
        ↓
Validation
        ↓
Transformation Engine
        ↓
New Dataset Version
        ↓
Lineage Record
```

AI may recommend:

```text
"Remove duplicate order IDs."
```

But the deterministic preparation engine performs the operation.

---

# 16. Transformation Lineage

Each transformation should be traceable.

Conceptually:

```text
Dataset Version 1
      ↓
Transformation 1
      ↓
Dataset Version 2
      ↓
Transformation 2
      ↓
Dataset Version 3
```

A transformation record should capture enough information to understand what changed and in what sequence.

Exact schema belongs in the database document.

---

# 17. Validation Architecture

Validation is a gate between preparation and analytical use.

```text
Prepared Dataset
       ↓
Validation
       ↓
┌──────┴──────┐
│             │
Valid         Invalid
│             │
↓             ↓
Save          Report issues
Version
```

Validation should check schema, types, transformation results, and relevant integrity rules.

---

# 18. Analytics Engine

The project specifies:

- DuckDB
- Polars
- Pandas
- Parquet

The analytics architecture should favor DuckDB/Polars for analytical workloads and use Pandas where appropriate.

Conceptually:

```text
Analysis Request
      ↓
Query / Analysis Planner
      ↓
DuckDB / Polars
      ↓
Aggregated Result
      ↓
Analysis Result
      ↓
Visualization / Dashboard / AI
```

The browser should not receive unnecessarily large raw datasets.

---

# 19. Analytics Result Boundary

Large data should be reduced before reaching the browser.

Example:

```text
10,000,000 source rows
        ↓
Group by month + category
        ↓
120 result rows
        ↓
Browser
```

The visualization layer should operate on the appropriate analytical result rather than indiscriminately downloading source data.

---

# 20. Modeling Architecture

Modeling represents analytical relationships between datasets/tables.

```text
Dataset A
    │
    ├── key
    │
    └──────── Relationship ──────── Dataset B
                                      │
                                      └── key
```

Relationship inference may be assisted by deterministic evidence or AI, but relationship creation should follow the approval rules defined in the product specification.

---

# 21. Visualization Architecture

The visualization pipeline is:

```text
Dataset
    ↓
Analysis
    ↓
Visualization Specification
    ↓
Validation
    ↓
Renderer
```

ECharts is the primary visualization renderer.

Plotly and Matplotlib can support advanced/Python-assisted visualization where required.

---

# 22. Visualization Specification

A visualization should be represented as structured data rather than arbitrary frontend code.

Conceptually:

```text
{
  dataset,
  analysis,
  chart_type,
  dimensions,
  measures,
  aggregation,
  filters,
  configuration
}
```

The exact schema belongs in the Visualization Specification document.

---

# 23. AI-to-Visualization Architecture

AI should produce a structured visualization specification.

```text
Natural Language
      ↓
AI Intent
      ↓
Structured Visualization Spec
      ↓
Schema Validation
      ↓
Field Validation
      ↓
Analysis
      ↓
Render
```

The LLM must not directly generate arbitrary HTML/JavaScript for the application.

---

# 24. Dashboard Architecture

Dashboards are workspace-scoped collections of analytical visuals and other components.

```text
Workspace
   ↓
Dashboard
   ├── KPI
   ├── Chart
   ├── Table
   ├── Text
   └── Filter
```

React Grid Layout is the planned grid/layout technology.

Dashboard configuration should be stored as metadata while analytical results remain generated by the analytics layer.

---

# 25. Filter Architecture

Filters should be represented as structured analytical context.

```text
Dashboard Filter
       ↓
Filter Context
       ↓
Affected Analysis Queries
       ↓
Updated Results
       ↓
Updated Visualizations
```

Cross-filtering follows the same principle:

```text
User selection
      ↓
Filter context
      ↓
Related analyses
      ↓
Updated visuals
```

---

# 26. AI Analyst Architecture

AI Analyst is separate from the deterministic analytics engine.

Flow:

```text
User Question
      ↓
AI Intent
      ↓
Required Analysis
      ↓
Validated Computation
      ↓
Result
      ↓
AI Explanation
```

The AI layer should not independently invent analytical results.

The deterministic result is the source of truth.

---

# 27. AI Provider Abstraction

The architecture should support multiple providers through an abstraction layer.

Initial/future providers may include:

```text
NVIDIA
OpenAI
Azure OpenAI
Future providers
```

Conceptually:

```text
AI Service
    ↓
Provider Interface
    ├── NVIDIA Adapter
    ├── OpenAI Adapter
    └── Azure OpenAI Adapter
```

Provider credentials must remain server-side.

---

# 28. AI Availability States

The application should explicitly represent:

```text
AI Online
AI Degraded
AI Unavailable
```

AI failure must not cause:

```text
Data upload failure
Preparation failure
Model failure
Visualization failure
Dashboard failure
```

Core KaanViz remains operational.

---

# 29. AI Security Boundary

Dataset content must be treated as untrusted input.

The AI context should conceptually separate:

```text
System Instructions
        ↓
User Request
        ↓
Dataset Content
```

Dataset cells must never automatically become trusted instructions.

This is particularly important because arbitrary uploaded data may contain text designed to manipulate an AI system.

---

# 30. Storage Architecture

The project specifies a storage abstraction.

Conceptually:

```text
StorageProvider
├── LocalStorageProvider
├── R2StorageProvider
├── S3StorageProvider
└── AzureBlobStorageProvider
```

The application should depend on the abstraction rather than hardcoding one storage vendor into the domain layer.

---

# 31. Local Development Architecture

The planned free-first local stack is:

```text
Docker Compose
│
├── Next.js
├── FastAPI
├── PostgreSQL
├── Redis
├── DuckDB / Polars
└── Local / mounted storage
```

AI should remain optional during local development.

The application must be usable for core workflows without requiring a local AI model.

---

# 32. Redis Responsibility

Redis can support infrastructure concerns such as:

- Background jobs
- Temporary processing state
- Caching where appropriate
- Rate limiting where appropriate

Redis should not become the source of truth for Workspace or dataset metadata.

PostgreSQL remains the metadata authority.

---

# 33. Background Processing

Some operations may be too expensive for synchronous HTTP requests.

Potential background jobs:

```text
Large file ingestion
Dataset profiling
Large transformations
Large analytical processing
Export generation
Long-running AI requests
```

Conceptually:

```text
Frontend
   ↓
API
   ↓
Job
   ↓
Worker
   ↓
Storage / Metadata
   ↓
Status
   ↓
Frontend
```

The exact job system can be finalized during implementation planning.

---

# 34. Export Architecture

Exports should operate from validated analytical results.

```text
Analysis / Dashboard
       ↓
Export Request
       ↓
Export Processor
       ↓
File
       ↓
User
```

The export layer should not bypass Workspace authorization.

---

# 35. Security Architecture

Security boundaries exist at several levels:

```text
Browser
   ↓
Authentication
   ↓
Workspace Authorization
   ↓
API Validation
   ↓
Data Validation
   ↓
Storage Controls
   ↓
Analytical Execution
   ↓
AI Security Boundary
```

The project also requires consideration of:

- File validation
- CSV formula injection defense
- Secrets management
- CORS
- Security headers
- Rate limiting
- I/O validation
- Auditability
- Authorization

Detailed security design belongs in the dedicated Security document.

---

# 36. Request Flow Example — Upload CSV

```text
User
 ↓
Next.js
 ↓
POST workspace dataset upload
 ↓
FastAPI
 ↓
Authenticate
 ↓
Authorize Workspace
 ↓
Validate file
 ↓
Store immutable raw file
 ↓
Create dataset metadata
 ↓
Start ingestion/profile
 ↓
Create analytical representation
 ↓
Return dataset status
 ↓
Frontend displays Dataset
```

---

# 37. Request Flow Example — Create Visualization

```text
User
 ↓
Visualization Studio
 ↓
Visualization Request
 ↓
FastAPI
 ↓
Authorize Workspace
 ↓
Validate dataset access
 ↓
Run analysis
 ↓
Produce result
 ↓
Create/validate visualization specification
 ↓
Return analytical result + specification
 ↓
ECharts renderer
 ↓
Chart
```

---

# 38. Request Flow Example — AI Question

```text
User
 ↓
AI Analyst
 ↓
FastAPI
 ↓
Authorize Workspace
 ↓
Build controlled AI context
 ↓
AI Provider
 ↓
Structured intent
 ↓
Validate intent
 ↓
Analytics Engine
 ↓
Computed result
 ↓
AI explanation
 ↓
Frontend
```

The AI provider must not be allowed to bypass the analytics validation layer.

---

# 39. Failure Isolation

A major architectural principle is:

```text
AI Failure
    ↓
AI feature unavailable
    ↓
Core application continues
```

Likewise:

```text
Visualization failure
    ↓
Affected visualization shows error
    ↓
Workspace remains operational
```

A failure in one analytical object should not unnecessarily bring down the entire Workspace.

---

# 40. Observability

The architecture should eventually include:

```text
Structured Logs
Metrics
Error Tracking
Performance Monitoring
Audit Events
```

Important events include:

```text
Workspace created
Dataset uploaded
Dataset processed
Transformation applied
Validation failed
Relationship created
Visualization created
Dashboard updated
AI request failed
```

Sensitive data should not be written into logs unnecessarily.

---

# 41. Performance Architecture

Important performance boundaries:

### Browser

- Avoid unnecessary raw data downloads.
- Virtualize large tables.
- Render aggregated results.
- Lazy-load expensive screens/components.

### API

- Validate input early.
- Avoid blocking long operations.
- Use background processing where appropriate.

### Analytics

- Push computation toward DuckDB/Polars.
- Aggregate before browser transfer.
- Reuse appropriate analytical results where safe.

### Storage

- Keep raw and processed data separated.
- Use Parquet for analytical workloads.

---

# 42. Accessibility Architecture

Accessibility is a product requirement, not a later polish step.

The UI architecture should support:

- Keyboard navigation
- Visible focus states
- Semantic controls
- Accessible dialogs
- Accessible tables
- Screen-reader labels
- Sufficient contrast
- Reduced-motion behavior
- Accessible chart explanations

Charts should not be the only way to communicate important analytical information.

---

# 43. Internationalization

The product should avoid hardcoding language-specific assumptions into core architecture.

AI explanations may eventually support multiple languages.

UI localization can be introduced through an appropriate translation architecture later.

The initial implementation should keep text centralized enough to make localization possible.

---

# 44. Architecture Boundaries

The following boundaries should remain explicit:

```text
Frontend
    ≠
Backend

Metadata
    ≠
Analytical Rows

Raw Data
    ≠
Processed Data

Deterministic Analytics
    ≠
AI Interpretation

Workspace Authorization
    ≠
UI Visibility Only

Visualization Specification
    ≠
Arbitrary Frontend Code
```

These boundaries protect the core KaanViz design.

---

# 45. Recommended Repository-Level Structure

Conceptually:

```text
KaanViz/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   ├── stores/
│   └── types/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── domains/
│   │   │   ├── workspace/
│   │   │   ├── datasets/
│   │   │   ├── preparation/
│   │   │   ├── modeling/
│   │   │   ├── analytics/
│   │   │   ├── visualization/
│   │   │   ├── dashboards/
│   │   │   └── ai/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── infrastructure/
│   └── tests/
│
├── storage/
│
├── docs/
│
└── docker-compose.yml
```

This is a conceptual structure, not an instruction to create these folders yet.

---

# 46. Architecture Decision Rules for Antigravity

Before implementation, Antigravity must follow:

1. Read the project specification and planning documents.
2. Implement only the requested phase.
3. Preserve Workspace-first architecture.
4. Do not move data operations outside Workspace context.
5. Do not introduce unnecessary dependencies.
6. Do not replace the agreed technology stack without justification.
7. Keep AI optional.
8. Keep raw data immutable.
9. Validate AI outputs.
10. Do not generate arbitrary frontend code from LLM output.
11. Keep metadata and analytical storage separated.
12. Enforce authorization server-side.
13. Test error paths, not only happy paths.
14. Report actual implementation status honestly.

---

# 47. Architecture Decisions Still Pending

The following should be finalized in later dedicated documents:

### Database

- Exact Workspace tables
- Membership schema
- Dataset relationships
- Foreign keys
- Indexes
- Versioning model

### API

- Exact routes
- Request schemas
- Response schemas
- Error format
- Authentication mechanism

### Data Architecture

- Storage paths
- Parquet organization
- Dataset version representation
- Profiling storage
- Transformation execution model

### Visualization

- Visualization specification schema
- Chart configuration schema
- Filter model
- Cross-filter model

### AI

- Provider interface
- Structured output schemas
- Context construction
- Validation
- Provider failover

### Security

- Authentication
- Authorization
- Secrets
- File scanning/validation
- Prompt injection controls

These should not be improvised during implementation.

---

# 48. Architecture Definition of Done

Architecture planning is complete when we can trace a complete operation through the system.

For example:

```text
User
 ↓
Workspace
 ↓
Frontend
 ↓
API
 ↓
Authorization
 ↓
Domain Service
 ↓
Metadata / Analytics / Storage
 ↓
Result
 ↓
Frontend
```

And for AI:

```text
User
 ↓
Workspace
 ↓
AI Analyst
 ↓
Controlled Context
 ↓
AI Provider
 ↓
Structured Intent
 ↓
Validation
 ↓
Analytics Engine
 ↓
Result
 ↓
AI Explanation
 ↓
User
```

No critical path should depend on undocumented assumptions.

---

# 49. Final Architecture Principle

> **KaanViz should be a Workspace-based analytical system with deterministic data and computation at its core, while AI remains a controlled optional intelligence layer around that core.**

The architecture should make it possible to operate KaanViz fully for core data workflows even when AI is unavailable.
