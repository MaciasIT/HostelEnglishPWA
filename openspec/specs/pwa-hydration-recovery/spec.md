# pwa-hydration-recovery Specification

## Purpose
TBD - created by archiving change pwa-black-screen-fix. Update Purpose after archive.
## Requirements
### Requirement: Hydration timeout with recovery fallback

The `AppInitializer` SHALL detect when Zustand store hydration exceeds a defined timeout and SHALL provide user-visible recovery actions.

#### Scenario: Normal fast hydration
- GIVEN the user opens the app in normal browser mode
- WHEN the Zustand store hydrates within 4 seconds
- THEN the app SHALL render the main UI normally without showing any recovery screen

#### Scenario: Slow hydration shows synchronizing state
- GIVEN the Zustand store has not hydrated after 4 seconds
- WHEN the hydration timeout fires
- THEN the app SHALL display a "Sincronizando" screen with a spinner and a message about database optimization
- AND SHALL NOT remain on a blank/black screen

#### Scenario: Persistent hydration failure shows recovery UI
- GIVEN the "Sincronizando" screen has been showing for 2 seconds without successful hydration
- WHEN the black-screen delay fires
- THEN the app SHALL display a recovery screen titled "La app se ha quedado sin respuesta"
- AND SHALL offer two buttons: "Recargar" and "Continuar sin datos guardados"

#### Scenario: Reload action
- GIVEN the recovery screen is displayed
- WHEN the user clicks "Recargar"
- THEN the page SHALL reload via `window.location.reload()`

#### Scenario: Continue without saved data
- GIVEN the recovery screen is displayed
- WHEN the user clicks "Continuar sin datos guardados"
- THEN `useAppStore.persist.clearStorage()` SHALL be called
- AND the page SHALL reload

#### Scenario: Auto-recovery via visibility change
- GIVEN the app has triggered the "Sincronizando" recovery state
- WHEN the user returns to the app (`visibilitychange` → `visible`) AND the store has since hydrated
- THEN the recovery state SHALL be cleared and the main UI SHALL render

### Requirement: Existing behavior unchanged

The change MUST NOT alter the normal hydration path or add new dependencies.

#### Scenario: Normal hydration path unchanged
- GIVEN the app is loaded in a fresh browser session (not standalone PWA)
- WHEN the store hydrates normally
- THEN the `InstallPWAButton` SHALL be rendered as before
- AND all existing features (navigation, frases, diálogos, quiz, etc.) SHALL work as before

