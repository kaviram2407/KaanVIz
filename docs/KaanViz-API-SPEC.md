# KaanViz API Specification

**Status:** Planning / Pre-Implementation  
**Purpose:** Define the API contract between the KaanViz frontend and FastAPI backend.

This document defines the intended API surface and behavior. Exact implementation details, framework conventions, authentication mechanism, and database migration code remain implementation concerns.

---

# 1. API Principles

KaanViz APIs must follow these principles:

1. Workspace is the primary scope for workspace-owned operations.
2. Authorization is enforced server-side.
3. The frontend must not be trusted to enforce Workspace boundaries.
4. Raw data is immutable.
5. Dataset preparation is deterministic.
6. AI output is validated before it can affect analytical operations.
7. Large analytical data should not be returned unnecessarily to the browser.
8. Long-running work may use background processing.
9. APIs should return predictable success/error structures.
10. AI availability must not prevent core data operations.

---

# 2. API Base Structure

Conceptually:

```text
/api
```

Workspace-scoped routes should generally follow:

```text
/api/workspaces/{workspace_id}/...
```

Examples:

```text
/api/workspaces/{workspace_id}
/api/workspaces/{workspace_id}/datasets
/api/workspaces/{workspace_id}/dashboards
/api/workspaces/{workspace_id}/ai/ask
```

The exact versioning strategy, such as `/api/v1`, should be finalized before implementation.

---

# 3. Authentication Context

Every authenticated request should establish:

```text
Authenticated User
        ↓
User Identity
        ↓
Workspace Membership
        ↓
Role
        ↓
Permission
```

The API should never accept a `user_id` from the frontend as the authoritative identity for authorization.

Identity should come from the authenticated request context.

The exact authentication mechanism is intentionally not finalized in this document.

---

# 4. Workspace Authorization

For a request such as:

```text
POST /api/workspaces/{workspace_id}/datasets
```

the backend should:

```text
1. Authenticate user
2. Resolve workspace
3. Check membership
4. Resolve role
5. Check required permission
6. Execute operation
```

If access is denied:

```text
403 Forbidden
```

If the Workspace does not exist or should not be disclosed:

```text
404 Not Found
```

The final distinction should be decided consistently across the application.

---

# 5. Standard Response Principles

Successful responses should be predictable.

Example:

```json
{
  "data": {},
  "meta": {}
}
```

For list operations:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "page_size": 50,
    "total": 120
  }
}
```

The exact envelope can be simplified if implementation experience shows that a wrapper adds unnecessary complexity.

Consistency is more important than the specific envelope.

---

# 6. Standard Error Structure

A predictable error format is recommended:

```json
{
  "error": {
    "code": "DATASET_VALIDATION_FAILED",
    "message": "The dataset could not be validated.",
    "details": {}
  }
}
```

The API should distinguish:

```text
Validation Error
Authentication Error
Authorization Error
Not Found
Conflict
Processing Error
External Provider Error
Internal Error
```

Do not expose stack traces or sensitive implementation details to users.

---

# 7. HTTP Status Direction

Use standard status meanings:

```text
200 OK
201 Created
202 Accepted
204 No Content

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests

500 Internal Server Error
502 Bad Gateway
503 Service Unavailable
```

Not every endpoint needs every status.

---

# 8. Workspace API

## Create Workspace

```text
POST /api/workspaces
```

Request:

```json
{
  "name": "E-Commerce Analytics",
  "description": "Sales and customer analytics"
}
```

Response concept:

```json
{
  "data": {
    "id": "...",
    "name": "E-Commerce Analytics",
    "description": "Sales and customer analytics",
    "role": "owner"
  }
}
```

Behavior:

```text
Create Workspace
    ↓
Create owner relationship
    ↓
Return Workspace
```

---

# 9. List Workspaces

```text
GET /api/workspaces
```

Returns Workspaces accessible to the authenticated user.

Example:

```json
{
  "data": [
    {
      "id": "...",
      "name": "E-Commerce Analytics",
      "role": "owner",
      "status": "active"
    },
    {
      "id": "...",
      "name": "Marketing Analytics",
      "role": "contributor",
      "status": "active"
    }
  ]
}
```

---

# 10. Get Workspace

```text
GET /api/workspaces/{workspace_id}
```

Returns Workspace metadata and relevant summary information.

Possible summary:

```text
Dataset count
Data source count
Model/relationship count
Visualization count
Dashboard count
Member count
Recent activity summary
```

Do not return large analytical data from this endpoint.

---

# 11. Update Workspace

```text
PATCH /api/workspaces/{workspace_id}
```

Possible request:

```json
{
  "name": "Updated Workspace Name",
  "description": "Updated description"
}
```

Only users with the appropriate permission may perform this operation.

---

# 12. Archive Workspace

```text
POST /api/workspaces/{workspace_id}/archive
```

This is preferable to immediately hard-deleting a Workspace in the initial lifecycle design.

The final archive/delete policy belongs to the Security/Data Architecture decisions.

---

# 13. Workspace Members

## List Members

```text
GET /api/workspaces/{workspace_id}/members
```

Returns:

```json
{
  "data": [
    {
      "user_id": "...",
      "display_name": "Kaan",
      "role": "owner",
      "status": "active"
    },
    {
      "user_id": "...",
      "display_name": "Arun",
      "role": "contributor",
      "status": "active"
    }
  ]
}
```

---

# 14. Add Workspace Member

```text
POST /api/workspaces/{workspace_id}/members
```

Conceptual request:

```json
{
  "user_id": "...",
  "role": "contributor"
}
```

The actual invitation mechanism may be introduced later.

---

# 15. Update Workspace Member

```text
PATCH /api/workspaces/{workspace_id}/members/{user_id}
```

Example:

```json
{
  "role": "viewer"
}
```

Role changes must be authorization-protected.

---

# 16. Remove Workspace Member

```text
DELETE /api/workspaces/{workspace_id}/members/{user_id}
```

The API must prevent invalid states such as accidentally removing the only Workspace owner.

---

# 17. Data Source API

## List Data Sources

```text
GET /api/workspaces/{workspace_id}/data-sources
```

Returns source metadata without exposing secrets.

---

# 18. Create Data Source

```text
POST /api/workspaces/{workspace_id}/data-sources
```

Conceptual request:

```json
{
  "name": "Sales Database",
  "source_type": "postgresql",
  "configuration": {}
}
```

Secret fields must use the appropriate secure mechanism.

---

# 19. Upload CSV

```text
POST /api/workspaces/{workspace_id}/datasets/upload
```

Multipart file upload.

Conceptual flow:

```text
Request
 ↓
Authenticate
 ↓
Authorize Workspace
 ↓
Validate file
 ↓
Store raw immutable source
 ↓
Create Data Source / Dataset metadata
 ↓
Start ingestion
 ↓
Return Dataset status
```

Response may be:

```text
201 Created
```

or:

```text
202 Accepted
```

depending on whether processing is synchronous.

---

# 20. Dataset API

## List Datasets

```text
GET /api/workspaces/{workspace_id}/datasets
```

Possible filters:

```text
status
source_type
created_by
search
```

Pagination should be supported for large Workspace inventories.

---

# 21. Create Dataset

For future connectors:

```text
POST /api/workspaces/{workspace_id}/datasets
```

Conceptual request:

```json
{
  "data_source_id": "...",
  "name": "Orders"
}
```

The connector-specific ingestion process happens behind the API boundary.

---

# 22. Get Dataset

```text
GET /api/workspaces/{workspace_id}/datasets/{dataset_id}
```

Returns metadata such as:

```text
Dataset identity
Name
Status
Source
Current version
Row count
Column count
Created/updated timestamps
```

The API must verify that the Dataset belongs to the requested Workspace.

---

# 23. Dataset Profile

```text
GET /api/workspaces/{workspace_id}/datasets/{dataset_id}/profile
```

Returns:

```text
Dataset statistics
Column statistics
Physical types
Semantic types
Missing values
Distinct counts
Basic numeric statistics
Date intelligence
Quality information
```

The profile is deterministic output.

---

# 24. Dataset Columns

```text
GET /api/workspaces/{workspace_id}/datasets/{dataset_id}/columns
```

Returns column metadata.

Example:

```json
{
  "data": [
    {
      "id": "...",
      "name": "order_date",
      "physical_type": "VARCHAR",
      "semantic_type": "Date",
      "type_source": "inferred"
    }
  ]
}
```

---

# 25. Update Column Semantic Type

```text
PATCH /api/workspaces/{workspace_id}/datasets/{dataset_id}/columns/{column_id}
```

Example:

```json
{
  "semantic_type": "Date"
}
```

The backend should validate whether the requested type can be applied.

Invalid conversions should return a structured validation error.

---

# 26. Dataset Preview

```text
GET /api/workspaces/{workspace_id}/datasets/{dataset_id}/preview
```

This endpoint should return a bounded sample, not the entire dataset.

Possible parameters:

```text
limit
offset
version_id
```

Maximum preview limits should be enforced server-side.

---

# 27. Dataset Versions

## List Versions

```text
GET /api/workspaces/{workspace_id}/datasets/{dataset_id}/versions
```

Returns version history:

```text
v1 Raw
v2 Prepared
v3 Validated
```

---

# 28. Get Dataset Version

```text
GET /api/workspaces/{workspace_id}/datasets/{dataset_id}/versions/{version_id}
```

Returns version metadata.

The API must verify:

```text
version → dataset → workspace
```

before returning it.

---

# 29. Prepare Dataset

```text
POST /api/workspaces/{workspace_id}/datasets/{dataset_id}/prepare
```

Conceptual request:

```json
{
  "source_version_id": "...",
  "operations": [
    {
      "operation": "remove_duplicates",
      "columns": ["order_id"]
    },
    {
      "operation": "convert_type",
      "column": "order_date",
      "target_type": "date"
    }
  ]
}
```

Backend flow:

```text
Authorize
 ↓
Validate request
 ↓
Validate operations
 ↓
Execute deterministic transformations
 ↓
Create target version
 ↓
Create lineage records
 ↓
Return result
```

---

# 30. Transformation History

```text
GET /api/workspaces/{workspace_id}/datasets/{dataset_id}/transformations
```

Returns transformation lineage.

---

# 31. Validate Dataset

```text
POST /api/workspaces/{workspace_id}/datasets/{dataset_id}/validate
```

Conceptual request:

```json
{
  "version_id": "..."
}
```

Response:

```json
{
  "data": {
    "status": "valid",
    "issues": []
  }
}
```

Failure example:

```json
{
  "data": {
    "status": "invalid",
    "issues": [
      {
        "code": "INVALID_DATE_VALUES",
        "column": "order_date",
        "message": "Some values cannot be converted to Date."
      }
    ]
  }
}
```

---

# 32. Save Dataset Version

If a separate explicit save operation is retained:

```text
POST /api/workspaces/{workspace_id}/datasets/{dataset_id}/save
```

Conceptual request:

```json
{
  "version_id": "..."
}
```

This operation should only succeed for a valid version according to the dataset lifecycle.

---

# 33. Model API

## Get Workspace Model

```text
GET /api/workspaces/{workspace_id}/model
```

Returns:

```text
Datasets
Tables
Columns
Relationships
Relationship statuses
```

---

# 34. Relationship Suggestions

```text
GET /api/workspaces/{workspace_id}/model/relationship-suggestions
```

Suggestions may be generated using deterministic evidence and/or controlled AI assistance.

Suggestions are not automatically approved.

---

# 35. Create Relationship

```text
POST /api/workspaces/{workspace_id}/model/relationships
```

Conceptual request:

```json
{
  "source_dataset_id": "...",
  "source_column_id": "...",
  "target_dataset_id": "...",
  "target_column_id": "...",
  "relationship_type": "many_to_one"
}
```

Backend must verify:

```text
source dataset belongs to Workspace
target dataset belongs to Workspace
source column belongs to source dataset
target column belongs to target dataset
```

---

# 36. Update Relationship

```text
PATCH /api/workspaces/{workspace_id}/model/relationships/{relationship_id}
```

Possible operations:

```text
Approve
Reject
Modify
Deactivate
```

---

# 37. Delete Relationship

```text
DELETE /api/workspaces/{workspace_id}/model/relationships/{relationship_id}
```

Authorization is required.

The API must verify the relationship belongs to the requested Workspace.

---

# 38. Analytics Query API

```text
POST /api/workspaces/{workspace_id}/analytics/query
```

Conceptual request:

```json
{
  "dataset_version_id": "...",
  "dimensions": ["category"],
  "measures": [
    {
      "field": "revenue",
      "aggregation": "sum"
    }
  ],
  "filters": [],
  "sort": [],
  "limit": 1000
}
```

The analytics service validates the request before executing it.

---

# 39. Analytics Result

Response should contain bounded analytical results.

Example:

```json
{
  "data": {
    "columns": [
      {
        "name": "category",
        "type": "string"
      },
      {
        "name": "revenue",
        "type": "number"
      }
    ],
    "rows": [
      ["Electronics", 123456.78],
      ["Furniture", 98231.10]
    ]
  },
  "meta": {
    "row_count": 2,
    "execution_time_ms": 82
  }
}
```

Do not return unbounded raw data.

---

# 40. Analytics Errors

Possible errors:

```text
INVALID_FIELD
INVALID_AGGREGATION
INVALID_FILTER
INVALID_RELATIONSHIP
QUERY_TIMEOUT
DATASET_NOT_READY
ANALYSIS_FAILED
```

Example:

```json
{
  "error": {
    "code": "INVALID_FIELD",
    "message": "The requested field does not exist in this dataset.",
    "details": {
      "field": "revenue_total"
    }
  }
}
```

---

# 41. Visualization API

## List Visualizations

```text
GET /api/workspaces/{workspace_id}/visualizations
```

---

# 42. Create Visualization

```text
POST /api/workspaces/{workspace_id}/visualizations
```

Conceptual request:

```json
{
  "name": "Revenue by Category",
  "dataset_version_id": "...",
  "analysis_spec": {},
  "visualization_spec": {}
}
```

The backend should validate both analytical and visualization specifications.

---

# 43. Get Visualization

```text
GET /api/workspaces/{workspace_id}/visualizations/{visualization_id}
```

---

# 44. Update Visualization

```text
PATCH /api/workspaces/{workspace_id}/visualizations/{visualization_id}
```

Used for changes such as:

```text
Chart type
Aggregation
Fields
Filters
Configuration
Name
```

---

# 45. Delete Visualization

```text
DELETE /api/workspaces/{workspace_id}/visualizations/{visualization_id}
```

The API must handle dashboard references according to the final deletion policy.

---

# 46. Visualization Recommendation

A controlled recommendation endpoint may be:

```text
POST /api/workspaces/{workspace_id}/visualizations/recommend
```

Conceptual request:

```json
{
  "dataset_version_id": "...",
  "fields": ["category", "revenue"],
  "intent": "compare revenue by category"
}
```

The recommendation should produce a structured specification, not arbitrary frontend code.

---

# 47. Prompt-to-Visual API

```text
POST /api/workspaces/{workspace_id}/ai/visualize
```

Conceptual request:

```json
{
  "dataset_version_id": "...",
  "prompt": "Show monthly revenue by category."
}
```

Flow:

```text
Prompt
 ↓
AI intent
 ↓
Structured visualization specification
 ↓
Schema validation
 ↓
Field validation
 ↓
Analysis
 ↓
Result
```

If AI is unavailable, the API should return an explicit AI-unavailable error rather than causing a core application failure.

---

# 48. Dashboard API

## List Dashboards

```text
GET /api/workspaces/{workspace_id}/dashboards
```

---

# 49. Create Dashboard

```text
POST /api/workspaces/{workspace_id}/dashboards
```

Request:

```json
{
  "name": "Executive Dashboard",
  "description": "Executive sales overview"
}
```

---

# 50. Get Dashboard

```text
GET /api/workspaces/{workspace_id}/dashboards/{dashboard_id}
```

Returns:

```text
Dashboard metadata
Layout
Components
Visual references
Filter configuration
Theme
```

---

# 51. Update Dashboard

```text
PATCH /api/workspaces/{workspace_id}/dashboards/{dashboard_id}
```

Possible changes:

```text
Name
Description
Layout
Theme
Configuration
```

---

# 52. Add Dashboard Visual

```text
POST /api/workspaces/{workspace_id}/dashboards/{dashboard_id}/visuals
```

Conceptual request:

```json
{
  "visualization_id": "...",
  "component_type": "chart",
  "position": {
    "x": 0,
    "y": 0,
    "width": 6,
    "height": 4
  }
}
```

The visualization must belong to the same Workspace.

---

# 53. Update Dashboard Visual

```text
PATCH /api/workspaces/{workspace_id}/dashboards/{dashboard_id}/visuals/{dashboard_visual_id}
```

Used for:

```text
Position
Size
Display configuration
```

---

# 54. Remove Dashboard Visual

```text
DELETE /api/workspaces/{workspace_id}/dashboards/{dashboard_id}/visuals/{dashboard_visual_id}
```

Removing a visual from a dashboard should not necessarily delete the underlying visualization.

---

# 55. Dashboard Filter API

Filters may be stored as dashboard configuration or represented through analytical query requests.

Conceptually:

```text
POST /api/workspaces/{workspace_id}/dashboards/{dashboard_id}/query
```

Request:

```json
{
  "filters": [
    {
      "field": "region",
      "operator": "equals",
      "value": "South"
    }
  ]
}
```

The exact endpoint model will be finalized with the visualization/filter specification.

---

# 56. AI Analyst API

## Ask Question

```text
POST /api/workspaces/{workspace_id}/ai/ask
```

Request:

```json
{
  "chat_session_id": "...",
  "question": "Which category generated the most revenue?"
}
```

Flow:

```text
Question
 ↓
Controlled context
 ↓
AI intent
 ↓
Validate intent
 ↓
Deterministic analytics
 ↓
Result
 ↓
AI explanation
```

---

# 57. AI Response Structure

Conceptual response:

```json
{
  "data": {
    "answer": "...",
    "intent": {},
    "analysis_result": {},
    "insights": [
      {
        "type": "calculated_metric",
        "text": "..."
      }
    ]
  }
}
```

The exact AI response schema will be finalized in the AI Architecture document.

---

# 58. Explain Visual API

```text
POST /api/workspaces/{workspace_id}/ai/explain
```

Request:

```json
{
  "visualization_id": "...",
  "question": "Explain the main trend."
}
```

The backend should build controlled context from:

```text
Visualization
Analysis Result
Dataset Metadata
Relevant Filters
```

The AI should not receive unnecessary raw data.

---

# 59. AI Insights API

```text
POST /api/workspaces/{workspace_id}/ai/insights
```

Used for controlled insight generation.

Potential insight categories:

```text
fact
calculated_metric
interpretation
hypothesis
```

The category must be visible to the user.

---

# 60. AI Provider Status

```text
GET /api/ai/status
```

or, if AI configuration is Workspace-specific:

```text
GET /api/workspaces/{workspace_id}/ai/status
```

Response:

```json
{
  "data": {
    "status": "online",
    "provider": "..."
  }
}
```

Possible statuses:

```text
online
degraded
unavailable
```

---

# 61. AI Unavailable Behavior

If:

```text
AI status = unavailable
```

Core endpoints remain functional:

```text
datasets
profile
prepare
validate
model
analytics
visualizations
dashboards
```

AI endpoints may return:

```json
{
  "error": {
    "code": "AI_UNAVAILABLE",
    "message": "AI assistance is currently unavailable."
  }
}
```

---

# 62. Chat Session API

## Create Session

```text
POST /api/workspaces/{workspace_id}/ai/sessions
```

## List Sessions

```text
GET /api/workspaces/{workspace_id}/ai/sessions
```

## Get Session

```text
GET /api/workspaces/{workspace_id}/ai/sessions/{session_id}
```

Messages should remain associated with their parent session.

---

# 63. Job / Processing API

Long-running operations may return:

```text
202 Accepted
```

Example:

```json
{
  "data": {
    "job_id": "...",
    "status": "processing"
  }
}
```

A generic job status endpoint may be:

```text
GET /api/jobs/{job_id}
```

The final job model should be decided after selecting the background-processing mechanism.

---

# 64. Processing Status

Possible states:

```text
queued
processing
completed
failed
cancelled
```

The frontend should not invent progress values.

If actual progress is unavailable, use an indeterminate progress indicator.

---

# 65. API Pagination

List endpoints should support pagination where collection size can grow.

Conceptual parameters:

```text
?page=1&page_size=50
```

Potential future cursor-based pagination can be introduced if required.

Large datasets should never rely on API pagination as a substitute for analytical storage.

---

# 66. Filtering and Search

Collection endpoints may support controlled filtering.

Example:

```text
GET /api/workspaces/{workspace_id}/datasets
    ?search=orders
    &status=ready
```

Filter syntax should remain intentionally constrained.

Do not expose arbitrary database query expressions through API parameters.

---

# 67. Idempotency

Operations involving external effects may benefit from idempotency keys.

Potential examples:

```text
Dataset upload
Export generation
Long-running processing
AI requests where duplicate execution is costly
```

The exact policy should be finalized during implementation.

---

# 68. Concurrency

The API should account for multiple users or browser tabs changing the same Workspace asset.

Potential mechanisms:

```text
updated_at comparison
version number
ETag / If-Match
optimistic concurrency
```

The final mechanism should be chosen during implementation.

---

# 69. API Security

Every endpoint must consider:

```text
Authentication
Authorization
Input validation
Rate limiting
Payload limits
File limits
Secret handling
Error sanitization
CORS
Security headers
```

File uploads require additional validation.

---

# 70. File Upload Security

CSV uploads must be treated as untrusted.

The API should validate:

```text
File extension
Content type
File size
Encoding
CSV structure
Potential malicious content
```

CSV formula injection defense must be applied when data could later be exported to spreadsheet-compatible formats.

---

# 71. Prompt Injection Protection

AI requests must keep these contexts separated:

```text
System instructions
    ↓
Application-controlled context
    ↓
User request
    ↓
Dataset content
```

Dataset cells are data.

They must not automatically become instructions.

---

# 72. Workspace Context Enforcement

A critical API invariant:

```text
Requested Workspace
        ↓
Requested Object
        ↓
Object must belong to Workspace
```

For example:

```text
GET /workspaces/A/datasets/123
```

must not return Dataset `123` if Dataset `123` belongs to Workspace `B`.

This must be checked server-side.

---

# 73. Cross-Workspace Reference Validation

For a relationship:

```text
source_dataset
target_dataset
```

both must belong to the same Workspace.

For a dashboard visual:

```text
dashboard
visualization
```

both must belong to the same Workspace.

For an AI session:

```text
chat_session
dataset / visualization / analysis context
```

the referenced objects must be authorized within the same Workspace.

---

# 74. API Layer Responsibilities

### Route Layer

Responsible for:

```text
HTTP
Request parsing
Response serialization
Status codes
```

### Authorization Layer

Responsible for:

```text
Identity
Membership
Permissions
Workspace access
```

### Application Service

Responsible for:

```text
Workflow orchestration
Transaction boundaries
Domain coordination
```

### Domain Service

Responsible for:

```text
Business rules
Data preparation
Analysis
Visualization validation
AI intent validation
```

### Repository / Infrastructure

Responsible for:

```text
PostgreSQL
Storage
DuckDB/Polars
Redis
External AI providers
```

---

# 75. API Transaction Boundaries

Operations that modify multiple metadata records should be treated as coordinated transactions where appropriate.

Example:

```text
Create Dataset
    ↓
Dataset metadata
    +
Data Source relationship
    +
Initial version
```

If a transaction fails, the system should not leave misleading partial metadata.

External file storage operations may require compensation/cleanup because they are not necessarily part of a PostgreSQL transaction.

---

# 76. API Versioning

Versioning should be introduced before the API becomes externally dependent.

Possible structure:

```text
/api/v1/...
```

The exact choice can be finalized before implementation.

The project should avoid silently changing response contracts once frontend development begins.

---

# 77. API Documentation

FastAPI should provide generated API documentation from the Pydantic request/response models.

The generated documentation should remain consistent with:

```text
API specification
Database schema
Frontend types
Tests
```

The API spec document remains the product-level contract.

---

# 78. API Definition of Done

Before implementation:

- Workspace endpoints are defined.
- Member endpoints are defined.
- Data source endpoints are defined.
- Dataset endpoints are defined.
- Profiling endpoint is defined.
- Preparation endpoint is defined.
- Validation endpoint is defined.
- Versioning behavior is defined.
- Modeling endpoints are defined.
- Analytics endpoint is defined.
- Visualization endpoints are defined.
- Dashboard endpoints are defined.
- AI Analyst endpoints are defined.
- AI availability behavior is defined.
- Error format is defined.
- Authorization boundary is defined.
- Cross-workspace isolation is defined.
- Long-running job behavior is defined.
- File-upload security requirements are defined.

---

# 79. Representative Complete Flow

A complete CSV-to-dashboard operation should look like:

```text
POST /api/workspaces
        ↓
Workspace created
        ↓
POST /api/workspaces/{id}/datasets/upload
        ↓
Dataset created
        ↓
GET /api/workspaces/{id}/datasets/{dataset}/profile
        ↓
POST /api/workspaces/{id}/datasets/{dataset}/prepare
        ↓
POST /api/workspaces/{id}/datasets/{dataset}/validate
        ↓
GET /api/workspaces/{id}/model
        ↓
POST /api/workspaces/{id}/model/relationships
        ↓
POST /api/workspaces/{id}/analytics/query
        ↓
POST /api/workspaces/{id}/visualizations
        ↓
POST /api/workspaces/{id}/dashboards
        ↓
POST /api/workspaces/{id}/dashboards/{dashboard}/visuals
        ↓
Dashboard available
```

AI can be inserted around the deterministic workflow without becoming a prerequisite.

---

# 80. Final API Principle

> **Every KaanViz API operation should have a clear Workspace context, a server-side authorization boundary, a deterministic domain responsibility, and a predictable result.**

The API should expose KaanViz capabilities—not database tables directly—and should preserve the separation between metadata, analytical computation, visualization, and optional AI.
