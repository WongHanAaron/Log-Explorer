# Research Notes: Shareable Tag Component

## Decision: Build custom React components rather than import a third-party

- Investigated existing tag/Chips libraries (e.g. `react-tag-input`, `@headlessui/react` listbox). Most were either overkill, required additional dependencies, or didn't support inline rename behavior.
- Rationale: the requirement set is small and the UI is simple; writing our own `Tag` and `TagSet` offers full control, keeps bundle size minimal, and fits with our shared UI component library.

## Decision: Merge duplicates case-insensitively and update casing

- To avoid confusing users when adding tags that differ only by letter case, normalization will be performed in the component logic. Existing tag is preserved and its text replaced with the most recently typed casing.
- Rationale: this behavior matches user expectations from other tagging systems and simplifies storage (no need to maintain canonical form separately).

## Decision: Expose validation props with defaults

- `TagSet` will accept optional props such as `maxTags?: number` and `validate?: (tags: string[]) => string | null` to allow panels to customize rules.
- Default `maxTags` is `undefined` (no limit) per spec.

## Styling approach

- Reuse shared UI components (`Button`, `Input`, etc.) and CSS variables for colors/spacing from `src/webview/shared/components/ui`.
- A `.tag { ... }` Tailwind class will apply `bg-[--button-primary-bg]` and `text-[--button-primary-fg]` with rounded corners to emulate the primary pill look.

## Integration target

- First consumer will be `LogFileSourcesPanel` / `log-file-sources` webview.
- Implementation will replace the existing `Labels` textarea; the host panel will translate its config property (array of strings) directly to/from the component props.
- Future consumers (e.g. session templates) can supply a plain `string[]` and handlers; no change to domain models required.

## Alternatives considered

- Storing tags as comma-separated strings in config: rejected due to parsing edge cases and desire to treat tags as distinct values.
- Keeping inline editable `input` elements rather than toggling between pill and input: rejected for simplicity and spacing concerns.

