# KaanViz — Visualization Specification

**Status:** Planning / Pre-Implementation  
**Purpose:** Define the visualization system before UI implementation.

---

## 1. Purpose

The KaanViz visualization system turns validated analytical results into interactive, reusable visuals.

The visualization architecture must remain explicitly separated into:

```text
Dataset → Analysis → Visualization Specification → Validation → Renderer
```

This separation is a core architectural boundary. A chart is not arbitrary frontend code; it is the rendered result of a structured, validated specification.

---

## 2. Visualization Principles

1. **Deterministic analysis first**  
   Data preparation and analytical computation happen before visualization rendering.

2. **Structured visualization specifications**  
   Visuals are represented as structured specifications rather than arbitrary HTML, JavaScript, or frontend code.

3. **AI is optional**  
   Manual visualization creation must work without an AI provider.

4. **Validate before rendering**  
   Chart type, columns, aggregation, filters, and allowed values must be validated before a visualization is rendered or saved.

5. **User remains in control**  
   Users can modify chart type, aggregation, filters, themes, layout, and other visual settings.

6. **Use analytical usefulness for recommendations**  
   Visualization recommendations should be based on the analytical pattern, not datatype alone.

7. **Keep large data out of the browser**  
   Analytical systems should aggregate results before sending them to browser visualizations.

---

## 3. Supported Core Visuals

KaanViz's core visualization set is:

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

The initial renderer should prioritize Apache ECharts for interactive charts.

Additional rendering technologies are separated by workflow:

- **Apache ECharts** — primary interactive charts
- **Plotly** — advanced interactive / Python workflows
- **Matplotlib** — Python / static workflows

---

## 4. Visualization Recommendation Rules

Recommendations should reflect the analytical question and pattern.

| Analytical pattern | Suggested visual |
|---|---|
| Category + measure | Bar |
| Time + measure | Line |
| Distribution | Histogram |
| Numeric + numeric | Scatter |
| Part-to-whole | Donut |
| Correlation matrix | Heatmap |
| Single metric | KPI |

These are recommendations, not mandatory mappings. Users must be able to select another compatible visualization type.

---

## 5. Visualization Pipeline

Every visualization should follow the same conceptual pipeline:

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

### 5.1 Dataset

The visualization references a validated dataset version rather than raw, mutable source data.

### 5.2 Analysis

The analytical layer determines what data is required for the visual.

Examples:

- grouped aggregation
- time-series aggregation
- distribution calculation
- numeric-to-numeric comparison
- KPI calculation
- correlation matrix

### 5.3 Visualization Specification

The visualization specification describes how the analytical result should be represented.

### 5.4 Validation

Before rendering or saving:

- verify the visualization type
- verify referenced columns
- verify aggregation
- verify filters
- verify allowed configuration values
- verify the referenced dataset/version belongs to the active workspace
- verify the analytical result is compatible with the requested renderer

### 5.5 Renderer

The renderer converts the validated specification and analytical result into the interactive visual.

---

## 6. Visualization Specification Model

The specification should conceptually contain:

```text
Visualization
├── dataset_version_id
├── analysis_spec
├── visualization_type
├── dimensions
├── measures
├── aggregation
├── filters
├── sort
├── configuration
├── theme
└── interactions
```

A representative specification is:

```json
{
  "type": "bar",
  "dataset_id": "dataset_123",
  "x": "category",
  "y": "revenue",
  "aggregation": "sum",
  "filters": [],
  "filter_behavior": "follow_all",
  "theme": "default"
}
```

The exact persisted schema should be versioned so future visualization capabilities can evolve without silently changing the meaning of existing visuals.

---

## 7. Data Roles

Visualization fields should be represented by analytical roles rather than only raw column positions.

Typical roles include:

- Dimension
- Measure
- Time dimension
- Category
- Numeric field
- Identifier
- Filter field

The visualization editor should expose fields appropriate to the selected chart type.

For example:

```text
Bar
├── Category / Dimension
└── Measure
```

```text
Line
├── Time / Dimension
└── Measure
```

```text
Scatter
├── Numeric X
└── Numeric Y
```

This role-based approach keeps the editor understandable and makes visualization validation deterministic.

---

## 8. Aggregation

Aggregation is part of the analytical specification.

A visualization may request an aggregation such as:

- Sum
- Average
- Minimum
- Maximum
- Count
- Distinct count

The backend must validate that the requested aggregation is compatible with the referenced field and analytical operation.

The frontend must not independently invent or reinterpret analytical results.

---

## 9. Sorting

Sorting belongs to the visualization/analysis configuration.

Supported concepts include:

- ascending
- descending
- field-based sorting
- metric-based sorting

Sorting must be deterministic and validated against the fields available to the analysis.

Example:

```text
Revenue by Month
→ aggregate revenue
→ sort by revenue descending
→ render top results
```

---

## 10. Filters

KaanViz supports multiple filter scopes:

- Dataset filters
- Page filters
- Dashboard filters
- Visual filters
- Cross-filtering
- Date filters
- Slicers

Each visual can define how it responds to filter context.

Supported behavior includes:

- Follow all filters
- Ignore page filters
- Ignore dashboard filters
- Ignore all filters

Filter application must happen through a controlled analytical/query layer rather than by downloading unrestricted raw data into the browser.

---

## 11. Cross-Filtering

Cross-filtering allows an interaction with one visual to affect other visuals that share compatible analytical context.

Conceptually:

```text
User selects value in Visual A
        ↓
Filter context generated
        ↓
Compatible visuals receive context
        ↓
Analytical queries recompute
        ↓
Visuals update
```

Cross-filtering must respect:

- workspace boundaries
- dataset/version boundaries
- field compatibility
- filter scope
- visual filter behavior

---

## 12. Visualization Studio

The flagship Visualization Studio uses the following layout:

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

### Toolbar

The toolbar provides actions such as:

- create/open visual
- save
- duplicate
- delete
- chart type
- undo/redo where supported
- filters
- theme
- explain visual

### Data Pane

The data pane exposes:

- tables/datasets
- columns
- measures
- available analytical fields

### Canvas

The canvas is the visual authoring area.

It should support:

- rendering
- selection
- resizing where applicable
- interaction
- filter interaction
- empty/error states

### Properties

The properties panel controls:

- visual type
- dimensions
- measures
- aggregation
- sorting
- filters
- themes
- visual-specific settings

---

## 13. User Actions

Users should be able to:

- drag
- resize
- duplicate
- delete
- customize
- change aggregation
- change chart type
- configure filters
- configure themes
- ask AI to explain a visual

Destructive actions such as delete must use the established KaanViz confirmation and recovery patterns.

---

## 14. Prompt-to-Visual

Natural-language visualization requests follow this flow:

```text
Prompt
  ↓
Intent
  ↓
Dataset validation
  ↓
Analysis specification
  ↓
Visualization specification
  ↓
Validation
  ↓
Chart
```

Example request:

> Show monthly revenue for 2025 and highlight the top three months.

The AI layer should produce a structured visualization specification.

It must **not** produce arbitrary frontend code.

---

## 15. AI Visualization Contract

AI-generated visualization requests are recommendations/specifications, not direct rendering commands.

The safe boundary is:

```text
User Prompt
    ↓
AI Intent
    ↓
Structured Spec
    ↓
Schema Validation
    ↓
Dataset / Field Validation
    ↓
Analytical Validation
    ↓
User-visible Visual
```

Invalid AI output must be rejected or repaired through a controlled validation path.

The AI provider must never be required for normal manual visualization workflows.

---

## 16. Visualization Validation

Validation should occur before rendering and before persistence.

### Specification validation

Check:

- supported chart type
- required fields
- valid field references
- compatible field roles
- valid aggregation
- valid filters
- valid filter behavior
- valid sorting
- valid configuration values
- valid theme
- valid interaction configuration

### Dataset/workspace validation

Check:

- dataset exists
- dataset version exists
- dataset belongs to the active workspace
- referenced fields belong to that dataset version
- referenced analytical result is valid

### Renderer validation

Check:

- renderer supports the requested chart type
- configuration is compatible with the renderer
- result shape is compatible with the visual

---

## 17. Renderer Architecture

The renderer should be selected behind an abstraction boundary.

Conceptually:

```text
Validated Visualization
        ↓
Renderer Selection
        ↓
┌──────────────┬──────────────┬───────────────┐
│ ECharts      │ Plotly       │ Matplotlib    │
│ Interactive  │ Advanced /   │ Python /      │
│ Web          │ Python       │ Static        │
└──────────────┴──────────────┴───────────────┘
```

The primary web renderer is Apache ECharts.

Renderer-specific configuration must not leak throughout the application domain model.

---

## 18. Python Visualization Boundary

Users may create Python charts using Plotly and Matplotlib.

Python execution must be isolated with:

- CPU limit
- Memory limit
- Timeout
- Restricted filesystem
- Controlled dependencies
- No unrestricted network access

Python visualization is an advanced execution path and must not weaken the security boundary of the core visualization system.

---

## 19. Dashboard Integration

A dashboard visual should reference a reusable visualization definition or validated visual configuration rather than embedding arbitrary frontend code.

Dashboard capabilities include:

- Grid layout
- Drag/resize
- KPI cards
- Charts
- Tables
- Text
- Filters
- Cross-filtering
- Themes

The recommended dashboard layout library is React Grid Layout.

Dashboard composition should therefore be treated as a separate layout concern from the visualization rendering engine.

---

## 20. Performance

Visualization performance must be protected at the analytical boundary.

Rules:

1. Do not send raw large datasets to the browser for ordinary visualization.
2. Aggregate large datasets before browser rendering.
3. Keep visualization result sets bounded.
4. Avoid unnecessary re-fetching when filter context has not changed.
5. Lazy-load expensive visualization/editor functionality where practical.
6. Use efficient rendering for large result sets.
7. Keep tables from attempting to render unbounded datasets at once.

The browser is primarily a visualization and interaction surface, not the primary analytical engine.

---

## 21. Accessibility

Every visualization should provide an accessible interpretation of its data.

Requirements include:

- meaningful visual titles
- descriptive labels
- keyboard-accessible controls
- visible focus states
- sufficient contrast
- do not rely on color alone
- accessible filter controls
- table or textual representation where appropriate
- understandable loading, empty, and error states

Charts should remain interpretable when visual encoding is insufficient for a user.

---

## 22. Explain Visual

Explain Visual is a controlled AI-assisted capability.

Conceptually:

```text
Visual
 ↓
Relevant specification
 ↓
Relevant analytical result
 ↓
Controlled context
 ↓
AI explanation
```

The explanation should remain grounded in the selected visual and its underlying analytical result.

The AI should distinguish documented facts/calculations from interpretations or hypotheses.

---

## 23. Provenance

A saved visualization should preserve enough provenance to understand:

- which dataset/version it uses
- which analysis produced the result
- which visualization specification was used
- which filters were active
- which renderer/configuration was used
- whether AI generated or modified the specification

This supports reproducibility, debugging, explanation, and user trust.

---

## 24. State Model

Visualization state should be separated according to KaanViz's broader state architecture.

### Server state

Examples:

- saved visualization
- analytical result
- dataset metadata
- visualization configuration

### UI state

Examples:

- selected visual
- open properties panel
- current editor interaction
- temporary drag/resize state

### Workspace state

Examples:

- active workspace
- available datasets
- active dashboard context
- workspace permissions

Unsaved editor state must not silently overwrite persisted visualization definitions.

---

## 25. Loading, Empty, and Error States

Every visualization surface must define explicit states.

### Loading

Show a stable visual skeleton or progress state while analytical results are loading.

### Empty

Explain why no visual is currently available.

Examples:

- no data
- no compatible fields
- filters produce no rows
- no aggregation result

### Error

Provide:

- what failed
- whether the problem is data, configuration, renderer, or service related
- a recovery action where possible

AI failures must not prevent manual visualization creation.

---

## 26. Security Boundaries

Visualization specifications must be treated as untrusted input when received from clients or AI providers.

The backend must validate:

- workspace ownership
- dataset/version references
- field references
- chart types
- aggregation
- filter expressions
- configuration values

No visualization specification should be allowed to execute arbitrary frontend or backend code.

Python visualization must remain inside its isolated execution boundary.

---

## 27. Persistence Model

A saved visualization should conceptually retain:

```text
Visualization
├── workspace
├── dataset / dataset version
├── analysis specification
├── visualization specification
├── filter configuration
├── renderer configuration
├── theme
├── provenance
├── created_by
├── created_at
└── updated_at
```

The database schema should keep visualization metadata separate from dashboard placement metadata.

This allows the same visual concept to be reused in different dashboard layouts.

---

## 28. Definition of Done

Visualization implementation is complete only when:

### Implementation
- structured visualization specifications exist
- validation exists before rendering
- primary ECharts renderer works
- Visualization Studio follows the approved layout
- filters and filter behavior work
- dashboard integration works

### Testing
- unit tests cover specification validation
- integration tests cover analytical result → visualization
- renderer tests cover supported chart types
- filter/cross-filter behavior is tested
- invalid specifications are rejected
- workspace isolation is tested

### Manual verification
- user can create a visual manually
- user can modify chart type and aggregation
- user can configure filters
- user can save a visual
- user can place the visual on a dashboard
- AI can be disabled and the workflow still works

### Error-path verification
- invalid field
- invalid aggregation
- invalid filter
- empty result
- renderer failure
- AI unavailable
- unauthorized dataset/version reference

### Documentation
- visualization specification documented
- renderer boundary documented
- validation rules documented
- dashboard integration documented
- AI visualization contract documented

---

## 29. Implementation Rule for Antigravity

Antigravity must not redesign the visualization architecture while implementing it.

Implementation should follow this specification and the existing KaanViz documents.

Rules:

- preserve the Dataset → Analysis → Visualization Specification → Validation → Renderer pipeline
- do not replace structured specs with arbitrary frontend code
- do not make AI mandatory
- do not bypass backend validation
- do not send unrestricted raw datasets to the browser
- preserve workspace boundaries
- preserve user control over generated/edited visuals
- avoid unnecessary dependencies
- test each visualization phase before moving to the next
- document deviations before introducing them

---

## 30. North Star

KaanViz visualization should feel like a professional analytical studio:

> **The user asks a question, KaanViz computes the answer deterministically, a structured specification describes the visual, validation protects the system, and the renderer turns the result into an interactive explanation.**

AI can accelerate the process, but the visualization system remains useful, inspectable, editable, and functional without AI.
