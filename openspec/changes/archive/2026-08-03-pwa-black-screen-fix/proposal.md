# PWA Standalone Black Screen Recovery

## Why

En modo standalone PWA (instalada desde Pages), al reabrir la aplicación tras ponerla en segundo plano, la pantalla queda completamente en negro/blanco. En incógnito funciona siempre. El diagnóstico apunta a que `vite-plugin-pwa` + el store de Zustand con persistencia en IndexedDB no se recuperan correctamente al volver a primer plano. El spinner de carga actual (`AppInitializer` sin timeout) nunca termina, dejando la app bloqueada.

## What Changes

- **AppInitializer**: añadir timeout de hidratación (4s), detección de pantalla negra persistente (2s adicionales), listener de `visibilitychange` para auto-recuperación, y pantalla de error con dos acciones: recargar o continuar sin datos guardados (limpiando IndexedDB).
- **DIARIO_DESARROLLO.md**: documentar la entrada V2.5.2.
- No se añaden dependencias nuevas. No se modifica el store ni la configuración de vite-plugin-pwa.
