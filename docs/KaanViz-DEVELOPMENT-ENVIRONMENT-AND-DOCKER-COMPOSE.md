# KaanViz — Development Environment & Docker Compose Specification

## 1. Purpose

This document defines the local development environment for KaanViz.

The initial development environment should avoid mandatory paid infrastructure and provide a reproducible local stack.

The approved local stack is:

```text
Next.js
   +
FastAPI
   +
PostgreSQL
   +
Redis
   +
DuckDB
   +
Polars
   +
Parquet
   +
Docker Compose
```

AI remains optional and provider-agnostic.

---

## 2. Development Goals

The local environment should allow the team to develop and verify the core KaanViz product without requiring:

- Paid cloud infrastructure
- Mandatory external AI services
- Mandatory production object storage
- Mandatory enterprise data connectors

The local environment should still reflect the architectural boundaries that will exist in demo and production deployments.

---

## 3. Local Architecture

Recommended local topology:

```text
Browser
   ↓
Next.js Frontend
   ↓
FastAPI API
   ├── PostgreSQL
   ├── Redis
   ├── DuckDB / Polars
   ├── Local Parquet Storage
   ├── Background Workers
   └── Optional AI Provider
```

Docker Compose should provide the infrastructure services required for local development.

Application code may be developed either inside the Compose environment or through a local development workflow that connects to the Compose services.

---

## 4. Core Services

### Frontend

Technology:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Responsibilities:

- KaanViz UI
- Workspace navigation
- Dataset workflows
- Visualization Studio
- Dashboard builder
- AI Analyst UI
- Client-side workspace/UI state

---

### API

Technology:

- Python
- FastAPI
- Pydantic

Responsibilities:

- API contracts
- Authentication/authorization boundaries
- Workspace operations
- Dataset operations
- Preparation
- Modeling
- Analytics orchestration
- Visualization orchestration
- Dashboard operations
- AI orchestration

---

### PostgreSQL

PostgreSQL stores application metadata and persistent relational state.

Examples include:

- Users
- Workspaces
- Workspace members
- Data sources
- Datasets
- Dataset columns
- Dataset versions
- Transformations
- Relationships
- Analysis sessions
- Analysis results
- Visualizations
- Dashboards
- Dashboard visuals
- Chat sessions
- Chat messages

PostgreSQL should not be treated as the primary analytical engine for large dataset computation.

---

### Redis

Redis supports infrastructure concerns such as:

- Background job coordination
- Job state
- Caching where appropriate
- Short-lived coordination data

Redis should not become the authoritative store for durable application data.

---

### DuckDB

DuckDB is the primary local analytical query engine.

Use it for:

- Aggregation
- Analytical queries
- Querying Parquet
- Large-data analytical operations

Do not move unnecessary raw datasets into the browser simply because the browser can render them.

---

### Polars

Polars is used for efficient dataframe-oriented processing.

Use it where appropriate for:

- Data preparation
- Type operations
- Transformations
- Profiling-related processing
- Dataframe-oriented analytical operations

The exact division between DuckDB and Polars should follow the data-processing requirement rather than forcing every operation through one tool.

---

### Parquet

Parquet is the preferred processed-data storage format.

Use it for:

- Processed dataset versions
- Analytical data artifacts
- Efficient local analytical access

Raw uploaded data must remain immutable.

---

## 5. Local Storage

Local development should provide a filesystem-backed storage implementation.

Conceptually:

```text
LocalStorageProvider
      ↓
Local filesystem
      ↓
Raw / processed dataset artifacts
```

The storage abstraction should allow later replacement with:

- R2
- S3
- Azure Blob Storage
- Other compatible object storage

Application code should depend on the storage abstraction rather than assuming a specific production storage vendor.

---

## 6. Docker Compose Responsibilities

Docker Compose should provide reproducible infrastructure for local development.

At minimum, the local Compose environment should represent:

```text
postgres
redis
```

Application services may also be represented as Compose services depending on the chosen development workflow:

```text
frontend
backend
worker
```

The exact container topology should remain simple enough for rapid local iteration.

---

## 7. Conceptual Compose Topology

```text
docker-compose
│
├── postgres
│
├── redis
│
├── backend
│    ├── API
│    └── application services
│
├── worker
│    └── background jobs
│
└── frontend
     └── Next.js
```

DuckDB and Polars run as part of the backend/worker execution environment rather than requiring separate infrastructure services.

Parquet/local storage is represented through a mounted application storage location during local development.

---

## 8. Environment Configuration

Configuration should be supplied through environment variables.

Use a safe template:

```text
.env.example
```

Typical categories include:

```text
Application configuration
Database connection
Redis connection
Storage configuration
Authentication configuration
AI provider configuration
Logging configuration
```

Real credentials must never be committed to source control.

---

## 9. AI Configuration

AI must be optional.

The local environment should support:

```text
AI enabled
AI disabled
```

When disabled:

- Core data workflows remain functional.
- Deterministic analytics remain functional.
- Visualization workflows remain functional.
- Dashboard workflows remain functional.
- AI-specific actions display an appropriate unavailable state.

Do not require a local AI runtime for the application to start.

---

## 10. Optional AI Provider Configuration

When AI is enabled, the backend should use the provider abstraction.

Supported provider direction includes:

- NVIDIA
- OpenAI
- Azure OpenAI
- Future providers

Provider credentials remain server-side.

The frontend must not contain provider API keys.

---

## 11. Development Modes

### Mode A — Core local development

```text
Frontend
   ↓
FastAPI
   ↓
PostgreSQL
Redis
DuckDB
Polars
Local Parquet
```

AI disabled.

This should be sufficient for deterministic product development.

---

### Mode B — AI-enabled development

```text
Frontend
   ↓
FastAPI
   ├── Core services
   └── AI provider
```

AI is added without changing the core data architecture.

---

## 12. Service Health

Local development should make service failures understandable.

At minimum, the application should be able to identify whether required infrastructure is available:

- PostgreSQL
- Redis where required
- Local storage
- Backend API

AI provider availability should be tracked separately.

AI being unavailable should not be treated as equivalent to the entire application being unavailable.

---

## 13. Database Initialization

Database initialization should be migration-driven.

Use:

- SQLAlchemy
- Alembic

Do not rely on manually edited production schemas.

A new developer should be able to initialize the local database through the documented migration workflow.

---

## 14. Local Database Lifecycle

Development workflows should support:

```text
Start infrastructure
      ↓
Apply migrations
      ↓
Start application
      ↓
Create/test workspace
      ↓
Upload dataset
      ↓
Run data workflow
```

Resetting local development data should be an explicit development operation.

Do not make destructive resets part of ordinary application startup.

---

## 15. Seed Data

Optional development seed data may be provided for repeatable testing.

Seed data should be clearly identified as development/test data.

The Olist dataset can be used as a validation case as defined by the project specification, but application logic must not be hardcoded specifically for Olist.

---

## 16. Volume and Performance Testing

Local development should support representative datasets.

Testing should distinguish between:

- Small interactive datasets
- Medium datasets
- Larger analytical datasets

The browser should receive aggregated or otherwise appropriately scoped results rather than unnecessary raw data.

Preferred flow:

```text
Raw data
   ↓
Analytical computation
   ↓
Aggregated result
   ↓
Visualization
```

---

## 17. Local File Handling

Uploaded files must be treated as untrusted.

Local development must preserve the same basic security boundaries expected in production:

- File validation
- Safe parsing
- Size controls
- Type validation
- Path safety
- Untrusted cell handling
- Raw-data immutability

Local development must not normalize unsafe shortcuts that would later be copied into production.

---

## 18. Background Workers

Long-running operations may be delegated to workers.

Potential worker operations include:

- Dataset processing
- Profiling
- Preparation
- Large analytical jobs
- Export generation

The API should provide a clear job state when an operation is asynchronous.

Conceptually:

```text
API request
   ↓
Job created
   ↓
Redis/job coordination
   ↓
Worker
   ↓
DuckDB / Polars / storage
   ↓
Job result
```

---

## 19. Development Ports

Port assignments should be documented in the repository rather than assumed by individual developers.

A typical local arrangement can use separate ports for:

```text
Frontend
Backend API
PostgreSQL
Redis
```

The exact port values are implementation configuration and should remain changeable through environment configuration.

---

## 20. Developer Startup Sequence

The documented developer workflow should be approximately:

```text
1. Start Docker Compose infrastructure
2. Verify PostgreSQL and Redis
3. Apply database migrations
4. Start FastAPI
5. Start Next.js
6. Open KaanViz
7. Create/select workspace
8. Upload test data
9. Run the relevant product workflow
```

The exact commands should be maintained in the repository README and scripts once implementation begins.

---

## 21. Development Commands

The repository should provide consistent commands for common operations.

Conceptual command categories:

```text
dev
build
test
lint
typecheck
format
migrate
migration:create
worker
```

Exact command names should match the implementation and should not be invented as if already available.

---

## 22. Logging

Local logs should make development failures understandable.

Useful categories include:

- API requests
- Background jobs
- Dataset processing
- Analytical operations
- Storage operations
- AI provider operations
- Errors

Do not log:

- API secrets
- Passwords
- Tokens
- Sensitive raw data unnecessarily

---

## 23. Local Observability

The local environment should support enough visibility to debug development issues.

At minimum:

- Backend logs
- Worker logs
- Database connectivity visibility
- Redis connectivity visibility
- API health
- Job status
- AI availability

Production observability can later expand into structured logging, error tracking, latency metrics, processing metrics, and AI failure metrics.

---

## 24. Demo Environment

The demo environment may host frontend and backend separately.

Conceptually:

```text
Browser
  ↓
Hosted Frontend
  ↓
Hosted Backend
  ├── PostgreSQL
  ├── Redis
  ├── Storage
  ├── Analytics
  └── Optional external AI provider
```

AI may be disabled in a demo deployment.

The demo architecture should not require a local AI runtime.

---

## 25. Production Direction

The production architecture is:

```text
Frontend
  ↓
API
  ↓
Application Services
  ├── PostgreSQL
  ├── Redis
  ├── Workers
  ├── Object Storage
  ├── DuckDB/Polars
  └── AI Provider
```

Local development should preserve these conceptual boundaries while remaining simpler.

---

## 26. Environment Separation

Configuration and credentials must remain environment-specific.

Conceptually:

```text
Development
Demo
Production
```

Each environment should have separate:

- Database configuration
- Storage configuration
- Credentials
- AI provider configuration
- Security configuration

Do not copy production secrets into local development.

---

## 27. Docker Compose Rules

Docker Compose configuration should:

- Be reproducible
- Use explicit service names
- Use persistent development volumes where required
- Provide health checks where useful
- Avoid embedding secrets
- Avoid unnecessary services
- Keep local startup understandable

Do not add production-only infrastructure merely because it exists in the future architecture.

---

## 28. Development Troubleshooting

When a service fails, troubleshooting should proceed from dependencies upward:

```text
Container/service status
      ↓
Health/connectivity
      ↓
Environment configuration
      ↓
Application logs
      ↓
Database migrations
      ↓
Application behavior
```

Do not immediately rewrite application code when the underlying issue is an unavailable dependency or invalid local configuration.

---

## 29. Antigravity Implementation Rules

When setting up or modifying the development environment:

1. Follow this specification and the broader KaanViz architecture.
2. Implement only the requested phase.
3. Avoid unnecessary services.
4. Do not introduce mandatory paid infrastructure.
5. Keep AI optional.
6. Do not require a local AI runtime.
7. Keep secrets out of source control.
8. Preserve raw-data immutability.
9. Use migrations for database schema changes.
10. Add health and error handling where appropriate.
11. Test the actual local startup workflow.
12. Report failed or unverified setup steps honestly.
13. Document important environment decisions.

---

## 30. Development Definition of Done

The local development environment is ready for a phase when:

- Required services start successfully.
- Database migrations can be applied.
- Backend can connect to required infrastructure.
- Frontend can communicate with the backend.
- Local storage works.
- DuckDB/Polars processing works where required.
- Background workers work where required.
- AI-disabled operation works.
- Environment configuration is documented.
- Relevant tests pass.
- Startup and troubleshooting instructions are documented.

---

## 31. Final Principle

The local development environment should be:

- Free-first
- Reproducible
- Simple
- Architecture-aligned
- AI-optional
- Secure by default
- Representative of future deployment boundaries

The local environment should make it easy to build KaanViz correctly without making cloud services or AI infrastructure mandatory.
