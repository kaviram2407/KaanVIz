# KaanViz --- UI/UX Preference Specification

**Product:** KaanViz\
**Tagline:** See Beyond Data.\
**Status:** Pre-implementation / UI-UX decision document

> This document converts the existing KaanViz product requirements into
> concrete UI/UX preferences. Exact visual values that were not defined
> in the source specification are proposed defaults and should be
> treated as changeable decisions.

## 1. UX North Star

KaanViz should communicate:

> **You are in control of your data.**

The interface should feel like a **professional analytics studio**, not
a chatbot or generic AI application.

AI is an assistant layer inside the analytical workflow. It must not
visually dominate the product.

## 2. Core UX Principles

1.  Data first.
2.  Analysis before interpretation.
3.  User control before automation.
4.  AI is optional and secondary.
5.  Progressive disclosure instead of overwhelming the user.
6.  Show why an action or recommendation exists.
7.  Never hide important transformations or filters.
8.  Prefer reversible operations.
9.  Use consistent patterns across workspaces.
10. Desktop-first for analytical workflows.
11. Every major screen needs loading, empty, error, and recovery states.
12. Accessibility is part of the design.

## 3. Product Personality

KaanViz should feel:

-   Intelligent
-   Modern
-   Precise
-   Futuristic
-   Trustworthy
-   Analytical
-   Creative
-   Professional

Avoid:

-   Generic chatbot appearance
-   Cartoon-style UI
-   Excessive gradients
-   Excessive glassmorphism
-   Decorative UI that reduces data density
-   Excessive animations
-   Generic AI-app styling
-   Unnecessary popups

## 4. Application Shell

Preferred desktop structure:

``` text
┌─────────────────────────────────────────────────────────────┐
│ KaanViz / Workspace        Search       AI Status   Profile │
├──────────────┬──────────────────────────────────────────────┤
│ Primary Nav  │                 Workspace                    │
│              │                                              │
│ Home         │                                              │
│ Data         │                                              │
│ Prepare      │                                              │
│ Model        │                                              │
│ Visualize    │                                              │
│ Dashboards   │                                              │
│ AI Analyst   │                                              │
│              │                                              │
│ Settings     │                                              │
│ Help         │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

Primary navigation:

``` text
Home | Data | Prepare | Model | Visualize | Dashboards | AI Analyst
```

Secondary navigation:

``` text
Settings | Help | About
```

Navigation should remain stable across workspaces.

## 5. Global Header

Keep the header compact. It should contain:

-   KaanViz identity
-   Current workspace/dataset context
-   Global search / command palette
-   AI availability indicator
-   User/settings access

Do not turn the application header into a marketing hero.

## 6. Responsive Strategy

KaanViz is **desktop/laptop first** because analytical workflows require
wide tables, multiple panels, visualization canvases, and dashboard
layouts.

On smaller screens:

-   Collapse primary navigation
-   Convert side panels to drawers
-   Preserve core functionality
-   Do not merely shrink dense desktop layouts

## 7. Design System

### Typography

Preferred:

-   Inter
-   Clear hierarchy
-   Compact but readable analytical text

### Spacing

Use a 4px spacing grid:

``` text
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48
```

### Radius

Use a consistent system around:

``` text
6px / 8px / 10px / 12px
```

Avoid excessive pill-shaped containers.

### Color

The existing KaanViz specification proposes:

-   Deep navy
-   Electric blue
-   Cyan
-   Teal
-   Green
-   Optional violet accents

Use semantic tokens such as:

``` text
background
surface
surface-secondary
border
text
text-secondary
primary
success
warning
danger
info
ai
```

Exact color values should be finalized during design-system
implementation.

### Themes

Support both light and dark themes. Do not use color alone to
communicate meaning.

## 8. Component Foundation

Primary component foundation:

**shadcn/ui**

Prefer existing shadcn components before creating custom components.

Expected building blocks:

-   Button
-   Input
-   Select
-   Combobox
-   Tabs
-   Card
-   Badge
-   Dialog
-   Sheet
-   Dropdown Menu
-   Tooltip
-   Popover
-   Command
-   Table
-   Scroll Area
-   Separator
-   Skeleton
-   Alert
-   Toast
-   Progress

Custom KaanViz components should build on this foundation.

## 9. UI MCP Strategy

Preferred development workflow:

``` text
Antigravity
    ↓
KaanViz UI Rules
    ↓
shadcn MCP
    ↓
Existing KaanViz components
    ↓
Custom component only when necessary
```

MCP is a development-time aid, not a KaanViz runtime dependency.

Do not introduce random UI libraries for individual components.

## 10. Home

The Home screen should answer:

> **What can I do next with my data?**

Preferred sections:

-   Upload Dataset
-   Create Table
-   Recent datasets
-   Recent dashboards / visualizations

The user should reach the analytical workflow quickly.

## 11. Data Workspace

The Data workspace manages datasets.

Preferred structure:

``` text
Data
├── Upload CSV
├── Create Table
└── Dataset list
```

For many datasets, prefer a table:

``` text
Name | Rows | Columns | Quality | Updated | Actions
```

## 12. Dataset Details

Provide:

``` text
Overview
Profile
Data Preview
Quality
Preparation
History
```

Always make the active dataset, row count, column count, quality,
version, and recent transformations understandable.

## 13. Data Preview

The table is the primary object.

Support:

-   Sticky headers where useful
-   Horizontal scrolling
-   Column resizing
-   Sorting
-   Filtering
-   Search where appropriate
-   Pagination/virtualization for large datasets
-   Type indicators
-   Loading/empty/error states

Do not render millions of raw rows directly in the browser.

## 14. Profiling

Show facts before interpretation.

Preferred top-level metrics:

``` text
Rows | Columns | Missing | Duplicates | Quality
```

Then provide column-level information:

``` text
Column | Type | Nulls | Unique | Range
```

Charts may show distributions, but underlying values should remain
accessible.

## 15. Data Quality

Quality findings should be actionable.

Example pattern:

``` text
Data Quality

12 findings

⚠ revenue contains 14 invalid values
⚠ order_date contains 3 unparseable values
ℹ customer_id has 2 duplicate values

[Review] [Fix] [Ignore]
```

Do not make a mysterious AI score the primary explanation. Show
evidence.

## 16. Prepare Workspace

This is a flagship workflow.

Preferred three-panel pattern:

``` text
┌───────────────────────────────────────────────────────────┐
│ Dataset / Preparation toolbar                             │
├──────────────┬──────────────────────────────┬─────────────┤
│ Operations   │ Data Preview                 │ Properties  │
│ Columns      │                              │ Selected    │
│ Text         │ table                        │ operation   │
│ Missing      │                              │ settings    │
│ Duplicates   │                              │             │
│ Dates        │                              │             │
│ Numeric      │                              │             │
│ Rows         │                              │             │
├──────────────┴──────────────────────────────┴─────────────┤
│ Transformation history / validation status                │
└───────────────────────────────────────────────────────────┘
```

Show the effect of transformations before saving.

## 17. Transformation History

Use a chronological, inspectable history:

``` text
1  Parse order_date → date       User     Applied
2  Remove duplicates             User     Applied
3  Fill revenue nulls            User     Applied
```

Support reversal/undo where technically possible.

## 18. AI Transformation Suggestions

AI suggestions must be clearly distinguishable from deterministic
operations.

Example:

``` text
AI Suggestion

14 values in "revenue" appear invalid.

Suggested action:
Convert invalid values to null and review them.

Reason:
Values do not match the inferred numeric pattern.

[Review] [Apply] [Reject]
```

AI must never silently modify the dataset.

## 19. Data Modeling

Use a relationship canvas.

Preferred structure:

``` text
┌───────────────┬───────────────────────────────┬──────────┐
│ Tables        │ Relationship Canvas           │ Details  │
│ customers     │ customers ───────── orders    │ Relation │
│ orders        │                               │ settings │
│ products      │                               │          │
└───────────────┴───────────────────────────────┴──────────┘
```

Relationships should be visually understandable.

AI relationship candidates must show confidence and evidence before
activation.

## 20. Visualization Studio

This is a flagship KaanViz experience.

Preferred layout:

``` text
┌──────────────────────────────────────────────────────────┐
│ Toolbar                                                   │
├───────────────┬──────────────────────────────┬───────────┤
│ Data Pane     │ Canvas                       │ Properties│
│ Tables        │                              │ Chart     │
│ Columns       │        Visualization         │ Type      │
│ Measures      │                              │ X / Y     │
│ Filters       │                              │ Filters   │
└───────────────┴──────────────────────────────┴───────────┘
```

The canvas should be the dominant area.

Users should be able to:

-   Drag
-   Resize
-   Duplicate
-   Delete
-   Change chart type
-   Change aggregation
-   Configure filters
-   Configure themes
-   Inspect data
-   Explain a visual with AI

## 21. Chart Configuration

Organize properties into:

``` text
Data
├── Dataset
├── X
├── Y
├── Aggregation
└── Filters

Appearance
├── Title
├── Legend
├── Labels
├── Theme
└── Formatting

Interaction
├── Cross-filtering
└── Filter behavior
```

Avoid one giant property form.

## 22. Dashboard Builder

Prioritize the canvas:

``` text
┌──────────────────────────────────────────────────────────┐
│ Dashboard toolbar                                        │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌───────────────────────┐             │
│  │ KPI         │  │ Revenue Trend         │             │
│  └─────────────┘  └───────────────────────┘             │
│  ┌───────────────────────┐ ┌─────────────────────────┐  │
│  │ Orders                │ │ Category Distribution   │  │
│  └───────────────────────┘ └─────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

Use grid-based positioning. Controls should not unnecessarily obstruct
the canvas.

## 23. Filters and Cross-Filtering

Filters should be visually obvious:

``` text
[ Date: Jan 2025 – Dec 2025 ]
[ Region: All ▼ ]
[ Category: All ▼ ]
```

Active filters should be discoverable.

When a visual filters other visuals:

-   Related visuals should visibly respond.
-   Active filter state should be understandable.
-   Users should have a clear way to remove the filter.

## 24. AI Analyst

AI Analyst is a dedicated workspace, not the application home screen.

Preferred structure:

``` text
AI Analyst

Context: Sales dataset

[ Ask a question about your data........................ ] [Ask]

Answer

Fact
...

Calculated Metric
...

Interpretation
...

Hypothesis
...
```

AI responses must visually distinguish:

-   Fact
-   Calculated Metric
-   Interpretation
-   Hypothesis

## 25. Explain Visual

Make it contextual:

``` text
Select visual
    ↓
Explain with AI
    ↓
AI explanation panel
    ↓
Facts
Patterns
Anomalies
Limitations
Hypotheses
```

The explanation should not replace the chart.

## 26. AI Availability

Keep AI status visible but subtle:

``` text
● AI Online
● AI Degraded
● AI Unavailable
```

When unavailable:

``` text
AI features unavailable
Core analytics remains fully operational.
```

Never block non-AI workflows.

## 27. Trust and Provenance

Where useful, show how a result was produced.

Example:

``` text
Source: Validated dataset
Calculation: Sum(revenue)
Filter: Region = South
Generated by: KaanViz analytics engine
```

For AI:

``` text
Based on:
Dataset profile
Validated analysis
Current filters
Selected visualization
```

This keeps deterministic computation separate from AI interpretation.

## 28. AI vs Deterministic UI

Use different visual treatment for:

``` text
Validated Result
Revenue increased 18.4%.
```

versus:

``` text
AI Interpretation
The increase may be associated with...
```

Never merge them into one unlabeled statement.

## 29. Empty States

Every empty state should explain:

1.  What is missing
2.  Why it matters
3.  What the user can do next

Example:

``` text
No datasets yet

Upload a CSV to start exploring your data.

[Upload CSV]
```

## 30. Error States

Errors should be:

-   Specific
-   Actionable
-   Non-technical where possible
-   Recoverable

Example:

``` text
We couldn't parse this CSV.

The file appears to contain inconsistent column values.

[Review file] [Try another file]
```

Technical diagnostics may be expandable.

## 31. Loading States

Use skeletons for structured content.

Use meaningful progress for:

-   Large file ingestion
-   Profiling
-   Transformation
-   Export
-   Python execution

Preferred long-running flow:

``` text
Uploading
  ↓
Profiling
  ↓
Preparing
  ↓
Validating
  ↓
Ready
```

## 32. Destructive Actions

For destructive operations:

-   Clearly identify the action
-   Explain the consequence
-   Confirm when appropriate
-   Offer undo where possible

## 33. Command Palette

A global command palette is preferred.

Potential actions:

``` text
Search datasets
Open dashboard
Create visualization
Go to Prepare
Go to Model
Ask AI
Toggle theme
Open settings
```

Implement after basic navigation is stable.

## 34. Accessibility

Target:

-   Keyboard navigation
-   Visible focus states
-   Semantic HTML
-   Accessible labels
-   Screen-reader-friendly controls
-   Sufficient contrast
-   Reduced motion support

Charts should provide textual summaries where possible.

Never use color as the only indicator of state.

## 35. Motion

Use motion sparingly for:

-   Panel/drawer transitions
-   Layout transitions
-   Loading transitions
-   Drag/resize feedback

Avoid decorative animations and long transitions.

## 36. Internationalization

The product should support multilingual AI explanations, including
English, Tamil, Hindi, and other supported languages.

Translation must not alter underlying facts or calculations.

User-visible strings should not be hardcoded directly into components if
an internationalization architecture is introduced.

## 37. Performance UX

Users should understand whether work is:

-   Waiting
-   Processing
-   Completed
-   Failed
-   Ready for review

Prefer:

``` text
Raw data
 → Analytical computation
 → Aggregated result
 → Visualization
```

## 38. Antigravity UI Rules

Before implementing UI:

1.  Read `KAANVIZ_INITIAL_PROJECT_SPEC.md`.
2.  Read this UI/UX specification.
3.  Identify the target screen and phase.
4.  Reuse existing KaanViz components.
5.  Prefer shadcn/ui.
6.  Do not introduce another UI framework without approval.
7.  Do not redesign unrelated screens.
8.  Preserve navigation and information architecture.
9.  Implement loading, empty, error, and recovery states.
10. Keep AI visually secondary.
11. Keep analytical content visually primary.
12. Use semantic design tokens.
13. Avoid arbitrary hardcoded styling.
14. Verify responsive behavior.
15. Verify keyboard accessibility.
16. Run relevant tests after implementation.
17. Report deviations from this specification.

## 39. UI Definition of Done

A UI screen is complete only after:

``` text
Structure
  ↓
Visual hierarchy
  ↓
Interaction states
  ↓
Loading state
  ↓
Empty state
  ↓
Error state
  ↓
Recovery path
  ↓
Accessibility
  ↓
Responsive behavior
  ↓
Visual consistency
  ↓
Manual verification
```

## 40. Screen Inventory

### Global

-   Application shell
-   Command palette
-   Settings
-   Help
-   About

### Home

-   Home
-   Recent datasets
-   Recent dashboards

### Data

-   Dataset list
-   Upload
-   Dataset details
-   Data preview
-   Profile
-   Data quality

### Prepare

-   Preparation workspace
-   Transformation editor
-   Transformation history
-   Validation

### Model

-   Model canvas
-   Table details
-   Relationship editor
-   Relationship validation
-   Relationship suggestions

### Visualize

-   Visualization Studio
-   Chart configuration
-   Data pane
-   Properties pane
-   Filters

### Dashboards

-   Dashboard list
-   Dashboard builder
-   Dashboard settings

### AI Analyst

-   Ask AI
-   Insights
-   Explain Visual
-   AI history

## 41. What Is Not Being Finalized Yet

Do not finalize at this stage:

-   Exact pixel dimensions for every component
-   Final color hex values
-   Final logo artwork
-   Marketing website
-   Enterprise administration screens
-   Multi-user collaboration screens
-   Complex mobile application
-   Forecasting UI
-   RAG UI
-   Enterprise connector UI

These belong to later phases.

## 42. UI/UX Decision Summary

Preferred KaanViz experience:

``` text
Professional
    +
Data-centric
    +
High information density
    +
Clear hierarchy
    +
Predictable interactions
    +
Strong user control
    +
AI assistance without AI dominance
```

Foundation:

``` text
Tailwind CSS
    +
shadcn/ui
    +
KaanViz custom components
```

Visualization:

``` text
Apache ECharts
```

Dashboard layout:

``` text
React Grid Layout
```

## 43. Current Status

**Status: PREFERRED DIRECTION --- PRE-IMPLEMENTATION**

This document should be reviewed before frontend implementation begins.

Major changes to navigation, workspace structure, design system, AI
visual hierarchy, or core interaction patterns should be explicitly
approved before implementation.

# KaanViz --- See Beyond Data.

> You are in control of your data.
