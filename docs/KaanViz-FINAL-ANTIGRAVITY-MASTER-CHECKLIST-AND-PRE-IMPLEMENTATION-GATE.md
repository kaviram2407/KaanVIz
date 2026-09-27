# KaanViz — Final Antigravity Master Checklist & Pre-Implementation Gate

## 1. Purpose

This is the final execution gate for KaanViz before implementation begins.

It consolidates the project's:

- Product principles
- Workspace architecture
- UX/UI rules
- Data architecture
- API architecture
- Database schema
- Visualization architecture
- Dashboard architecture
- AI architecture
- Security standards
- Testing strategy
- Observability standards
- Deployment standards
- Coding standards
- Antigravity implementation rules

This document is intended to prevent architectural drift, premature implementation, accidental redesign, and unverified claims.

---

# 2. North Star

KaanViz is an AI-powered, AI-optional analytics and visualization workspace.

The implementation must preserve:

```text
Reliable Data Engine
        ↓
Deterministic Analytics
        ↓
Visualization
        ↓
Dashboard
        ↓
AI Enhancement
```

AI is an enhancement, not a dependency.

The product must remain useful when the AI provider is unavailable.

---

# 3. Non-Negotiable Product Principles

Before implementation, confirm:

- [ ] AI is optional.
- [ ] Deterministic analysis happens before AI interpretation.
- [ ] Uploaded data is treated as untrusted content.
- [ ] Dataset content is never treated as instructions.
- [ ] LLMs generate structured intent/specifications rather than arbitrary HTML/JS.
- [ ] Users can approve AI suggestions.
- [ ] Users can edit AI suggestions.
- [ ] Users can reject AI suggestions.
- [ ] Users can reverse AI-applied changes where supported.
- [ ] Raw data remains immutable.
- [ ] Processed data is stored separately.
- [ ] Every major phase is tested and verified before the next phase begins.

---

# 4. Pre-Implementation Gate

Do not begin feature implementation until the following are understood.

## Architecture

- [ ] Frontend architecture is understood.
- [ ] Backend architecture is understood.
- [ ] PostgreSQL metadata role is understood.
- [ ] DuckDB/Polars analytical role is understood.
- [ ] Parquet processed-data role is understood.
- [ ] Storage abstraction is understood.
- [ ] AI provider abstraction is understood.
- [ ] Workspace is treated as a first-class boundary.

## Data

- [ ] Data Source vs Dataset distinction is understood.
- [ ] Raw vs processed data distinction is understood.
- [ ] Dataset versioning is understood.
- [ ] Transformation lineage is understood.
- [ ] Physical vs semantic type distinction is understood.
- [ ] Browser data boundary is understood.

## Product

- [ ] MVP scope is understood.
- [ ] Deferred features are understood.
- [ ] Navigation/information architecture is understood.
- [ ] Visualization Studio responsibilities are understood.
- [ ] Dashboard responsibilities are understood.
- [ ] AI Analyst responsibilities are understood.

## Security

- [ ] Uploaded files are treated as untrusted.
- [ ] Cell contents are treated as untrusted.
- [ ] Prompt injection boundary is understood.
- [ ] AI output validation is understood.
- [ ] Secrets remain server-side.
- [ ] Workspace authorization is understood.
- [ ] CSV formula-injection risk is understood.

---

# 5. Repository Gate

Before coding:

- [ ] Repository structure is established.
- [ ] Frontend directory structure is established.
- [ ] Backend directory structure is established.
- [ ] Shared types/contracts location is established.
- [ ] Test directories are established.
- [ ] Documentation location is established.
- [ ] Environment configuration is established.
- [ ] `.gitignore` protects local secrets/artifacts.
- [ ] Docker Compose structure is established.

Do not create arbitrary directories merely because they are convenient for one feature.

---

# 6. Technology Gate

The planned stack is:

```text
Frontend
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
React Grid Layout
Apache ECharts

Backend
Python
FastAPI
Pydantic
SQLAlchemy
Alembic

Data
PostgreSQL
DuckDB
Polars
Pandas
Parquet

Infrastructure
Redis
Docker Compose
Storage abstraction

AI
Provider abstraction
Optional NVIDIA / OpenAI / Azure OpenAI / future providers
```

Before replacing a technology:

- [ ] The replacement is necessary.
- [ ] The architectural impact is understood.
- [ ] The reason is documented.
- [ ] The replacement is approved where required.

Do not replace technologies casually.

---

# 7. Workspace Gate

Workspace is a first-class product boundary.

Expected conceptual structure:

```text
KaanViz
  ↓
Workspaces
  ↓
Workspace
  ├── Overview
  ├── Data
  ├── Prepare
  ├── Model
  ├── Visualize
  ├── Dashboards
  ├── AI Analyst
  └── Workspace Management
```

Before implementing workspace-scoped features:

- [ ] Workspace identity is explicit.
- [ ] Workspace-aware routing is defined.
- [ ] Data is workspace-scoped.
- [ ] Workspace authorization is server-side.
- [ ] Client-provided workspace IDs are not trusted as authorization.
- [ ] Workspace context is propagated to relevant services.

---

# 8. Data Source Gate

Initial source:

```text
CSV
```

Future sources may include:

```text
Excel
Databricks
Snowflake
Cloud warehouses
Object storage
APIs
Databases
```

Before connector implementation:

- [ ] Source abstraction exists.
- [ ] Provider-specific logic stays inside connector boundaries.
- [ ] Credentials remain server-side.
- [ ] Source provenance is preserved.
- [ ] Connector errors are normalized.
- [ ] Core analytics does not depend on provider-specific behavior.

---

# 9. Ingestion Gate

CSV ingestion must support:

- [ ] File upload.
- [ ] File-size validation.
- [ ] Extension/MIME validation.
- [ ] Safe parsing.
- [ ] Malformed-file handling.
- [ ] Raw storage.
- [ ] Dataset registration.
- [ ] Provenance.
- [ ] Error reporting.

Verify:

```text
Upload
 ↓
Validate
 ↓
Store raw
 ↓
Register dataset
```

Do not skip validation because the test file is trusted.

---

# 10. Profiling Gate

Profiling must produce useful deterministic information.

Verify support for:

- [ ] Row count.
- [ ] Column count.
- [ ] Missing values.
- [ ] Unique/cardinality information.
- [ ] Numeric statistics.
- [ ] Date intelligence.
- [ ] Type inference.
- [ ] Data-quality signals.

Profiling must work without AI.

---

# 11. Type System Gate

Preserve:

```text
Physical Type
        +
Semantic Type
```

Verify:

- [ ] Physical type is captured.
- [ ] Semantic type is inferred.
- [ ] User overrides are possible where specified.
- [ ] Type inference is explainable.
- [ ] Type changes are deterministic.
- [ ] Type history is recorded.

---

# 12. Preparation Gate

Preparation must be deterministic.

Required categories include:

- [ ] Rename columns.
- [ ] Type changes.
- [ ] Null handling.
- [ ] Duplicate handling.
- [ ] Value replacement.
- [ ] Date transformations.
- [ ] Calculated columns.
- [ ] Transformation history.

Verify:

```text
Input Version
     ↓
Transformation
     ↓
Validation
     ↓
New Version
```

Never silently overwrite raw data.

---

# 13. Lineage Gate

Every important transformation should be traceable.

Verify that lineage can answer:

- [ ] What changed?
- [ ] Which column changed?
- [ ] What was the original state?
- [ ] What is the resulting state?
- [ ] Which operation was applied?
- [ ] When was it applied?
- [ ] Who/system applied it?
- [ ] Which dataset version resulted?

---

# 14. Modeling Gate

Verify:

- [ ] Dataset/model representation exists.
- [ ] Relationships can be created manually.
- [ ] Cardinality is represented.
- [ ] Relationships are validated.
- [ ] Workspace isolation is enforced.
- [ ] AI relationship suggestions are optional.
- [ ] User approval remains authoritative.

---

# 15. Analytics Gate

The analytics layer must remain deterministic.

Preferred flow:

```text
Dataset
 ↓
DuckDB / Polars / Pandas
 ↓
Validated analytical result
 ↓
Visualization / Dashboard / AI
```

Verify:

- [ ] Aggregations are deterministic.
- [ ] Filters are deterministic.
- [ ] Time-series analysis is deterministic.
- [ ] KPI calculations are deterministic.
- [ ] Large data is aggregated before browser delivery.
- [ ] Result size is bounded.
- [ ] Analytical failures are observable.

---

# 16. Visualization Gate

Required pipeline:

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

Verify:

- [ ] Visualization specification is structured.
- [ ] Specification is validated.
- [ ] ECharts is the primary renderer.
- [ ] Plotly/Matplotlib are used only where appropriate.
- [ ] Visualization does not require arbitrary frontend code.
- [ ] Data roles are explicit.
- [ ] Aggregation is explicit.
- [ ] Sorting is explicit.
- [ ] Filters are explicit.
- [ ] Provenance is available.
- [ ] Explain Visual uses controlled context.

---

# 17. Visualization Studio Gate

Verify the planned three-pane model:

```text
Toolbar
Data Pane | Canvas | Properties
```

Required capabilities include:

- [ ] Drag.
- [ ] Resize.
- [ ] Duplicate.
- [ ] Delete.
- [ ] Chart type change.
- [ ] Aggregation configuration.
- [ ] Filter configuration.
- [ ] Theme configuration.
- [ ] Explanation/provenance.

Do not redesign the information architecture without approval.

---

# 18. Dashboard Gate

Verify:

- [ ] Grid-based layout.
- [ ] Charts.
- [ ] KPI cards.
- [ ] Tables.
- [ ] Text blocks where supported.
- [ ] Filters.
- [ ] Cross-filtering.
- [ ] Themes.
- [ ] Persistence.
- [ ] Responsive behavior.
- [ ] Accessibility.

Dashboard layout state and visualization definition should remain conceptually separate.

---

# 19. Filter and Cross-Filtering Gate

Verify:

- [ ] Filters have explicit scope.
- [ ] Filter state is represented structurally.
- [ ] Filter changes trigger deterministic analytical updates.
- [ ] Cross-filtering propagates only to compatible visuals.
- [ ] Filter failures are visible.
- [ ] Large filter operations remain bounded.

---

# 20. AI Gate

AI development must follow:

```text
Data Engine
    ↓
Visualization Engine
    ↓
Dashboard
    ↓
AI Context
    ↓
AI Provider
    ↓
Structured AI Output
    ↓
Validation
    ↓
UI
```

Do not reverse this order by building the product around an LLM first.

---

# 21. AI Provider Gate

Verify:

- [ ] Provider abstraction exists.
- [ ] NVIDIA can fit the abstraction.
- [ ] OpenAI can fit the abstraction.
- [ ] Azure OpenAI can fit the abstraction.
- [ ] Future providers can fit the abstraction.
- [ ] Credentials remain server-side.
- [ ] Provider availability is represented.
- [ ] Online state exists.
- [ ] Degraded state exists.
- [ ] Unavailable state exists.
- [ ] Core product continues without AI.

---

# 22. AI Context Gate

AI context must distinguish:

```text
System Instructions
User Request
Dataset Content
```

Verify:

- [ ] Dataset content remains data.
- [ ] Dataset text cannot become application instructions.
- [ ] Sensitive data is minimized.
- [ ] Only relevant analytical context is provided.
- [ ] AI context is workspace-scoped.

---

# 23. AI Output Gate

AI output is untrusted until validated.

Verify:

- [ ] Schema validation.
- [ ] Semantic validation.
- [ ] Analytical validation.
- [ ] Application validation.
- [ ] Unsupported operations rejected.
- [ ] Arbitrary HTML/JS rejected.
- [ ] Arbitrary Python rejected.
- [ ] Arbitrary shell commands rejected.
- [ ] Unsafe SQL execution is not introduced.

---

# 24. AI Analyst Gate

Required conceptual flow:

```text
Question
 ↓
Intent
 ↓
Required Analysis
 ↓
Validated Computation
 ↓
Result
 ↓
Explanation
```

The model must not replace deterministic computation.

---

# 25. AI Insight Gate

Supported insight categories:

```text
Fact
Calculated Metric
Interpretation
Hypothesis
```

Verify:

- [ ] Facts are grounded in computed results.
- [ ] Calculated metrics are reproducible.
- [ ] Interpretations are distinguishable from facts.
- [ ] Hypotheses are clearly labeled.
- [ ] Unsupported claims are not presented as computed facts.

---

# 26. Security Gate

Before a phase is considered secure:

- [ ] File validation exists.
- [ ] File size limits exist.
- [ ] Safe parsing exists.
- [ ] Macro execution is impossible.
- [ ] Cell contents are treated as untrusted.
- [ ] Prompt injection defenses exist.
- [ ] Secrets are protected.
- [ ] CORS is controlled.
- [ ] Inputs are validated.
- [ ] Outputs are validated.
- [ ] Rate limiting exists where required.
- [ ] Secure headers are configured.
- [ ] Audit logging is implemented where required.
- [ ] CSV formula injection is addressed.

---

# 27. Database Gate

Verify:

- [ ] PostgreSQL stores metadata rather than large raw analytical rows.
- [ ] SQLAlchemy models are defined.
- [ ] Alembic migrations exist.
- [ ] Workspace relationships are defined.
- [ ] Dataset versions are represented.
- [ ] Transformation lineage is represented.
- [ ] Relationships are represented.
- [ ] Analysis results are represented.
- [ ] Visualization metadata is represented.
- [ ] Dashboard metadata is represented.
- [ ] AI session/message metadata is represented where required.

---

# 28. Migration Gate

Before a schema change:

- [ ] Alembic migration exists.
- [ ] Migration has a descriptive name.
- [ ] Existing data impact is understood.
- [ ] Compatibility is understood.
- [ ] Backfill behavior is defined if needed.
- [ ] Destructive effects are reviewed.
- [ ] Migration is tested.
- [ ] Recovery strategy is understood.

---

# 29. Storage Gate

Verify the abstraction:

```text
StorageProvider
├── LocalStorageProvider
├── R2StorageProvider
├── S3StorageProvider
└── AzureBlobStorageProvider
```

Verify:

- [ ] Raw data is immutable.
- [ ] Processed data is separate.
- [ ] Metadata is separate.
- [ ] Storage references are version-aware.
- [ ] Storage failures are observable.
- [ ] Temporary artifacts are cleaned up.
- [ ] Workspace isolation is preserved.

---

# 30. Export Gate

Verify:

- [ ] Export source is explicit.
- [ ] Export scope is authorized.
- [ ] CSV formula injection is addressed.
- [ ] Filenames are safe.
- [ ] Large exports are bounded.
- [ ] Temporary artifacts are protected.
- [ ] Export works with AI disabled.
- [ ] Export failures are recoverable.

---

# 31. Frontend State Gate

Maintain separation between:

```text
Server State
UI State
Workspace State
```

Verify:

- [ ] Server data is not duplicated unnecessarily into global UI state.
- [ ] Workspace state is explicit.
- [ ] UI-only state remains local where practical.
- [ ] Async loading/error states are modeled.
- [ ] AI availability state is separate from core application state.

Zustand may be used where appropriate, but state tooling must serve the architecture rather than dictate it.

---

# 32. UI/UX Gate

Verify:

- [ ] KaanViz information architecture is preserved.
- [ ] Professional analytics-studio character is preserved.
- [ ] Design system is consistent.
- [ ] Typography is consistent.
- [ ] Spacing uses the defined system.
- [ ] Light and dark modes are supported.
- [ ] Semantic colors are used.
- [ ] Loading states exist.
- [ ] Empty states exist.
- [ ] Error states exist.
- [ ] Recovery actions exist.
- [ ] Destructive actions require appropriate confirmation.
- [ ] AI state is clearly communicated.
- [ ] Provenance/trust signals are visible where relevant.

---

# 33. Accessibility Gate

Verify:

- [ ] Keyboard navigation.
- [ ] Visible focus.
- [ ] Semantic HTML.
- [ ] Accessible labels.
- [ ] Screen-reader-friendly controls.
- [ ] Sufficient contrast.
- [ ] Reduced-motion support.
- [ ] Accessible dialogs.
- [ ] Accessible forms.
- [ ] Accessible tables.
- [ ] Textual chart summaries where possible.

---

# 34. Performance Gate

Verify the preferred pipeline:

```text
Raw Data
 ↓
Analytical Computation
 ↓
Aggregated Result
 ↓
Visualization
```

Avoid shipping huge raw datasets to the browser.

Check:

- [ ] API latency.
- [ ] Processing duration.
- [ ] Query duration.
- [ ] Result size.
- [ ] Visualization render cost.
- [ ] Dashboard load cost.
- [ ] Cross-filter latency.
- [ ] Background-job duration.

---

# 35. Observability Gate

Verify:

- [ ] Structured logging.
- [ ] Request correlation IDs.
- [ ] Error tracking.
- [ ] API latency measurement.
- [ ] Dataset processing metrics.
- [ ] Job queue metrics.
- [ ] AI latency metrics.
- [ ] AI failure metrics.
- [ ] Database health.
- [ ] Redis health.
- [ ] Storage health.
- [ ] Worker health.
- [ ] Liveness/readiness behavior.

Never claim a health or performance check was performed when it was not.

---

# 36. Testing Gate

Required testing layers:

```text
Unit
 ↓
Integration
 ↓
API / Contract
 ↓
Frontend
 ↓
E2E
 ↓
Manual Verification
 ↓
Error-Path Verification
```

Verify critical E2E:

```text
Upload
 ↓
Profile
 ↓
Type
 ↓
Clean
 ↓
Validate
 ↓
Save
 ↓
Relationship
 ↓
Chart
 ↓
Filter
 ↓
Dashboard
```

Also verify the same core workflow with AI disabled.

---

# 37. Error-Path Gate

Every major feature must test:

- [ ] Loading.
- [ ] Empty.
- [ ] Validation failure.
- [ ] Network failure.
- [ ] Server failure.
- [ ] Dependency failure.
- [ ] Permission failure.
- [ ] Invalid state.
- [ ] Recovery/retry.
- [ ] Cancellation where applicable.

AI features additionally require:

- [ ] Provider unavailable.
- [ ] Provider timeout.
- [ ] Invalid AI output.
- [ ] Validation rejection.
- [ ] Safe fallback.

---

# 38. Production Gate

Before production readiness:

- [ ] Security hardening.
- [ ] Rate limiting.
- [ ] Observability.
- [ ] Performance verification.
- [ ] Deployment validation.
- [ ] Backup configuration.
- [ ] Recovery procedure.
- [ ] Authentication when required.
- [ ] Authorization.
- [ ] Secret management.
- [ ] Migration verification.
- [ ] AI outage behavior.

---

# 39. Phase Gate

KaanViz implementation follows:

```text
Phase 0 — Architecture
        ↓
Phase 1 — Setup
        ↓
Phase 2 — Ingestion
        ↓
Phase 3 — Profiling
        ↓
Phase 4 — Preparation
        ↓
Phase 5 — Modeling
        ↓
Phase 6 — Visualization
        ↓
Phase 7 — Dashboard
        ↓
Phase 8 — AI
        ↓
Phase 9 — Production Readiness
```

Do not advance merely because code exists.

---

# 40. Definition of Done

Every phase must pass this sequence:

```text
Implementation
      ↓
Unit Tests
      ↓
Integration Tests
      ↓
Manual Verification
      ↓
Error-Path Verification
      ↓
Documentation
      ↓
Status Report
```

Only after all steps are complete should the next phase begin.

---

# 41. Status Reporting Gate

Every completed implementation phase must report:

### Implemented

What was actually built.

### Tested

Which tests actually ran.

### Manually verified

Which workflows were actually exercised.

### Error paths verified

Which failure states were actually checked.

### Known limitations

What remains incomplete.

### Deferred work

What was intentionally not implemented.

### Documentation

Which documents were updated.

Never substitute:

```text
"should work"
```

for:

```text
"verified"
```

---

# 42. Antigravity Master Rules

Antigravity must follow these rules for every implementation task:

1. Read the relevant specification before coding.
2. Implement only the requested phase.
3. Preserve the information architecture.
4. Preserve the design system.
5. Do not redesign without approval.
6. Avoid unnecessary dependencies.
7. Do not replace technologies without justification.
8. Keep AI optional.
9. Keep raw data immutable.
10. Validate AI-generated structures.
11. Add tests for important functionality.
12. Run tests after implementation.
13. Perform manual verification.
14. Verify error paths.
15. Report failures honestly.
16. Never claim verification that was not performed.
17. Keep secrets out of source control.
18. Preserve workspace boundaries.
19. Preserve dataset lineage.
20. Preserve connector abstraction.
21. Preserve deterministic analytics.
22. Preserve structured visualization specifications.
23. Preserve AI/core separation.
24. Document important architectural decisions.

---

# 43. Out-of-Scope Protection

Do not expand the current implementation phase merely because a future feature is architecturally possible.

Examples of deferred areas include:

- Collaboration
- Complex authentication
- RAG
- Forecasting
- Enterprise connectors
- Streaming
- Complex cloud infrastructure

The architecture should allow future expansion without requiring those features to be implemented prematurely.

---

# 44. Change-Control Gate

If implementation reveals a need to change architecture:

1. Stop before silently redesigning.
2. Identify the affected requirement.
3. Identify the proposed change.
4. Identify downstream impact.
5. Update the relevant architecture document.
6. Record the decision.
7. Obtain required approval.
8. Then implement.

Do not let code silently become the new architecture.

---

# 45. AI-Specific Master Gate

Before any AI feature is accepted:

- [ ] Deterministic underlying capability exists.
- [ ] AI provider abstraction exists.
- [ ] AI context is controlled.
- [ ] Dataset content is separated from instructions.
- [ ] Structured output schema exists.
- [ ] Output validation exists.
- [ ] Application validation exists.
- [ ] AI failure is recoverable.
- [ ] AI-disabled behavior is verified.
- [ ] User control is preserved.
- [ ] Provenance is preserved where relevant.

---

# 46. Final Pre-Implementation Approval

Before starting the first implementation phase, confirm:

- [ ] Product specification is available.
- [ ] Workspace architecture is defined.
- [ ] User flows are defined.
- [ ] UI/UX preferences are defined.
- [ ] Architecture is documented.
- [ ] Database schema is documented.
- [ ] API specification is documented.
- [ ] Data architecture is documented.
- [ ] Visualization specification is documented.
- [ ] Dashboard specification is documented.
- [ ] AI architecture is documented.
- [ ] Security specification is documented.
- [ ] Testing strategy is documented.
- [ ] Observability/performance strategy is documented.
- [ ] Deployment architecture is documented.
- [ ] Implementation roadmap is documented.
- [ ] Antigravity rules are documented.
- [ ] Error/recovery states are documented.
- [ ] Accessibility is documented.
- [ ] Repository standards are documented.
- [ ] Development environment is documented.
- [ ] API/service coding standards are documented.
- [ ] Data-processing standards are documented.
- [ ] Visualization/dashboard coding standards are documented.
- [ ] AI coding standards are documented.
- [ ] Security coding standards are documented.
- [ ] Export/file safety standards are documented.
- [ ] Connector standards are documented.
- [ ] Migration/versioning standards are documented.
- [ ] Observability/operations standards are documented.

---

# 47. Final Implementation Order

The implementation should now proceed in this order:

```text
01. Architecture
02. Repository / Development Setup
03. Workspace Foundation
04. Data Ingestion
05. Profiling
06. Preparation
07. Modeling
08. Analytics
09. Visualization
10. Dashboard
11. AI Context
12. AI Provider
13. Structured AI Output
14. AI Validation
15. AI UI
16. Security Hardening
17. Observability
18. Performance
19. Deployment
20. Production Readiness
```

The detailed phase roadmap remains authoritative for the exact scope of each phase.

---

# 48. Final North-Star Verification

Before declaring KaanViz implementation-ready, verify the complete conceptual architecture:

```text
                         KaanViz
                            |
                      Workspace Layer
                            |
        +-------------------+-------------------+
        |                   |                   |
      Data              Prepare              Model
        |                   |                   |
        +-------------------+-------------------+
                            |
                       Data Engine
                            |
                    DuckDB / Polars
                            |
                    Analytical Results
                            |
                 +----------+----------+
                 |                     |
           Visualization           AI Context
                 |                     |
            Dashboard             AI Provider
                 |                     |
                 +----------+----------+
                            |
                       User Control
```

The architecture must preserve:

```text
Reliable data
     +
Deterministic analysis
     +
Structured visualization
     +
User-controlled workflows
     +
Optional AI
```

---

# 49. Final Sign-Off Checklist

### Product

- [ ] The MVP scope is understood.
- [ ] Deferred scope is protected.
- [ ] User control is preserved.

### Architecture

- [ ] Frontend/backend boundaries are clear.
- [ ] Workspace boundary is clear.
- [ ] Data lifecycle is clear.
- [ ] Storage boundary is clear.
- [ ] Connector boundary is clear.
- [ ] AI boundary is clear.

### Data

- [ ] Raw data is immutable.
- [ ] Processed data is separate.
- [ ] Versions are traceable.
- [ ] Transformations are traceable.
- [ ] Analytics are deterministic.

### Visualization

- [ ] Specifications are structured.
- [ ] Rendering is validated.
- [ ] Dashboards are compositional.
- [ ] Filters are deterministic.

### AI

- [ ] AI is optional.
- [ ] AI context is controlled.
- [ ] AI output is validated.
- [ ] AI cannot execute arbitrary frontend/backend code.
- [ ] AI-disabled workflows work.

### Security

- [ ] Untrusted data boundaries are defined.
- [ ] Secrets are protected.
- [ ] Authorization is defined.
- [ ] File security is defined.
- [ ] Export security is defined.
- [ ] Prompt injection defense is defined.

### Quality

- [ ] Tests are defined.
- [ ] E2E flows are defined.
- [ ] Error paths are defined.
- [ ] Accessibility is defined.
- [ ] Performance is defined.
- [ ] Observability is defined.

### Operations

- [ ] Local environment is defined.
- [ ] Deployment architecture is defined.
- [ ] Migrations are defined.
- [ ] Backups are defined.
- [ ] Recovery is defined.

### Execution

- [ ] Antigravity rules are understood.
- [ ] Phase gates are understood.
- [ ] Definition of Done is understood.
- [ ] Status-report requirements are understood.
- [ ] No implementation begins outside the requested phase.

---

# 50. Final Rule

The most important execution rule is:

> Do not confuse implementation progress with verified completion.

KaanViz should advance phase by phase only after implementation, tests, manual verification, error-path verification, documentation, and status reporting are complete.

The architecture is the contract.

The deterministic data engine is the foundation.

AI is the enhancement.

The user remains in control.
