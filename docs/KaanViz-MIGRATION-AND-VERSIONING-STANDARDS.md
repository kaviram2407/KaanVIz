# KaanViz — Migration & Versioning Standards

## 1. Purpose

This document defines standards for database migrations, dataset versioning, transformation history, metadata evolution, and backward-compatible application changes in KaanViz.

KaanViz has two distinct versioning concerns:

1. **Application schema versioning** — PostgreSQL schema changes managed through Alembic.
2. **Analytical data versioning** — dataset and transformation history used to preserve reproducibility and lineage.

These concerns must remain separate.

---

## 2. Core Principles

1. Database schema changes are explicit and migration-controlled.
2. Dataset versions are immutable analytical states.
3. Raw source data remains immutable.
4. Transformations are recorded as lineage.
5. Historical analytical states must not silently change because a new application version was deployed.
6. Migrations must be deterministic and repeatable.
7. Destructive schema changes require deliberate migration planning.
8. Application code must remain compatible with the deployed schema during controlled rollout where necessary.
9. AI availability must not affect migration or dataset-version integrity.
10. Version identifiers must be explicit rather than inferred from timestamps alone.

---

## 3. Two Versioning Systems

### 3.1 Application schema version

Managed through:

```text
Alembic
    |
    v
PostgreSQL schema
```

This version answers:

> What structure does the metadata database currently use?

### 3.2 Dataset version

Managed through dataset-version records and processed artifacts.

This version answers:

> What analytical state of this dataset was produced?

These must not be conflated.

---

## 4. Dataset Version Model

A dataset may have multiple versions:

```text
Dataset
  |
  +-- Version 1
  |
  +-- Version 2
  |
  +-- Version 3
```

A version represents a defined state of the dataset after ingestion, preparation, or another supported lifecycle operation.

A dataset version should retain enough metadata to identify:

- Dataset
- Version identifier
- Creation time
- Source/version relationship
- Processing status
- Schema state
- Row/record characteristics where applicable
- Storage location/reference
- Transformation lineage reference

---

## 5. Immutable Version Principle

Once a dataset version is finalized, it should not be silently modified in place.

Prefer:

```text
Version 1
    |
    | preparation
    v
Version 2
```

over:

```text
Version 1
    |
    | overwrite
    v
Version 1
```

This preserves reproducibility and supports transformation history.

---

## 6. Raw Data Immutability

Raw source data is immutable.

A preparation operation must not rewrite the original uploaded source.

Conceptually:

```text
Raw Source
   |
   +--> Dataset Version 1
   |
   +--> Dataset Version 2
   |
   +--> Dataset Version 3
```

The exact physical storage strategy may evolve, but the logical immutability rule remains.

---

## 7. Transformation Lineage

Each transformation records the state change it represents.

A lineage entry should capture concepts such as:

```json
{
  "column": "order_date",
  "original_type": "string",
  "final_type": "date",
  "transformation": "parse_date",
  "timestamp": "...",
  "applied_by": "user"
}
```

The implementation may extend this structure with:

- Dataset version
- Transformation ID
- Operation parameters
- Source version
- Target version
- User/system actor
- Status
- Validation result

---

## 8. Transformation Identity

A transformation must be identifiable independently of its display label.

Do not rely only on:

```text
"Convert date"
```

Prefer a structured operation identity such as:

```text
parse_date
```

with validated parameters.

This makes transformation history machine-readable and reproducible.

---

## 9. User vs System Transformations

Lineage should distinguish whether a transformation was applied by:

```text
user
system
```

Future AI-assisted transformations may also need a source classification, but an AI recommendation must not be represented as if it were a user-approved operation until the user actually accepts it.

---

## 10. AI Recommendations and Versioning

AI may recommend a transformation.

The safe sequence is:

```text
AI Recommendation
      |
      v
User Review
      |
      +--> Reject
      |
      +--> Edit
      |
      v
User Approval
      |
      v
Deterministic Transformation
      |
      v
New Dataset Version
```

The recommendation itself is not a finalized dataset transformation.

This preserves the principle that AI enhances deterministic data processing rather than replacing it.

---

## 11. Dataset Version Status

A version may require lifecycle states such as:

```text
created
processing
validated
ready
failed
archived
```

The exact enum can evolve.

The important rule is that consumers such as analytics and visualization should operate only on versions in an appropriate valid state.

---

## 12. Version Lineage

A version should be traceable to its source.

Conceptually:

```text
Version 1
   |
   +-- Transformation A
   |
   +-- Transformation B
   |
   v
Version 2
```

This should allow the application to answer:

- Where did this version come from?
- Which transformations produced it?
- Which actor applied them?
- Which source version was used?
- Which processed artifact corresponds to it?

---

## 13. Version and Storage Alignment

Dataset version metadata and physical artifacts must remain consistent.

For example:

```text
Dataset Version 2
      |
      +--> processed/version-2.parquet
      |
      +--> metadata/version-2-profile.json
      |
      +--> lineage/version-2.json
```

The exact paths may differ by storage provider.

The application must not persist a metadata record pointing to an artifact that was never successfully produced.

---

## 14. Transaction Boundaries

Metadata changes should be transactional where practical.

A dataset-version creation workflow should avoid leaving a misleading "ready" version if processing failed.

Conceptually:

```text
Create version metadata
       |
       v
Process artifact
       |
       v
Validate artifact
       |
       v
Mark version ready
```

Failure should result in an explicit failed/incomplete state rather than a false success.

Where physical storage and PostgreSQL transactions cannot be atomic together, the implementation must use explicit reconciliation/cleanup behavior.

---

## 15. PostgreSQL Migration Tooling

KaanViz uses:

```text
PostgreSQL
Alembic
SQLAlchemy
```

Database schema changes must be represented by Alembic migrations.

Do not manually modify production schema outside the migration process except through an explicitly documented emergency procedure.

---

## 16. Migration Naming

Migration revisions should have descriptive names.

Prefer:

```text
add_workspace_membership
add_dataset_version_status
add_visualization_spec
```

over opaque descriptions such as:

```text
update_db
```

The migration history should make the purpose of each schema change understandable.

---

## 17. Migration Contents

Each migration should define only the schema change required for that revision.

Typical operations include:

- Create table
- Add column
- Add index
- Add constraint
- Modify nullable behavior
- Add relationship
- Add enum/value representation where supported

Avoid unrelated application changes inside schema migrations.

---

## 18. Forward and Backward Considerations

For changes that require multiple deployment steps, prefer an expand/contract approach.

### Expand

Introduce new structures while preserving compatibility.

```text
Old code <-> Expanded schema
```

### Migrate

Backfill or transition data.

```text
Existing data
      |
      v
New representation
```

### Contract

Remove obsolete structures only after dependent application code no longer requires them.

```text
New code <-> Final schema
```

This reduces deployment-time incompatibilities.

---

## 19. Data Backfills

Backfills must be treated as data migrations rather than casual application startup work.

A backfill should define:

- Input population
- Transformation logic
- Idempotency behavior
- Progress visibility
- Failure handling
- Rollback/recovery approach
- Validation

Large backfills should not block normal API startup unnecessarily.

---

## 20. Idempotency

Migration and backfill operations should be designed to avoid accidental repeated application.

For example:

```text
Run migration
    |
    v
Run again
    |
    v
No duplicate data or destructive repetition
```

Where strict idempotency is not possible because Alembic controls revision execution, the underlying data transformation should still have a clearly defined one-time behavior.

---

## 21. Destructive Migrations

Destructive changes require additional review.

Examples:

- Dropping columns
- Dropping tables
- Removing indexes relied upon by queries
- Deleting metadata
- Changing identifiers
- Removing historical lineage

Before destructive changes:

1. Identify consumers.
2. Confirm historical-data impact.
3. Confirm backup/recovery coverage.
4. Confirm application compatibility.
5. Test against representative data.
6. Document the decision.

---

## 22. Historical Dataset Compatibility

A new application version must not silently reinterpret old dataset versions in a way that changes their meaning.

Examples requiring care:

- Semantic type definitions
- Transformation semantics
- Visualization specification schemas
- Analysis result schemas
- Dashboard configuration schemas

If a format changes, define an explicit migration or compatibility layer.

---

## 23. Visualization and Dashboard Versioning

Persisted visualization specifications and dashboard layouts may outlive the application code that created them.

Therefore:

```text
Stored Spec Version
       |
       v
Compatibility / Migration
       |
       v
Current Runtime Spec
```

The same principle applies to:

- Visualization specifications
- Dashboard visual configuration
- Filter state
- AI structured output persisted as application state

Do not assume historical JSON will always match the latest schema.

---

## 24. AI Output Versioning

Structured AI output that becomes persisted application state should carry enough information to understand the schema it conforms to.

For example:

```text
spec_version
schema_version
provider
model
```

The exact metadata is implementation-specific.

AI-generated output must still pass deterministic validation before persistence.

---

## 25. API Contract Evolution

API request/response schemas may evolve independently of database migrations.

When changing an API:

- Preserve compatibility where required.
- Introduce new fields before removing old ones when practical.
- Validate both old and new representations during a transition.
- Document breaking changes.

Do not use database migration success as proof that the API contract is compatible.

---

## 26. Migration Testing

Every migration must be tested against representative database states.

Minimum checks:

- Fresh database
- Previous production-like schema
- Migration upgrade
- Application startup after migration
- Data integrity
- Relevant constraints
- Relevant indexes
- Downgrade strategy where supported

For significant migrations, test with realistic row counts and metadata relationships.

---

## 27. Dataset Version Testing

Test:

- Initial dataset creation
- New version creation
- Version lineage
- Transformation history
- Failed processing
- Retry behavior
- Version selection
- Historical version analytics
- Historical visualization usage
- Raw-data immutability

A failed preparation must not accidentally replace the last valid version.

---

## 28. Migration and Storage Testing

Where metadata references physical artifacts, verify both sides.

Example:

```text
PostgreSQL
dataset_version -> artifact reference
                     |
                     v
Storage
             artifact exists
```

Test failure cases such as:

- Metadata created but artifact generation fails
- Artifact created but metadata transaction fails
- Artifact deleted unexpectedly
- Storage provider unavailable
- Version marked ready incorrectly

The system should have a defined reconciliation or repair path.

---

## 29. Rollback and Recovery

Rollback strategy depends on the change type.

### Schema migration

Use the documented Alembic strategy where downgrade is safe and supported.

### Dataset version

Prefer creating a new version or restoring a known valid version rather than mutating historical state.

### Processing failure

Keep the last valid dataset version available.

### Storage failure

Do not mark a version ready until required artifacts are confirmed.

---

## 30. Migration Observability

Migration operations should expose enough information for operators to determine:

- Current schema revision
- Migration success/failure
- Backfill progress where applicable
- Duration
- Failure reason
- Affected objects

Do not log secrets or unnecessary sensitive data.

---

## 31. Deployment Sequence

A typical schema-affecting deployment may follow:

```text
Backup / recovery check
        |
        v
Apply migration
        |
        v
Verify schema
        |
        v
Deploy compatible application
        |
        v
Run validation
        |
        v
Complete rollout
```

For expand/contract changes:

```text
Expand
  ->
Deploy compatible code
  ->
Migrate/backfill
  ->
Verify
  ->
Deploy final code
  ->
Contract
```

The exact deployment process belongs to the deployment environment.

---

## 32. Antigravity Migration Rules

Antigravity must:

1. Use Alembic for PostgreSQL schema changes.
2. Never silently alter the database outside the migration system.
3. Preserve raw-data immutability.
4. Preserve dataset-version history.
5. Record transformation lineage.
6. Treat AI recommendations as recommendations until approved.
7. Avoid destructive migrations without explicit architectural approval.
8. Test migrations against representative states.
9. Avoid coupling schema migrations to provider-specific connector behavior.
10. Preserve workspace/resource relationships.
11. Maintain compatibility for persisted visualization and dashboard specifications.
12. Validate metadata-to-storage consistency.
13. Never mark a dataset version ready before its required artifacts are valid.
14. Document migration decisions.
15. Report migration failures honestly.

---

## 33. Definition of Done

A migration/versioning change is complete only when:

- [ ] The schema change has an Alembic migration.
- [ ] Migration naming is descriptive.
- [ ] Existing data compatibility is understood.
- [ ] Dataset version semantics remain intact.
- [ ] Raw data remains immutable.
- [ ] Transformation lineage remains traceable.
- [ ] Relevant backfills are tested.
- [ ] Destructive effects are reviewed.
- [ ] Metadata/storage consistency is verified.
- [ ] Relevant API compatibility is verified.
- [ ] Visualization/dashboard persistence remains compatible.
- [ ] Migration tests pass.
- [ ] Recovery behavior is documented.
- [ ] Documentation reflects the implemented migration.

---

## 34. Source Alignment

This document operationalizes the KaanViz requirements for dataset versions, transformation lineage, PostgreSQL metadata, Alembic migrations, immutable raw data, processed analytical versions, and the phased implementation model.

The source defines dataset versions and transformation history as core architectural concepts and specifies PostgreSQL, SQLAlchemy, and Alembic for metadata and migrations. It does not prescribe an exact migration naming convention, expand/contract rollout process, or artifact reconciliation implementation; those are implementation standards introduced here to preserve the source requirements safely.
