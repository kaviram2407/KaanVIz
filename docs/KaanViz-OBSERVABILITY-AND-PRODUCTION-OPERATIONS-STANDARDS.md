# KaanViz — Observability & Production Operations Standards

## 1. Purpose

This document defines the operational standards for running KaanViz reliably from local development through production.

The goal is to make the system observable enough to answer:

- Is the application healthy?
- Are requests succeeding?
- How long do they take?
- Are datasets processing successfully?
- Are background jobs healthy?
- Are analytics operations slow or failing?
- Is the AI provider available?
- Which component caused a failure?
- Can an operator recover safely?

Observability must support the AI-optional architecture. Core KaanViz functionality must remain operational when an AI provider is unavailable.

---

## 2. Core Principles

1. Every important operation should be observable.
2. Logs should be structured.
3. Requests should have correlation identifiers.
4. Metrics should describe both success and failure.
5. Expensive data operations should expose duration and outcome.
6. Background jobs require explicit lifecycle visibility.
7. AI latency and failure rates must be measured separately from core application health.
8. Health checks must distinguish application health from dependency availability.
9. Observability must not expose secrets or unnecessary sensitive dataset contents.
10. Performance monitoring must protect the browser from unnecessarily large analytical results.
11. Production operations must include recovery and backup visibility.
12. Local development should remain simple enough for the free-first stack.

---

## 3. Production Architecture

The production architecture is conceptually:

```text
Frontend
   |
   v
API
   |
   v
Application Services
   |
   +--> PostgreSQL
   |
   +--> Redis
   |
   +--> Workers
   |
   +--> Object Storage
   |
   +--> DuckDB / Polars
   |
   +--> Optional AI Provider
```

The exact hosting platform may vary.

The operational model must not make a local AI runtime a mandatory dependency.

---

## 4. Structured Logging

Application logs should use structured fields rather than relying exclusively on free-form text.

Useful fields include:

```text
timestamp
level
service
environment
request_id
workspace_id
user_id where appropriate
dataset_id where appropriate
job_id where appropriate
operation
duration_ms
status
error_code
```

Sensitive values must be excluded or redacted.

---

## 5. Correlation IDs

Requests should have a correlation/request identifier.

Conceptually:

```text
Browser Request
      |
      v
API request_id
      |
      +--> Service log
      +--> Database operation log where appropriate
      +--> Processing job
      +--> Error record
```

This allows operators to trace a failure across application boundaries.

The correlation ID should be safe to expose to the user as a troubleshooting reference.

---

## 6. Error Tracking

Production error tracking should capture actionable application failures.

Useful information includes:

- Error type
- Safe message
- Stack trace in protected internal tooling
- Request ID
- Service
- Environment
- Relevant resource identifiers
- Timestamp
- Release/version

Error tracking must not become a mechanism for collecting full datasets or secrets.

---

## 7. API Latency

Measure API latency by endpoint and operation class.

Useful dimensions include:

- Endpoint
- HTTP method
- Status class
- Success/failure
- Duration
- Workspace/resource context where appropriate

Avoid uncontrolled high-cardinality metric labels.

The goal is to identify slow API paths without turning the metrics system into an unbounded metadata store.

---

## 8. Processing Duration

Dataset processing operations should expose duration.

Examples:

```text
Upload processing
Profiling
Preparation
Validation
Parquet generation
Export generation
Analytics query
```

A useful operational record might include:

```text
operation
dataset_id
version_id
started_at
completed_at
duration_ms
status
rows_processed where appropriate
```

Avoid logging full row contents.

---

## 9. Dataset Processing Metrics

Useful metrics include:

- Datasets uploaded
- Upload failures
- Profiling duration
- Preparation duration
- Validation failures
- Versions successfully created
- Versions failed
- Rows processed
- Processing throughput
- Storage generation failures

These metrics help identify whether failures are isolated or systemic.

---

## 10. Background Job Observability

Background jobs require explicit state.

Conceptually:

```text
queued
  |
  v
running
  |
  +--> failed
  |
  v
completed
```

The application should be able to determine:

- Job type
- Job ID
- Dataset/version
- Workspace
- Start time
- Completion time
- Duration
- Status
- Retry count where applicable
- Safe failure reason

---

## 11. Job Queue Metrics

For Redis-backed or equivalent job processing, monitor:

- Queue depth
- Job throughput
- Job age
- Failure count
- Retry count
- Worker availability
- Processing duration

A growing queue can indicate:

- Insufficient worker capacity
- Provider/storage latency
- A processing regression
- A failed worker pool
- Unexpected workload

---

## 12. AI Observability

AI operations must be observable independently from core application operations.

Track:

- AI request count
- AI latency
- AI success rate
- AI failure rate
- Provider availability
- Validation failure rate
- Retry count
- Timeout count

Where appropriate, distinguish:

```text
Provider unavailable
Provider timeout
Provider rejected request
Invalid structured output
Application validation failure
```

Do not log prompts or dataset contents by default when they contain sensitive data.

---

## 13. AI Availability States

The product defines three conceptual AI states:

```text
Online
Degraded
Unavailable
```

Observability should make these states visible to the application.

A provider outage must not be represented as total KaanViz application failure.

Core capabilities should continue operating where possible.

---

## 14. Health Checks

Health endpoints should distinguish different levels of health.

### Liveness

Answers:

> Is this process running?

### Readiness

Answers:

> Can this service safely receive work?

### Dependency health

Provides visibility into dependencies such as:

- PostgreSQL
- Redis
- Object storage
- Worker subsystem
- Optional AI provider

An AI provider being unavailable should not necessarily make the entire application unready.

---

## 15. Dependency Health

Dependency health should identify:

```text
Healthy
Degraded
Unavailable
```

without exposing credentials or provider secrets.

For example:

```text
PostgreSQL: healthy
Redis: healthy
Storage: healthy
AI Provider: unavailable
```

The UI may surface AI availability separately from core product health.

---

## 16. Database Observability

PostgreSQL operations should be observable through appropriate application and infrastructure metrics.

Useful signals include:

- Connection availability
- Query duration
- Connection pool pressure
- Migration status
- Transaction failures
- Storage growth
- Backup status

Do not log complete SQL queries when doing so could expose sensitive user data unless a controlled diagnostic mode explicitly permits it.

---

## 17. Redis Observability

Redis is used for capabilities such as:

- Caching
- Job coordination
- Background processing support

Monitor:

- Availability
- Connection failures
- Memory usage
- Queue depth where applicable
- Job latency
- Evictions where applicable

The exact Redis responsibilities should remain explicit rather than allowing uncontrolled application-state storage.

---

## 18. Storage Observability

Monitor storage operations such as:

- Upload success
- Upload failure
- Artifact creation
- Artifact retrieval
- Artifact deletion/cleanup
- Storage latency
- Storage availability

Important artifacts include:

```text
Raw source
Processed Parquet
Profiling metadata
Transformation metadata
Lineage metadata
Export artifacts
```

A dataset version should not be marked ready if required artifacts were not successfully produced.

---

## 19. Analytics Observability

DuckDB/Polars analytical operations should expose:

- Query duration
- Result size
- Rows processed where appropriate
- Failure count
- Timeout count
- Operation type

Examples:

```text
profile
aggregate
group_by
filter
join
time_series
KPI
```

The browser should receive bounded analytical results rather than unnecessarily large raw datasets.

---

## 20. Browser Performance Boundary

Preferred flow:

```text
Raw Data
   |
   v
Analytical Computation
   |
   v
Aggregated Result
   |
   v
Visualization
```

Avoid:

```text
Raw Data
   |
   v
Browser
   |
   v
Visualization
```

when the raw dataset is large.

Observability should make result-size problems visible.

---

## 21. Visualization Performance

Monitor or diagnose:

- Render duration
- Large result payloads
- Excessive visual count
- Expensive chart types
- Cross-filter latency
- Dashboard load time

A visualization should consume the smallest result set that satisfies the analytical requirement.

---

## 22. Dashboard Performance

Dashboards may contain multiple visuals.

Operational concerns include:

- Number of visuals
- Query count
- Query duration
- Cross-filter propagation time
- Initial load duration
- Re-render frequency
- Result payload size

The dashboard should not independently download the same large dataset repeatedly for every visual when shared analytical results or caching can safely reduce work.

---

## 23. Caching Observability

Where caching is introduced, measure:

- Hit rate
- Miss rate
- Eviction rate where applicable
- Cache latency
- Invalidations
- Stale-data incidents

Cache keys must preserve workspace/resource isolation.

Caching must not make data freshness behavior ambiguous.

---

## 24. Performance Budgets

Performance targets should be established for important workflows.

Examples of measurable targets:

```text
Workspace load
Dataset list
Dataset preview
Profile generation
Preparation operation
Analytics query
Visualization render
Dashboard load
AI request
```

Exact numeric budgets should be finalized using representative datasets and deployment conditions rather than invented prematurely.

---

## 25. Accessibility and Operations

Operational performance must not create inaccessible UI states.

Loading, failure, and degraded states should remain:

- Keyboard accessible
- Clearly labeled
- Screen-reader understandable
- Visually distinguishable without relying only on color

Charts should provide textual summaries where possible.

Reduced-motion behavior must remain respected.

---

## 26. Production Environments

KaanViz should distinguish at least:

```text
Local
Demo
Production
```

Environment configuration must control:

- Database
- Redis
- Storage
- AI provider
- Logging
- Error tracking
- CORS
- Security settings
- Resource limits

Secrets must not be copied between environments casually.

---

## 27. Deployment Observability

A deployment should expose enough information to determine:

- Application version
- Database migration revision
- Worker version
- Frontend version
- Configuration environment
- Dependency health

A deployment is not complete merely because containers start.

Post-deployment validation must verify actual application behavior.

---

## 28. Database Migrations in Operations

Before production schema changes:

- Confirm backup/recovery status.
- Verify migration revision.
- Apply migration.
- Validate schema.
- Validate critical application paths.
- Monitor errors after rollout.

Migration failures must be visible and must not be hidden by generic startup messages.

---

## 29. Backups

Production operations must provide visibility into backup state.

At minimum, operators should know:

- Whether backups are configured
- Last successful backup
- Backup failure state
- Recovery procedure
- Backup retention policy

The exact backup provider and retention values depend on the deployment environment.

---

## 30. Recovery Readiness

A production deployment should document recovery for:

- PostgreSQL failure
- Redis failure
- Object storage failure
- Worker failure
- API failure
- Frontend failure
- AI provider outage

The AI provider is an optional dependency, so AI failure should have a graceful degraded path rather than a full product outage.

---

## 31. Incident Response

A production incident should be traceable through:

```text
Alert
  |
  v
Correlation ID / Error
  |
  v
Affected Service
  |
  v
Affected Resource
  |
  v
Recovery Action
  |
  v
Verification
```

Incident records should identify:

- What failed
- When it failed
- What was affected
- Current status
- Recovery action
- Verification result

Avoid collecting unnecessary sensitive dataset content during incident investigation.

---

## 32. Observability for Data Integrity

Operational monitoring must also detect data-integrity problems.

Important signals include:

- Failed dataset versions
- Missing processed artifacts
- Metadata/artifact mismatch
- Unexpected schema changes
- Failed transformations
- Failed relationship validation
- Failed analytical queries

A system can be technically "up" while producing invalid analytical results, so health monitoring must include relevant data-processing signals.

---

## 33. Security and Observability

Observability must follow the security standards.

Never log:

- API keys
- Passwords
- Access tokens
- Database credentials
- Full sensitive datasets
- Unnecessary AI prompts containing sensitive information

Prefer:

```text
dataset_id
version_id
request_id
operation
status
duration
error_code
```

over raw content.

---

## 34. Local Development

Local development should remain simple.

The intended free-first local stack includes:

```text
Next.js
FastAPI
PostgreSQL
Redis
DuckDB
Polars
Parquet
Docker Compose
Optional AI
```

Developers should be able to inspect:

- API logs
- Worker logs
- Database status
- Redis status
- Storage artifacts
- Job status

without requiring production-grade observability infrastructure.

OpenTelemetry may be introduced when production infrastructure requires it.

---

## 35. Production Tooling

The source architecture permits production observability tooling to evolve.

Potential categories include:

- Structured application logging
- Error tracking
- Metrics
- Distributed tracing
- OpenTelemetry
- Infrastructure monitoring

The exact vendor/tooling choice is not fixed by the product specification.

Tooling should be introduced when it provides operational value without creating unnecessary local-development complexity.

---

## 36. Testing Observability

Test that:

- Request IDs are created and propagated.
- Important errors are recorded.
- Sensitive fields are redacted.
- Job state transitions are observable.
- Processing durations are captured.
- AI failure states are distinguishable.
- Health endpoints behave correctly.
- AI outage does not incorrectly mark core KaanViz functionality unavailable.

---

## 37. Production Readiness Checklist

Before production readiness:

- [ ] Structured logging works.
- [ ] Request correlation works.
- [ ] Error tracking is configured.
- [ ] API latency is measurable.
- [ ] Dataset processing duration is measurable.
- [ ] Job queue metrics are visible.
- [ ] AI latency/failure metrics are visible.
- [ ] Database health is visible.
- [ ] Redis health is visible.
- [ ] Storage health is visible.
- [ ] Worker health is visible.
- [ ] Liveness/readiness behavior is defined.
- [ ] Backup status is visible.
- [ ] Recovery procedures are documented.
- [ ] Sensitive information is excluded from logs.
- [ ] Browser result-size behavior is controlled.
- [ ] Critical E2E workflows have been verified.
- [ ] AI-disabled workflows have been verified.

---

## 38. Antigravity Operations Rules

Antigravity must:

1. Add structured logs for important operations.
2. Preserve request/job correlation.
3. Never log secrets.
4. Never log entire datasets as a debugging shortcut.
5. Expose meaningful processing failures.
6. Preserve AI/core-health separation.
7. Avoid making AI availability a core application health dependency.
8. Add observability when introducing new background jobs.
9. Add duration/error signals for expensive operations.
10. Preserve bounded browser result sizes.
11. Keep local development operationally simple.
12. Document new production dependencies.
13. Verify health behavior after infrastructure changes.
14. Verify backup/recovery implications for production changes.
15. Report operational limitations honestly.

---

## 39. Definition of Done

An operationally significant feature is complete only when:

- [ ] Its success and failure states are observable.
- [ ] Important operations have structured logs.
- [ ] Relevant durations are measurable.
- [ ] Background jobs expose lifecycle state.
- [ ] Sensitive information is protected.
- [ ] Health behavior is defined.
- [ ] AI degradation is separated from core application health.
- [ ] Performance impact is measured where appropriate.
- [ ] Data-integrity failure modes are observable.
- [ ] Relevant tests pass.
- [ ] Production deployment implications are documented.

---

## 40. Source Alignment

This document operationalizes the KaanViz requirements for structured logging, error tracking, API latency, processing duration, AI latency/failure rate, job queue metrics, dataset-processing metrics, optional OpenTelemetry, accessibility, performance, production architecture, and the requirement that local AI not become a mandatory hosting dependency.

Where the source document does not prescribe exact metric names, numeric performance budgets, monitoring vendors, backup retention periods, or incident-management tooling, those remain deployment and implementation decisions.
