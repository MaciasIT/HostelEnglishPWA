# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2026-04-09

### Añadido
- Nueva arquitectura modular basada en `features/`.
- Módulo de **Examen** completamente modularizado (`ExamHeader`, `ExamQuestion`, etc.).
- Hook de lógica centralizada `useExamLogic` para el módulo de examen.
- Audit técnico 360° con hoja de ruta de refactorización (`AUDITORIA_360_HostelEnglishPWA.md`).

### Seguridad
- **Fix Crítico**: Resueltas vulnerabilidades (RCE y DoS) en `serialize-javascript` (vía `@rollup/plugin-terser`) forzando la versión `7.0.5` en `package.json`.
- Eliminación de `dangerouslySetInnerHTML` en componentes clave para mitigar riesgos XSS.
- Blindaje del pipeline de CI/CD añadiendo paso obligatorio de `npm test` antes del despliegue.

### Cambios en TS y Arquitectura
- Habilitado el modo **TypeScript Strict** (`strict: true`) en toda la aplicación.
- Modularización del **God Store** (Zustand) en slices independientes: `data`, `prefs`, `progress`, `ui`.
- Limpieza masiva de imports no utilizados y migración a React Context/Hooks modernos.
- Refactorización de `initNotifications` para evitar spam de notificaciones en cada carga.

### Corregido
- Corregidos más de 50 errores de tipado latentes tras activar el modo estricto.
- Reposicionado el hook `useBeforeInstallPrompt.ts` en la carpeta `hooks/` correspondiente.
- Error fonético en el motor de Euskera para ciertas combinaciones de sibilantes.

---
## [2.2.0] - Anterior
- Versión inicial estable con soporte multi-idioma (ES, EN, EU).
- Persistencia local con IndexedDB.
- Funcionalidades básicas de Quiz, Frases y Conversaciones.
