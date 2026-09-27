# KaanViz — Dashboard Specification

**Status:** Planning / Pre-Implementation  
**Purpose:** Define the dashboard composition and interaction system before UI implementation.

---

## 1. Purpose

The KaanViz Dashboard system combines validated visualizations, KPI cards, tables, text, and filters into reusable analytical pages.

A dashboard is a **composition and interaction layer** over the existing data, analysis, and visualization systems.

The dashboard must not become a second analytical engine.

Its responsibility is to:

- arrange analytical visuals
- provide shared context
- expose filters
- coordinate cross-filtering
- preserve layout and presentation settings
- provide a coherent analytical experience

---

## 2. Dashboard Principles

1. **Compose, do not recompute**  
   Dashboards consume validated analytical and visualization capabilities.

2. **Reuse visualization definitions**  
   A dashboard visual should reference a validated visual/configuration rather than embed arbitrary frontend code.

3. **Workspace-scoped**  
   Every dashboard belongs to a workspace and can only reference resources available to that workspace.

4. **Interactive by default**  
   Dashboard visuals can respond to shared filters and cross-filtering where configured.

5. **User-controlled**  
   Users control layout, sizing, filters, themes, and dashboard composition.

6. **AI optional**  
   Dashboards must remain functional when AI services are unavailable.

7. **Deterministic analytical behavior**  
   Filter changes should flow through the analytical/query layer rather than relying on uncontrolled browser-side data manipulation.

---

## 3. Dashboard Composition Model

Conceptually:

```text
Dashboard
├── Metadata
├── Layout
├── Visuals
├── KPI Cards
├── Tables
├── Text
├── Filters
├── Cross-filtering rules
└── Theme
```

A dashboard should contain reusable components rather than arbitrary executable content.

---

## 4. Dashboard Components

The initial dashboard component set is:

### 4.1 Charts

Existing validated KaanViz visualizations.

Examples:

- Bar
- Line
- Area
- Scatter
- Histogram
- Pie / Donut
- Heatmap
- Combo

### 4.2 KPI Cards

KPI cards display a single important metric.

A KPI should have:

- metric value
- optional label
- optional comparison/context
- formatting configuration
- filter behavior

KPI calculations should use the same analytical engine as other visualizations.

### 4.3 Tables

Tables provide detailed analytical results.

They should support:

- filtering
- sorting where supported
- bounded result sets
- loading/empty/error states

Large unbounded datasets must not be pushed directly into the browser.

### 4.4 Text

Text components provide dashboard context such as:

- titles
- descriptions
- section headings
- explanatory notes

Text must not be treated as executable content.

### 4.5 Filters

Filters provide shared analytical context.

Supported filter concepts include:

- dataset filters
- page filters
- dashboard filters
- visual filters
- date filters
- slicers

---

## 5. Dashboard Layout

The dashboard uses a grid-based layout.

Recommended library:

**React Grid Layout**

Conceptually:

```text
┌───────────────────────────────────────────────┐
│ Dashboard Header                              │
├───────────────────────────────────────────────┤
│ Filter / Slicer Area                          │
├───────────────────────┬───────────────────────┤
│ KPI                   │ KPI                   │
├───────────────────────┼───────────────────────┤
│ Chart                 │ Chart                 │
│                       │                       │
├───────────────────────┼───────────────────────┤
│ Table                 │ Chart                 │
│                       │                       │
└───────────────────────┴───────────────────────┘
```

The exact arrangement is user-controlled.

---

## 6. Layout Behavior

Users should be able to:

- add components
- remove components
- drag components
- resize components
- reorder components
- duplicate supported components
- edit component properties
- configure filters
- configure themes

The layout should persist independently from the underlying visualization definition.

This allows the same visual definition to be used in different dashboard compositions.

---

## 7. Dashboard Visual Model

Dashboard placement should be treated separately from visualization configuration.

Conceptually:

```text
Visualization
├── analytical definition
├── visualization specification
└── renderer configuration

Dashboard Visual
├── dashboard_id
├── visualization_id / visual reference
├── position
├── size
├── visibility
└── dashboard-specific behavior
```

This separation prevents dashboard layout concerns from leaking into the core visualization model.

---

## 8. Dashboard Filters

Dashboard filters provide shared context to compatible dashboard components.

Example:

```text
Dashboard Filter
      ↓
   Date = 2025
      ↓
┌───────────┬───────────┬───────────┐
│ KPI       │ Chart A   │ Chart B   │
│ updated   │ updated   │ updated   │
└───────────┴───────────┴───────────┘
```

A dashboard filter must only affect visuals that are compatible with the filter's dataset and field context.

---

## 9. Filter Behavior

Each visual can choose how it responds to filter context.

Supported behavior:

- **Follow all filters**
- **Ignore page filters**
- **Ignore dashboard filters**
- **Ignore all filters**

The behavior should be explicit in the visual configuration.

The dashboard should not silently override an individual visual's filter policy.

---

## 10. Cross-Filtering

Cross-filtering allows a user interaction with one dashboard visual to affect other compatible visuals.

Conceptual flow:

```text
User selects data in Visual A
        ↓
Cross-filter event
        ↓
Dashboard filter context
        ↓
Compatible visuals identified
        ↓
Analytical queries recomputed
        ↓
Visuals update
```

Cross-filtering must respect:

- dataset compatibility
- field compatibility
- filter scope
- visual filter behavior
- workspace boundaries

Cross-filtering should be deterministic and reproducible.

---

## 11. Dashboard State

Dashboard state is separated into three categories.

### Server state

Persisted information:

- dashboard metadata
- dashboard components
- visualization references
- layout
- filters
- theme
- saved configuration

### UI state

Temporary interface information:

- selected component
- active properties panel
- drag/resize interaction
- open menus
- temporary filter edits

### Workspace state

Contextual information:

- active workspace
- workspace permissions
- available datasets
- available visualizations

Unsaved UI changes must not silently overwrite persisted dashboard state.

---

## 12. Dashboard Metadata

A dashboard should conceptually contain:

```text
Dashboard
├── workspace_id
├── name
├── description
├── owner / creator
├── theme
├── layout configuration
├── filter configuration
├── created_at
└── updated_at
```

Dashboard components are stored separately.

---

## 13. Dashboard Visual Persistence

A dashboard component should preserve enough information to reproduce its placement and behavior.

Conceptually:

```text
Dashboard Visual
├── dashboard_id
├── visualization_id
├── x
├── y
├── width
├── height
├── z / ordering where required
├── filter behavior
├── visibility
└── component configuration
```

The exact database representation must remain compatible with the workspace-centered schema defined elsewhere in the KaanViz architecture.

---

## 14. Dashboard Themes

Dashboards should support themes.

Theme configuration may affect:

- background
- surface
- text
- chart styling
- KPI styling
- borders
- spacing
- visual hierarchy

Themes must use the KaanViz design-token system rather than arbitrary per-component styling.

Light and dark themes are required by the broader KaanViz design system.

---

## 15. Dashboard Editing Experience

The dashboard builder should provide a professional analytical editing workflow.

Conceptually:

```text
Dashboard
   ↓
Edit mode
   ↓
Add / arrange components
   ↓
Configure component
   ↓
Configure filters
   ↓
Preview interactions
   ↓
Save
```

Editing controls should remain discoverable without overwhelming the analytical canvas.

---

## 16. Dashboard Viewing Experience

Viewing mode should prioritize analysis rather than editing.

The viewer should provide:

- dashboard title and context
- filters/slicers
- responsive visual layout
- interactive charts
- KPI cards
- tables
- loading states
- empty states
- error recovery
- theme

Editing controls should not dominate the viewing experience.

---

## 17. Loading States

Dashboards may contain several analytical components that resolve independently.

The system should therefore support component-level loading states.

Example:

```text
Dashboard loading
├── KPI A       loading
├── KPI B       ready
├── Chart A     loading
├── Chart B     ready
└── Table       loading
```

A slow component should not unnecessarily block already available dashboard content.

---

## 18. Empty States

Empty states should explain the reason.

Examples:

- dashboard contains no components
- visual has no compatible data
- current filters produce no results
- referenced visualization has no result
- dataset is unavailable

Empty states should provide an appropriate next action when possible.

---

## 19. Error Handling

Dashboard failures should be isolated where practical.

A single broken visual should not automatically make the entire dashboard unusable.

Error states should identify whether the problem is:

- data
- visualization configuration
- filter configuration
- renderer
- permissions
- service availability

Provide recovery actions such as:

- retry
- clear filter
- edit configuration
- return to dashboard
- inspect source visual

---

## 20. Permissions Boundary

Every dashboard operation must validate workspace access.

Before loading or saving a dashboard:

```text
Request
  ↓
Authenticated user
  ↓
Workspace membership / permission check
  ↓
Dashboard ownership / access validation
  ↓
Dashboard operation
```

Dashboard references must not permit access to visualizations, datasets, or analysis results from another workspace.

---

## 21. Performance

Dashboard performance should be managed at both the layout and analytical layers.

Requirements:

1. Avoid loading unnecessary visuals.
2. Avoid sending raw large datasets to the browser.
3. Aggregate analytical results before rendering.
4. Keep individual result sets bounded.
5. Load expensive components lazily where appropriate.
6. Avoid redundant analytical requests.
7. Reuse compatible analytical results where safe.
8. Keep cross-filter updates targeted to affected components.

Dashboard rendering should remain responsive even when several visuals are present.

---

## 22. Accessibility

Dashboard requirements include:

- semantic dashboard headings
- keyboard-accessible controls
- visible focus states
- accessible filter controls
- sufficient contrast
- non-color-only communication
- readable KPI values
- accessible visual summaries/tables where appropriate
- clear loading, empty, and error states

Drag/resize interactions must have an accessible alternative where the component requires positioning.

---

## 23. AI Integration

AI can assist with dashboard creation and analysis, but it is not required for dashboard operation.

Potential AI-assisted workflows include:

- generating a visualization for a dashboard
- suggesting relevant visuals
- explaining dashboard visuals
- answering questions about dashboard data
- suggesting analytical observations

AI-generated changes must pass through the same structured visualization and validation boundaries as manually configured visuals.

AI must never directly inject arbitrary dashboard code.

---

## 24. AI Availability States

Dashboard behavior must remain understandable across AI states:

### Online

AI-assisted capabilities are available.

### Degraded

AI may be slow or partially available.

Core dashboard functionality remains available.

### Unavailable

AI-assisted features are disabled or unavailable.

Users can still:

- open dashboards
- edit layouts
- configure visuals
- apply filters
- cross-filter
- inspect tables
- save dashboards

---

## 25. Dashboard Provenance

Dashboard components should preserve enough provenance to understand:

- source visualization
- dataset/version
- analytical context
- filters
- dashboard-specific filter behavior
- layout configuration
- AI-generated changes where applicable

This supports reproducibility and debugging.

---

## 26. Security

Dashboard configuration is untrusted input when received from clients or AI providers.

The backend must validate:

- dashboard ownership/workspace
- visualization references
- dataset references
- filter fields
- filter values
- layout values
- component types
- configuration values

No dashboard configuration should be able to execute arbitrary frontend or backend code.

---

## 27. API Responsibilities

The dashboard API layer should provide operations conceptually equivalent to:

```text
GET    /api/workspaces/{workspace_id}/dashboards
POST   /api/workspaces/{workspace_id}/dashboards
GET    /api/workspaces/{workspace_id}/dashboards/{dashboard_id}
PATCH  /api/workspaces/{workspace_id}/dashboards/{dashboard_id}
DELETE /api/workspaces/{workspace_id}/dashboards/{dashboard_id}

POST   /api/workspaces/{workspace_id}/dashboards/{dashboard_id}/visuals
PATCH  /api/workspaces/{workspace_id}/dashboards/{dashboard_id}/visuals/{visual_id}
DELETE /api/workspaces/{workspace_id}/dashboards/{dashboard_id}/visuals/{visual_id}
```

Exact endpoint naming must remain aligned with `06-API-SPEC.md`.

The frontend should not bypass the API to directly mutate dashboard persistence.

---

## 28. Database Relationship

The dashboard model should remain workspace-centered.

Conceptually:

```text
Workspace
   │
   ├── Dashboards
   │      │
   │      └── Dashboard Visuals
   │                  │
   │                  └── Visualizations
   │
   ├── Datasets
   └── Users / Members
```

The dashboard visual placement record should remain separate from the reusable visualization record.

---

## 29. Dashboard Lifecycle

The expected lifecycle is:

```text
Create Dashboard
      ↓
Add Visuals / KPIs / Tables / Text
      ↓
Arrange Grid
      ↓
Configure Filters
      ↓
Configure Cross-filtering
      ↓
Configure Theme
      ↓
Preview
      ↓
Save
      ↓
View / Interact
      ↓
Edit / Update
```

All stages should preserve workspace boundaries and validated analytical behavior.

---

## 30. Definition of Done

### Implementation

- dashboard creation works
- dashboard persistence works
- grid layout works
- drag/resize works
- KPI cards work
- charts work
- tables work
- text components work
- filters work
- cross-filtering works
- themes work
- dashboard editing and viewing modes work

### Testing

- dashboard CRUD is tested
- workspace isolation is tested
- dashboard visual persistence is tested
- layout persistence is tested
- filter behavior is tested
- cross-filtering is tested
- invalid references are rejected
- permissions are tested
- AI-disabled dashboard operation is tested

### Manual verification

A user can:

1. create a dashboard
2. add a visualization
3. add a KPI
4. add a table
5. arrange and resize components
6. configure a dashboard filter
7. interact with a chart and trigger cross-filtering
8. change the theme
9. save the dashboard
10. reopen it with the same layout and behavior

### Error-path verification

Verify:

- missing visualization
- invalid dataset/version
- incompatible filter
- empty analytical result
- renderer failure
- permission failure
- AI unavailable
- dashboard save failure

### Documentation

Document:

- dashboard component model
- layout model
- filter model
- cross-filtering behavior
- persistence model
- API contract
- permission boundary
- AI integration boundary

---

## 31. Implementation Rule for Antigravity

Antigravity must implement the dashboard system as the composition layer described here.

Do not:

- turn dashboards into a second analytical engine
- bypass visualization validation
- embed arbitrary HTML/JavaScript
- make AI mandatory
- allow cross-workspace references
- replace the grid model without approval
- mix dashboard placement state into reusable visualization definitions
- introduce unnecessary dependencies

Do:

- preserve the existing Visualization Specification
- preserve workspace boundaries
- preserve filter semantics
- preserve user control
- test dashboard behavior before expanding functionality
- document deviations before introducing them

---

## 32. North Star

KaanViz dashboards should feel like a professional analytical workspace:

> **A dashboard is a clear, interactive composition of trusted analytical results—not a collection of arbitrary widgets.**

The dashboard organizes the user's analysis while the underlying data, analytics, visualization, and validation systems remain responsible for correctness.
