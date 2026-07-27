# Spec: a1-react-router-v7

## ADDED Requirements

### Requirement: Dependencies upgraded to v7
The project MUST use `react-router` >=7.18.0 and `react-router-dom` >=7.18.0.

#### Scenario: Dependencies resolve to v7
Given the package.json is updated with react-router ^7.18.0
When `npm install` is run
Then `npm ls react-router` shows version >=7.18.0
And `npm ls react-router-dom` shows version >=7.18.0

#### Scenario: TypeScript compilation passes
Given the upgraded dependencies
When `npx tsc --noEmit` is run
Then exit code is 0
And no type errors are reported

#### Scenario: All existing tests pass
Given the upgraded dependencies
When `npm test` is run
Then all 75 tests pass
And exit code is 0

#### Scenario: Build produces valid PWA bundle
Given the upgraded dependencies
When `npm run build` is run
Then exit code is 0
And dist/ contains index.html and service worker

#### Scenario: No open redirect vectors introduced
Given all Link and useNavigate usages in the codebase
Then no Link has a to prop containing unvalidated user input
And all routes resolve correctly after the upgrade