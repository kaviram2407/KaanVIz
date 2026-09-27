# KaanViz — Export & File Safety Standards

## 1. Purpose

This document defines implementation standards for file handling and data export in KaanViz.

The goal is to ensure that:

- Uploaded files are handled as untrusted input.
- File processing is bounded and predictable.
- Exported data respects application boundaries.
- CSV exports cannot accidentally create spreadsheet formulas.
- Export behavior remains deterministic and independent of AI availability.
- Future file formats and connectors can be added without weakening the security model.

This document complements the KaanViz Security Coding Standards & Threat Model.

---

## 2. Core Principles

1. Uploaded files are untrusted.
2. File names, extensions, MIME types, and contents must all be validated.
3. Uploaded content must never be executed.
4. File processing must have explicit resource boundaries.
5. Raw source data remains immutable.
6. Processed data is generated through controlled preparation pipelines.
7. Exports are derived artifacts, not replacements for source data.
8. Export operations must respect workspace and resource authorization.
9. CSV formula injection must be addressed server-side.
10. Export behavior must not depend on an AI provider being available.
11. Sensitive data should not be exposed unnecessarily.
12. Future formats must use the same validation and trust-boundary model.

---

## 3. Supported File Model

KaanViz distinguishes between:

```text
Uploaded Source File
        |
        v
Validated Ingestion
        |
        v
Raw Immutable Representation
        |
        v
Profile / Prepare / Validate
        |
        v
Processed Dataset Version
        |
        v
Analytics / Visualization / Dashboard
        |
        v
Export Artifact
```

An export is therefore a representation of a selected analytical state.

It must not mutate the source dataset or silently rewrite the dataset's canonical version.

---

## 4. Upload Safety

### 4.1 File size limits

Every upload path must enforce a configurable file-size limit.

Requirements:

- Validate the limit at the API boundary.
- Do not rely only on browser-side checks.
- Reject oversized files before expensive parsing.
- Return a structured validation error.
- Record operationally useful information about repeated failures.

The exact size limit is deployment configuration.

### 4.2 Extension validation

The application must maintain an explicit allowlist of supported file types.

Do not infer support from a filename alone.

For example:

```text
sales.csv
```

must still be inspected as actual file content.

### 4.3 MIME validation

The declared MIME type must be checked against the supported file type.

MIME validation is one signal, not the sole source of truth.

### 4.4 Content validation

Before ingestion becomes trusted application state:

1. Validate file type.
2. Validate file structure.
3. Parse using an approved library.
4. Apply resource limits.
5. Reject malformed or unsupported content.
6. Record the ingestion result.

---

## 5. Safe Parsing

File parsers must operate only on data.

KaanViz must never:

- Execute uploaded scripts.
- Evaluate uploaded expressions as application code.
- Dynamically import uploaded modules.
- Execute spreadsheet macros.
- Pass uploaded content directly to a shell.
- Treat a cell as Python, JavaScript, or SQL merely because it contains code-like text.

For example, this cell:

```text
SELECT * FROM users;
```

is still a data value unless a separately designed, validated feature explicitly interprets it as a query.

---

## 6. Malicious or Malformed Files

File-processing code must expect malformed input.

Possible failures include:

- Invalid encoding
- Broken delimiters
- Unexpected column counts
- Invalid dates
- Extremely large fields
- Unexpected nested structures
- Corrupt files
- Parser exceptions
- Resource exhaustion

The application must fail safely.

User-facing responses should provide a useful explanation without exposing internal parser details.

Temporary files created during processing must be cleaned up after success or failure.

---

## 7. Macro Awareness

KaanViz must not execute spreadsheet macros.

If future spreadsheet support introduces macro-capable formats:

- Detect or account for macro content where supported.
- Define an explicit handling policy.
- Never execute macros as part of ingestion, preview, profiling, preparation, analytics, or export.

Spreadsheet support must not silently introduce an executable-content path.

---

## 8. Raw Data Preservation

Raw source data is immutable.

File processing must preserve the distinction between:

```text
Raw source
Processed version
Export
```

A preparation action must not overwrite the raw source.

An export action must not overwrite either the raw source or processed version.

Every export should be reproducible from the selected dataset/version and export parameters, subject to the application's documented runtime behavior.

---

## 9. Export Sources

Exports may be generated from:

- A validated dataset version
- An analytical query result
- A visualization's result set
- A dashboard-related data result
- A user-selected filtered state

The export service must know exactly which source it is exporting.

Conceptually:

```text
Workspace
  └── Dataset
       └── Dataset Version
            └── Analysis Result
                 └── Export
```

The selected source must be authorized before export generation.

---

## 10. Export Authorization

Export operations must be subject to the same workspace/resource authorization model as other data operations.

Before exporting:

1. Identify the authenticated principal.
2. Resolve the workspace.
3. Verify access to the dataset or analytical result.
4. Verify the requested version/result belongs to that workspace.
5. Verify that the requested operation is permitted.
6. Generate the export only after authorization succeeds.

A client-provided dataset ID or workspace ID is never proof of authorization.

---

## 11. Export Scope

Exports should contain only the data requested by the operation.

Examples:

- A filtered table export should respect the active filter.
- An aggregated analytical export should contain the analytical result rather than silently reverting to raw data.
- A dashboard export should use the dashboard's defined data state.
- A dataset export should clearly identify whether it represents raw or processed data.

The system must not silently broaden export scope.

---

## 12. CSV Export Safety

CSV is a particularly important safety boundary because spreadsheet applications may interpret certain strings as formulas.

Examples include:

```text
=SUM(A1:A10)
=HYPERLINK("https://example.com")
```

These values must not be exported unsafely.

### 12.1 Required behavior

Before writing a CSV response:

1. Identify values that may be interpreted as spreadsheet formulas.
2. Apply the application's defined safe-export policy.
3. Preserve the user's data meaning as far as practical.
4. Ensure the resulting CSV does not unintentionally create executable spreadsheet formulas.

The protection must be implemented server-side.

Frontend-only sanitization is insufficient.

### 12.2 Coverage

The protection must apply regardless of where the value originated:

- Original upload
- User transformation
- AI-recommended transformation
- Analytical result
- Calculated field
- Joined dataset
- Filtered result
- Dashboard result

### 12.3 Testing

Include cases such as:

```text
=SUM(...)
=HYPERLINK(...)
+123
-123
@value
```

Tests should verify the application's defined safe-export behavior and avoid assuming that only one formula prefix is relevant.

---

## 13. Other Export Formats

Future formats may include:

- CSV
- JSON
- Parquet
- Excel-compatible formats
- Image exports
- PDF
- Other analytical file formats

Each exporter must define:

- Input contract
- Output contract
- Size limits
- Encoding behavior
- Data-scope behavior
- Security considerations
- Filename policy
- Error behavior
- Test coverage

A new export format must not bypass authorization or data-scope checks.

---

## 14. Filename Safety

User-controlled names must not become unsafe filesystem paths.

Export filenames must be normalized and constrained.

Do not allow user-provided values to introduce:

- Path traversal
- Unexpected directories
- Control characters
- Unsupported filesystem semantics

A safe logical name should be converted into a safe output filename.

The server must control the actual storage path.

---

## 15. Content-Disposition Safety

When returning downloads over HTTP:

- Use a controlled `Content-Disposition`.
- Sanitize user-derived filenames.
- Do not construct headers from unvalidated raw input.
- Ensure filenames cannot inject additional HTTP header content.

The response content type must match the actual generated format.

---

## 16. Temporary Export Files

If an export requires temporary filesystem storage:

1. Generate it in a controlled temporary directory.
2. Use an application-generated unique identifier.
3. Do not trust user-provided paths.
4. Apply cleanup behavior after completion.
5. Apply cleanup behavior after failure.
6. Prevent unrelated users or workspaces from accessing the file.
7. Avoid keeping temporary artifacts longer than necessary.

---

## 17. Large Export Handling

Large exports must not automatically consume unbounded application memory.

Preferred strategies include:

- Streaming where appropriate
- Chunked processing
- Server-side aggregation
- Temporary-file generation
- Background export jobs for expensive operations

The browser should not receive raw massive datasets when an aggregate or paginated result is sufficient.

Export size limits should be configurable.

---

## 18. Export Job Model

For larger exports, KaanViz may use a background job:

```text
Export Request
      |
      v
Authorization
      |
      v
Export Job
      |
      v
Generate Artifact
      |
      v
Validate Artifact
      |
      v
Store / Stream
      |
      v
Download
```

The job must preserve:

- Workspace identity
- Dataset/version identity
- Requested export type
- Filter/analysis context
- Requesting principal
- Creation time
- Status
- Failure reason where safe to expose

The export job must not silently switch to a different dataset or version.

---

## 19. Export Validation

Before an export becomes downloadable, validate:

- Expected file type
- Expected encoding
- Expected schema
- Expected row/record structure
- Export scope
- Authorization context
- Safe filename
- Formula-injection handling where applicable
- Successful completion

If validation fails, do not deliver a partially generated artifact as a successful export.

---

## 20. Sensitive Data

Exports can increase the risk of data leakage.

The implementation should minimize unnecessary exposure of:

- Credentials
- Tokens
- Internal metadata
- Hidden system fields
- Unneeded sensitive columns
- Internal identifiers when they are not part of the requested output

The system should not automatically send full datasets to external AI providers merely because an export or analysis is requested.

---

## 21. AI and Export Independence

AI must not be required for normal export functionality.

The following must work with AI disabled:

- Dataset export
- Filtered export
- Analytical result export
- Visualization-related export where implemented
- Dashboard-related export where implemented

AI may assist with future export features, but deterministic export behavior remains the source of truth.

---

## 22. Storage Safety

Export artifacts stored temporarily or persistently must follow the storage abstraction.

Conceptually:

```text
LocalStorageProvider
R2StorageProvider
S3StorageProvider
AzureBlobStorageProvider
```

The exporter should depend on the storage abstraction rather than a provider-specific implementation.

Storage keys must be generated by the application and scoped to the appropriate workspace/resource.

---

## 23. Logging and Audit

Relevant export events should be observable.

Useful events include:

- Export requested
- Export rejected
- Export completed
- Export failed
- Export job started
- Export job completed
- Export job expired/cleaned up

Logs must not contain:

- API credentials
- Authentication tokens
- Full sensitive datasets
- Unnecessary raw cell contents

Audit records should contain enough metadata to understand what happened without storing the exported data itself.

---

## 24. Error States

### Invalid file

Display:

> This file could not be processed. Check the file type and contents, then try again.

### File too large

Display a clear size-limit message and the allowed limit where appropriate.

### Unsupported format

Tell the user which formats are currently supported.

### Export failed

Provide:

- Failure state
- Safe explanation
- Retry action where appropriate

### Export expired

If exports use temporary storage or download tokens, expired artifacts should produce a clear recovery path rather than exposing an internal storage error.

---

## 25. Testing Standards

### Upload tests

- Valid supported file
- Unsupported extension
- Incorrect MIME type
- Oversized file
- Malformed file
- Empty file
- Unusual encoding
- Unexpected columns
- Parser failure

### Export tests

- Valid CSV
- Filtered CSV
- Aggregated result export
- Empty result
- Large result
- Unauthorized export
- Cross-workspace export
- Invalid dataset version
- Missing analytical result
- Safe filename
- Unsafe filename
- Temporary-file cleanup

### CSV security tests

Explicitly test values beginning with spreadsheet formula characters and verify that the application's safe-export policy is applied.

### AI-disabled tests

Export functionality must continue to work when the AI provider is unavailable.

---

## 26. API Responsibilities

The API layer should expose export operations through a clear contract.

Representative future shape:

```text
POST /api/exports
GET  /api/exports/{id}
GET  /api/exports/{id}/download
```

Exact endpoint naming and schemas remain implementation decisions.

The API layer is responsible for:

- Authentication
- Authorization
- Request validation
- Workspace/resource validation
- Export job creation
- Status reporting
- Safe error responses

The export service is responsible for:

- Resolving the source data
- Applying export parameters
- Generating the artifact
- Applying format-specific safety rules
- Validating the generated artifact

---

## 27. Service Boundary

A conceptual service boundary is:

```text
Export API
    |
    v
Export Service
    |
    +--> Authorization / Workspace Validation
    |
    +--> Dataset / Analysis Resolver
    |
    +--> Exporter
    |      +--> CSV Exporter
    |      +--> JSON Exporter
    |      +--> Parquet Exporter
    |      +--> Future Exporters
    |
    +--> Artifact Validator
    |
    +--> Storage Provider
```

Format-specific behavior must stay inside the exporter implementation.

Authorization must not be delegated to an exporter.

---

## 28. Antigravity Rules

Antigravity must:

1. Treat every uploaded file as untrusted.
2. Enforce server-side file validation.
3. Never execute uploaded content.
4. Never execute spreadsheet macros.
5. Preserve raw-data immutability.
6. Never allow an export to bypass workspace authorization.
7. Never trust a client-provided path.
8. Never construct filesystem paths directly from raw user input.
9. Apply CSV formula-injection protection server-side.
10. Validate export scope before generation.
11. Avoid loading unnecessarily large datasets into browser memory.
12. Clean up temporary export artifacts.
13. Keep export behavior functional when AI is unavailable.
14. Add tests for every new export format.
15. Document any format-specific security behavior.

---

## 29. Definition of Done

An export/file-handling feature is complete only when:

- [ ] File size limits are enforced.
- [ ] Extension/MIME/content validation exists where applicable.
- [ ] Uploaded content is never executed.
- [ ] Temporary files are safely handled.
- [ ] Raw data remains immutable.
- [ ] Export source and dataset version are explicit.
- [ ] Workspace/resource authorization is enforced.
- [ ] Export scope is validated.
- [ ] CSV formula injection is addressed.
- [ ] Filenames are safely generated.
- [ ] Large exports have bounded resource behavior.
- [ ] Export failures are handled cleanly.
- [ ] Relevant events are observable.
- [ ] Unit/integration tests pass.
- [ ] AI-disabled export verification passes.
- [ ] Documentation reflects the implemented behavior.

---

## 30. Source Alignment

This document operationalizes the KaanViz requirements for file security, data security, CSV formula injection, storage abstraction, processed data handling, and export-related product behavior.

The source requirements establish that file size limits, extension/MIME validation, safe parsing, malicious-file handling, macro awareness, untrusted cell handling, secret protection, and minimized sensitive-data exposure are required. They also explicitly require protection against unsafe CSV formula export.

Where the source does not prescribe an exact export endpoint, file-size value, sanitization algorithm, or export-job implementation, those details remain implementation decisions and must be finalized without weakening the security requirements.
