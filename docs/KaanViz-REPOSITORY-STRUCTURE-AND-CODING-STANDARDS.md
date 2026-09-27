# KaanViz — Repository Structure & Coding Standards

## 1. Purpose

This document defines the repository organization and coding conventions for KaanViz.

The structure follows the approved architecture:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Grid Layout
- Apache ECharts
- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic

The repository should make product boundaries, data boundaries, and architectural responsibilities easy to understand.

---

## 2. Repository Top Level

Recommended structure:

```text
kaanviz/
├── frontend/
├── backend/
├── docs/
├── infra/
├── scripts/
├── tests/
├── .env.example
├── docker-compose.yml
├── README.md
└── ...
```

Responsibilities:

| Directory | Responsibility |
|---|---|
| `frontend/` | Next.js/React application |
| `backend/` | FastAPI application and backend services |
| `docs/` | Architecture, product, API, UX, and implementation documentation |
| `infra/` | Local/deployment infrastructure configuration |
| `scripts/` | Development and maintenance utilities |
| `tests/` | Cross-cutting or repository-level tests |
| `.env.example` | Safe configuration template |
| `docker-compose.yml` | Local development service orchestration |

Do not place application logic directly in the repository root.

---

## 3. Frontend Architecture

The approved frontend stack is:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Grid Layout
- Apache ECharts

Recommended structure:

```text
frontend/
├── app/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── data/
│   ├── preparation/
│   ├── modeling/
│   ├── visualization/
│   ├── dashboard/
│   └── ai/
├── features/
│   ├── datasets/
│   ├── preparation/
│   ├── modeling/
│   ├── visualization/
│   ├── dashboards/
│   └── ai/
├── lib/
└── styles/
```

---

## 4. Frontend Directory Responsibilities

### `app/`

Own:

- Next.js routing
- Route-level layouts
- Page entry points
- Route-level loading states
- Route-level error boundaries
- Workspace-aware route structure

Do not put large domain implementations directly into route files.

---

### `components/ui/`

Contains reusable UI primitives and shadcn/ui-based components.

Examples:

- Button
- Input
- Select
- Dialog
- Dropdown
- Tabs
- Tooltip
- Table
- Badge
- Card

These components should remain domain-agnostic where practical.

---

### `components/layout/`

Contains application shell components such as:

- Global header
- Workspace navigation
- Sidebar
- Page header
- Command interface
- Content containers

---

### Domain component directories

The following directories contain reusable domain-specific components:

```text
components/
├── data/
├── preparation/
├── modeling/
├── visualization/
├── dashboard/
└── ai/
```

Domain components should represent reusable UI behavior rather than entire page implementations.

---

## 5. Feature Modules

Feature modules contain domain-specific client behavior and composition.

Example:

```text
features/datasets/
├── components/
├── hooks/
├── api/
├── types/
├── utils/
└── index.ts
```

Feature modules may contain:

- Feature hooks
- Feature-specific API clients
- Feature types
- Feature state
- Feature utilities
- Feature composition

Avoid importing implementation details from unrelated feature modules.

Prefer explicit public exports.

---

## 6. Frontend Layering

A practical frontend dependency direction is:

```text
app
 ↓
features
 ↓
domain components
 ↓
shared UI
 ↓
shared utilities
```

Lower-level shared components should not depend on higher-level product features.

For example:

```text
components/ui
```

should not import from:

```text
features/ai
features/dashboards
```

---

## 7. Frontend State Separation

KaanViz should separate three major state categories.

### Server State

Examples:

- Datasets
- Profiles
- Relationships
- Dashboards
- Analysis results

Server state should represent backend-owned data and lifecycle.

---

### UI State

Examples:

- Selected visual
- Open panels
- Modals
- Theme
- Local layout interaction
- Temporary UI state

---

### Workspace State

Examples:

- Active dataset
- Active dashboard
- Active model
- Filters
- Current workspace context

Zustand may be used for complex client workspace state.

Do not use one global state store as an undifferentiated container for all application state.

---

## 8. TypeScript Standards

Use TypeScript for frontend application code.

Prefer explicit domain types for:

- Dataset metadata
- Dataset columns
- Dataset versions
- Transformations
- Relationships
- Analysis results
- Visualization specifications
- Dashboard layouts
- AI requests/responses
- Workspace state

Avoid broad use of `any`.

When external data is untrusted or runtime-generated, validate it before treating it as a trusted TypeScript domain object.

Types should describe application contracts rather than compensate for missing validation.

---

## 9. API Client Boundaries

Frontend API access should be centralized through feature or shared API modules.

Avoid scattering raw request logic across page components.

A typical pattern is:

```text
UI
 ↓
Feature action/hook
 ↓
API client
 ↓
FastAPI
```

API response handling should account for:

- Success
- Validation failure
- Authorization failure
- Not found
- Conflict
- Rate limiting
- Server failure
- Network failure

---

## 10. Backend Architecture

The approved backend stack is:

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic

Recommended structure:

```text
backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── data/
│   ├── ai/
│   ├── analytics/
│   ├── visualization/
│   └── workers/
├── tests/
└── migrations/
```

---

## 11. Backend Directory Responsibilities

### `api/`

Own:

- FastAPI routes
- Request handling
- Authentication/authorization boundaries
- Response construction
- API-level validation

Routes should remain thin.

Business logic belongs in services or domain modules rather than being embedded directly in route handlers.

---

### `core/`

Own cross-cutting infrastructure such as:

- Configuration
- Security primitives
- Logging
- Request context
- Shared application infrastructure

---

### `models/`

Contains SQLAlchemy persistence models.

Models should represent database persistence rather than becoming a dumping ground for business logic.

---

### `schemas/`

Contains Pydantic request/response/domain-boundary schemas.

Schemas should define explicit contracts between API boundaries and application services.

---

### `services/`

Contains application/business workflows.

Examples:

- Dataset service
- Preparation service
- Workspace service
- Dashboard service
- Visualization service

Services coordinate domain operations without exposing unnecessary persistence details to API routes.

---

### `data/`

Contains data ingestion and data-processing concerns.

Examples:

- File parsing
- Profiling
- Type inference
- Preparation
- Storage interaction
- Dataset version processing

---

### `ai/`

Contains AI provider and AI workflow infrastructure.

Examples:

- Provider abstraction
- Provider adapters
- Prompt/context construction
- Structured output handling
- AI validation
- AI availability handling

AI implementation must remain optional to core analytics.

---

### `analytics/`

Contains deterministic analytical operations.

Examples:

- DuckDB queries
- Polars processing
- Aggregation
- Metrics
- Analytical result generation

Deterministic analysis should remain independent from AI provider availability.

---

### `visualization/`

Contains visualization-specific backend logic.

Examples:

- Visualization specification validation
- Analysis-to-visual specification conversion
- Visualization metadata
- Renderer-related preparation

---

### `workers/`

Contains background processing tasks where required.

Examples:

- Long-running dataset processing
- Export jobs
- Expensive analytical jobs
- Other asynchronous operations

---

## 12. Backend Layering

Prefer the following direction:

```text
API
 ↓
Service / application workflow
 ↓
Domain processing
 ↓
Persistence / analytics / external providers
```

Avoid tightly coupling FastAPI route handlers directly to:

- SQLAlchemy internals
- AI provider implementations
- Storage implementations
- Complex analytical execution

---

## 13. Data and Workspace Boundaries

Workspace scope must remain explicit.

Backend operations involving workspace-owned resources should validate:

```text
Authenticated user
      ↓
Workspace membership/authorization
      ↓
Requested resource belongs to workspace
      ↓
Operation
```

Do not rely on client-provided workspace identifiers without server-side authorization and ownership checks.

---

## 14. Naming Conventions

Use clear domain terminology consistently.

Preferred terms include:

- Workspace
- Data Source
- Dataset
- Dataset Version
- Transformation
- Relationship
- Analysis
- Visualization
- Dashboard
- AI Analyst

Avoid introducing multiple names for the same concept.

### TypeScript

Prefer:

```text
PascalCase
```

for types/components.

Prefer:

```text
camelCase
```

for variables/functions.

### Python

Prefer:

```text
snake_case
```

for functions, variables, and modules.

Use:

```text
PascalCase
```

for classes.

---

## 15. File Naming

Use predictable names.

Examples:

```text
dataset-card.tsx
dataset-preview.tsx
visualization-studio.tsx
dashboard-grid.tsx
workspace-service.py
dataset-service.py
visualization-schema.py
```

Avoid vague filenames such as:

```text
helpers.ts
misc.py
stuff.tsx
utils2.ts
```

unless their scope is genuinely broad and documented.

---

## 16. Components

React components should have focused responsibilities.

Prefer:

```text
DatasetPreview
```

over a single component that owns:

- Upload
- Profiling
- Preparation
- Modeling
- Visualization
- Dashboard logic

Large screens should compose smaller components.

---

## 17. Hooks

Hooks should represent reusable client behavior.

Examples:

```text
useDataset
useDatasetProfile
useWorkspace
useDashboard
useVisualization
useFilters
```

Avoid hooks that become large containers for unrelated business domains.

---

## 18. API and Domain Types

Do not duplicate the same contract across many files.

When practical:

```text
API contract
   ↓
Validated response
   ↓
Domain type
   ↓
UI
```

If a frontend type intentionally differs from the backend representation, document the transformation.

---

## 19. Error Handling

Errors should be handled at the correct layer.

```text
Low-level failure
      ↓
Domain/application error
      ↓
API error contract
      ↓
User-facing state
```

Do not expose raw backend exceptions directly to users.

Use the Error States & Recovery specification for user-facing behavior.

---

## 20. Validation

Validate data at trust boundaries.

Important boundaries include:

- File uploads
- API requests
- API responses where external/untrusted
- Database input
- Storage metadata
- AI-generated structures
- Visualization specifications
- Dashboard configuration

Do not assume that TypeScript or Python type annotations alone provide runtime validation.

---

## 21. Dependency Management

Dependencies should be intentional.

Before adding one:

1. Check whether the existing stack already solves the requirement.
2. Check whether an internal utility is sufficient.
3. Consider bundle/runtime impact.
4. Consider security and maintenance.
5. Document significant architectural dependencies.

Do not introduce libraries merely because they simplify a small implementation.

---

## 22. Environment Configuration

Environment-specific configuration should be externalized.

Use:

```text
.env
.env.local
.env.example
```

as appropriate to the environment and framework.

Never commit real credentials.

`.env.example` should contain safe placeholders and document required variables.

---

## 23. Formatting and Quality

Code should be consistently formatted and linted according to the project's configured tooling.

Before completing a phase, run applicable:

- Formatter
- Linter
- Type checker
- Unit tests
- Integration tests
- End-to-end tests

Do not silently ignore failures.

---

## 24. Comments and Documentation

Prefer clear code over excessive comments.

Comments should explain:

- Non-obvious architectural decisions
- Important constraints
- Security considerations
- Performance tradeoffs
- Temporary compatibility behavior

Do not write comments that merely restate obvious code.

Important architectural decisions belong in project documentation as well.

---

## 25. Testing Organization

Frontend tests should live close to their feature/component when practical.

Backend tests should reflect application/domain boundaries.

Example:

```text
backend/tests/
├── api/
├── services/
├── data/
├── analytics/
├── visualization/
└── ai/
```

Tests should verify behavior rather than implementation details whenever possible.

---

## 26. Antigravity Repository Rules

When modifying the repository:

1. Read the relevant specification first.
2. Identify the requested phase.
3. Inspect existing files before creating replacements.
4. Preserve the approved repository structure.
5. Avoid unnecessary dependencies.
6. Do not replace technologies without justification.
7. Keep AI optional.
8. Preserve raw-data immutability.
9. Validate AI-generated structures.
10. Add tests for important behavior.
11. Run the relevant tests.
12. Report failures honestly.
13. Never claim verification that was not performed.
14. Keep secrets out of source control.
15. Document important architectural decisions.

---

## 27. Recommended Change Workflow

For a normal implementation task:

```text
Specification
     ↓
Existing repository inspection
     ↓
Identify affected layer
     ↓
Implement smallest coherent change
     ↓
Add/update tests
     ↓
Format/lint/type-check
     ↓
Run relevant tests
     ↓
Manual verification
     ↓
Update documentation
     ↓
Report status
```

Avoid broad refactors during feature implementation unless the refactor is required by the approved architecture.

---

## 28. Repository DoD

A repository change is complete when:

- The requested behavior is implemented.
- The intended architecture is preserved.
- Types/contracts are valid.
- Important tests are present.
- Relevant tests have been run.
- Error paths have been considered.
- Accessibility has been considered for UI changes.
- Security boundaries have been preserved.
- Documentation has been updated when needed.
- Verification status is reported honestly.

---

## 29. Final Principle

The KaanViz repository should make the architecture visible through its structure.

A developer should be able to determine from the repository:

- Where UI belongs
- Where domain behavior belongs
- Where API contracts belong
- Where deterministic analytics belong
- Where AI belongs
- Where persistence belongs
- Where tests belong
- Where architectural decisions are documented

The repository should support the same principle as the product:

> Clear structure, controlled intelligence, and predictable behavior.
