# KaanViz — Visualization & Dashboard Coding Standards

## 1. Purpose

This document defines implementation standards for KaanViz visualization and dashboard features.

The visualization architecture must preserve a clear separation between:

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

Dashboards compose validated visualization and other supported components without taking ownership of the underlying analytical logic.

---

## 2. Visualization Stack

Recommended visualization technologies:

- Apache ECharts for primary interactive charts
- Plotly for advanced interactive/Python workflows
- Matplotlib for Python/static workflows

Apache ECharts should be the primary interactive rendering path for the core visualization experience.

---

## 3. Visualization Architecture

Keep these concerns separate:

### Dataset

Defines the available data and dataset version.

### Analysis

Defines the deterministic analytical computation.

### Visualization Specification

Defines how the analytical result should be represented visually.

### Validation

Checks that the visualization specification is valid for the available data/result.

### Renderer

Converts the validated specification into the supported visual output.

Do not collapse these responsibilities into a single chart component.

---

## 4. Core Visual Types

The initial visualization system supports:

- Bar
- Line
- Area
- Scatter
- Histogram
- Pie/Donut
- KPI
- Table
- Heatmap
- Combo

New visual types should be introduced through the visualization specification and renderer architecture rather than through one-off implementations.

---

## 5. Visualization Recommendation Rules

Recommendations should be based on analytical usefulness, not only datatype.

Initial guidance:

| Analytical pattern | Suggested visual |
|---|---|
| Category + measure | Bar |
| Time + measure | Line |
| Distribution | Histogram |
| Numeric + numeric | Scatter |
| Part-to-whole | Donut |
| Correlation matrix | Heatmap |
| Single metric | KPI |

These are recommendation rules, not hard constraints.

The user should remain able to select supported alternatives when appropriate.

---

## 6. Visualization Specification

A visualization should be represented as structured configuration.

Conceptually:

```text
Visualization Specification
├── visualization type
├── dataset/version context
├── analysis context
├── data roles
├── fields
├── measures
├── aggregations
├── sorting
├── filters
├── appearance
└── interaction configuration
```

The exact schema should follow the API and visualization specifications.

Do not represent a visualization as arbitrary HTML or JavaScript.

---

## 7. Data Roles

Visualization specifications should explicitly identify the role of fields.

Possible roles include:

- Dimension
- Measure
- Category
- X-axis
- Y-axis
- Series
- Size
- Color
- Tooltip
- Other chart-specific roles

A renderer should not infer critical roles from ambiguous configuration at runtime.

---

## 8. Aggregations

Aggregations must be explicit.

Examples:

```text
Sum
Count
Distinct count
Average
Minimum
Maximum
Median
```

The selected aggregation must be validated against the underlying field and analytical result.

---

## 9. Sorting

Visualization sorting should be explicit.

Support applicable:

- Field-based sorting
- Ascending
- Descending
- Top-N/limited views where supported

Sorting should occur at the correct analytical/specification layer rather than being implemented inconsistently inside individual chart components.

---

## 10. Filters

Visualization filters should be represented as structured configuration.

A filter should identify:

- Target field
- Operator
- Value/range
- Scope

Temporary analytical filters and persistent visualization filters should remain distinguishable.

---

## 11. Cross-Filtering

Cross-filtering should be treated as an interaction between dashboard/visual context and analytical queries.

A visual interaction may produce:

```text
User selection
   ↓
Filter event
   ↓
Validated filter context
   ↓
Analytical refresh
   ↓
Updated visual results
```

Do not mutate unrelated visual specifications merely because a temporary cross-filter is active.

---

## 12. Visualization Studio

The flagship Visualization Studio layout is:

```text
┌────────────────────────────────────────────────────┐
│ Toolbar                                             │
├───────────────┬───────────────────────┬────────────┤
│ Data Pane     │ Canvas                │ Properties │
│ Tables        │       Chart           │ Visual     │
│ Columns       │                       │ settings   │
│ Measures      │                       │ Filters    │
└───────────────┴───────────────────────┴────────────┘
```

The three primary areas are:

- Data Pane
- Canvas
- Properties

The toolbar provides major creation and editing actions.

---

## 13. Visualization Studio Responsibilities

Users should be able to:

- Select data
- Select fields
- Create a visual
- Drag
- Resize
- Duplicate
- Delete
- Customize
- Change aggregation
- Change chart type
- Configure filters
- Configure themes
- Ask AI to explain a visual

The Studio should compose existing visualization primitives rather than implementing separate rendering logic for every interaction.

---

## 14. Canvas Architecture

The canvas should manage visual placement and interaction.

It should not become the owner of:

- Raw data processing
- Analytical query execution
- AI provider calls
- Database persistence

Those responsibilities belong to the appropriate application layers.

---

## 15. Properties Panel

The Properties panel should expose supported visualization configuration.

Potential groups include:

```text
Visual
Data
Aggregation
Sorting
Filters
Appearance
Interaction
```

Only options valid for the current visualization type should be presented as active configuration.

---

## 16. Visualization Renderer

Renderers should receive validated specifications.

Conceptually:

```text
Validated Visualization Spec
          ↓
Renderer
          ↓
ECharts / Plotly / Matplotlib
```

Renderers should not perform hidden business logic or silently modify the analytical result.

---

## 17. Renderer Isolation

Each renderer should have a clear interface.

A renderer should:

- Receive validated input
- Produce the supported visualization
- Handle renderer-specific options
- Report renderer errors clearly

Renderer-specific implementation should not leak into the shared visualization specification unnecessarily.

---

## 18. AI Prompt-to-Visual

AI-generated visualizations must follow:

```text
User request
   ↓
AI intent
   ↓
Structured visualization specification
   ↓
Schema validation
   ↓
Semantic validation
   ↓
Analytical validation
   ↓
Application validation
   ↓
Renderer
```

AI must not generate arbitrary frontend code as the visualization implementation.

---

## 19. AI Explain Visual

Explain Visual should receive controlled context such as:

- Visualization specification
- Relevant analytical result
- Dataset metadata
- Active filters
- Applicable provenance

AI should explain the visual using that controlled context.

Hypotheses must remain clearly distinguishable from computed facts.

---

## 20. Dashboard Architecture

Dashboards are composition layers.

Supported dashboard components include:

- KPI cards
- Charts
- Tables
- Text
- Filters

Dashboard capabilities include:

- Grid layout
- Drag/resize
- Cross-filtering
- Themes

React Grid Layout is the recommended layout library.

---

## 21. Dashboard Data Boundaries

A dashboard should reference visualization definitions rather than duplicating their analytical logic.

Conceptually:

```text
Dashboard
   ↓
Dashboard Visual
   ↓
Visualization Definition
   ↓
Analysis
   ↓
Dataset Version
```

Dashboard-specific configuration may include:

- Position
- Size
- Visibility
- Local display settings
- Dashboard-specific filter context

---

## 22. Dashboard Layout

The dashboard grid should support:

- Drag
- Resize
- Position persistence
- Component ordering
- Responsive layout where applicable

Layout state should be persisted separately from visualization analytical definitions.

---

## 23. Dashboard Components

### KPI

Should display a defined metric and relevant context.

### Chart

Should render an existing validated visualization.

### Table

Should display a controlled analytical result rather than unnecessarily loading raw data.

### Text

Should support dashboard explanatory content.

### Filters

Should communicate their scope and affect only supported dashboard context.

---

## 24. Dashboard Cross-Filtering

Dashboard interactions should follow:

```text
Visual interaction
   ↓
Filter event
   ↓
Dashboard filter context
   ↓
Affected analytical queries
   ↓
Updated components
```

A cross-filter failure should not silently corrupt dashboard state.

---

## 25. Dashboard Themes

Themes should be represented through shared design tokens and supported visualization configuration.

Do not hardcode unrelated colors inside individual charts.

Theme changes should preserve:

- Readability
- Contrast
- Accessibility
- Chart meaning
- Dashboard consistency

---

## 26. Performance

Visualization performance should follow the data architecture:

```text
Raw data
   ↓
Analytical computation
   ↓
Aggregated result
   ↓
Visualization
```

Avoid rendering millions of raw records in the browser.

Use appropriate strategies such as:

- Aggregation
- Result limits
- Efficient chart configuration
- Controlled updates
- Background processing where appropriate

---

## 27. Visualization State

Separate:

### Server state

Examples:

- Visualization definitions
- Analysis results
- Dashboard definitions
- Persisted layouts

### UI state

Examples:

- Selected visual
- Active property panel
- Temporary editing state
- Modal state

### Workspace state

Examples:

- Active dataset
- Active dashboard
- Active filters
- Active model

Do not merge these into one undifferentiated store.

---

## 28. Error Handling

Visualization and dashboard features must provide:

- Loading state
- Empty state
- Error state
- Recovery guidance

Examples include:

- Missing data
- Invalid field mapping
- Unsupported chart configuration
- Analytical query failure
- Renderer failure
- Dashboard component failure

A failed visual should not automatically destroy valid dashboard components.

---

## 29. Accessibility

Visualization code must support:

- Keyboard-accessible controls
- Visible focus
- Accessible labels
- Sufficient contrast
- Non-color-only meaning
- Textual chart summaries where possible
- Reduced motion

Charts should remain understandable without relying exclusively on visual inspection.

---

## 30. Testing Standards

Visualization tests should cover:

### Specification

- Valid chart types
- Invalid chart types
- Field mappings
- Aggregations
- Filters
- Sorting

### Rendering

- Renderer receives valid specification
- Visual appears correctly
- Renderer errors are handled

### Studio

- Field selection
- Chart type changes
- Aggregation changes
- Property updates
- Duplicate/delete
- Filter configuration

### Dashboard

- Add component
- Move component
- Resize component
- Persist layout
- Apply filters
- Cross-filter
- Handle failed visual

---

## 31. Snapshot/Regression Considerations

Visual regression testing may be used for important stable UI surfaces.

However, tests should avoid becoming so brittle that harmless renderer changes create excessive maintenance.

Behavior and specification correctness should remain more important than exact pixel snapshots.

---

## 32. Visualization Security

Visualization specifications must be validated.

Do not allow visualization configuration to introduce:

- Arbitrary script execution
- Arbitrary HTML execution
- Untrusted JavaScript
- Cross-workspace data access
- Unvalidated analytical queries

AI-generated visualization structures receive the same validation requirements as user-generated structures.

---

## 33. Dashboard Persistence

Persist:

- Dashboard metadata
- Component references
- Layout
- Supported component configuration
- Relevant filter configuration

Do not persist transient UI state as durable dashboard state unless explicitly intended.

---

## 34. Antigravity Implementation Rules

When implementing visualization or dashboard functionality:

1. Preserve the Dataset → Analysis → Specification → Validation → Renderer architecture.
2. Use structured visualization specifications.
3. Keep renderers separate from analytical computation.
4. Keep dashboard layout separate from visualization definitions.
5. Keep AI output structured and validated.
6. Do not generate arbitrary frontend code from AI.
7. Preserve workspace isolation.
8. Avoid unnecessary browser data transfer.
9. Implement loading, empty, error, and recovery states.
10. Preserve accessibility.
11. Add tests for important visual and dashboard behavior.
12. Run relevant tests.
13. Report failures honestly.
14. Document important architectural decisions.

---

## 35. Definition of Done

A visualization or dashboard feature is complete when:

- The specification is structured and validated.
- Analytical input is correct.
- Renderer behavior is verified.
- User editing behavior is verified.
- Filters work as specified.
- Dashboard layout behavior is verified where applicable.
- Accessibility has been considered.
- Error/recovery states are implemented.
- Important tests pass.
- Performance is appropriate for the expected result size.
- Workspace boundaries are preserved.
- Documentation is updated where necessary.
- Verification status is reported honestly.

---

## 36. Final Principle

KaanViz visualization code should remain a controlled rendering layer over deterministic analytical results.

The product should make it easy to move from:

```text
Data
 ↓
Analysis
 ↓
Visual specification
 ↓
Validated visual
 ↓
Dashboard
```

without allowing UI code, renderer code, or AI output to silently take ownership of the underlying data logic.
