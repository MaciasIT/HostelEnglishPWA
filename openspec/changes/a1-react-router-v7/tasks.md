# Tasks: a1-react-router-v7

- [ ] Update package.json: react-router ^7.18.0, react-router-dom ^7.18.0
- [ ] Run npm install to update lockfile and node_modules
- [ ] Verify installed versions: npm ls react-router react-router-dom
- [ ] Run typecheck: npx tsc --noEmit (expect: exit 0)
- [ ] Run tests: npm test (expect: 75 passed, 0 failed)
- [ ] Run build: npm run build (expect: exit 0)
- [ ] Review all <Link> and useNavigate usages for v7 compatibility
- [ ] Run requesting-code-review pipeline
- [ ] Commit: feat(a1): upgrade react-router v6 -> v7, fix CVE-2025-68470

# Verification
- npx tsc --noEmit → exit 0
- npm test → 75 passed, 0 failed
- npm run build → exit 0, PWA generated
- npm ls react-router → >=7.18.0