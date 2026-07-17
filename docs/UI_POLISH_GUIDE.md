# MoveVN UI Polish Guide

Use this guide when changing MoveVN frontend UI so different tasks keep one visual language.

## Scope

- Prefer improving shared primitives before individual pages: `Button`, `Card`, `Input`, `FormField`, `Modal`, `Alert`, `EmptyState`, `Header`, `Sidebar`.
- Keep business logic and API contracts unchanged unless a UI issue cannot be fixed otherwise.
- Do not mix large feature work into UI polish branches.

## Visual Rules

- Use quiet operational UI for dashboard pages: dense enough to scan, clear spacing, restrained shadows.
- Use `rounded-md` for controls, cards, modals, table containers, dropdowns, and repeated items.
- Use brand purple for primary actions and selected states only; keep page surfaces mostly white, slate, and neutral.
- Use `border-slate-200`, `shadow-sm shadow-slate-950/5`, and `bg-white` for standard containers.
- Avoid decorative blobs, orbs, heavy gradients, nested cards, and marketing-style hero layouts inside app dashboards.
- Text should not rely on viewport-width font sizing.
- Buttons and fixed-format controls should have stable heights.

## Component Patterns

- Use `cn()` from `src/utils/cn.ts` when merging Tailwind classes.
- Prefer `Button` for actions instead of raw button styling.
- Prefer `Card` for repeated item containers or real framed tools.
- Forms should use `FormField`, `Input`, or existing feature-specific wrappers with matching focus states.
- Empty/error/loading states should be explicit and compact.

## Layout Rules

- Dashboard pages live inside `MainLayout`; use the shared header/sidebar.
- Page content should usually be `max-w-7xl`, with `space-y-6` between main sections.
- Toolbars should wrap on smaller screens and avoid text overflow.
- Tables should use consistent header, row hover, and empty-state treatment.

## Review Checklist

- Run `npm run check`.
- Open at least one Customer page, one Owner page, and one Staff/Admin page.
- Check desktop and mobile widths.
- Confirm no text overlaps, no button label spills, and no component jumps on hover/loading.
- Keep `.env` files out of commits.
