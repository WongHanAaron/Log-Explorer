# Research Notes: Log File Source Editor Save

## Decision: Form validation and dirty tracking

* We need to know when the form contains valid data and when it has unsaved changes.  Existing `App` component already has a `validateForm` function that sets error messages.  Rather than introduce a new library, we reuse that function and call it via an effect on field changes.
* To track whether the form is "dirty" we store a `savedConfig` object representing the last-saved state.  The effect compares current trimmed field values against this snapshot; if they differ, the form is dirty.  After a successful save we update `savedConfig`.
* The Save button visibility (`canSave`) is simply `validateForm() && dirty` and is passed as a prop to `FormPage`.  Hiding the button completely makes it impossible to attempt a save when invalid, satisfying FR-001.  Tests verify both visibility states.

## Decision: UI behavior

* Instead of disabling the button we choose to hide it when `canSave` is false because the spec phrased "only appear when it is valid to save" and the acceptance scenarios allowed either hiding or disabling.  Hiding provides a clear signal and reduces clutter in the invalid state.
* `FormPage` now accepts a `canSave` boolean and conditionally renders the submit button.  This keeps the form presentation simple and avoids coupling to the validation logic.

## Error handling and save flow

* The backend panel already implements save messaging and directory creation; no additional research needed.  We only need to update state when `filepath-config:save-result` arrives to refresh `savedConfig` and `status`.
* For error cases, the panel already posts an error message; the webview displays `status.kind === 'error'` text.  No further research required.

## Alternatives considered

* Could have kept Save button always present but disabled it; rejected because disabling still leaves an affordance and might confuse users into thinking they can click.  Hiding matches spec more literally.
* Could track dirty state by deep equality on a config object created on every render; this adds extra memory churn.  Instead we capture trimmed values once into `savedConfig` and compare simple primitives/arrays.

