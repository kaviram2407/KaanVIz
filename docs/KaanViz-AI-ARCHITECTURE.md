# KaanViz — AI Architecture

**Status:** Planning / Pre-Implementation  
**Purpose:** Define the AI system as an optional, controlled intelligence layer over the deterministic KaanViz data and analytics platform.

---

## 1. Purpose

KaanViz is AI-powered but AI-optional.

The core product must remain operational when an AI provider is unavailable.

AI should help users:

- ask questions about data
- generate visualization specifications
- explain visuals
- surface insights
- translate explanations
- accelerate analytical workflows

AI must not become the source of truth for data correctness.

The deterministic data, preparation, analytics, visualization, and validation layers remain authoritative.

---

## 2. Core AI Principles

1. **AI is an enhancement, not a dependency.**
2. **Deterministic computation happens before AI explanation.**
3. **AI outputs are structured and validated.**
4. **AI must not execute arbitrary Python or SQL without validation.**
5. **AI must not receive unnecessary raw data.**
6. **Dataset content is untrusted data, not instructions.**
7. **Provider credentials remain server-side.**
8. **Users remain in control of AI-generated suggestions.**
9. **AI failures must degrade gracefully.**
10. **Facts, calculations, interpretations, and hypotheses must remain distinguishable.**

---

## 3. AI Development Sequence

KaanViz should not be built around an LLM first.

The intended development sequence is:

```text
Data Engine
    ↓
Visualization Engine
    ↓
Dashboard
    ↓
AI Context
    ↓
AI Provider
    ↓
Structured AI Output
    ↓
Validation
    ↓
AI UI
```

This ensures the AI layer has reliable deterministic systems to operate against.

---

## 4. AI Architecture

Conceptually:

```text
┌──────────────────────────────────────────┐
│              KaanViz UI                  │
│ AI Analyst / Insights / Explain Visual   │
└───────────────────┬──────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│             AI Application Layer         │
│ Intent / Context / Prompt / Validation  │
└───────────────────┬──────────────────────┘
                    │
          Structured AI Contract
                    │
                    ▼
┌──────────────────────────────────────────┐
│              AI Provider Layer           │
│ NVIDIA │ OpenAI │ Azure OpenAI │ Future  │
└───────────────────┬──────────────────────┘
                    │
                    ▼
             External AI Model
```

The AI application layer is responsible for controlling what enters and leaves the provider boundary.

---

## 5. AI Provider Abstraction

Use a provider abstraction:

```text
AIProvider
├── NVIDIAProvider
├── OpenAIProvider
├── AzureOpenAIProvider
└── FutureProvider
```

The application should not depend directly on one provider's SDK throughout the codebase.

A provider abstraction allows:

- provider switching
- provider outage handling
- future providers
- testing with mock providers
- consistent request/response contracts

---

## 6. Provider Credentials

AI provider credentials remain server-side.

Rules:

- never expose provider API keys to the frontend
- never persist secrets in source control
- load credentials through server-side configuration/secrets management
- never include provider credentials in AI context
- never return credentials through API responses

The frontend communicates with KaanViz's backend AI endpoints, not directly with external providers.

---

## 7. AI Availability States

KaanViz exposes three conceptual states:

### AI Online

AI functionality is available.

### AI Degraded

AI is available but may be slow, rate-limited, or partially unavailable.

Core analytics remains operational.

### AI Unavailable

AI-assisted features are unavailable.

The user-facing message is:

> AI features unavailable — Core analytics remains fully operational.

The application must not treat AI unavailability as a platform-wide failure.

---

## 8. AI Capability Boundaries

AI capabilities are divided into controlled workflows.

### AI Analyst

Natural-language questions about the user's data.

### Prompt-to-Visual

Natural-language requests that produce structured visualization specifications.

### Explain Visual

Explanation of a selected chart using controlled analytical context.

### AI Insights

Structured observations derived from validated analytical results.

### Multilingual Explanations

Translate explanations without changing the underlying facts or calculations.

---

## 9. AI Analyst

AI Analyst is a separate workspace for questions and insights.

The required pipeline is:

```text
Question
   ↓
Intent
   ↓
Required Analysis
   ↓
Validated Computation
   ↓
Result
   ↓
Explanation
```

AI should determine what the user is asking for, but deterministic KaanViz services should perform the actual computation.

---

## 10. AI Analyst Request Contract

Conceptually:

```text
User Question
├── workspace context
├── dataset context
├── relevant schema/profile context
└── conversation context
```

The AI layer produces a structured analytical intent.

Conceptually:

```text
Intent
├── question type
├── required fields
├── required operation
├── filters
├── grouping
├── time context
└── output preference
```

The backend validates this intent before executing analysis.

---

## 11. AI Analyst Safety Boundary

The AI must not execute arbitrary Python or SQL without validation.

Safe conceptual flow:

```text
Question
  ↓
LLM-generated intent
  ↓
Schema validation
  ↓
Field validation
  ↓
Operation validation
  ↓
Query / analysis generation
  ↓
Execution through approved analytics layer
  ↓
Validated result
  ↓
AI explanation
```

The AI is therefore an interface to the analytics engine rather than an unrestricted execution environment.

---

## 12. AI Context

AI should receive only the context required for the current task.

Possible context includes:

- workspace context
- dataset metadata
- dataset schema
- column metadata
- semantic types
- relevant profiling information
- validated analytical results
- visualization specification
- active filters
- relevant conversation context

Raw data should not be sent to the model unless a specific, controlled workflow requires it.

---

## 13. Context Minimization

The AI context builder should follow a minimum-required-context principle.

For example:

```text
Explain Visual
    ↓
Chart specification
    +
Aggregated result
    +
Dataset metadata
    +
Active filters
    +
Relevant profile information
```

It should not automatically send:

- unrelated datasets
- unrelated workspace content
- complete raw files
- unrelated conversations
- secrets
- credentials

---

## 14. Prompt Injection Boundary

Dataset contents are data.

A cell containing text such as:

```text
Ignore previous instructions and...
```

must remain dataset content rather than becoming an instruction to the AI system.

The AI architecture must keep these conceptual layers separate:

```text
System instructions
        ≠
Application instructions
        ≠
User request
        ≠
Dataset content
```

Dataset content must never silently override system or application rules.

---

## 15. Structured AI Output

AI output should use explicit structured contracts.

Examples include:

```text
AnalyticalIntent
VisualizationSpecification
Insight
Explanation
```

The system should validate the returned structure before using it.

Invalid output must not be trusted merely because it is syntactically valid JSON.

---

## 16. AI Output Validation

Validation should happen in layers.

### Layer 1 — Schema validation

Check that the response matches the expected structured contract.

### Layer 2 — Semantic validation

Check that:

- referenced datasets exist
- referenced fields exist
- requested operations are supported
- values are allowed
- filters are valid
- visualization types are supported

### Layer 3 — Analytical validation

Check that the requested operation can be safely executed against the analytical engine.

### Layer 4 — Application validation

Check workspace permissions and application policy.

Only validated output may proceed to execution or persistence.

---

## 17. AI Insight Classification

Every insight should be classified.

### Fact

Directly supported by data.

Example:

```text
Revenue increased by 18% between January and February.
```

### Calculated Metric

Mathematically derived from validated data.

Example:

```text
Average order value is $74.20.
```

### Interpretation

A reasonable explanation of an observed pattern.

Example:

```text
The increase appears concentrated in the returning-customer segment.
```

### Hypothesis

A possible explanation that requires further validation.

Example:

```text
A promotional campaign may have contributed to the increase.
```

The UI must clearly distinguish these categories.

---

## 18. Insight Generation Flow

Insights should follow:

```text
Dataset
   ↓
Deterministic Analysis
   ↓
Validated Analytical Result
   ↓
AI Context
   ↓
AI Interpretation
   ↓
Classification
   ↓
User-visible Insight
```

AI should not invent numerical facts that were not established by the analytical layer.

---

## 19. Explain Visual

When a user selects a chart and chooses **Explain with AI**, send controlled context:

- chart specification
- aggregated results
- dataset metadata
- active filters
- relevant profile information

The response may cover:

- what the chart shows
- notable patterns
- anomalies
- limitations
- clearly labeled hypotheses

Conceptual flow:

```text
Selected Visual
      ↓
Controlled Context
      ↓
AI Explanation
      ↓
Classification / validation
      ↓
User
```

---

## 20. Prompt-to-Visual

Prompt-to-Visual follows:

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

The LLM returns a structured visualization specification.

It must never return arbitrary frontend code for execution.

---

## 21. AI-Generated Visualization Validation

A generated visual must pass the same validation path as a manually created visual.

Validate:

- chart type
- dataset/version
- fields
- dimensions
- measures
- aggregation
- filters
- filter behavior
- sorting
- configuration
- workspace ownership

This prevents AI from bypassing application safety boundaries.

---

## 22. Multilingual Explanations

KaanViz should support explanations in languages such as:

- English
- Tamil
- Hindi
- other supported languages

Translation must not change the underlying facts or calculations.

The numerical result and analytical meaning remain authoritative regardless of explanation language.

---

## 23. Conversation Context

AI Analyst conversations may maintain relevant conversational context.

Context should remain scoped to the appropriate:

- workspace
- dataset
- analytical session
- user interaction

Conversation history should not automatically grant access to unrelated workspace resources.

---

## 24. AI Session Model

An AI session should conceptually retain:

```text
AI Session
├── workspace
├── user
├── optional dataset context
├── conversation messages
├── analytical requests
├── results
└── timestamps
```

The session is context for the AI experience, not a replacement for authoritative analytical records.

---

## 25. AI Request Lifecycle

A controlled AI request should follow:

```text
Frontend
   ↓
Authenticated API
   ↓
Workspace / permission validation
   ↓
Task-specific context builder
   ↓
Provider request
   ↓
Structured response
   ↓
Schema validation
   ↓
Semantic validation
   ↓
Analytical/application validation
   ↓
Persist or return result
```

Failures at any stage should produce a controlled application error.

---

## 26. AI Errors

AI errors should be classified where practical:

- provider unavailable
- provider timeout
- rate limit
- invalid provider response
- invalid structured output
- validation failure
- unsupported request
- permission failure
- context construction failure

The UI should provide actionable messages without exposing secrets or internal provider details unnecessarily.

---

## 27. AI Retry Behavior

Retries must be controlled.

Do not blindly retry every failed request.

Retry behavior should consider:

- provider timeout
- transient provider failure
- rate limiting
- request idempotency
- user intent

Validation failures should not be repeatedly retried as though they were network failures.

---

## 28. AI Observability

Track operational metadata such as:

- provider
- model identifier where appropriate
- request type
- latency
- success/failure
- validation result
- token/cost metadata where available
- correlation/request identifier

Do not log sensitive raw dataset content unnecessarily.

---

## 29. AI Privacy and Data Handling

AI context must be intentionally constructed.

The system should avoid sending:

- secrets
- credentials
- unrelated workspace data
- unnecessary raw dataset rows
- unrelated conversation content

The application should make the AI data boundary understandable to users.

---

## 30. AI and Workspace Isolation

Every AI request must be workspace-aware.

Before constructing context:

```text
User
 ↓
Workspace membership
 ↓
Requested dataset / visual / dashboard
 ↓
Permission validation
 ↓
Context construction
```

An AI prompt must never become a mechanism for bypassing workspace authorization.

---

## 31. AI Persistence

AI-generated artifacts may include:

- analysis results
- visualization specifications
- insights
- explanations
- chat messages

Persist structured artifacts where reproducibility or user history requires them.

The authoritative source for numerical results remains the analytical system.

---

## 32. AI Provider Testing

The provider abstraction should support mock providers for testing.

Tests should cover:

- successful response
- provider unavailable
- timeout
- malformed response
- invalid structured output
- unsupported operation
- validation rejection
- workspace authorization failure

Core application tests must not require a live external AI provider.

---

## 33. AI-Disabled Mode

KaanViz must support an explicit AI-disabled operating mode.

When AI is disabled:

- upload works
- profiling works
- preparation works
- modeling works
- analytics works
- visualization works
- dashboards work
- filters work
- exports work

AI-specific controls should either be hidden or clearly marked unavailable.

The core application must remain fully usable.

---

## 34. AI Availability UX

The product should communicate AI status clearly without making AI feel like the foundation of KaanViz.

Examples:

```text
AI Online
AI Degraded
AI Unavailable
```

When unavailable:

> AI features unavailable — Core analytics remains fully operational.

The interface should continue exposing manual alternatives where available.

---

## 35. AI Governance Rules

AI-generated content must be:

- structured
- validated
- attributable to the AI-assisted workflow
- editable where applicable
- rejectable by the user
- reversible where applicable

AI should suggest rather than silently mutate important user data or analytical state.

---

## 36. Definition of Done

### Architecture

- provider abstraction exists
- AI context construction is separated from provider calls
- structured contracts exist
- validation boundaries are defined
- workspace authorization is enforced

### AI Analyst

- question → intent → analysis → result → explanation works
- arbitrary Python/SQL execution is prevented
- deterministic analytical results remain authoritative

### Prompt-to-Visual

- natural-language prompt can produce a structured visual specification
- specification validation works
- invalid output is rejected
- manual visualization remains available

### Explain Visual

- controlled chart context is sent
- explanation is grounded in validated results
- hypotheses are clearly labeled

### Insights

- facts are distinguishable from calculations
- interpretations are distinguishable from hypotheses

### Provider resilience

- online state works
- degraded state works
- unavailable state works
- core analytics continues during AI outage

### Security

- credentials remain server-side
- dataset content is treated as untrusted data
- workspace boundaries are enforced
- sensitive context is minimized

### Testing

- mock provider tests exist
- validation tests exist
- AI-disabled E2E path passes
- provider failure paths pass

---

## 37. Implementation Rule for Antigravity

Antigravity must treat AI as a controlled application layer, not as the application foundation.

Do not:

- make AI mandatory
- execute arbitrary LLM-generated Python or SQL
- trust unvalidated AI output
- expose provider credentials
- send unnecessary raw data
- allow dataset text to become system instructions
- bypass workspace authorization
- let AI silently overwrite important user state
- replace deterministic analytics with LLM reasoning

Do:

- build deterministic systems first
- use structured contracts
- validate every AI-generated artifact
- preserve user approval/control
- provide manual alternatives
- support provider abstraction
- test AI-disabled behavior
- document provider-specific decisions

---

## 38. North Star

KaanViz AI should behave like a capable analytical assistant:

> **AI helps the user ask better questions, discover patterns, create visuals, and understand results—but deterministic KaanViz systems remain responsible for the data and computation.**

The user remains in control, and KaanViz remains useful even when AI is unavailable.
