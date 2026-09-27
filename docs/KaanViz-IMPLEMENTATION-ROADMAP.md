# KaanViz — Implementation Roadmap

**Status:** Planning / Pre-Implementation  
**Purpose:** Define the implementation order for KaanViz so each architectural foundation is completed and verified before dependent capabilities are built.

---

## 1. Roadmap Purpose

KaanViz should be implemented in dependency order.

The core principle is:

```text
Architecture
   ↓
Setup
   ↓
Data Foundation
   ↓
Preparation
   ↓
Modeling
   ↓
Visualization
   ↓
Dashboard
   ↓
AI
   ↓
Production Readiness
```

AI must not be used as the foundation of the product.

---

## 2. Implementation Principles

1. Implement the requested phase only.
2. Complete tests before advancing dependent work.
3. Preserve the approved information architecture and design system.
4. Keep AI optional throughout implementation.
5. Keep raw data immutable.
6. Validate AI output before use.
7. Preserve workspace boundaries.
8. Avoid unnecessary dependencies.
9. Document meaningful architectural decisions.
10. Report incomplete or failed work honestly.

---

## 3. Phase 0 — Architecture

### Goal

Establish the complete technical and product foundation before implementation.

### Required outputs

- PRD / project specification
- architecture
- API specification
- database schema
- folder/repository structure
- data flow
- security model
- roadmap

### Existing planning documents

The current architecture pack includes:

```text
KAANVIZ_INITIAL_PROJECT_SPEC.md
KAANVIZ_UI_UX_PREFERENCE.md
KAANVIZ_WORKSPACE_FOUNDATION.md
KAANVIZ_USER_FLOWS.md

04-ARCHITECTURE.md
05-DATABASE-SCHEMA.md
06-API-SPEC.md
07-DATA-ARCHITECTURE.md
08-VISUALIZATION-SPEC.md
09-DASHBOARD-SPEC.md
10-AI-ARCHITECTURE.md
11-SECURITY-SPEC.md
12-TESTING-STRATEGY.md
13-OBSERVABILITY-PERFORMANCE.md
14-DEPLOYMENT-ARCHITECTURE.md
15-IMPLEMENTATION-ROADMAP.md
```

### Gate

Do not begin product implementation until the architecture decisions required by the current phase are documented.

---

## 4. Phase 1 — Setup

### Goal

Create the working development environment.

### Scope

- repository
- Next.js
- FastAPI
- PostgreSQL
- Docker Compose
- environment configuration
- base UI

### Expected architecture

```text
Next.js
   ↓
FastAPI
   ↓
PostgreSQL

Redis
DuckDB
Polars
Parquet
```

AI remains optional.

### Verification

Confirm:

- frontend starts
- backend starts
- PostgreSQL connects
- migrations can run
- Docker Compose works
- environment configuration works
- base UI loads
- API communication works

### Gate

Do not begin ingestion until the development foundation is stable.

---

## 5. Phase 2 — Ingestion

### Goal

Establish the first trusted boundary around uploaded data.

### Scope

- CSV upload
- file validation
- metadata extraction
- raw storage
- dataset registration

### Flow

```text
CSV
 ↓
File Validation
 ↓
Ingestion
 ↓
Raw Immutable Storage
 ↓
Dataset Registration
```

### Security requirements

- file size limits
- extension/MIME validation
- safe parsing
- malicious-file handling
- macro awareness

### Verification

Test:

- valid CSV
- malformed CSV
- oversized file
- unsupported file
- invalid content
- successful dataset registration
- raw immutability

### Gate

A dataset must be safely registered before profiling begins.

---

## 6. Phase 3 — Profiling

### Goal

Understand the dataset before preparation.

### Scope

- dataset profile
- statistics
- missing values
- cardinality
- type inference
- data-quality report
- date intelligence

### Flow

```text
Registered Dataset
       ↓
Profiling
       ↓
Profile Metrics
       ↓
Type / Semantic Understanding
       ↓
Quality Report
```

### Verification

Confirm:

- row count
- column count
- missing values
- cardinality
- type inference
- semantic type inference
- date-related intelligence
- quality findings

### Gate

Profiling must produce trustworthy metadata before preparation depends on it.

---

## 7. Phase 4 — Preparation

### Goal

Create validated processed dataset versions through deterministic transformations.

### Scope

- rename
- type changes
- null handling
- duplicate handling
- replacements
- date transformations
- calculated columns
- transformation history

### Flow

```text
Profiled Dataset
      ↓
Transformation
      ↓
Validation
      ↓
Processed Version
      ↓
Lineage / History
```

### Core rule

AI may recommend preparation actions, but deterministic application logic performs them.

### Verification

Test:

- valid transformation
- invalid transformation
- type conversion failure
- null handling
- duplicate handling
- date transformation
- calculated column
- lineage
- version creation
- raw immutability

### Gate

Only validated processed versions should become inputs to modeling and analytics.

---

## 8. Phase 5 — Modeling

### Goal

Represent relationships between datasets/tables.

### Scope

- table canvas
- manual relationships
- cardinality
- relationship validation
- AI relationship suggestions

### Flow

```text
Processed Dataset(s)
       ↓
Table Canvas
       ↓
Relationship Definition
       ↓
Validation
       ↓
Approved Relationship
```

### AI boundary

AI relationship suggestions remain suggestions.

The user must approve them before they become part of the model.

### Verification

Test:

- relationship creation
- cardinality
- invalid relationship
- incompatible fields
- user approval
- workspace isolation

### Gate

Validated model relationships must exist before advanced multi-table analysis depends on them.

---

## 9. Phase 6 — Visualization

### Goal

Turn validated analytical results into interactive visualizations.

### Scope

- visualization canvas
- Apache ECharts
- chart configuration
- drag/resize
- filters
- themes
- visualization specifications

### Pipeline

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

### Core visuals

- Bar
- Line
- Area
- Scatter
- Histogram
- Pie / Donut
- KPI
- Table
- Heatmap
- Combo

### Verification

Test:

- manual visual creation
- chart type changes
- aggregation changes
- filtering
- visualization specification validation
- rendering
- saving
- reopening
- invalid specifications

### Gate

The visualization system must work manually before AI-generated visualization is introduced.

---

## 10. Phase 7 — Dashboard

### Goal

Compose validated visuals into reusable analytical dashboards.

### Scope

- dashboard layout
- KPI cards
- multiple visuals
- tables
- text
- filters
- cross-filtering
- persistence
- themes

### Flow

```text
Validated Visuals
      ↓
Dashboard
      ↓
Grid Layout
      ↓
Shared Filters
      ↓
Cross-Filtering
      ↓
Persistence
```

### Verification

Test:

- create dashboard
- add visual
- add KPI
- add table
- arrange components
- resize components
- configure filters
- cross-filter
- change theme
- save
- reopen

### Gate

The dashboard system must work without AI.

---

## 11. Phase 8 — AI

### Goal

Add AI as a controlled analytical assistant on top of deterministic foundations.

### Scope

- provider abstraction
- insights
- prompt-to-visual
- Ask AI / AI Analyst
- Explain Visual
- multilingual output

### Required development sequence

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

### AI provider abstraction

```text
AIProvider
├── NVIDIAProvider
├── OpenAIProvider
├── AzureOpenAIProvider
└── FutureProvider
```

### AI context

AI receives controlled analytical context such as:

- dataset metadata
- profile metrics
- validated analysis results
- relevant columns
- current filters
- visualization specification
- user question

The model must not receive unrestricted database access.

### AI output validation

Required conceptual flow:

```text
LLM
 ↓
Pydantic Schema
 ↓
Allowed Values
 ↓
Dataset / Column Validation
 ↓
Application Object
```

Invalid output must be rejected safely.

---

## 12. Phase 8A — AI Analyst

### Goal

Allow natural-language analytical questions.

### Pipeline

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

### Security rule

AI must not execute arbitrary Python or SQL without validation.

### Verification

Test:

- valid question
- invalid field
- unsupported analysis
- invalid filter
- unauthorized dataset
- provider failure
- malformed AI output
- AI-disabled state

---

## 13. Phase 8B — Prompt-to-Visual

### Goal

Allow users to describe a visual in natural language.

### Pipeline

```text
Prompt
 ↓
Intent
 ↓
Dataset Validation
 ↓
Analysis Specification
 ↓
Visualization Specification
 ↓
Validation
 ↓
Chart
```

### Verification

Test:

- valid prompt
- invalid field
- invalid chart type
- invalid aggregation
- invalid filter
- malformed specification
- unauthorized resource

The LLM must produce structured visualization specifications rather than arbitrary frontend code.

---

## 14. Phase 8C — Explain Visual

### Goal

Explain an existing visualization using controlled context.

### Context

Send:

- chart specification
- aggregated results
- dataset metadata
- active filters
- relevant profile information

### Verification

Confirm:

- explanation matches selected visual context
- unrelated data is not included
- failures are handled
- hypotheses are clearly labeled

---

## 15. Phase 8D — AI Insights

### Goal

Surface useful observations from validated analytical results.

### Classification

Every insight should be classified as:

```text
Fact
Calculated Metric
Interpretation
Hypothesis
```

### Verification

Confirm:

- numerical facts originate from validated analysis
- calculations are reproducible
- interpretations are distinguished from facts
- hypotheses are clearly labeled

---

## 16. Phase 8E — Multilingual Output

### Goal

Allow AI explanations in supported languages.

Initial examples include:

- English
- Tamil
- Hindi

Translation must not change underlying facts or calculations.

### Verification

Compare the translated explanation against the same validated analytical result.

---

## 17. Phase 9 — Production Readiness

### Goal

Prepare the system for production operation.

### Scope

- security hardening
- rate limits
- observability
- performance
- deployment
- backups
- authentication

### Verification

Confirm:

- security boundaries
- API protection
- file validation
- workspace isolation
- observability
- performance behavior
- deployment behavior
- backup/recovery approach
- authentication where required

---

## 18. Critical End-to-End Path

The mandatory product-level E2E workflow is:

```text
Upload CSV
   ↓
Profile
   ↓
Change Type
   ↓
Clean
   ↓
Validate
   ↓
Save
   ↓
Create Relationship
   ↓
Create Chart
   ↓
Apply Filter
   ↓
Save Dashboard
```

This path must be tested with AI disabled.

It proves that the core product does not depend on AI.

---

## 19. Phase Completion Gate

Every phase follows:

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

Do not move to a dependent phase when a critical requirement of the current phase remains unverified.

---

## 20. Phase Dependency Map

```text
Phase 0 Architecture
        ↓
Phase 1 Setup
        ↓
Phase 2 Ingestion
        ↓
Phase 3 Profiling
        ↓
Phase 4 Preparation
        ↓
Phase 5 Modeling
        ↓
Phase 6 Visualization
        ↓
Phase 7 Dashboard
        ↓
Phase 8 AI
        ↓
Phase 9 Production
```

AI should not be moved earlier in this dependency chain merely to accelerate development.

---

## 21. Parallel Work Rules

Some work may be prepared in parallel without violating dependency order.

Examples:

- UI component foundations can be prepared during setup.
- Test infrastructure can be prepared before product features.
- API contract documentation can be refined while backend foundations are implemented.
- Security utilities can be prepared before the relevant feature.
- Visualization specification validation can be designed before the full Visualization Studio exists.

However, dependent product functionality must not be treated as complete until its prerequisites are verified.

---

## 22. Definition of Done

For each phase:

### Implementation

The requested functionality is implemented according to the approved architecture.

### Unit tests

Deterministic logic is covered.

### Integration tests

Subsystem interactions are verified.

### Manual verification

The intended user workflow is exercised.

### Error-path verification

Important failure and recovery paths are tested.

### Documentation

Architecture and implementation decisions are recorded.

### Status report

The actual state is reported:

```text
Complete
Partial
Blocked
Deferred
Failed
```

No status should imply completion when a required verification step was skipped.

---

## 23. Antigravity Execution Rules

Antigravity should receive implementation tasks in phase-sized increments.

Each task should explicitly state:

```text
Phase
Goal
Allowed Scope
Dependencies
Expected Files / Areas
Acceptance Criteria
Tests Required
Manual Verification
Error Paths
Out of Scope
```

This reduces accidental redesign and prevents implementation from expanding beyond the requested phase.

---

## 24. Out-of-Scope Protection

During implementation, do not silently introduce:

- collaboration
- complex authentication before the relevant phase
- RAG
- forecasting
- enterprise connectors
- streaming
- complex cloud infrastructure
- arbitrary AI execution
- unnecessary libraries

These are outside the MVP or later-phase scope unless explicitly brought into the roadmap.

---

## 25. Change Control

When a requirement appears to conflict with an existing architecture decision:

1. identify the conflict
2. document it
3. assess affected components
4. propose the smallest necessary change
5. obtain approval before redesigning the affected architecture

Do not silently resolve architectural conflicts by improvising a new design.

---

## 26. Milestone Structure

The roadmap can be treated as the following milestones:

### M0 — Architecture Ready

Architecture and planning pack complete.

### M1 — Development Environment Ready

Frontend, backend, database, Docker Compose, and base UI operational.

### M2 — Data Ingestion Ready

CSV can be validated, stored, and registered.

### M3 — Data Understanding Ready

Profiling and quality reporting operational.

### M4 — Data Preparation Ready

Deterministic transformations, validation, versions, and lineage operational.

### M5 — Modeling Ready

Relationships can be created and validated.

### M6 — Visualization Ready

Interactive visuals can be created and configured manually.

### M7 — Dashboard Ready

Dashboards can compose, filter, and persist visuals.

### M8 — AI Ready

Controlled AI workflows operate over deterministic foundations.

### M9 — Production Ready

Security, performance, observability, deployment, backups, and authentication requirements are addressed.

---

## 27. Final Implementation Order

The implementation order is intentionally:

```text
1. Architecture
2. Setup
3. Ingestion
4. Profiling
5. Preparation
6. Modeling
7. Visualization
8. Dashboard
9. AI
10. Production Readiness
```

The order should be treated as a dependency sequence rather than merely a project-management checklist.

---

## 28. North Star

KaanViz implementation should follow one rule:

> **Build the deterministic foundation first, verify each boundary, then add intelligence on top.**

The final product should be understandable, testable, secure, AI-optional, and extensible without requiring the implementation team to repeatedly redesign the foundation.
