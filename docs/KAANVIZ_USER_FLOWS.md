# KaanViz User Flows

**Status:** Planning / Pre-Implementation  
**Purpose:** Define the expected user behavior, navigation, states, and transitions across the KaanViz product before implementation.

---

# 1. Flow Principles

KaanViz is Workspace-first.

No data operation should occur outside an active Workspace.

The primary product journey is:

```text
KaanViz
  ↓
Workspace
  ↓
Data
  ↓
Profile
  ↓
Prepare
  ↓
Validate
  ↓
Model
  ↓
Analytics
  ↓
Visualize
  ↓
Dashboard
  ↓
AI Analyst
```

Core principles:

- User remains in control of the analytical process.
- Deterministic data operations do not depend on AI.
- AI suggestions require validation/approval where applicable.
- Raw uploaded data remains immutable.
- Every major stage has loading, empty, success, and error states.
- Users should understand what happened and what they can do next.
- Workspace context is visible throughout the analytical journey.

---

# 2. Global Product Entry Flow

## 2.1 Returning User

```text
Open KaanViz
    ↓
Load accessible Workspaces
    ↓
If previous Workspace is valid
    ↓
Open previous Workspace
    ↓
Workspace Overview
```

The exact persistence behavior can be finalized during architecture.

## 2.2 New User With No Workspace

```text
Open KaanViz
    ↓
No Workspace exists
    ↓
Workspace Empty State
    ↓
Create Workspace
    ↓
Workspace Overview
```

The user should not see a confusing empty analytics application.

Suggested message:

```text
Welcome to KaanViz

Create a Workspace to start bringing your data into KaanViz.

[ Create Workspace ]
```

---

# 3. Create Workspace Flow

## Trigger

User selects:

```text
+ Create Workspace
```

## Screen

Workspace creation form:

```text
Create Workspace

Workspace Name *
[________________________]

Description
[________________________]

[ Cancel ]       [ Create Workspace ]
```

Only essential information should be requested during creation.

## Success

```text
Create Workspace
    ↓
Workspace created
    ↓
User becomes Owner
    ↓
Enter Workspace Overview
```

## Error

Possible errors:

- Name validation failure
- Network/server failure
- Duplicate/conflicting workspace state
- Permission failure

Example:

```text
Could not create Workspace.

Please try again.
```

Do not discard entered form data when possible.

---

# 4. Workspace Selection Flow

## Trigger

User opens the Workspace selector.

```text
Current Workspace ▼
```

Menu:

```text
Workspaces

✓ E-Commerce Analytics
  Marketing Analytics
  Finance Analytics
  ──────────────────
  + Create Workspace
  View all Workspaces
```

## Switching

```text
Select Workspace
    ↓
Validate access
    ↓
Change active Workspace
    ↓
Clear incompatible local UI state
    ↓
Load Workspace context
    ↓
Open Workspace Overview
```

The previous Workspace's dataset, dashboard, filters, or visual selection must not leak into the new Workspace.

---

# 5. Workspace Overview Flow

After entering a Workspace:

```text
Workspace
    ↓
Overview
```

The Overview answers:

- Where am I?
- What exists here?
- What changed recently?
- What should I do next?

Suggested areas:

```text
Workspace Header

Summary
├── Datasets
├── Data Sources
├── Models
├── Visualizations
└── Dashboards

Quick Actions
├── Add Data
├── Create Table
├── Create Visualization
└── Create Dashboard

Recent Activity
```

---

# 6. Empty Workspace Flow

For a newly created Workspace:

```text
Workspace Overview
    ↓
No datasets
    ↓
Empty state
```

Example:

```text
No data has been added yet.

Bring data into this Workspace to start your analysis.

[ Upload CSV ]   [ Connect Data ]
```

The user should have a clear next action.

---

# 7. Add Data Flow

Data is always added inside an active Workspace.

```text
Workspace
    ↓
Data
    ↓
Add Data
```

Initial choices:

```text
Add Data

Upload CSV
Connect / Fetch Data
```

CSV is the initial MVP source.

Future sources may include:

```text
Excel
PostgreSQL
MySQL
Snowflake
Databricks
Cloud Storage
APIs
Other connectors
```

These are future extensions unless explicitly brought into the MVP.

---

# 8. Upload CSV Flow

## Step 1 — Select File

```text
Data
  ↓
Add Data
  ↓
Upload CSV
  ↓
File picker / drop zone
```

Example:

```text
Upload CSV

Drag and drop a CSV file here

or

[ Choose File ]

Maximum file size: according to configured system limit
```

## Step 2 — Client Validation

Validate basic file requirements before upload.

Possible errors:

- Unsupported extension
- Empty file
- Invalid file structure
- File too large

Example:

```text
This file cannot be uploaded.

The file is empty or is not a valid CSV.
```

## Step 3 — Upload

```text
Uploading
████████████░░░░ 72%
```

The UI should communicate that the file is being processed.

## Step 4 — Ingestion

After upload:

```text
File
  ↓
Ingestion
  ↓
Raw dataset stored
  ↓
Dataset record created
  ↓
Profiling
```

Raw source data remains immutable.

---

# 9. Dataset Creation Flow

After successful ingestion:

```text
Dataset Created

orders.csv

Rows: ...
Columns: ...
Status: Profiling
```

The user should be able to continue into the dataset workflow.

Possible next action:

```text
[ View Profile ]
```

---

# 10. Dataset Profile Flow

```text
Dataset
    ↓
Profile
```

Profile should present:

### Dataset-level information

- Row count
- Column count
- Missing-value summary
- Duplicate summary
- Overall quality indicators

### Column-level information

- Column name
- Physical type
- Inferred semantic type
- Null count
- Unique count
- Example values
- Basic statistics where appropriate

### Date intelligence

Where applicable:

- Minimum date
- Maximum date
- Granularity
- Date-derived information

---

# 11. Type Correction Flow

If KaanViz detects a questionable type:

```text
Profile
    ↓
Column
    ↓
Detected type
```

Example:

```text
order_date

Detected:
String

Suggested semantic type:
Date

[ Apply ] [ Change ] [ Keep Current ]
```

The user remains in control.

If the user changes a type:

```text
User selects new type
    ↓
Validate conversion
    ↓
Show result
    ↓
Apply or cancel
```

Invalid conversion must not silently corrupt the dataset.

---

# 12. Data Quality Flow

From Profile:

```text
Profile
    ↓
Data Quality
```

Show issues such as:

```text
Missing values
Duplicates
Invalid dates
Type inconsistencies
Potential anomalies
```

The system should distinguish:

```text
Detected issue
Suggested action
Applied action
```

AI-generated recommendations must be clearly identified as recommendations.

---

# 13. Prepare Flow

```text
Dataset
    ↓
Prepare
```

Preparation operations include:

### Columns

- Rename
- Reorder
- Remove
- Duplicate

### Text

- Trim
- Case normalization
- Replace
- Split
- Combine

### Missing values

- Drop rows
- Fill values
- Forward fill where applicable

### Duplicates

- Detect
- Remove

### Dates

- Parse
- Extract date components

### Numeric

- Convert
- Scale
- Derive

### Rows

- Filter
- Keep / exclude conditions

---

# 14. Transformation Flow

When the user applies a preparation operation:

```text
Select operation
    ↓
Configure operation
    ↓
Preview effect
    ↓
Apply
    ↓
Create transformation record
    ↓
Update prepared version
```

The user should be able to understand:

```text
What changed?
Why?
When?
Which columns/rows were affected?
```

---

# 15. Transformation History Flow

```text
Prepare
    ↓
Transformation History
```

Example:

```text
Transformation History

1. Removed duplicate order IDs
2. Converted order_date → Date
3. Filled missing customer_city
4. Removed cancelled rows
```

Users should be able to inspect the sequence.

Reversal/undo behavior should be explicitly defined during implementation architecture.

---

# 16. Validation Flow

Before the prepared dataset is considered ready:

```text
Prepare
    ↓
Validate
```

Validation should check:

- Schema consistency
- Type validity
- Transformation validity
- Required analytical fields
- Data integrity
- Processing errors

Success:

```text
Dataset validated

Ready for analysis.

[ Continue to Model ]
```

Failure:

```text
Validation found issues.

3 issues require attention.

[ Review Issues ]
```

---

# 17. Save Dataset Version Flow

```text
Validated Dataset
    ↓
Save
```

The system creates a processed analytical version.

Conceptually:

```text
Raw Source
   ↓
Prepared Version
   ↓
Validated Version
   ↓
Analytical Storage
```

Raw source remains immutable.

---

# 18. Model Flow

```text
Workspace
    ↓
Model
```

The Model workspace shows:

- Tables
- Columns
- Relationships
- Relationship status
- Relationship evidence where applicable

---

# 19. Create Relationship Flow

```text
Model
    ↓
Select table A
    ↓
Select table B
    ↓
Select columns
    ↓
Select relationship type
    ↓
Preview / validate
    ↓
Save relationship
```

Possible relationship types:

```text
One-to-one
One-to-many
Many-to-one
Many-to-many
```

Exact supported relationship types should be confirmed in the database/model architecture.

---

# 20. Relationship Suggestion Flow

KaanViz may infer possible relationships.

```text
Model
    ↓
Relationship suggestion
```

Example:

```text
Possible relationship detected

orders.customer_id
        ↓
customers.customer_id

Evidence:
Matching key structure
High overlap
Compatible types

[ Review ] [ Ignore ]
```

AI or automated inference must not silently create relationships.

User approval is required where the product design calls for approval.

---

# 21. Analytics Flow

Once a model exists:

```text
Model
    ↓
Analytics
```

Analytics operations may include:

- Filtering
- Aggregation
- Grouping
- Sorting
- Joins
- Statistics
- Time-series analysis
- Correlation
- Distinct counts
- KPI calculations

Large datasets should be aggregated before browser rendering.

---

# 22. Visualization Flow

```text
Workspace
    ↓
Visualize
```

Primary studio structure:

```text
┌─────────────────────────────────────────────────────────────┐
│ Toolbar                                                     │
├──────────────┬───────────────────────────────┬──────────────┤
│ Data Pane    │ Canvas                        │ Properties   │
│              │                               │              │
│ Fields       │       Visualization           │ Chart Type   │
│ Measures     │                               │ Axis         │
│ Dimensions   │                               │ Aggregation  │
│              │                               │ Filters      │
└──────────────┴───────────────────────────────┴──────────────┘
```

Users should be able to:

- Select fields
- Change chart type
- Change aggregation
- Configure axes
- Apply filters
- Resize visuals
- Duplicate visuals
- Delete visuals
- Customize visual properties

---

# 23. Visualization Creation Flow

```text
Choose dataset
    ↓
Choose fields
    ↓
Choose analysis
    ↓
Choose / recommend visualization
    ↓
Generate visualization specification
    ↓
Validate specification
    ↓
Render chart
```

Architecture principle:

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

AI must not generate arbitrary frontend HTML/JS for a visualization.

---

# 24. Prompt-to-Visual Flow

Optional AI flow:

```text
User prompt
    ↓
Intent extraction
    ↓
Structured visualization specification
    ↓
Schema validation
    ↓
Data/field validation
    ↓
Render
```

Example:

```text
"Show monthly revenue by category."

        ↓

Chart:
Line / Bar

Dimension:
Month

Measure:
Revenue

Group:
Category
```

The generated specification must be validated before rendering.

---

# 25. Explain Visual Flow

User selects:

```text
Explain Visual
```

Flow:

```text
Current visualization
    ↓
Controlled context extraction
    ↓
Deterministic result
    ↓
AI explanation
    ↓
Display explanation
```

The UI should distinguish:

```text
Facts
Calculated metrics
Interpretations
Hypotheses
```

Hypotheses must not be presented as established facts.

---

# 26. Dashboard Flow

```text
Visualize
    ↓
Save Visual
    ↓
Add to Dashboard
```

Or:

```text
Dashboards
    ↓
Create Dashboard
```

Dashboard components can include:

- KPI cards
- Charts
- Tables
- Text
- Filters

---

# 27. Create Dashboard Flow

```text
Create Dashboard
    ↓
Name dashboard
    ↓
Create
    ↓
Dashboard Builder
```

Dashboard Builder:

```text
┌─────────────────────────────────────────────────────────────┐
│ Dashboard Name                              Save            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐ ┌──────────┐ ┌──────────────────────────┐   │
│   │ KPI      │ │ KPI      │ │ Revenue Trend            │   │
│   └──────────┘ └──────────┘ └──────────────────────────┘   │
│                                                             │
│   ┌──────────────────────────────┐ ┌─────────────────────┐ │
│   │ Sales by Category            │ │ Orders Table        │ │
│   └──────────────────────────────┘ └─────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Grid layout should support moving and resizing components.

---

# 28. Dashboard Filtering Flow

```text
Dashboard
    ↓
User selects filter
    ↓
Filter context changes
    ↓
Relevant visuals re-query
    ↓
Visuals update
```

Cross-filtering:

```text
Click data point in Chart A
    ↓
Filter context changes
    ↓
Related Chart B/C update
```

The UI should clearly indicate active filters.

---

# 29. AI Analyst Flow

AI Analyst is a separate analytical workspace.

```text
AI Analyst
    ↓
User asks question
    ↓
Intent detection
    ↓
Determine required analysis
    ↓
Run validated computation
    ↓
Return result
    ↓
Explain result
```

AI should not bypass the deterministic analytics layer.

---

# 30. AI Analyst Example

User:

```text
"Which category generated the most revenue?"
```

System:

```text
Question
    ↓
Intent:
Top category by revenue
    ↓
Required analysis:
Group by category
Sum revenue
Sort descending
    ↓
Validated computation
    ↓
Result
    ↓
Explanation
```

The answer should be based on the computed result rather than unsupported model reasoning.

---

# 31. AI Availability Flow

KaanViz must work when AI is unavailable.

States:

```text
AI Online
AI Degraded
AI Unavailable
```

When unavailable:

```text
AI features unavailable

Core data, preparation, modeling,
visualization and dashboard functionality
remain available.

[ Continue Working ]
```

AI outage must not break the Workspace.

---

# 32. Workspace Permission Flow

When a user opens a Workspace:

```text
Workspace ID
    ↓
Authenticate
    ↓
Authorize membership
    ↓
Determine role
    ↓
Load allowed Workspace content
```

If unauthorized:

```text
You don't have access to this Workspace.

[ Back to Workspaces ]
```

If the user can view but cannot edit:

```text
View-only mode
```

Edit controls should reflect the user's permission level.

---

# 33. Error Recovery Principles

Every major operation should have:

```text
Idle
Loading
Success
Empty
Error
Retry
```

Where appropriate:

```text
Uploading
Processing
Validating
Saving
Querying
Rendering
```

Errors should tell the user:

1. What happened.
2. Whether their data is safe.
3. What they can do next.

---

# 34. Navigation Rules

Primary Workspace navigation:

```text
Overview
Data
Prepare
Model
Visualize
Dashboards
AI Analyst
```

Navigation should preserve Workspace context.

Example:

```text
/workspaces/123/data
/workspaces/123/prepare
/workspaces/123/model
/workspaces/123/visualize
/workspaces/123/dashboards
/workspaces/123/ai
```

The exact routing structure will be finalized in architecture.

---

# 35. Breadcrumb Context

Where useful:

```text
E-Commerce Analytics
  / Data
  / Orders
  / Profile
```

Or:

```text
E-Commerce Analytics
  / Visualize
  / Revenue by Category
```

The active Workspace should remain identifiable.

---

# 36. Unsaved Changes

For editing workflows such as Prepare, Visualize, and Dashboard Builder:

```text
User changes configuration
    ↓
Unsaved state
```

If leaving:

```text
You have unsaved changes.

[ Stay ] [ Discard ] [ Save ]
```

This behavior should be defined before implementation.

---

# 37. Destructive Operations

Potential destructive actions:

- Delete dataset
- Delete transformation/version
- Remove relationship
- Delete visualization
- Delete dashboard
- Remove Workspace member
- Delete Workspace

The UI should provide:

```text
Action
    ↓
Impact explanation
    ↓
Explicit confirmation
    ↓
Operation
    ↓
Success/error
```

---

# 38. End-to-End MVP Journey

The critical happy path is:

```text
Open KaanViz
    ↓
Create Workspace
    ↓
Workspace Overview
    ↓
Upload CSV
    ↓
Ingestion
    ↓
Profile
    ↓
Correct Types
    ↓
Prepare Data
    ↓
Validate
    ↓
Save Processed Dataset
    ↓
Create / Approve Relationship
    ↓
Create Visualization
    ↓
Apply Filter
    ↓
Create Dashboard
    ↓
Save Dashboard
    ↓
Ask AI Analyst
```

This is the primary product journey to validate during MVP development.

---

# 39. AI-Disabled End-to-End Journey

The same journey must work with AI disabled:

```text
Create Workspace
    ↓
Upload CSV
    ↓
Profile
    ↓
Prepare
    ↓
Validate
    ↓
Model
    ↓
Visualization
    ↓
Filter
    ↓
Dashboard
```

AI-dependent actions should either be hidden, disabled with explanation, or replaced by deterministic controls.

Core analytics must remain functional.

---

# 40. Critical Error Paths

The MVP should explicitly test:

### Workspace

```text
Create Workspace fails
Workspace unavailable
Permission denied
Workspace switch failure
```

### Data

```text
Invalid CSV
Empty CSV
Oversized CSV
Upload failure
Processing failure
```

### Preparation

```text
Invalid transformation
Type conversion failure
Validation failure
```

### Model

```text
Invalid relationship
Relationship validation failure
```

### Analytics

```text
Invalid query
Query timeout
No matching data
```

### Visualization

```text
Invalid visualization configuration
Unsupported field type
Rendering failure
```

### Dashboard

```text
Save failure
Invalid layout
Missing visualization
```

### AI

```text
AI unavailable
AI timeout
Invalid structured AI output
Unsupported request
```

---

# 41. Loading and Processing UX

Long-running operations should not appear frozen.

Examples:

```text
Profiling dataset...
Analyzing 24 columns

Preparing dataset...
Applying 4 transformations

Validating dataset...
Checking schema and data integrity

Running analysis...
Calculating results
```

Progress should be truthful.

Do not show fake percentages if the backend cannot provide real progress.

---

# 42. User Control Rules

At each major stage, users should understand:

```text
Current state
What changed
What KaanViz recommends
What KaanViz automatically did
What requires approval
What happens next
```

AI should act as an assistant beside the user, not as an invisible decision-maker.

---

# 43. Flow Completion Criteria

The User Flows specification is complete when each major workflow has:

- Entry point
- Preconditions
- User action
- System action
- UI state
- Success state
- Error state
- Next action
- Permission requirements
- Data/context requirements
- AI dependency status

The following workflows must be fully covered:

```text
Workspace creation
Workspace switching
Workspace management
Data upload
Data connection
Dataset profiling
Type correction
Data quality
Preparation
Transformation history
Validation
Modeling
Relationships
Analytics
Visualization
Dashboard creation
Filtering
Cross-filtering
AI Analyst
Explain Visual
AI unavailable
Errors/recovery
```

---

# 44. Definition of Done

Before implementation begins:

- Workspace-first flow is agreed.
- Primary navigation is agreed.
- Dataset lifecycle is agreed.
- Preparation lifecycle is agreed.
- Modeling flow is agreed.
- Visualization flow is agreed.
- Dashboard flow is agreed.
- AI flow is agreed.
- AI-disabled behavior is agreed.
- Critical error paths are identified.
- Permission boundaries are identified.
- Loading/empty/error states are identified.
- Destructive operations are identified.

Only after this should the system architecture and database schema be finalized.

---

# 45. North Star User Journey

```text
┌───────────────┐
│    KaanViz    │
└───────┬───────┘
        ↓
┌───────────────┐
│   Workspace   │
└───────┬───────┘
        ↓
┌───────────────┐
│     Data      │
└───────┬───────┘
        ↓
┌───────────────┐
│    Profile    │
└───────┬───────┘
        ↓
┌───────────────┐
│    Prepare    │
└───────┬───────┘
        ↓
┌───────────────┐
│    Validate   │
└───────┬───────┘
        ↓
┌───────────────┐
│     Model     │
└───────┬───────┘
        ↓
┌───────────────┐
│   Visualize   │
└───────┬───────┘
        ↓
┌───────────────┐
│   Dashboard   │
└───────┬───────┘
        ↓
┌───────────────┐
│  AI Analyst   │
└───────────────┘
```

**KaanViz should make this journey feel continuous, understandable, reversible where appropriate, and always controlled by the user.**
