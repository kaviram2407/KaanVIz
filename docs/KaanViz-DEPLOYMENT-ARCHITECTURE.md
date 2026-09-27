# KaanViz — Deployment Architecture

**Status:** Planning / Pre-Implementation  
**Purpose:** Define the documented local, demo, and production deployment shapes while preserving KaanViz's AI-optional architecture.

---

## 1. Purpose

KaanViz must support a progression from local development to demo hosting and eventually production deployment.

The deployment architecture should preserve the same core application boundaries:

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
   ├── DuckDB / Polars
   └── Optional AI Provider
```

The deployment model must not make a local AI runtime a mandatory dependency.

---

## 2. Deployment Principles

1. **Free-first development**  
   Initial development should avoid mandatory paid infrastructure.

2. **AI optionality**  
   The platform must operate without an AI provider.

3. **Environment separation**  
   Local, demo, and production configurations should remain distinct.

4. **Same architectural boundaries**  
   Deployment should not require redesigning the application architecture.

5. **Secrets stay server-side**  
   Provider and infrastructure credentials must never be exposed to the frontend.

6. **Core analytics remains independent**  
   AI availability must not determine whether the core product is operational.

7. **Storage remains abstracted**  
   The application should use the storage abstraction rather than coupling domain logic to one storage provider.

---

## 3. Local Development

The documented local stack is:

```text
Next.js
FastAPI
PostgreSQL
Redis
DuckDB
Polars
Parquet
Docker Compose
```

AI is optional and provider-agnostic.

Conceptually:

```text
Developer Machine
│
├── Next.js
├── FastAPI
├── PostgreSQL
├── Redis
├── Local Storage
├── DuckDB / Polars
└── Optional AI Provider
```

The local environment should provide enough functionality to develop and test the core product without paid infrastructure.

---

## 4. Local Frontend

The frontend uses:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Grid Layout
- Apache ECharts

The frontend communicates with the FastAPI backend through the defined API layer.

The frontend must not directly connect to:

- PostgreSQL
- Redis
- private object storage
- AI provider credentials

---

## 5. Local Backend

The backend uses:

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic

The API is responsible for:

- authentication/authorization where enabled
- workspace access
- dataset operations
- preparation
- modeling
- analytics
- visualization
- dashboard operations
- AI application-layer requests

---

## 6. Local Database

PostgreSQL stores application metadata.

It includes the workspace-centered domain model for resources such as:

- users
- workspaces
- workspace members
- data sources
- datasets
- dataset columns
- dataset versions
- transformations
- relationships
- analysis sessions/results
- visualizations
- dashboards
- dashboard visuals
- AI/chat session metadata

The database should be initialized and migrated through the project's migration process.

---

## 7. Local Redis

Redis is part of the local stack.

It may support:

- background job coordination
- caching where appropriate
- other asynchronous application infrastructure

Redis must not bypass application authorization or workspace isolation.

---

## 8. Local Analytics

DuckDB and Polars provide the primary analytical capabilities.

Parquet is used for processed analytical storage.

Conceptually:

```text
Uploaded Data
    ↓
Raw Storage
    ↓
Preparation
    ↓
Processed Parquet
    ↓
DuckDB / Polars
    ↓
Analytical Result
```

Pandas may also be used where appropriate within the analytical architecture.

---

## 9. Local Storage

Local development uses local storage.

The storage abstraction must keep domain logic independent of the physical storage implementation.

Conceptually:

```text
StorageProvider
├── LocalStorageProvider
├── R2StorageProvider
├── S3StorageProvider
└── AzureBlobStorageProvider
```

The local provider should preserve the same raw/processed separation used by other providers.

---

## 10. Docker Compose

Docker Compose is the documented local orchestration approach.

It should provide the local infrastructure needed for development without requiring complex cloud setup.

The exact service definitions should be implemented separately from this architecture document.

Do not introduce additional infrastructure services merely for convenience unless a real requirement exists.

---

## 11. Environment Configuration

Environment-specific configuration should be separated from source code.

Configuration may include:

- API configuration
- database connection
- Redis connection
- local/storage configuration
- file limits
- AI provider configuration
- application environment
- frontend/backend origins

Secrets must not be committed to source control.

---

## 12. Demo Environment

The documented demo strategy allows frontend and backend to be hosted separately.

Conceptually:

```text
Demo Frontend
      ↓
Demo API
      ↓
Application Services
```

The demo may operate:

- with AI disabled
- with an external AI provider

AI is not required for the demo to demonstrate core analytics.

---

## 13. Demo Storage

The demo environment should use the storage abstraction rather than embedding provider-specific storage logic throughout the application.

The selected storage implementation must preserve:

- raw immutability
- processed data separation
- dataset/version lineage
- workspace boundaries

---

## 14. Demo Database

The demo backend should use the same PostgreSQL-centered metadata architecture as local development.

The database schema should not diverge simply because the application is hosted separately.

Schema changes should continue to use migrations.

---

## 15. Demo AI

The demo may connect to an external AI provider.

Provider credentials remain server-side.

If AI is disabled:

```text
AI Unavailable
      ↓
Core KaanViz remains operational
```

The demo should therefore be capable of demonstrating the product's non-AI workflows independently.

---

## 16. Production Architecture

The documented production shape is:

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

This architecture separates:

- user interface
- API boundary
- application services
- metadata storage
- asynchronous infrastructure
- object storage
- analytical computation
- optional AI

---

## 17. Production Frontend

The frontend is deployed independently from backend services where appropriate.

It communicates with the API through the defined API contract.

The production frontend must not contain:

- database credentials
- object storage private credentials
- Redis credentials
- AI provider secrets

---

## 18. Production API

The API is the primary application boundary.

It coordinates:

- authentication
- authorization
- workspace access
- data operations
- analytical operations
- visualization operations
- dashboard operations
- AI application-layer requests

The API should remain stateless at the application layer where practical, with persistent state stored in the appropriate services.

---

## 19. Production PostgreSQL

PostgreSQL remains the metadata store.

Production database responsibilities include:

- workspace metadata
- dataset metadata
- version metadata
- transformation metadata
- relationship metadata
- analysis metadata
- visualization metadata
- dashboard metadata
- AI/chat metadata

Database backups and recovery are part of production readiness.

---

## 20. Production Redis

Redis may support:

- job queues
- background processing coordination
- caching where appropriate

Redis should not become the authoritative store for core domain data.

Cached or queued data must remain correctly scoped to workspace and resource context.

---

## 21. Production Workers

Workers handle processing that is appropriate for asynchronous execution.

Potential responsibilities include:

- ingestion
- profiling
- preparation
- export
- other long-running processing

Workers should operate through controlled application services and preserve workspace authorization context.

---

## 22. Production Object Storage

Production uses object storage for dataset artifacts.

The storage abstraction supports providers such as:

- Cloudflare R2
- Amazon S3
- Azure Blob Storage

The exact provider is an environment/deployment decision rather than a domain-model dependency.

---

## 23. Raw and Processed Storage

Production storage must preserve the core data architecture:

```text
Raw Upload
   ↓
Immutable Raw Storage
   ↓
Processing
   ↓
Processed Version
   ↓
Parquet / Analytical Storage
```

Raw data must not be silently overwritten.

Processed versions must retain lineage back to their source.

---

## 24. Production Analytics

DuckDB and Polars remain part of the analytical architecture.

The production environment should preserve the same conceptual boundary:

```text
Stored Data
   ↓
Analytical Engine
   ↓
Validated Result
   ↓
Visualization / Dashboard / AI
```

Large raw datasets should not be unnecessarily transferred to the browser.

---

## 25. Production AI Provider

The AI provider is optional from the core architecture perspective.

Possible providers include:

```text
NVIDIA
OpenAI
Azure OpenAI
Future Provider
```

The provider abstraction allows the production deployment to change providers without rewriting application-level AI workflows.

---

## 26. AI Runtime Independence

A local AI runtime must not become a mandatory hosting dependency.

Production should be capable of operating with:

```text
AI Online
```

or:

```text
AI Degraded
```

or:

```text
AI Unavailable
```

Core analytics remains operational in all three states.

---

## 27. Production Security

Production deployment must include the security controls defined by `11-SECURITY-SPEC.md`.

Important areas include:

- authentication
- authorization
- rate limiting
- CORS restrictions
- secure headers
- file validation
- input/output validation
- secrets management
- workspace isolation
- audit logging
- safe exports
- AI prompt-injection defense

---

## 28. Production Observability

Production deployment must support the observability requirements defined in `13-OBSERVABILITY-PERFORMANCE.md`.

Important signals include:

- structured logs
- error tracking
- API latency
- processing duration
- dataset processing metrics
- job queue metrics
- AI latency
- AI failure rate

OpenTelemetry can be introduced when production infrastructure requires it.

---

## 29. Production Performance

The production architecture should preserve:

```text
Raw data
  ↓
Analytical computation
  ↓
Aggregated result
  ↓
Visualization
```

Avoid sending huge raw datasets to the browser.

Performance improvements should not bypass:

- validation
- workspace authorization
- analytical correctness
- data lineage

---

## 30. Production Backups

Production readiness includes backups.

Backups should cover the appropriate persistent application data and stored artifacts.

The exact backup implementation is a deployment concern and should be defined when the production infrastructure is selected.

Recovery procedures should be documented and tested as production deployment matures.

---

## 31. Environment Separation

KaanViz should distinguish at least:

```text
Local
Demo
Production
```

Environment-specific differences should be configuration-driven rather than implemented as unrelated application architectures.

The domain model and major service boundaries should remain consistent.

---

## 32. Deployment Configuration

Configuration should determine environment-specific values such as:

```text
Environment
Database
Redis
Storage Provider
Storage Location
AI Provider
AI Availability
Allowed Frontend Origins
File Limits
Application URLs
```

Secrets must remain outside source control.

---

## 33. Deployment Validation

Before a deployment is considered usable, verify:

### Application

- frontend loads
- API is reachable
- database connection works
- migrations are applied
- storage is accessible
- background processing works where enabled

### Data

- upload works
- raw storage works
- processing works
- analytical queries work
- visualization works
- dashboard persistence works

### AI

- AI provider works when configured
- AI can be disabled
- AI outage does not break core analytics

### Security

- unauthorized access is rejected
- workspace boundaries hold
- secrets are not exposed
- CORS is configured
- file validation works

---

## 34. Deployment Testing

Deployment testing should include the critical E2E path:

```text
Upload CSV
→ Profile
→ Change type
→ Clean
→ Validate
→ Save
→ Create relationship
→ Create chart
→ Apply filter
→ Save dashboard
```

Run the same workflow with AI disabled.

This verifies that deployment has not accidentally introduced an AI dependency.

---

## 35. Production Readiness Gate

Production deployment is not complete until the documented Phase 9 requirements have been addressed:

- security hardening
- rate limits
- observability
- performance
- deployment
- backups
- authentication

The exact implementation of each requirement should be documented before production launch.

---

## 36. Antigravity Deployment Rules

Antigravity must not invent a new deployment architecture during implementation.

Do not:

- make local AI mandatory
- couple domain logic to one cloud provider
- expose infrastructure credentials to the frontend
- bypass the API boundary
- bypass workspace authorization
- ship huge raw datasets to the browser
- add paid infrastructure without a requirement

Do:

- preserve local Docker Compose development
- preserve storage abstraction
- preserve provider abstraction
- preserve AI optionality
- preserve PostgreSQL metadata architecture
- preserve DuckDB/Polars analytical architecture
- document deployment-specific decisions

---

## 37. North Star

KaanViz deployment should preserve the same product principle in every environment:

> **The environment may change, but the core analytical architecture does not.**

Local, demo, and production deployments should all provide the same fundamental KaanViz journey while allowing infrastructure to scale independently around it.
