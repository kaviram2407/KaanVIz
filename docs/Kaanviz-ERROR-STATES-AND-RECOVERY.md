# KaanViz — Error States & Recovery Specification

## 1. Purpose

This document defines the error-state and recovery expectations for KaanViz.

Every major feature must provide:

- Loading state
- Empty state
- Error state
- Recovery guidance

Error handling must preserve user trust, protect data, and provide a clear path forward.

A failure in one capability must not unnecessarily prevent unrelated capabilities from continuing.

---

## 2. Core Error-State Model

Each major user-facing operation should account for the following states:

```text
Initial
  ↓
Loading
  ↓
Success
  ├── Empty
  └── Error
       ↓
   Recovery
       ↓
    Retry / Edit / Back / Continue
```

The exact state sequence depends on the feature, but the user should never be left without meaningful feedback.

---

## 3. Loading State

Loading states should communicate that work is actively in progress.

Use loading states for operations such as:

- Workspace loading
- Dataset loading
- File upload
- Profiling
- Preparation
- Validation
- Relationship analysis
- Analytical queries
- Visualization generation
- Dashboard loading
- AI requests
- Export generation

Loading states should:

- Preserve the surrounding layout where practical.
- Avoid unnecessary full-screen blocking.
- Communicate the operation being performed when useful.
- Prevent duplicate actions when the operation is not safely repeatable.
- Provide progress information when meaningful progress can be measured.

Do not display false precision such as invented percentage completion.

---

## 4. Empty State

Empty states should distinguish between:

- Nothing exists yet
- Nothing matches the current filters
- The operation produced no result
- Required data has not been configured

Examples:

### Empty workspace

Explain that the workspace has no data or assets yet and provide the next useful action.

### Empty dataset

Explain that the dataset contains no usable records and provide recovery guidance where applicable.

### No profiling result

Explain that profiling has not yet completed or that there is insufficient data for profiling.

### No relationships

Explain that no approved relationships currently exist rather than presenting this as an application failure.

### No visualization

Explain that no visual has been created and provide a clear creation path.

### No dashboard components

Explain that the dashboard is empty and provide a way to add visuals or other supported components.

### No AI result

An empty AI response should not be represented as a successful analytical conclusion.

---

## 5. Error State

An error state should answer, as clearly as possible:

1. What operation failed?
2. What is the user-facing impact?
3. What can the user do next?
4. Was the underlying data preserved?

Error messages should be:

- Specific
- Actionable
- Non-technical where possible
- Honest about what happened
- Safe to display to users

Avoid exposing:

- Secrets
- Provider credentials
- Internal stack traces
- Sensitive file paths
- Raw infrastructure details
- Unvalidated AI output

Technical details may be captured in server-side logs when appropriate.

---

## 6. Recovery Guidance

Recovery guidance should match the failure.

Possible recovery actions include:

- Retry
- Re-upload
- Correct the source file
- Change a selected type
- Edit a transformation
- Re-run preparation
- Return to the previous step
- Select another dataset version
- Remove an invalid filter
- Reduce query scope
- Reconnect a data source
- Wait for a background job
- Continue without AI
- Contact an administrator when appropriate

Do not provide a recovery action that cannot actually resolve the stated problem.

---

## 7. Data Ingestion Errors

Upload and ingestion failures should distinguish between:

- Unsupported file type
- Invalid file structure
- Corrupt file
- Empty file
- File too large
- Invalid encoding
- Unsafe or disallowed content
- Processing failure
- Storage failure

The original/raw data must remain protected and must not be silently replaced by a partially processed result.

Where possible, the user should be told how to correct the source and retry.

---

## 8. Profiling Errors

Profiling can fail because of invalid input, unsupported structure, resource limitations, or processing problems.

The UI should:

- Identify that profiling failed.
- Preserve the dataset/source state.
- Provide a retry path where appropriate.
- Avoid presenting incomplete profiling results as complete.
- Keep deterministic processing independent from AI availability.

---

## 9. Preparation Errors

Preparation failures should identify the affected transformation or operation when possible.

Examples include:

- Invalid type conversion
- Invalid date parsing
- Unsupported transformation
- Missing required column
- Transformation dependency failure
- Validation failure
- Processing resource failure

A failed transformation must not silently corrupt the processed dataset.

The transformation history should remain consistent with the actual state.

Where possible, the user should be able to:

- Edit the transformation
- Remove the transformation
- Retry preparation
- Return to a previous valid version

---

## 10. Modeling and Relationship Errors

Relationship-related errors should distinguish between:

- Invalid relationship definition
- Missing columns
- Incompatible types
- Unsupported relationship
- Ambiguous relationship
- Query failure after relationship creation

The system should not silently create a relationship merely because an automated or AI suggestion exists.

User approval remains required where the product workflow requires it.

---

## 11. Analytics Errors

Analytical query failures should not be presented as valid analytical results.

Potential causes include:

- Invalid query intent
- Missing fields
- Invalid aggregation
- Unsupported operation
- Resource limitations
- Processing failure
- Dataset/version mismatch

The UI should preserve enough context for the user to correct the request without exposing internal query implementation unnecessarily.

Large-data failures should encourage narrower scope or aggregation where appropriate.

---

## 12. Visualization Errors

Visualization errors should distinguish between:

- Invalid visualization specification
- Missing data
- Unsupported chart configuration
- Invalid field mapping
- Analytical result failure
- Renderer failure
- Performance limitation

A visualization should not render misleading partial output as if it were a complete result.

Where possible, users should be able to:

- Edit the visualization configuration
- Change fields
- Change aggregation
- Change chart type
- Retry the analysis
- Return to the source analysis

---

## 13. Dashboard Errors

Dashboard failures should be isolated as much as practical.

Examples:

- Dashboard cannot load
- Individual visual fails
- Filter cannot be applied
- Cross-filtering fails
- Layout data is invalid
- Dashboard save fails
- Export fails

A failure in one visual should not automatically destroy the entire dashboard.

The dashboard should preserve valid components and clearly identify the component that failed.

---

## 14. Filter and Cross-Filtering Errors

Filter errors should explain:

- Which filter failed
- Whether the underlying visual remains usable
- Whether the filter can be removed or edited

If a cross-filter cannot be applied, the system should avoid silently changing unrelated visuals.

A safe recovery path is typically:

```text
Filter failure
    ↓
Identify affected filter
    ↓
Remove / edit filter
    ↓
Retry
```

---

## 15. AI Errors

AI is an optional capability.

The following AI states should be distinguishable:

- AI available
- AI degraded
- AI unavailable
- AI request failed
- AI response invalid
- AI response rejected by validation
- AI request timed out

Most importantly:

> AI failure must never become a core analytics failure.

When AI is unavailable, users should still be able to use deterministic product functionality.

Examples:

- Manual visualization creation remains available.
- Existing dashboards remain usable.
- Deterministic analytics remain available.
- Data preparation remains available.
- Manual questions/workflows remain available where supported without AI.

---

## 16. AI Validation Failure

An AI response that fails validation is not a successful result.

The system should:

1. Reject the invalid structure.
2. Preserve the current valid application state.
3. Record an appropriate diagnostic event.
4. Offer retry or another supported recovery path.
5. Avoid executing arbitrary AI-generated code or structures.

The user should receive a safe explanation such as the AI response being unavailable or invalid, rather than an internal validation traceback.

---

## 17. Export Errors

Export failures should identify:

- What export failed
- Whether the source data/dashboard remains intact
- Whether retry is possible

A failed export must not modify the underlying dataset or dashboard state.

If an export is generated asynchronously, the UI should represent the job state clearly.

---

## 18. Background Job Errors

Long-running operations may use background processing.

The UI should support states such as:

```text
Queued
  ↓
Running
  ↓
Succeeded
  ├── Empty result
  └── Failed
       ↓
    Retry / Recover
```

Failed jobs should not be presented as successful.

Repeated retry should be controlled where the operation is expensive or non-idempotent.

---

## 19. Workspace and Permission Errors

Workspace-scoped operations may fail because:

- Workspace does not exist
- User is not authorized
- Resource is unavailable
- Resource belongs to another workspace
- Session/context is invalid

The system must preserve workspace isolation.

Do not expose information about resources the current user is not authorized to access.

---

## 20. Network and Service Failures

Temporary service failures should be handled without unnecessarily destroying local UI state.

Where safe, provide:

- Retry
- Refresh
- Reconnect
- Return to a stable state

Do not automatically repeat operations that could create duplicate or destructive side effects unless the operation is safely idempotent.

---

## 21. Error Message Structure

A user-facing error should generally follow this structure:

```text
[What happened]

[Why it matters, when useful]

[Recommended next action]
```

Example:

```text
We couldn't apply this transformation.

The selected values could not be converted to dates.

Edit the transformation and choose a supported date format, then try again.
```

Avoid messages such as:

```text
500 Internal Server Error
NullPointerException
DuckDBException
```

unless the interface is specifically intended for technical diagnostics.

---

## 22. Recovery Principles

Recovery should preserve as much valid state as possible.

Prefer:

```text
Failure
  ↓
Preserve valid state
  ↓
Identify affected operation
  ↓
Provide targeted recovery
  ↓
Retry / edit / continue
```

Avoid:

```text
Failure
  ↓
Reset everything
```

unless a full reset is genuinely required and clearly communicated.

---

## 23. Error Observability

User-facing errors and internal diagnostics serve different purposes.

The UI should provide an understandable message and recovery path.

Internal telemetry/logging may capture:

- Error type
- Request correlation identifier
- Workspace context where appropriate
- Dataset/version context where appropriate
- Operation
- Processing duration
- Provider/service status
- Validation failure category
- Stack trace in protected server-side diagnostics

Sensitive values must not be unnecessarily logged.

---

## 24. Error Testing Requirements

Important error paths should be explicitly tested.

At minimum, test applicable failures for:

- File upload
- Profiling
- Type correction
- Preparation
- Validation
- Relationships
- Analytics
- Visualization
- Dashboard loading
- Filters
- Cross-filtering
- AI availability
- AI validation
- Export
- Background jobs
- Workspace authorization
- Network/service failures

Tests should verify both:

1. The failure is represented correctly.
2. The user has a valid recovery path.

---

## 25. Definition of Done

A feature is not complete until its major states have been considered:

```text
Loading
   ↓
Success
   ↓
Empty
   ↓
Error
   ↓
Recovery
```

For applicable features, verification should confirm:

- Loading state works
- Empty state is meaningful
- Error state is accurate
- Recovery guidance is actionable
- Valid state is preserved
- Sensitive implementation details are not exposed
- AI failure does not break core analytics
- Error paths are tested

---

## 26. Antigravity Implementation Rules

When implementing error handling:

1. Preserve the approved KaanViz UX and information architecture.
2. Implement error handling for the requested phase only.
3. Do not introduce generic error screens where a feature-specific recovery path is required.
4. Do not hide failures to make a feature appear complete.
5. Do not invent progress or successful results.
6. Preserve raw data and valid application state.
7. Keep AI failure isolated from deterministic functionality.
8. Validate all AI-generated structures before application use.
9. Add tests for important error paths.
10. Report unverified or unresolved failures honestly.

---

## 27. Final Principle

KaanViz error handling should communicate:

> Something went wrong, your valid work is protected, and here is what you can do next.

Errors are part of the product experience, not merely backend exceptions.
