# KaanViz — API & Service Coding Standards

## 1. Purpose

This document defines implementation standards for the KaanViz API and backend service layer.

The API must provide clear boundaries between:

```text
HTTP/API
   ↓
Application Services
   ↓
Domain/Data/Analytics/AI
   ↓
Persistence / Storage / External Providers
```

The API is a contract boundary, not the place for large amounts of business logic.

Exact request/response schemas are finalized during implementation.

---

## 2. API Technology

The approved backend API stack is:

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic

The API should remain workspace-aware and preserve the architectural boundaries defined by the KaanViz specifications.

---

## 3. Representative API Surface

The initial API surface includes:

```text
POST   /api/datasets/upload
GET    /api/datasets
GET    /api/datasets/{id}
GET    /api/datasets/{id}/profile
POST   /api/datasets/{id}/prepare
POST   /api/datasets/{id}/validate
POST   /api/datasets/{id}/save

GET    /api/model
POST   /api/model/relationships
PATCH  /api/model/relationships/{id}
DELETE /api/model/relationships/{id}

POST   /api/analytics/query

POST   /api/visualizations
PATCH  /api/visualizations/{id}

GET    /api/dashboards
POST   /api/dashboards
PATCH  /api/dashboards/{id}

POST   /api/ai/insights
POST   /api/ai/ask
POST   /api/ai/explain
POST   /api/ai/visualize
```

Workspace-aware routing and authorization should be applied according to the final implementation contract.

---

## 4. API Route Responsibilities

API routes should be responsible for:

- Receiving requests
- Authentication context
- Authorization checks or authorization delegation
- Request validation
- Calling application services
- Translating service results into API responses
- Translating known application errors into API errors

Routes should not contain large business workflows.

Avoid:

```python
@router.post(...)
def endpoint(...):
    # hundreds of lines of business logic
```

Prefer:

```text
Route
  ↓
Service
  ↓
Domain operation
```

---

## 5. Pydantic Schemas

Use Pydantic schemas for explicit API contracts.

Separate schemas when necessary for:

- Create requests
- Update requests
- Query requests
- Response models
- Nested configuration
- AI structured output

Do not expose SQLAlchemy models directly as the API contract when a dedicated schema is more appropriate.

---

## 6. Request Validation

Validate incoming requests before executing application logic.

Validation should cover:

- Required fields
- Allowed values
- Identifier formats
- Numeric ranges
- String lengths
- Nested structures
- Visualization specifications
- Dashboard configurations
- Filter definitions
- AI request structures

Validation should reject malformed input early.

---

## 7. Workspace Authorization

Workspace ownership and membership must be validated server-side.

For workspace-scoped operations:

```text
Request
  ↓
Authenticated identity
  ↓
Workspace access
  ↓
Resource belongs to workspace
  ↓
Requested operation
```

Never trust a client-provided workspace or resource identifier without verifying the relationship.

---

## 8. Resource Ownership Checks

Every workspace-owned resource should be checked against the active workspace context.

Examples:

- Dataset
- Dataset version
- Transformation
- Relationship
- Analysis result
- Visualization
- Dashboard
- Chat session

A valid identifier from another workspace must not produce data or metadata leakage.

---

## 9. Service Layer

Application services should coordinate complete workflows.

Examples:

```text
DatasetService
PreparationService
ModelService
AnalyticsService
VisualizationService
DashboardService
AIService
WorkspaceService
```

A service may coordinate:

- Validation
- Persistence
- Storage
- Analytics
- Background jobs
- External providers

Services should not unnecessarily depend on HTTP-specific concepts.

---

## 10. Service Boundaries

A service should expose meaningful operations rather than low-level database mechanics.

Prefer:

```text
prepare_dataset(...)
validate_dataset(...)
create_relationship(...)
run_analysis(...)
create_visualization(...)
generate_ai_insight(...)
```

over exposing database-oriented operations throughout the application.

---

## 11. Repository/Persistence Layer

Where repository abstractions are used, their responsibility should be persistence access.

Examples:

```text
DatasetRepository
WorkspaceRepository
DashboardRepository
VisualizationRepository
```

Repositories should not become a second application-service layer.

Keep business decisions in services/domain logic.

---

## 12. Database Transactions

Use explicit transaction boundaries for operations that modify related metadata.

Examples:

- Creating dataset versions
- Saving transformations
- Creating relationships
- Saving dashboards
- Updating dashboard layouts
- Persisting AI sessions/results

A transaction should protect the consistency of the metadata state.

---

## 13. Dataset Versioning

Dataset processing must preserve version relationships.

A preparation workflow should not silently overwrite the immutable raw dataset.

Conceptually:

```text
Raw dataset
    ↓
Preparation
    ↓
Processed dataset version
    ↓
Validation
    ↓
Saved version
```

The API should expose enough metadata to understand which version produced an analytical result.

---

## 14. Idempotency

Operations should be designed to avoid accidental duplication where appropriate.

Particular care is required for:

- File uploads
- Background jobs
- Export generation
- Save operations
- External provider requests

If an operation cannot safely be retried, its API behavior should make that clear.

---

## 15. Concurrency

Concurrent updates should not silently overwrite important user changes.

For mutable resources such as:

- Dashboards
- Visualizations
- Relationships
- Workspace settings

the implementation should define appropriate conflict behavior.

The exact optimistic-locking/versioning mechanism can be finalized during implementation.

---

## 16. Standard Response Shape

Successful response structures should be consistent within each API family.

Where appropriate, responses can communicate:

```text
data
metadata
pagination
job status
```

Do not wrap every response in unnecessary layers solely for consistency.

The final response schema should be selected based on the actual API contract during implementation.

---

## 17. Error Response Shape

Errors should be predictable and actionable.

A conceptual structure is:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The selected column cannot be converted to dates.",
    "details": {}
  }
}
```

The implementation may extend this with fields such as:

- Request/correlation identifier
- Field-level validation details
- Recovery metadata

Do not expose internal stack traces or sensitive infrastructure details to clients.

---

## 18. HTTP Status Codes

Use HTTP status codes consistently with the operation.

Typical categories include:

```text
2xx  Successful operation
4xx  Invalid request / authorization / resource state
5xx  Server-side failure
```

Examples:

```text
400  Invalid request
401  Unauthenticated
403  Unauthorized
404  Resource not found
409  Conflict
422  Validation failure
429  Rate limited
500  Unexpected server failure
503  Temporary service unavailable
```

The exact status code should reflect the actual failure semantics.

---

## 19. Pagination

Collection endpoints should support pagination when the dataset can grow beyond a small bounded size.

Examples:

```text
GET /api/datasets
GET /api/dashboards
```

The API should define:

- Page/offset or cursor strategy
- Page size
- Maximum page size
- Total/count behavior where appropriate

Do not return arbitrarily large collections.

---

## 20. Filtering and Sorting

Collection endpoints may support filtering and sorting where useful.

Parameters should be:

- Explicit
- Validated
- Bounded
- Consistent

Do not expose arbitrary database query expressions through public API parameters.

---

## 21. Dataset Upload API

The upload API must treat files as untrusted.

The upload workflow should account for:

```text
Upload
  ↓
Validate file
  ↓
Store raw artifact
  ↓
Create dataset metadata
  ↓
Profile/process
```

File validation should cover applicable:

- File size
- Extension
- MIME/content characteristics
- Parsing safety
- Storage path safety

Do not execute uploaded content.

---

## 22. Preparation API

The preparation API should accept structured transformation intent.

Conceptually:

```text
POST /api/datasets/{id}/prepare
```

The backend should:

1. Validate the request.
2. Resolve the dataset/version.
3. Validate referenced columns.
4. Apply supported deterministic transformations.
5. Record transformation metadata.
6. Produce a derived version/result.
7. Return structured status.

AI recommendations must not bypass deterministic validation.

---

## 23. Validation API

The validation API should verify the prepared state.

Conceptually:

```text
POST /api/datasets/{id}/validate
```

Validation may include:

- Type compatibility
- Required fields
- Transformation validity
- Data quality checks
- Version consistency

A failed validation must not be represented as a valid processed state.

---

## 24. Modeling API

Relationship operations should be explicit.

```text
GET    /api/model
POST   /api/model/relationships
PATCH  /api/model/relationships/{id}
DELETE /api/model/relationships/{id}
```

Relationship creation should validate:

- Workspace membership
- Dataset ownership
- Column existence
- Type compatibility
- Relationship configuration

Automated suggestions must not bypass required user approval.

---

## 25. Analytics API

The analytics endpoint should accept structured analytical intent.

```text
POST /api/analytics/query
```

The backend should validate:

- Dataset/version access
- Fields
- Measures
- Aggregations
- Filters
- Grouping
- Sorting
- Result size

The analytical engine should produce a controlled result suitable for downstream visualization or application use.

---

## 26. Visualization API

Visualization creation should use structured specifications.

```text
POST /api/visualizations
PATCH /api/visualizations/{id}
```

The API should validate:

- Dataset/version context
- Analysis context
- Visualization type
- Data roles
- Fields
- Aggregations
- Filters
- Sorting
- Supported properties

Do not accept arbitrary frontend HTML/JavaScript as a visualization definition.

---

## 27. Dashboard API

Dashboard endpoints should support:

```text
GET    /api/dashboards
POST   /api/dashboards
PATCH  /api/dashboards/{id}
```

Dashboard persistence should distinguish between:

- Dashboard definition
- Dashboard layout
- References to visualization definitions
- Dashboard-specific configuration

The API should preserve valid dashboard state when one component fails.

---

## 28. AI API

AI endpoints include:

```text
POST /api/ai/insights
POST /api/ai/ask
POST /api/ai/explain
POST /api/ai/visualize
```

AI requests should be processed through:

```text
API
 ↓
AI application service
 ↓
Controlled context
 ↓
Provider abstraction
 ↓
Structured output
 ↓
Validation
 ↓
Application result
```

The provider itself must not directly control application state.

---

## 29. AI Context Security

AI requests must separate:

```text
System instructions
User request
Dataset-derived content
Application metadata
```

Dataset contents must be treated as data, not as trusted instructions.

Prompt-injection defenses must be applied at the context construction and validation boundaries.

---

## 30. AI Output Validation

AI-generated output must be validated before use.

Validation should cover:

```text
Schema
 ↓
Allowed values
 ↓
Semantic validity
 ↓
Analytical validity
 ↓
Application constraints
```

Invalid output should be rejected safely.

Do not execute arbitrary code generated by an AI provider.

---

## 31. AI Availability

The API should distinguish provider states such as:

```text
Online
Degraded
Unavailable
```

A provider failure should return a controlled AI-specific error state.

The core API should remain usable for deterministic functionality when AI is unavailable.

---

## 32. Background Jobs

Long-running operations should not unnecessarily block HTTP requests.

Potential asynchronous operations include:

- Large dataset processing
- Profiling
- Preparation
- Export
- Expensive analysis

A job-oriented API may expose:

```text
Queued
Running
Succeeded
Failed
```

The exact job endpoints can be finalized during implementation.

---

## 33. External Provider Boundaries

External services should be hidden behind abstractions.

Examples:

```text
AIProvider
StorageProvider
DataSourceConnector
```

The API/service layer should not hardcode vendor-specific logic throughout the application.

---

## 34. Logging

API/service logs should provide useful diagnostic information without leaking sensitive data.

Log categories may include:

- Request lifecycle
- Workspace operation
- Dataset processing
- Analytics
- Visualization
- Dashboard
- AI provider
- Background jobs
- Errors

Never log secrets or unnecessary raw dataset contents.

---

## 35. Request Correlation

Requests and background jobs should support correlation identifiers where practical.

A correlation identifier helps connect:

```text
Frontend request
   ↓
API request
   ↓
Service operation
   ↓
Worker/job
   ↓
Storage/analytics/AI
```

This becomes especially valuable when diagnosing long-running analytical or AI operations.

---

## 36. Rate Limiting

Rate limiting should be applied where appropriate, particularly to:

- Upload operations
- Expensive analytics
- AI requests
- Export generation
- Authentication-sensitive endpoints

Limits should reflect actual resource cost.

---

## 37. API Security

The API must enforce:

- Authentication where required
- Workspace authorization
- Input validation
- File validation
- Rate limiting
- CORS policy
- Secure headers
- Secret protection
- Safe error responses

Security controls should be implemented server-side.

---

## 38. Testing Standards

API/service changes should include appropriate tests.

Test at least the applicable:

- Request validation
- Authorization
- Workspace isolation
- Service behavior
- Persistence behavior
- Error handling
- AI validation
- Background job behavior
- API contract behavior

Critical workflows should also be covered by end-to-end tests.

---

## 39. API Coding Workflow

For a new endpoint:

```text
Define contract
    ↓
Define Pydantic schemas
    ↓
Implement service operation
    ↓
Implement persistence/domain integration
    ↓
Implement API route
    ↓
Add authorization
    ↓
Add validation
    ↓
Add tests
    ↓
Run tests
    ↓
Document behavior
```

Avoid starting with the route handler and building the entire architecture inside it.

---

## 40. Antigravity Implementation Rules

When modifying the API:

1. Read the relevant API/domain specification first.
2. Implement only the requested phase.
3. Preserve the workspace boundary.
4. Keep routes thin.
5. Keep deterministic analytics independent from AI.
6. Validate all untrusted inputs.
7. Validate all AI-generated structures.
8. Preserve raw-data immutability.
9. Do not expose secrets or internal failures.
10. Add tests for important behavior.
11. Run relevant tests.
12. Report failures honestly.
13. Document important API or architectural decisions.

---

## 41. API Definition of Done

An API change is complete when:

- The contract is defined.
- Request validation is implemented.
- Authorization is implemented where required.
- Workspace/resource isolation is verified.
- Service behavior is implemented.
- Persistence/analytics/storage integration works.
- Error behavior is defined.
- Important tests pass.
- Relevant manual or integration verification is complete.
- Documentation is updated where necessary.
- Verification status is reported honestly.

---

## 42. Final Principle

KaanViz APIs should expose stable, structured application capabilities rather than internal implementation details.

The desired boundary is:

```text
Clear API contract
      ↓
Validated request
      ↓
Workspace authorization
      ↓
Application service
      ↓
Deterministic domain operation
      ↓
Controlled persistence / analytics / AI
      ↓
Validated response
```

The API should make KaanViz predictable, secure, testable, and extensible without making AI or any single external provider a core dependency.
