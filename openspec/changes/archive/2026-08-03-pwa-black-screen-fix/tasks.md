# Tasks: pwa-black-screen-fix

- [x] 1. Add hydration timeout constants (4s / 2s) to `AppInitializer.tsx`
- [x] 2. Replace direct `setHasHydrated(true)` calls with `finish()` callback
- [x] 3. Add `useCallback` wrappers for `finish`, `reload`, `continueWithoutData`
- [x] 4. Add `setTimeout` for hydration timeout → sets `recovery` state
- [x] 5. Implement "Sincronizando" screen (recovery without blackScreen)
- [x] 6. Add `setTimeout` for black-screen detection → sets `blackScreen` state
- [x] 7. Implement recovery error screen with "Recargar" and "Continuar sin datos guardados" buttons
- [x] 8. Add `visibilitychange` listener for auto-recovery when store hydrates while app is backgrounded
- [x] 9. Ensure cleanup of timeouts and event listeners in `useEffect` return
- [x] 10. Run `npm run build` to verify production build
- [x] 11. Run `npm run test -- --run` to verify 75 tests still pass
- [x] 12. Update `docs/DIARIO_DESARROLLO.md` with V2.5.2 entry
- [x] 13. Commit on `feat/pwa-black-screen-fix` branch
- [x] 14. Merge to `main` and push to `origin/main`
