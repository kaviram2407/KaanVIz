# KaanViz — Antigravity Implementation Rules

## 1. Purpose

This document defines the implementation rules for Antigravity when building KaanViz.

The goal is to keep implementation aligned with the approved KaanViz architecture, product experience, data-safety principles, and phased delivery plan.

Antigravity must execute the requested implementation scope without silently redesigning the product or changing architectural decisions.

---

## 2. Core Implementation Rules

### Rule 1 — Read the specification before coding

Before implementing any feature or phase:

- Read the relevant KaanViz specification.
- Understand the intended architecture and dependencies.
- Identify the phase being requested.
- Check existing implementation before introducing new structures.

Do not begin implementation based only on a short task description when the project specification contains relevant requirements.

---

### Rule 2 — Implement the requested phase only

Stay within the approved implementation phase.

Do not silently implement:

- Future-phase features
- Deferred MVP features
- Enterprise features
- Unrequested redesigns
- Unrequested architectural changes
- Unrelated refactors

If an adjacent dependency is genuinely required, implement only the minimum required dependency and document why it was necessary.

---

### Rule 3 — Preserve the information architecture and design system

The existing KaanViz information architecture and design system are authoritative.

Preserve:

- Navigation structure
- Workspace-centered product model
- Existing screen responsibilities
- Component hierarchy
- Design tokens
- Interaction patterns
- Visual language
- Responsive behavior
- Accessibility expectations

Do not introduce a competing navigation model or parallel UX pattern without an explicit architectural decision.

---

### Rule 4 — Do not redesign without approval

Implementation work must not become an unsolicited product redesign.

If an existing design creates an implementation problem:

1. Identify the problem.
2. Explain the constraint.
3. Propose the smallest viable change.
4. Wait for approval when the change affects product behavior, information architecture, or visual direction.

---

### Rule 5 — Avoid unnecessary dependencies

Prefer the existing technology stack and established project dependencies.

Before adding a dependency, determine whether the requirement can reasonably be implemented using:

- Existing project libraries
- Native platform capabilities
- Existing internal utilities
- Existing shared components

New dependencies should have a clear technical reason and should not be introduced merely for convenience.

---

### Rule 6 — Do not replace technologies without justification

The approved KaanViz technology choices should remain stable unless there is a documented reason to change them.

Do not replace a selected technology because another library appears easier or more familiar.

Any technology change should document:

- The problem with the existing choice
- Why the replacement solves it
- Compatibility implications
- Migration implications
- Testing implications
- Maintenance implications

---

## 3. Data and AI Safety Rules

### Rule 7 — Keep AI optional

AI must remain an enhancement, not a dependency for core functionality.

Core workflows must continue to function when an AI provider is:

- Disabled
- Unavailable
- Degraded
- Misconfigured
- Temporarily failing

AI failure must not prevent users from performing deterministic data operations, visualization work, dashboard work, or other non-AI functionality within the implemented phase.

---

### Rule 8 — Keep raw data immutable

Raw uploaded/source data must remain immutable.

Implementation must preserve separation between:

- Original/raw data
- Prepared/processed data
- Derived analytical results
- Visualizations
- AI-generated suggestions

Transformations should create derived versions or transformation records rather than silently modifying the original source.

---

### Rule 9 — Validate AI-generated structures

AI output must never be treated as trusted executable application logic.

Validate AI-generated structures before they affect application state.

Validation should cover the applicable layers, including:

- Schema validity
- Allowed values
- Semantic validity
- Analytical validity
- Application constraints
- Workspace/data access boundaries

AI should produce structured intent, specifications, suggestions, or explanations rather than arbitrary frontend or backend code.

---

## 4. Testing and Verification Rules

### Rule 10 — Add tests for important functionality

Important functionality must receive appropriate automated coverage.

Depending on the implementation phase, this can include:

- Unit tests
- Integration tests
- API/contract tests
- Frontend component tests
- End-to-end tests
- Security tests
- Error-path tests

Testing should focus especially on critical data boundaries and user-visible behavior.

---

### Rule 11 — Run tests after implementation

Do not treat writing tests as completion.

After implementation:

1. Run the relevant automated tests.
2. Inspect failures.
3. Fix failures caused by the implementation.
4. Re-run the affected tests.
5. Record remaining failures honestly.

---

### Rule 12 — Report failures honestly

Implementation reports must distinguish between:

- Passed
- Failed
- Blocked
- Not run
- Manually verified
- Not manually verified

Do not hide failing tests, warnings, build failures, or known limitations.

---

### Rule 13 — Never claim verification that was not performed

Do not claim that something was:

- Tested
- Verified
- Production-ready
- Manually checked
- Security-reviewed
- Performance-tested

unless the corresponding verification actually occurred.

Evidence should match the claim.

---

## 5. Security and Repository Rules

### Rule 14 — Keep secrets out of source control

Never commit secrets, credentials, tokens, private keys, or provider API keys into source control.

Use the project's environment/configuration mechanism for secrets.

Examples include:

- AI provider credentials
- Database credentials
- Storage credentials
- Authentication secrets
- Encryption keys
- Third-party API keys

Sample configuration should use placeholders or documented environment variable names rather than real credentials.

---

## 6. Architecture Documentation Rules

### Rule 15 — Document important architectural decisions

Important implementation decisions must be documented when they affect:

- Architecture
- Data lifecycle
- API contracts
- Database structure
- Workspace isolation
- Storage
- AI behavior
- Security
- Visualization architecture
- Dashboard architecture
- Performance
- Deployment

Documentation should explain the decision and its rationale rather than merely recording the final implementation.

---

## 7. Phase Execution Protocol

Every implementation phase should follow this operating sequence:

```text
Read specification
      ↓
Confirm requested phase
      ↓
Inspect existing implementation
      ↓
Implement approved scope
      ↓
Add/update tests
      ↓
Run tests
      ↓
Perform manual verification
      ↓
Verify error paths
      ↓
Update documentation
      ↓
Report status honestly
```

The next phase should not begin until the current phase satisfies the project's Definition of Done.

---

## 8. Definition of Done

A KaanViz implementation phase is complete only after:

```text
Implementation
 ↓
Unit tests
 ↓
Integration tests
 ↓
Manual verification
 ↓
Error-path verification
 ↓
Documentation
 ↓
Status report
```

This sequence is mandatory for phase completion.

A feature should not be considered complete merely because the code compiles or the primary happy path works.

---

## 9. Status Reporting Format

At the end of a phase, the implementation report should clearly state:

### Implemented

List the functionality actually completed.

### Tests

List:

- Unit tests run
- Integration tests run
- End-to-end tests run, when applicable

### Manual Verification

State what was manually checked.

### Error Paths

State which failure and recovery paths were verified.

### Known Issues

List unresolved failures, limitations, or deferred work.

### Documentation

List specifications or architectural documents updated.

### Phase Status

Use an explicit status such as:

- Complete
- Complete with known limitations
- Blocked
- In progress

Do not use a stronger status than the evidence supports.

---

## 10. Antigravity Guardrails

Before making a change, verify:

- Is this part of the requested phase?
- Does it preserve the approved architecture?
- Does it preserve the information architecture?
- Does it preserve the design system?
- Does it keep AI optional?
- Does it preserve raw-data immutability?
- Are AI-generated structures validated?
- Are important behaviors tested?
- Are secrets excluded?
- Does the change require architectural documentation?

If the answer to any of these is unclear, stop and resolve the ambiguity before expanding implementation scope.

---

## 11. Final Principle

Antigravity is an implementation agent for KaanViz, not an independent product decision-maker.

The implementation should be:

- Spec-driven
- Phase-controlled
- Test-backed
- Data-safe
- AI-optional
- Architecture-preserving
- Honest about verification
- Documented when decisions matter

The specification defines the intended product. Implementation should faithfully realize it rather than silently redefine it.
