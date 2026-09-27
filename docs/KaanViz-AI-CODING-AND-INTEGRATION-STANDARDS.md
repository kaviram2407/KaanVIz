# KaanViz — AI Coding & Integration Standards

## 1. Purpose

This document defines implementation standards for integrating AI into KaanViz.

AI is an enhancement layer over deterministic data, analytics, visualization, and dashboard foundations.

The core principle is:

> Build the product around reliable analytical foundations first; add AI on top of validated context and structured outputs.

AI must never become a mandatory dependency for core application functionality.

---

## 2. AI Development Sequence

The approved development sequence is:

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
UI
```

Do not build the product around an LLM first.

The AI layer should consume established deterministic capabilities rather than becoming the foundation for them.

---

## 3. AI Provider Abstraction

Use a provider abstraction:

```text
AIProvider
├── NVIDIAProvider
├── OpenAIProvider
├── AzureOpenAIProvider
└── FutureProvider
```

The application should depend on the provider interface rather than hardcoding one provider throughout the product.

---

## 4. Provider Responsibilities

An AI provider adapter should handle provider-specific concerns such as:

- Authentication
- Provider API communication
- Request formatting
- Response parsing
- Provider errors
- Provider-specific configuration
- Provider-specific limits

Provider-specific implementation should not leak into unrelated application services.

---

## 5. Provider Credentials

Provider credentials remain server-side.

The frontend must never receive AI API keys.

Do not:

- Embed provider credentials in frontend bundles.
- Return provider secrets through API responses.
- Store credentials in source control.
- Place secrets in visualization specifications.
- Expose credentials through browser-accessible configuration.

---

## 6. AI Availability States

The application should represent AI availability explicitly.

Supported conceptual states:

```text
AI Online
AI Degraded
AI Unavailable
```

The UI should not imply that AI is available when the provider cannot process requests.

A suitable unavailable message is:

> AI features unavailable — Core analytics remains fully operational.

---

## 7. AI Independence

AI outages must not break the core application.

When AI is unavailable, users should still be able to use applicable deterministic functionality such as:

- Data upload
- Profiling
- Data preparation
- Validation
- Modeling
- Analytical queries
- Visualization creation
- Dashboards

AI-specific actions should display an appropriate unavailable state rather than blocking unrelated workflows.

---

## 8. AI Analyst Architecture

AI Analyst is a separate workspace for questions and insights.

The core pipeline is:

```text
Question
   ↓
Intent
   ↓
Required analysis
   ↓
Validated computation
   ↓
Result
   ↓
Explanation
```

AI should not execute arbitrary Python or SQL without validation.

---

## 9. AI Intent

The model should convert a user question into structured analytical intent.

Conceptually:

```text
User question
   ↓
Structured intent
   ├── Dataset/version
   ├── Dimensions
   ├── Measures
   ├── Aggregations
   ├── Filters
   ├── Grouping
   └── Other supported analytical requirements
```

The exact schema should follow the API and analytics specifications.

---

## 10. Deterministic Computation Boundary

AI should identify or request the analysis.

The deterministic analytics engine performs the actual computation.

Preferred flow:

```text
User question
   ↓
AI intent
   ↓
Intent validation
   ↓
Deterministic analytical query
   ↓
Validated result
   ↓
AI explanation
```

Do not allow the model to invent numerical results.

---

## 11. AI Context

AI receives controlled analytical context such as:

- Dataset metadata
- Profile metrics
- Validated analysis results
- Relevant columns
- Current filters
- Visualization specification
- User question

The model should not receive unrestricted database access.

---

## 12. Context Construction

Context should be intentionally scoped to the current operation.

For example:

```text
AI question
    +
Relevant dataset metadata
    +
Relevant profile metrics
    +
Validated analysis result
    +
Relevant filters
    +
Visualization context
```

Do not send unrelated workspace data merely because it is available.

---

## 13. Dataset Content as Data

Uploaded dataset contents must be treated as data, not trusted instructions.

AI context construction must distinguish between:

```text
System instructions
User request
Dataset-derived content
Application metadata
```

Dataset cells may contain text that resembles instructions.

That text must not automatically become trusted model instructions.

---

## 14. AI Output Validation

AI-generated output must be validated before application use.

The baseline validation pipeline is:

```text
LLM
 ↓
Pydantic schema
 ↓
Allowed values
 ↓
Dataset-column validation
 ↓
Application object
```

Invalid output is rejected safely.

---

## 15. Validation Layers

Depending on the operation, validation should include:

### Schema validation

Does the output match the expected structure?

### Allowed-value validation

Are chart types, operations, aggregations, and other enums supported?

### Dataset-column validation

Do referenced fields actually exist in the selected dataset/version?

### Semantic validation

Does the requested operation make sense for the selected field?

### Application validation

Does the structure satisfy current workspace and feature constraints?

---

## 16. Invalid AI Output

If AI output fails validation:

1. Reject it.
2. Preserve the current valid application state.
3. Record an appropriate diagnostic event.
4. Return a controlled error state.
5. Allow retry or another supported recovery path.

Do not execute partially valid output simply because some fields passed validation.

---

## 17. AI Insights

Every insight should be classified as one of:

### Fact

Directly supported by data.

### Calculated Metric

Mathematically derived from validated data.

### Interpretation

Reasonable explanation of an observed pattern.

### Hypothesis

Possible explanation that requires further validation.

The UI must clearly distinguish these categories.

---

## 18. Fact Handling

Facts should be traceable to validated data or validated analytical results.

The system should avoid presenting generated narrative as a direct data fact unless the underlying evidence supports it.

---

## 19. Calculated Metrics

Calculated metrics must be derived from validated analytical computation.

AI should explain the result rather than inventing the calculation.

Conceptually:

```text
Validated data
   ↓
Deterministic calculation
   ↓
Metric
   ↓
AI explanation
```

---

## 20. Interpretation

Interpretations may describe observed patterns.

They should remain distinguishable from direct facts.

For example, a generated explanation of why a metric changed should not automatically be represented as proven causation.

---

## 21. Hypotheses

Hypotheses are possible explanations that require further validation.

The UI must label them clearly as hypotheses.

Do not silently convert a hypothesis into:

- Fact
- Causal conclusion
- Verified explanation

---

## 22. Explain Visual

When a user selects a chart and chooses **Explain with AI**, send controlled context including:

- Chart specification
- Aggregated results
- Dataset metadata
- Active filters
- Relevant profile information

The response can cover:

- What the chart shows
- Patterns
- Anomalies
- Limitations
- Clearly labeled hypotheses

The AI should not receive unrestricted database access merely because the user selected a visual.

---

## 23. Prompt-to-Visual

Prompt-to-Visual should follow:

```text
User request
   ↓
AI intent
   ↓
Structured visualization specification
   ↓
Schema validation
   ↓
Semantic validation
   ↓
Analytical validation
   ↓
Application validation
   ↓
Renderer
```

AI must not generate arbitrary frontend HTML/JavaScript for visualization creation.

---

## 24. AI and Visualization Specifications

AI should generate supported structured configuration such as:

- Chart type
- Data roles
- Fields
- Aggregations
- Sorting
- Filters
- Supported appearance settings

The visualization renderer should consume the validated specification.

---

## 25. AI and Data Preparation

AI may recommend transformations.

It must not directly mutate the dataset.

Preferred flow:

```text
AI recommendation
   ↓
User review/approval
   ↓
Structured transformation
   ↓
Validation
   ↓
Deterministic transformation engine
   ↓
Processed dataset version
```

This preserves user control and data lineage.

---

## 26. AI and Analytics

AI may determine analytical intent.

The analytics engine performs the computation.

Do not allow AI-generated arbitrary SQL or Python to bypass analytical validation.

The analytical request should be converted into a controlled structure before execution.

---

## 27. AI Conversation Context

AI Analyst conversations should retain enough context to understand the current session.

Relevant context may include:

- Current workspace
- Dataset/version
- Prior approved analytical results
- Current filters
- Relevant visual/dashboard context
- Conversation messages

Context should remain scoped to the authorized workspace and session.

---

## 28. Conversation State

Conversation state should distinguish between:

- User message
- AI response
- Analytical request
- Validated result
- Explanation
- Suggested action

Do not treat every conversational message as an executable instruction.

---

## 29. AI Request Lifecycle

A typical AI request should follow:

```text
Receive request
      ↓
Authenticate/authorize
      ↓
Resolve workspace
      ↓
Resolve dataset/context
      ↓
Construct controlled context
      ↓
Call provider
      ↓
Parse structured response
      ↓
Validate response
      ↓
Execute deterministic operation if applicable
      ↓
Persist appropriate result
      ↓
Return user-facing response
```

---

## 30. AI Error Handling

AI requests should account for:

- Provider unavailable
- Provider degraded
- Timeout
- Rate limit
- Invalid provider response
- Invalid structured output
- Dataset/context mismatch
- Validation failure

AI-specific failures should not break unrelated application functionality.

---

## 31. AI Retry Behavior

Retries should be controlled.

Retry may be appropriate for transient provider failures.

Avoid blindly retrying:

- Invalid model output
- Invalid user input
- Authorization failures
- Unsupported analytical requests

Repeated retries should not create duplicate durable side effects.

---

## 32. AI Observability

AI operations should provide appropriate telemetry such as:

- Request duration
- Provider
- Availability state
- Success/failure
- Validation failure
- Retry count
- Token/cost metrics where supported and appropriate

Do not log sensitive prompts, secrets, or raw dataset contents unnecessarily.

---

## 33. AI Privacy

AI context should contain only information necessary for the requested operation.

Do not send:

- Unrelated workspace data
- Unnecessary raw rows
- Secrets
- Credentials
- Internal infrastructure information

Where possible, prefer:

```text
Metadata
+
Aggregated results
+
Relevant filtered context
```

over unrestricted raw data.

---

## 34. Workspace Isolation

AI requests must respect workspace boundaries.

Before constructing context, validate:

```text
User
 ↓
Workspace membership
 ↓
Dataset/resource access
 ↓
AI context
```

AI must never be used as a path around authorization controls.

---

## 35. AI UI Integration

AI UI should clearly communicate:

- AI availability
- What the AI is doing
- When a result is computed
- When a result is an interpretation
- When something is a hypothesis
- When AI output is unavailable
- When user approval is required

The AI should appear as an intelligent analyst beside the user, not as a black-box replacement for deterministic analytics.

---

## 36. AI Accessibility

AI interactions should support:

- Keyboard navigation
- Accessible labels
- Loading states
- Error states
- Text-based result presentation
- Clear classification labels
- Reduced-motion preferences

AI availability should not be communicated only through color.

---

## 37. AI Testing

AI integrations should be tested at multiple levels.

### Provider abstraction

- Provider selection
- Provider failure
- Provider unavailable
- Provider timeout
- Provider response parsing

### Structured output

- Valid schema
- Invalid schema
- Unsupported values
- Missing fields
- Invalid dataset columns
- Semantic mismatch

### AI Analyst

- Question-to-intent
- Intent validation
- Deterministic computation
- Explanation
- Error handling

### Prompt-to-Visual

- Valid specification
- Invalid specification
- Unsupported chart
- Invalid field
- Invalid aggregation

### Explain Visual

- Controlled context
- Correct visualization metadata
- Active filter context
- Hypothesis labeling

### AI-disabled mode

- Core analytics remains operational
- Visualization remains operational
- Dashboard remains operational
- AI actions show appropriate unavailable state

---

## 38. Mocking and Deterministic Tests

Core automated tests should not require a live external AI provider for every test run.

Use controlled/mock provider behavior where appropriate to test:

- Valid output
- Invalid output
- Provider failure
- Timeout
- Degraded state

Live provider testing can be performed separately when required.

---

## 39. Security Rules

AI implementation must:

- Keep credentials server-side
- Validate all AI output
- Treat dataset content as untrusted data
- Prevent arbitrary code execution
- Prevent unrestricted database access
- Preserve workspace isolation
- Avoid unnecessary sensitive context
- Protect logs

---

## 40. Antigravity Implementation Rules

When implementing AI:

1. Confirm deterministic foundations already exist.
2. Implement only the requested AI phase.
3. Use the provider abstraction.
4. Keep credentials server-side.
5. Keep AI optional.
6. Construct controlled context.
7. Treat dataset content as untrusted data.
8. Use structured outputs.
9. Validate every AI-generated structure before use.
10. Never execute arbitrary AI-generated Python/SQL without validation.
11. Preserve user approval for AI-recommended data changes where required.
12. Preserve raw-data immutability.
13. Add AI-disabled tests.
14. Test provider failure and invalid output.
15. Report failures honestly.
16. Document important AI architecture decisions.

---

## 41. Definition of Done

An AI feature is complete when:

- The deterministic dependency exists.
- Provider abstraction is used.
- Credentials remain server-side.
- Controlled context is constructed.
- Structured output is validated.
- Invalid output is safely rejected.
- Workspace isolation is verified.
- AI-unavailable behavior works.
- Core analytics remains operational without AI.
- Important error paths are tested.
- AI-specific tests pass.
- Documentation is updated.
- Verification status is reported honestly.

---

## 42. Final Principle

KaanViz should use AI to make validated analytical capabilities easier to access and understand.

The intended relationship is:

```text
Reliable data
     ↓
Deterministic analytics
     ↓
Validated application state
     ↓
Controlled AI context
     ↓
Structured AI assistance
     ↓
Validated result
```

AI adds intelligence to the workspace without taking ownership of the underlying truth, data, or application logic.
