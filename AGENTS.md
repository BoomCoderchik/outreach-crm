# Outreach CRM project rules

## UI component stack

- Use **shadcn/ui** conventions and accessible primitives for shared interface components.
- Use **Spell UI** as the visual component source and inspiration for refined React components: https://spell.sh/
- Prefer copying/adapting Spell UI components into the repository over introducing a separate UI kit.
- Keep components compatible with the existing Tailwind CSS, `class-variance-authority`, and `lucide-react` setup.
- Preserve the existing design tokens, semantic states, keyboard access, and responsive behavior when adding UI.
- Do not add another component library without an explicit product decision.

## Verification

- Run the relevant typecheck, lint, tests, and production build after UI changes.
- For user-visible changes, verify the actual browser result at desktop and mobile widths.
