# Proposal: Upgrade react-router 6 → v7

## Change ID
a1-react-router-v7

## Summary
Upgrade `react-router` and `react-router-dom` from v6.30.3 to v7.x to address vulnerability CVE-2025-68470 (open redirect via backslash in `<Link>` and `useNavigate`) and GHSA-337j-9hxr-rhxg (constructor injection via `deserializeErrors()`).

## Rationale
- Active CVE affecting public-facing PWA
- v6.30.3 is the last non-patched version in the 6.x line
- v7 includes security fixes and performance improvements
- Breaking changes are minimal for this codebase (no `location` prop on `<Routes>`, no relative route default dependency)

## Scope
- `package.json` only (dependency bump)
- `package-lock.json` regeneration
- `src/router/AppRouter.tsx` — remove `location` prop if present (not present, no change)
- Verify all route definitions remain correct after upgrade

## Risks
- Routes using relative navigation (none detected — all use absolute paths: `/`, `/frases`, `/conversaciones`, etc.)
- `<Routes>` `location` prop behavior change (not used in codebase)
- Test regression from behavior change (unlikely given v7 backward compat)

## Acceptance Criteria
1. `npm ls react-router` shows v7.x installed
2. `npx tsc --noEmit` exits 0
3. `npm test` passes (75 tests GREEN)
4. `npm run build` exits 0 with PWA generated
5. No open redirect vectors in remaining code via manual review of all `<Link to=...>` values