# KaanViz — Observability & Performance Specification

**Status:** Planning / Pre-Implementation  
**Purpose:** Define how KaanViz will measure system behavior, diagnose failures, and preserve responsive analytical performance from ingestion through visualization and dashboards.

---

## 1. Purpose

KaanViz processes uploaded datasets through multiple stages:

```text
Upload
  ↓
Ingestion
  ↓
Profiling
  ↓
Preparation
  ↓
Modeling
  ↓
Analytics
  ↓
Visualization
  ↓
Dashboard
  ↓
Optional AI
```

Observability must make these stages understandable during development and production.

Performance must preserve the core architectural boundary:

```text
Raw data
  ↓
Analytical computation
  ↓
Aggregated result
  ↓
Visualization
```

The browser should not become the primary analytical engine.

---

## 2. Observability Principles

1. **Observe important boundaries, not every implementation detail.**
2. **Use structured logs rather than unstructured debugging output.**
3. **Measure API latency and processing duration.**
4. **Measure dataset processing behavior.**
5. **Measure AI latency and failure rate separately from core analytics.**
6. **Measure background job behavior.**
7. **Never use observability as a reason to expose sensitive data.**
8. **Performance decisions must preserve correctness.**
9. **AI performance must not determine whether core analytics is usable.**
10. **Observability should support diagnosis, not become a source of unnecessary data exposure.**

---

## 3. Observability Architecture

Conceptually:

```text
KaanViz Application
       │
       ├── Structured Logs
       ├── Error Tracking
       ├── API Metrics
       ├── Processing Metrics
       ├── Job Metrics
       ├── Dataset Metrics
       └── AI Metrics
              │
              ▼
       Observability System
```

OpenTelemetry can be added when production infrastructure requires it.

---

## 4. Structured Logging

Application logs should use structured records rather than relying primarily on free-form strings.

Useful fields may include:

- timestamp
- severity
- service
- operation
- request/correlation ID
- workspace context where appropriate
- dataset context where appropriate
- duration
- status
- error category

Logs must avoid unnecessary sensitive dataset content.

---

## 5. Logging Levels

The exact logging framework can be selected during implementation.

Conceptually:

### Debug

Detailed development information.

### Info

Normal important application events.

### Warning

Unexpected but recoverable conditions.

### Error

Operation failures requiring investigation.

Production logging should avoid excessive debug-level output.

---

## 6. Request Correlation

Important operations should have a request/correlation identifier.

Conceptually:

```text
Frontend request
      ↓
Request ID
      ↓
API
      ↓
Service
      ↓
Database / storage / worker
```

The same correlation context should help connect related logs and errors.

---

## 7. API Latency

Measure API latency for important endpoint categories.

Examples:

- workspace operations
- dataset operations
- profiling
- preparation
- analytics
- visualization
- dashboard
- AI requests

Useful measurements include:

- request duration
- success/failure
- status category
- operation type

Latency should be analyzed by endpoint and operation rather than only as one application-wide number.

---

## 8. Processing Duration

Measure duration for expensive data operations.

Examples:

```text
File ingestion
Profiling
Transformation
Validation
Analytical query
Export
```

Conceptually:

```text
Operation started
      ↓
Processing
      ↓
Operation completed
      ↓
Duration recorded
```

Failures should still produce useful timing information for diagnosis.

---

## 9. Dataset Processing Metrics

Dataset processing metrics should help explain the cost of working with data.

Potential measurements include:

- upload size
- processing duration
- row count
- column count
- profiling duration
- transformation duration
- analytical query duration
- result size

Sensitive values should not be recorded merely because they are available.

---

## 10. Job Queue Metrics

Redis is part of the intended local/production architecture for background processing.

When background jobs are introduced, observe:

- queued jobs
- running jobs
- completed jobs
- failed jobs
- retry behavior
- processing duration
- queue latency

Useful job categories may include:

- ingestion
- profiling
- preparation
- export
- other expensive processing

---

## 11. AI Observability

AI must be observable separately from core application behavior.

Track:

- AI latency
- AI success/failure rate
- provider
- model identifier where appropriate
- request type
- validation outcome

Potential AI request types:

- AI Analyst
- Prompt-to-Visual
- Explain Visual
- Insight generation

AI observability must not imply that AI is required for core product health.

---

## 12. AI Failure Rate

AI provider failures should be measured independently.

Conceptually:

```text
Core analytics health
        ≠
AI provider health
```

This allows the product team to identify whether a problem is:

- KaanViz core infrastructure
- analytics processing
- AI provider
- AI output validation
- network/provider latency

---

## 13. Error Tracking

Error tracking should capture failures that require investigation.

Useful metadata:

- operation
- error category
- request/correlation ID
- service
- duration
- workspace context where appropriate
- relevant resource identifier where safe

Do not include:

- provider secrets
- database credentials
- unnecessary raw dataset content
- sensitive user data

---

## 14. Error Categories

Errors should be classified where practical.

Examples:

```text
ValidationError
AuthorizationError
NotFoundError
ProcessingError
StorageError
AnalyticsError
RendererError
ProviderError
TimeoutError
RateLimitError
```

The exact error taxonomy should remain aligned with `06-API-SPEC.md`.

---

## 15. Health Signals

The production system should distinguish core service health from optional AI health.

Conceptually:

```text
KaanViz Health
├── API
├── Database
├── Storage
├── Redis / Jobs
├── Analytics
└── AI Provider
```

An AI provider failure should not automatically mean that KaanViz core analytics is unhealthy.

---

## 16. Performance Principles

The preferred data path is:

```text
Raw data
   ↓
Analytical computation
   ↓
Aggregated result
   ↓
Visualization
```

Avoid:

```text
Raw data
   ↓
Browser
   ↓
Browser-side heavy computation
   ↓
Visualization
```

The backend/analytical layer should perform expensive computation whenever practical.

---

## 17. Browser Data Boundary

Large raw datasets should not be unnecessarily shipped to the browser.

The browser should primarily receive:

- metadata
- bounded analytical results
- visualization specifications
- dashboard configuration
- interaction state

This improves:

- performance
- memory usage
- responsiveness
- data exposure control

---

## 18. Analytical Query Performance

DuckDB, Polars, Pandas, and Parquet form the analytical stack.

Performance work should favor the appropriate engine for the operation rather than moving large datasets between systems unnecessarily.

Analytical results should be aggregated before reaching visualization components when the requested visual does not require raw rows.

---

## 19. Result Size Control

Analytical endpoints should avoid returning unbounded result sets.

Where appropriate:

- aggregate
- filter
- limit
- paginate
- summarize

The result size should match the visualization or analytical question.

---

## 20. Visualization Performance

Visualization performance should account for:

- result size
- chart complexity
- number of dashboard components
- filter updates
- cross-filtering
- renderer cost

The visualization system should avoid repeatedly recomputing unchanged analytical results.

---

## 21. Dashboard Performance

Dashboards can contain multiple analytical components.

Performance principles:

1. Avoid loading unnecessary data.
2. Keep individual result sets bounded.
3. Avoid redundant analytical queries.
4. Update only affected components after filter changes where possible.
5. Load expensive components lazily where practical.
6. Preserve responsive layout behavior.

One slow visual should not unnecessarily prevent unrelated dashboard content from becoming usable.

---

## 22. Cross-Filtering Performance

Cross-filtering may trigger multiple analytical updates.

Conceptually:

```text
User interaction
      ↓
Filter context
      ↓
Affected visuals identified
      ↓
Analytical requests
      ↓
Updated results
      ↓
Targeted visual updates
```

The system should avoid recomputing unrelated visuals when the filter context does not affect them.

---

## 23. Profiling Performance

Profiling can be expensive for large datasets.

The implementation should measure:

- profiling duration
- dataset size
- row/column count
- processing failures

The profiling implementation should avoid unnecessary repeated scans where possible.

Correctness remains more important than premature optimization.

---

## 24. Preparation Performance

Preparation operations should be deterministic and measurable.

Measure expensive operations such as:

- type conversion
- duplicate handling
- null handling
- date transformations
- calculated columns

Transformation history should not require repeatedly recomputing unrelated historical steps when a cached/versioned result can safely be reused.

---

## 25. Storage Performance

The storage architecture separates raw and processed data.

Conceptually:

```text
Raw immutable storage
        +
Processed Parquet storage
        ↓
Analytical access
```

Performance decisions should preserve:

- raw immutability
- version lineage
- workspace isolation

Storage optimization must not silently change the meaning of a dataset version.

---

## 26. Caching

Caching may be introduced where useful.

Potential candidates:

- repeated metadata requests
- repeated profiling results
- repeated analytical results
- dashboard configuration

Cached results must remain correctly scoped to:

- workspace
- dataset/version
- analysis context
- filters
- relevant configuration

Caching must never become a workspace-isolation bypass.

---

## 27. Background Processing

Expensive operations may use background jobs.

Potential candidates:

- ingestion
- profiling
- preparation
- export
- other long-running processing

The frontend should expose appropriate job/loading states rather than appearing frozen.

---

## 28. Job Reliability

Background jobs should have observable lifecycle states.

Conceptually:

```text
Queued
  ↓
Running
  ↓
Succeeded
```

or:

```text
Queued
  ↓
Running
  ↓
Failed
  ↓
Retry / Recovery
```

Retry behavior should be controlled and appropriate to the operation.

---

## 29. Frontend Performance

The frontend should avoid unnecessary work.

Relevant principles:

- lazy-load expensive functionality where practical
- avoid unnecessary re-renders
- avoid repeatedly fetching unchanged data
- keep dashboard interactions responsive
- avoid rendering unbounded tables
- keep visualization configuration lightweight

Frontend performance must not bypass server-side validation or analytical boundaries.

---

## 30. Loading Experience

Performance includes perceived responsiveness.

Major operations should provide appropriate states:

```text
Idle
 ↓
Loading / Processing
 ↓
Success
```

or:

```text
Idle
 ↓
Loading / Processing
 ↓
Error
 ↓
Recovery
```

Long-running operations should communicate that processing is occurring.

---

## 31. Accessibility and Performance

Performance optimizations must preserve accessibility.

Do not:

- remove meaningful labels
- remove keyboard access
- rely only on animation
- make loading states inaccessible
- use color as the only status indicator

The project accessibility targets include:

- keyboard navigation
- visible focus states
- semantic HTML
- accessible labels
- screen-reader-friendly controls
- sufficient contrast
- reduced motion support

Charts should provide textual summaries where possible.

---

## 32. Performance Testing

Performance testing should be included in the testing strategy.

Measure representative workflows such as:

```text
Upload
 → Profile
 → Prepare
 → Analyze
 → Visualize
 → Dashboard
```

Measurements should include where relevant:

- processing duration
- API latency
- analytical query duration
- result size
- dashboard load behavior
- AI latency

The goal is to identify architectural bottlenecks rather than optimize isolated numbers without context.

---

## 33. Performance Regression Testing

Once baseline measurements exist, important regressions should be detectable.

Potential regression areas:

- upload processing
- profiling
- transformations
- analytical queries
- visualization rendering
- dashboard loading
- filter response
- AI response latency

Performance regressions should be investigated before they become architectural debt.

---

## 34. Production Readiness

Production readiness is the final development phase.

It includes:

- security hardening
- rate limits
- observability
- performance
- deployment
- backups
- authentication

The observability system should be sufficiently useful to diagnose failures in these areas.

---

## 35. Deployment Observability

The production architecture is conceptually:

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
   └── AI Provider
```

Observability should help identify which layer is responsible when an operation fails or becomes slow.

---

## 36. Backup and Recovery Visibility

Production readiness includes backups.

Observability should make failures in backup/recovery operations visible when backup infrastructure is introduced.

The exact backup implementation is outside this specification and should be defined during production deployment planning.

---

## 37. Observability Definition of Done

### Logging

- structured logging exists
- important operations are represented
- correlation/request IDs are available where appropriate
- sensitive values are excluded

### Errors

- error tracking exists
- errors have useful categories
- diagnostic context is available
- sensitive information is protected

### Metrics

- API latency measured
- processing duration measured
- dataset processing metrics available
- job queue metrics available
- AI latency/failure rate available

### Performance

- large raw datasets are not unnecessarily sent to browser
- analytical results are bounded
- visualization performance is measured
- dashboard performance is measured
- cross-filtering behavior is monitored

### Production

- observability covers core services
- AI health is separate from core health
- rate limits are observable
- deployment failures can be diagnosed
- backup/recovery failures are visible when implemented

---

## 38. Implementation Rule for Antigravity

Antigravity must not optimize KaanViz by weakening its architectural boundaries.

Do not:

- send huge raw datasets to the browser for convenience
- bypass analytical services with browser-side computation
- remove validation to improve latency
- cache data without workspace/context scoping
- hide failures to make metrics look better
- make AI latency a prerequisite for core product readiness

Do:

- measure before optimizing
- preserve correctness
- preserve workspace isolation
- keep AI health separate from core health
- document meaningful performance decisions
- add production observability when the relevant infrastructure exists

---

## 39. North Star

KaanViz performance should follow one principle:

> **Compute close to the data, send only what the user needs, and make every important system boundary observable.**

A fast dashboard is useful only when the result remains correct, secure, explainable, and reproducible.
