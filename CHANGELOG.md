# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.1] - 2026-07-27
### Added
- Deploy hardening for GitHub Pages: `public/_headers`, `robots.txt`, `sitemap.xml`, and `404.html` fallback to improve public exposure control and offline behavior.
- OpenSpec change `openspec/changes/cve-react-router-v8` documenting the react-router v8 CVE and the explicit decision not to migrate while the app stays on React 18.
### Changed
- Package and release metadata aligned to version `2.5.1`.
### Fixed
- CI quality gates hardened around TypeScript, lint, tests, and build validation.
- Security header baseline documented for Pages deployment.

## [2.5.0] - 2026-07-20
### Added
- **Dataset Expansion**: Expanded phrase and dialogue datasets to cover more intermediate vocabulary.
- **UX Polish**: Install button visibility behavior refined to hide while scrolling down and reappear on scroll up.
### Changed
- **Dependencies**: Major dependency updates including Vite 8, @vitejs/plugin-react 6, React Router 6.30, Vitest 4, and PostCSS 8.5.20.
- **Stability**: Multiple maintenance updates from Dependabot.
### Fixed
- **Dictation Test CI**: Fixed `speechSynthesis.getVoices` mocking so the Dictation module works reliably in CI.
- **License Cleanup**: Clarified AGPL + Commercial dual-license model and cleaned licensing docs.
- **Design Validation**: Completed PWA design validation pass and cleaned leftover assets/config.

## [2.4.0] - 2026-04-09
### Added
- **Accessibility**: Full A11y coverage with `aria-live`, labels, roles, and screen-reader-friendly data tables.
- **Modular Architecture**: Migration to a feature-based architecture for Dictation, Flashcards, Dialogues, and Phrases.
### Changed
- **Type Safety**: Enabled TypeScript Strict Mode across the project.
- **State Management**: Zustand slices modularized into `data`, `prefs`, `progress`, and `ui`.
### Fixed
- **Audio Sync Loop**: Fixed an infinite loop in `useDictationLogic` with ref-based guards.
- **Test Stability**: Updated selector strategy in tests to use accessible roles and labels.
- **Navigation**: Fixed carousel index overflow behavior in Flashcards and Phrases.

## [2.3.0] - 2026-04-09
### Added
- New feature-based architecture under `features/`.
- Modularized **Examen** module with dedicated presentation and logic hooks.
- Technical audit and refactor roadmap document (`AUDITORIA_360_HostelEnglishPWA.md`).
### Changed
- Enabled TypeScript Strict Mode.
- Centralized logic through `useExamLogic` to reduce duplication.
### Fixed
- **Security**: Fixed critical RCE/DoS issues via forced `serialize-javascript@7.0.5`.
- **XSS Risk**: Removed `dangerouslySetInnerHTML` usage in exposed components.
- **CI/CD**: Added mandatory `npm test` gate before deployment.
- **50+ Typing Issues**: Resolved strict-mode type errors after enabling strict TypeScript checks.
- **Euskera Phonetics**: Corrected sibilant combination handling in phonetic engine.

## [2.2.0] - Prior release
- Initial stable release with multi-language support (ES, EN, EU).
- Local persistence via IndexedDB.
- Core features: Quiz, Phrases, and Conversations.
