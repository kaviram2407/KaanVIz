# KaanViz — Accessibility Specification

## 1. Purpose

This document defines the accessibility requirements for KaanViz.

Accessibility is part of the product experience and must be considered across:

- Workspace navigation
- Data management
- Data preparation
- Modeling
- Visualization
- Dashboards
- AI Analyst
- Forms
- Dialogs
- Tables
- Filters
- Charts
- Loading, empty, and error states

The target accessibility behavior includes keyboard navigation, visible focus states, semantic HTML, accessible labels, screen-reader-friendly controls, sufficient contrast, and reduced-motion support.

Charts should provide textual summaries where possible.

---

## 2. Accessibility Principles

KaanViz should provide equivalent access to important product functionality regardless of input method.

Core principles:

1. Keyboard access must be supported.
2. Focus must remain visible and understandable.
3. Controls must have meaningful accessible names.
4. Semantic HTML should be preferred over unnecessary custom interaction patterns.
5. Dynamic state changes should be communicated appropriately.
6. Color must not be the only way to communicate meaning.
7. Motion should respect reduced-motion preferences.
8. Data visualizations should have non-visual alternatives where practical.

---

## 3. Keyboard Navigation

All important interactive functionality should be reachable and usable with a keyboard.

This includes:

- Global navigation
- Workspace navigation
- Dataset selection
- Tabs
- Buttons
- Links
- Forms
- Dropdowns
- Dialogs
- Menus
- Filters
- Tables
- Visualization controls
- Dashboard controls
- AI Analyst controls

Avoid keyboard traps.

Users should be able to move logically through the interface and return focus to the initiating control after temporary overlays close where appropriate.

---

## 4. Focus Management

Focus states must be visible.

Interactive controls should provide a clear focus indicator that remains distinguishable from:

- Hover
- Selected
- Disabled
- Error
- Active states

When a modal dialog opens:

1. Move focus into the dialog.
2. Keep focus within the dialog while it is active.
3. Provide a keyboard method to close it where appropriate.
4. Return focus to the originating control after closing.

When navigation or major page content changes, focus should remain predictable and should not be unexpectedly lost.

---

## 5. Semantic HTML

Prefer native semantic elements and established accessible components.

Use appropriate elements for:

- Navigation
- Main content
- Headings
- Sections
- Forms
- Labels
- Buttons
- Links
- Tables
- Lists

Do not use generic containers as interactive controls when a native semantic control is appropriate.

Custom components should preserve the expected keyboard and accessibility behavior of the interaction they represent.

---

## 6. Headings and Page Structure

Each major screen should have a clear heading hierarchy.

The structure should communicate:

```text
Page
 ├── Primary section
 │    ├── Subsection
 │    └── Subsection
 └── Secondary section
```

Headings should describe the content rather than merely the visual appearance.

Do not use heading levels only to achieve a desired font size.

---

## 7. Accessible Labels

Interactive controls need meaningful accessible names.

This applies to:

- Icon-only buttons
- Chart controls
- Dashboard controls
- Filter controls
- Dataset actions
- Toolbar actions
- Close buttons
- Expand/collapse controls
- Visualization configuration controls
- AI actions

An icon by itself is not sufficient when its meaning is not otherwise exposed.

Tooltips can supplement an accessible name but should not be the only mechanism for identifying a critical action.

---

## 8. Forms

Forms should associate labels with their corresponding controls.

Forms should communicate:

- Required fields
- Invalid values
- Validation messages
- Current values
- Available options
- Relevant constraints

Errors should be associated with the affected field where possible.

Do not rely on placeholder text as the only label.

---

## 9. Tables and Data Grids

Data tables should preserve understandable relationships between:

- Column headers
- Rows
- Cells
- Sorting state
- Filtering state
- Pagination or virtualized regions

Important table interactions should remain keyboard accessible.

When a dataset is large and virtualization is used, the implementation must still provide an understandable navigation model for keyboard and assistive-technology users.

---

## 10. Data Preparation Accessibility

Preparation workflows should make the current state understandable without relying solely on color or visual position.

For example, a transformation row should communicate:

- Transformation type
- Target column
- Current status
- Validation state
- Available actions

If a transformation fails, the failure should be associated with the relevant operation and provide recovery guidance.

---

## 11. Visualization Accessibility

Visualization is a core KaanViz capability and requires special treatment.

Charts should provide textual summaries where possible.

A chart should communicate, as appropriate:

- Chart type
- Title
- Primary dimensions
- Measures
- Relevant filters
- Important values or trends
- Current state

Do not assume that visual inspection of a chart is the only way to understand the result.

---

## 12. Color and Meaning

Color should not be the sole carrier of important information.

Avoid patterns where users must distinguish information only through:

- Red vs green
- Similar shades
- Color-only status indicators
- Color-only categories

Where color communicates state, supplement it with appropriate:

- Text
- Icons
- Labels
- Patterns
- Position
- Other distinguishable cues

This is especially important for:

- Data quality
- Validation status
- Dashboard status
- Filter state
- Chart categories
- AI availability

---

## 13. Contrast

Text and important interface elements should have sufficient contrast against their backgrounds.

Check contrast across:

- Light theme
- Dark theme
- Disabled states where applicable
- Focus indicators
- Error states
- Warning states
- Success states
- Chart labels
- Dashboard components

The design system should use semantic color tokens so contrast improvements can be applied consistently.

---

## 14. Dark Mode

Dark mode must remain accessible rather than simply inverting colors.

Verify:

- Text readability
- Control boundaries
- Focus indicators
- Selected states
- Error/warning/success states
- Chart readability
- Disabled states
- Overlay and dialog contrast

Do not introduce colors that are readable in light mode but become ambiguous in dark mode.

---

## 15. Reduced Motion

KaanViz should support reduced-motion preferences.

When a user requests reduced motion:

- Avoid unnecessary animation.
- Reduce transitions where appropriate.
- Avoid motion-dependent information.
- Preserve functional state changes without requiring animation.

Motion should improve comprehension, not be required to understand the interface.

---

## 16. Loading States

Loading states should communicate that an operation is in progress without relying only on animation.

Where appropriate, provide:

- Textual status
- Accessible loading semantics
- Stable layout
- Clear indication of what is loading

Do not use an endlessly spinning indicator as the only information.

---

## 17. Empty States

Empty states should communicate:

1. What is empty.
2. Why it may be empty.
3. What the user can do next.

The primary recovery or creation action should be keyboard accessible and clearly labeled.

---

## 18. Error States

Errors should be understandable to users with or without assistive technology.

An error should identify:

- What failed
- What was affected
- What can be done next

Important error messages should be exposed through appropriate accessible semantics so they are not only visually displayed.

Do not expose internal stack traces or infrastructure details as the primary user-facing error.

---

## 19. Dashboard Accessibility

Dashboard editing and viewing should support accessible interaction with:

- Grid items
- Charts
- KPI cards
- Tables
- Text blocks
- Filters
- Toolbar controls

Drag-and-drop should not be the only way to reposition or configure dashboard components.

Where the visual layout interaction cannot be fully represented through a pointer, provide accessible controls for the same meaningful operation where practical.

---

## 20. Visualization Studio Accessibility

The three-pane Visualization Studio should remain usable without requiring pointer-only interaction.

Important operations include:

- Selecting a dataset
- Selecting fields
- Configuring chart type
- Configuring aggregation
- Applying filters
- Editing properties
- Duplicating a visualization
- Deleting a visualization
- Explaining a visualization

Each operation should have an accessible control and understandable state.

---

## 21. Filters

Filters should communicate:

- Filter name
- Current value
- Available values or range
- Applied state
- Clear/reset action

Filter changes should be understandable when they affect multiple visuals.

Do not rely solely on visual highlighting to indicate which filters are active.

---

## 22. AI Analyst Accessibility

AI Analyst interactions should remain accessible across:

- Question input
- Submit action
- Loading state
- Result display
- Error state
- Suggested actions
- Conversation history
- Structured results

AI responses should not depend exclusively on visual formatting.

Where AI produces analytical results, important conclusions should be represented in readable text.

---

## 23. AI Availability States

AI availability should be understandable without relying solely on color.

States such as:

- Online
- Degraded
- Unavailable

should have textual or otherwise accessible labels.

When AI is unavailable, the interface should make the non-AI path clear where applicable.

---

## 24. Dialogs, Menus, and Overlays

Temporary interface layers should provide predictable keyboard behavior.

Examples:

- Confirmation dialogs
- Dataset actions
- Export dialogs
- Visualization configuration
- AI explanations
- Workspace settings
- Command menus

Requirements include:

- Accessible name
- Correct focus handling
- Keyboard interaction
- Predictable closing behavior
- No inaccessible background interaction while a modal is active

---

## 25. Tooltips

Tooltips should supplement, not replace, essential information.

Do not place critical instructions, error details, or required actions exclusively inside hover-only tooltips.

Important information should remain accessible to:

- Keyboard users
- Touch users
- Screen-reader users

---

## 26. Responsive Accessibility

Responsive layouts must preserve accessibility.

When the layout changes across screen sizes:

- Navigation should remain reachable.
- Content order should remain understandable.
- Controls should remain usable.
- Text should remain readable.
- Important actions should not disappear without an alternative.

Responsive behavior must not create a pointer-only workflow.

---

## 27. Accessibility and Performance

Accessibility should not be treated as separate from performance.

The application should avoid unnecessary client-side work that delays:

- Keyboard interaction
- Focus updates
- Screen rendering
- Accessible state updates

For large datasets, KaanViz should continue to follow the analytical architecture:

```text
Raw data
   ↓
Analytical computation
   ↓
Aggregated result
   ↓
Visualization
```

Avoid shipping huge raw datasets to the browser.

---

## 28. Accessibility Testing

Accessibility should be tested at both component and end-to-end levels.

Testing should cover:

- Keyboard navigation
- Focus visibility
- Focus management
- Semantic structure
- Accessible names
- Form errors
- Dialog behavior
- Table interaction
- Visualization controls
- Dashboard controls
- Filter controls
- Loading states
- Empty states
- Error states
- Reduced motion
- Light mode
- Dark mode
- Chart textual summaries

Automated accessibility checks should supplement, not replace, manual keyboard and assistive-technology verification.

---

## 29. Accessibility Definition of Done

A major feature should not be considered complete until:

```text
Keyboard access
      ↓
Visible focus
      ↓
Semantic structure
      ↓
Accessible labels
      ↓
State communication
      ↓
Contrast verification
      ↓
Reduced-motion behavior
      ↓
Manual accessibility verification
```

For visualization-heavy features, also verify:

```text
Chart
 ↓
Textual summary where possible
 ↓
Accessible controls
 ↓
Non-color-only meaning
```

---

## 30. Antigravity Implementation Rules

When implementing accessibility:

1. Preserve the approved KaanViz information architecture.
2. Preserve the design system while improving accessibility.
3. Do not remove keyboard alternatives in favor of pointer-only interactions.
4. Do not rely solely on color for meaning.
5. Do not use tooltips as the only source of critical information.
6. Keep charts understandable through text where possible.
7. Respect reduced-motion preferences.
8. Test both normal and error states.
9. Verify important interactions manually.
10. Report accessibility limitations honestly.

---

## 31. Final Principle

KaanViz should be usable as an analytics workspace by people using different input methods and different ways of perceiving information.

Accessibility should be built into the product's interaction model rather than added after the interface is complete.
