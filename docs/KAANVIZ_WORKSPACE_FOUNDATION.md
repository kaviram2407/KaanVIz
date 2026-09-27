# KaanViz Workspace Foundation

**Status:** Planning / Pre-Implementation  
**Purpose:** Establish Workspace as the first-class product boundary before data ingestion, preparation, modeling, visualization, dashboards, or AI workflows are finalized.

---

## 1. Decision

KaanViz will require a **Workspace before data can be uploaded or fetched**.

The product journey is therefore:

```text
KaanViz
  ↓
Workspace
  ↓
Data Source / Dataset
  ↓
Profile
  ↓
Prepare
  ↓
Validate
  ↓
Model
  ↓
Visualize
  ↓
Dashboard
  ↓
AI Analyst
```

A user should never land directly in a dataset workflow without an active Workspace context.

This changes the original single-user/single-workspace assumption into an explicit Workspace-first product architecture while remaining compatible with the existing plan to keep the system extensible for future multi-user workspaces.

---

## 2. Why Workspace Comes First

A Workspace provides the boundary that groups related analytical work.

A Workspace can contain:

- Data sources
- Datasets
- Dataset versions
- Transformations
- Relationships
- Analytical results
- Visualizations
- Dashboards
- AI analysis sessions
- Members / contributors
- Workspace settings
- Activity / audit information

This prevents KaanViz from becoming a collection of disconnected CSV tools.

The existing project document already separates application metadata from large analytical data and identifies datasets, transformations, relationships, analysis sessions, visualizations, dashboards, and chat sessions as metadata objects. Workspace should become the parent context for these objects.

---

## 3. Workspace Hierarchy

```text
KaanViz
│
├── Workspaces
│   │
│   ├── E-Commerce Analytics
│   │   ├── Overview
│   │   ├── Data
│   │   ├── Prepare
│   │   ├── Model
│   │   ├── Visualize
│   │   ├── Dashboards
│   │   ├── AI Analyst
│   │   └── Workspace Management
│   │
│   └── Marketing Analytics
│       ├── Overview
│       ├── Data
│       ├── Prepare
│       ├── Model
│       ├── Visualize
│       ├── Dashboards
│       ├── AI Analyst
│       └── Workspace Management
│
└── User Profile
```

---

## 4. Workspace Lifecycle

### 4.1 Create Workspace

Required initial information:

- Workspace name
- Optional description

The creator automatically becomes the **Owner**.

Future creation options may include:

- Workspace icon / avatar
- Industry or use-case
- Default theme
- Initial contributors

Do not add unnecessary setup questions during MVP creation.

### 4.2 Enter Workspace

After creation, the user enters the Workspace Overview.

The active Workspace becomes the context for all subsequent operations.

### 4.3 Add Data

Only after a Workspace is active should the user see the Workspace Data workflow.

```text
Workspace
  ↓
Data
  ↓
Add Data
  ├── Upload CSV
  └── Fetch / Connect Data
```

Future connectors can be added without changing the Workspace concept.

### 4.4 Manage Workspace

Workspace members and owners can access Workspace Management according to their permissions.

### 4.5 Archive / Delete

Workspace deletion must be treated as a destructive operation.

The UI must clearly communicate the scope of deletion before confirmation.

---

# 5. Workspace UX

## 5.1 Workspace List

The top-level KaanViz experience should provide a Workspace selector/list.

Example:

```text
┌─────────────────────────────────────────────────────────────┐
│ KaanViz                                      Profile        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Workspaces                                                  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ E-Commerce Analytics                                   │ │
│ │                                                         │ │
│ │ Owner: Kaan                                            │ │
│ │ Contributors: 3                                       │ │
│ │ Datasets: 8                                           │ │
│ │ Dashboards: 4                                         │ │
│ │                                                         │ │
│ │ Last updated: 2 hours ago              Open →          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Marketing Analytics                                    │ │
│ │                                                         │ │
│ │ Owner: Kaan                                            │ │
│ │ Contributors: 2                                       │ │
│ │ Datasets: 5                                           │ │
│ │ Dashboards: 2                                         │ │
│ │                                                         │ │
│ │ Last updated: Yesterday                Open →          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                     + Create Workspace                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

The exact visual layout remains subject to the UI/UX design system.

---

# 6. Workspace Overview

The Overview is the landing page after entering a Workspace.

It should answer:

1. Where am I?
2. What is in this Workspace?
3. What happened recently?
4. What can I do next?

Suggested structure:

```text
Workspace Header
├── Workspace name
├── Description
├── Owner / members
├── Workspace selector
└── Workspace actions

Workspace Summary
├── Datasets
├── Data Sources
├── Models
├── Visualizations
└── Dashboards

Recent Activity
├── Dataset uploaded
├── Dataset updated
├── Visualization created
├── Dashboard changed
└── Contributor activity

Quick Actions
├── Add Data
├── Create Table
├── Create Visualization
└── Create Dashboard
```

The Overview should remain useful even when the Workspace is empty.

---

# 7. Empty Workspace

A newly created Workspace should not look broken.

Example:

```text
E-Commerce Analytics

No data has been added yet.

Start by bringing data into this Workspace.

[ Upload CSV ]   [ Connect Data ]
```

Secondary guidance can explain that data will become available to Prepare, Model, Visualize, and Dashboards after ingestion.

Do not expose disabled navigation as the primary experience.

---

# 8. Workspace Navigation

Once inside a Workspace:

```text
Overview
Data
Prepare
Model
Visualize
Dashboards
AI Analyst
```

Workspace management should be separated from the primary analytical workflow:

```text
Workspace Management
├── Members
├── Permissions
├── Data Sources
├── Activity / Audit
└── Settings
```

Global application navigation can remain separate:

```text
KaanViz
├── Workspace Selector
└── User Profile
```

---

# 9. Workspace Header

Every Workspace screen should make the active Workspace obvious.

Recommended header information:

```text
[E-Commerce Analytics ▼]   Data / Prepare / Model / ...
```

The Workspace selector should allow switching between Workspaces without forcing the user back to a global home page.

If the active Workspace changes, all workspace-scoped content must change accordingly.

---

# 10. Workspace Members

Workspace membership is a proposed product requirement for the multi-user-ready architecture.

Suggested roles:

### Owner

Can:

- View Workspace
- Add/remove members
- Change member roles
- Manage Workspace settings
- Manage data sources
- Create/edit/delete analytical assets
- Delete/archive Workspace

### Contributor

Can:

- View Workspace
- Add/import data if permitted
- Prepare data
- Create models
- Create visualizations
- Create/edit dashboards
- Use AI Analyst
- Modify analytical assets according to Workspace permissions

### Viewer

Can:

- View Workspace
- View datasets and analytical outputs according to access rules
- View dashboards
- View visualizations

The exact permission matrix should be finalized in the Security / Authorization design before implementation.

---

# 11. Contributor Model

The UI should distinguish:

```text
Owner
Contributors
Viewers
```

Example:

```text
Members

Kaan
Owner

Arun
Contributor

Priya
Contributor

Ravi
Viewer
```

Member management should be available from Workspace Management rather than occupying primary analytics navigation.

---

# 12. Workspace Data Boundary

Every analytical object should belong to a Workspace.

Conceptually:

```text
Workspace
   │
   ├── Dataset
   │    ├── Columns
   │    ├── Versions
   │    └── Profiles
   │
   ├── Transformations
   │
   ├── Relationships
   │
   ├── Analysis Results
   │
   ├── Visualizations
   │
   ├── Dashboards
   │
   └── AI Sessions
```

A dataset must not accidentally become visible in another Workspace merely because the same user owns both Workspaces.

Workspace identity should therefore be part of the backend authorization and data-access boundary.

---

# 13. Data Sources vs Datasets

KaanViz should distinguish **Data Source** from **Dataset**.

### Data Source

Where data comes from.

Examples:

```text
orders.csv
PostgreSQL connection
Snowflake connection
API
S3
```

### Dataset

The analytical representation used inside KaanViz.

Example:

```text
Data Source
    ↓
Ingestion
    ↓
Dataset
    ↓
Profile
    ↓
Prepared Dataset Version
```

This distinction will make future connectors easier to add.

---

# 14. Workspace-Scoped Data Flow

```text
Workspace
   ↓
Add Data
   ↓
Select Source
   ├── Upload CSV
   └── Connect / Fetch
   ↓
Ingestion
   ↓
Dataset Created
   ↓
Profiling
   ↓
Preparation
   ↓
Validated Version
   ↓
Model
   ↓
Analytics / Visualization
```

Raw source data remains immutable according to the existing KaanViz architecture.

---

# 15. Workspace State

The existing project separates server state, UI state, and workspace state.

Workspace state should explicitly include:

```text
activeWorkspaceId
activeDatasetId
activeDatasetVersionId
activeModelId
activeDashboardId
activeFilters
```

UI state remains separate:

```text
selectedVisual
openPanel
modal
theme
layout
```

Server state remains separate:

```text
datasets
profiles
relationships
dashboards
analysisResults
```

This separation should be preserved.

---

# 16. URL / Routing Concept

The implementation should use Workspace-aware routes.

Conceptually:

```text
/workspaces
/workspaces/new

/workspaces/{workspaceId}
/workspaces/{workspaceId}/data
/workspaces/{workspaceId}/prepare
/workspaces/{workspaceId}/model
/workspaces/{workspaceId}/visualize
/workspaces/{workspaceId}/dashboards
/workspaces/{workspaceId}/ai

/workspaces/{workspaceId}/members
/workspaces/{workspaceId}/settings
/workspaces/{workspaceId}/data-sources
```

Exact Next.js routing should be finalized in the architecture document.

The important rule is:

> Workspace identity must be explicit in navigation and backend context.

---

# 17. Workspace Switching

Workspace switching should be available from the application header.

Example:

```text
E-Commerce Analytics ▼

✓ E-Commerce Analytics
  Marketing Analytics
  Finance Analytics
  ──────────────────
  + Create Workspace
  View all Workspaces
```

Switching Workspace should:

1. Change active Workspace context.
2. Load that Workspace's datasets and assets.
3. Clear incompatible dataset/dashboard/filter UI state.
4. Navigate to an appropriate Workspace landing page.
5. Never leak assets from the previous Workspace.

---

# 18. Workspace-Level Error States

Examples:

### Workspace unavailable

```text
Workspace unavailable

This Workspace may have been deleted, archived,
or you may no longer have access.

[ Back to Workspaces ]
```

### Permission denied

```text
You don't have permission to perform this action.

[ Return to Workspace ]
```

### Empty Workspace

```text
This Workspace doesn't have any datasets yet.

[ Add Data ]
```

These states should be designed before implementation.

---

# 19. Workspace Activity

Workspace activity can eventually provide an audit-friendly timeline:

```text
Today

10:42 AM
Kaan uploaded orders.csv

10:51 AM
Arun created "Sales Model"

11:07 AM
Priya created "Revenue Dashboard"

11:23 AM
Kaan updated the Orders transformation
```

For MVP, this can remain lightweight.

A full enterprise audit implementation can be handled later.

---

# 20. Workspace Settings

Initial settings categories:

```text
Workspace Settings
├── General
├── Members & Permissions
├── Data Sources
├── Appearance
└── Danger Zone
```

Danger Zone:

```text
Archive Workspace
Delete Workspace
```

Destructive operations require explicit confirmation.

---

# 21. Relationship to Existing KaanViz Architecture

The original project specification defines:

```text
Home | Data | Prepare | Model | Visualize | Dashboards | AI Analyst
```

This navigation remains valid, but it is now **inside a Workspace**.

The revised structure is:

```text
KaanViz
  ↓
Workspace
  ↓
Home / Overview
  ↓
Data
  ↓
Prepare
  ↓
Model
  ↓
Visualize
  ↓
Dashboards
  ↓
AI Analyst
```

The original project document also states that the application should feel like a professional analytics studio rather than a generic chatbot. Workspace-first architecture supports that direction by making KaanViz feel like a persistent analytical environment rather than a one-off upload tool.

---

# 22. Proposed Metadata Changes

The original metadata model contains:

```text
users
datasets
dataset_columns
dataset_versions
transformations
relationships
analysis_sessions
analysis_results
visualizations
dashboards
dashboard_visuals
chat_sessions
chat_messages
```

The Workspace-first model should introduce:

```text
workspaces
workspace_members
```

And workspace ownership/context should be represented for workspace-scoped entities.

Conceptually:

```text
users
  │
  └── workspace_members
          │
          └── workspaces
                  │
                  ├── datasets
                  ├── transformations
                  ├── relationships
                  ├── analysis_sessions
                  ├── visualizations
                  ├── dashboards
                  └── chat_sessions
```

The exact relational schema belongs in the later database-schema document.

---

# 23. API Direction

The existing API surface should become Workspace-aware.

Instead of thinking only in terms of:

```text
GET /api/datasets
POST /api/datasets/upload
```

the conceptual API boundary becomes:

```text
GET  /api/workspaces
POST /api/workspaces
GET  /api/workspaces/{workspaceId}

GET  /api/workspaces/{workspaceId}/datasets
POST /api/workspaces/{workspaceId}/datasets/upload

GET  /api/workspaces/{workspaceId}/dashboards
POST /api/workspaces/{workspaceId}/dashboards

GET  /api/workspaces/{workspaceId}/members
```

Exact endpoint structure and request/response schemas will be finalized later.

---

# 24. Important Product Rule

> **No active Workspace = no workspace-scoped data operation.**

Therefore:

```text
Upload Data
Fetch Data
Create Dataset
Create Model
Create Visualization
Create Dashboard
Ask Workspace AI
```

all require a Workspace context.

This should be enforced in both UI and backend authorization—not only through frontend navigation.

---

# 25. Revised Primary User Journey

The main KaanViz journey is now:

```text
Open KaanViz
      ↓
Workspace List
      ↓
Create or Select Workspace
      ↓
Workspace Overview
      ↓
Add / Fetch Data
      ↓
Dataset Created
      ↓
Profile
      ↓
Prepare
      ↓
Validate
      ↓
Save Dataset Version
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

---

# 26. Revised MVP Boundary

### Must have

- Workspace creation
- Workspace selection
- Workspace overview
- Active Workspace context
- Workspace-scoped datasets
- Workspace-scoped analytical assets
- Owner concept
- Basic contributor/member concept
- Workspace switching
- Workspace settings foundation
- Workspace-aware routing
- Workspace-aware backend authorization boundary

### Can remain lightweight initially

- Full invitations
- Advanced permission policies
- Enterprise audit logs
- Workspace templates
- Workspace cloning
- Workspace archival workflows
- Advanced organization hierarchy

---

# 27. What We Should NOT Build Yet

Do not implement:

- Enterprise organizations
- Billing
- Teams across organizations
- Complex RBAC
- SSO
- SCIM
- Cross-workspace sharing
- Collaboration comments
- Real-time multiplayer editing

These can be future architecture extensions.

The Workspace abstraction should simply make those additions possible later.

---

# 28. Planning Decision

Before implementation, the architecture pack should now be ordered as:

```text
01  Initial Project Spec
02  UI/UX Preference
03  Workspace Foundation
04  User Flows
05  System Architecture
06  Database Schema
07  API Specification
08  Data Architecture
09  Visualization Specification
10  AI Architecture
11  Security
12  Testing
13  Local Development
14  Roadmap
```

Workspace is intentionally placed before User Flows because every major flow now depends on Workspace context.

---

# 29. Workspace Definition of Done

The Workspace design is considered complete when we can answer:

- How is a Workspace created?
- How is a Workspace selected?
- What happens when no Workspace exists?
- What appears in Workspace Overview?
- How does the user switch Workspaces?
- What belongs to a Workspace?
- Who owns a Workspace?
- Who can contribute?
- What can viewers do?
- How is Workspace context represented in routes?
- How is Workspace context enforced by the backend?
- How does data ingestion attach to a Workspace?
- What happens when Workspace access is lost?
- How are destructive Workspace operations handled?
- Which Workspace features are MVP vs future?

Only after these are agreed should implementation begin.

---

## Final Product Principle

**KaanViz is not a file uploader with charts.**

It is a **Workspace-based analytics environment** where users bring data into a controlled analytical context and progressively turn that data into models, insights, visualizations, dashboards, and AI-assisted analysis.

The Workspace is therefore the foundation—not an add-on.
