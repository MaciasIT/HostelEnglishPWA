# ADR-2026-001: Stack Upgrade y Resiliencia Offline Definitiva

> **Estado:** Aceptado
> **Fecha:** 01-11-2026
> **Autores:** Michel Macias (arquitectura)
> **Alcance:** Fase A — Modernización de infraestructura HostelEnglish PWA
> **Referencias:** `docs/plan-2026/03_ARQUITECTURA_Y_STACK_2026.md`, `openspec/changes/cve-react-router-v8`

---

## 1. Contexto

HostelEnglish PWA partía de una base React 18 + Vite 8 + TypeScript Strict que había demostrado ser estable, pero acumulaba dos deudas técnicas bloqueantes:

1. **CVE documentada en `react-router` 7.x** (HIGH). La ruta de mitigación hacia v8 estaba condicionada a la adopción previa de React 19.
2. **Resiliencia offline incompleta**: la pantalla negra en standalone PWA era síntoma de que el ciclo de vida del shell seguía acoplado a la hidratación de Zustand ↔ IndexedDB.

Además, el proyecto necesitaba una base de licencias offline, búsquedas no bloqueantes y una arquitectura preparada para los módulos de IA de la Fase C.

---

## 2. Decisión

Se acepta el upgrade integral de la Fase A:

| Capa | Antes | Después | Motivo |
|---|---|---|---|
| Framework | React 18.2 | React 19 | Acceso a APIs modernas, eliminación de warnings y desbloqueo de Router v8. |
| Router | react-router 7.x (CVE) | react-router 8.x | Mitigación de CVE; API DOM unificada en `react-router/dom`. |
| Estado | Zustand 4.5 | Zustand 5 | Named exports, mejor tipado y `persist` controlado. |
| CSS | Tailwind 3.4 + PostCSS | Tailwind v4 | Lightning CSS integrado, compilación más rápida y arquitectura `@theme`. |
| PWA | Workbox 7.3 (parcial) | Workbox 7 (estrategias granulares) | Offline-first definitivo con Background Sync y navegación SPA offline. |
| Workers | Ninguno | Web Workers (búsqueda + métricas) | Índice invertido tokenizado y cálculo de retención fuera del hilo principal. |
| Licencia | N/A | Web Crypto API (Ed25519) | Validación offline de licencias Pro sin dependencias nativas. |
| Tests | Vitest 4 + 75 tests | Vitest 4 + 103 tests + Playwright 3 specs | Cobertura ampliada y validación móvil headless. |

### 2.1 Arquitectura adoptada

- **App shell no bloqueante**: splash nativa + skeleton mientras Zustand hidrata en segundo plano.
- **Service Worker como fuente de verdad offline**: `generateSW` con `navigateFallback` y estrategias diferenciadas por tipo de recurso.
- **Background Sync**: cola en IndexedDB para mutaciones de stats/progreso cuando no hay red.
- **Web Workers**: búsqueda tokenizada (es/en/eu/categoría) y métricas de retención (Fitts/Leitner) con fallback síncrono automático en tests/jsdOM.
- **Licencia offline**: token base64url con firma Ed25519 nativa; clave pública embebida y slice Zustand con persistencia IndexedDB.

---

## 3. Trade-offs y riesgos mitigados

| Decisión | Compensación | Mitigación |
|---|---|---|
| React 19 + Router v8 | Cambio de API (`react-router-dom` desaparece) | Migración controlada en rama feature; mantención de `HashRouter` como respaldo. |
| Tailwind v4 | Cambio de sintaxis (`@tailwind` → `@import`) | Uso de `npx @tailwindcss/upgrade` y diff visual exhaustivo. |
| Zustand 5 | Cambio de exports y comportamiento de `persist` | Actualización escalonada y tests de migración en CI. |
| Web Workers | Complejidad de comunicación y serialización | Workers puros (sin dependencias de UI), fallback síncrono en tests. |
| Service Worker actualizado | Riesgo de cacheo obsoleto en clientes | `generateSW` con mismo nombre renueva limpio; estrategias diferenciadas. |
| Licencia Ed25519 | Curva de aprendizaje criptográfica | Web Crypto API nativa, sin dependencias externas; tests con override de clave. |

---

## 4. Consecuencias

### 4.1 Desarrollo en Fase B (UI/UX renovada)
- Los componentes heredan un stack moderno con build rápido (Tailwind v4 + Lightning CSS) y estado tipado (Zustand 5).
- La navegación y el routing son estables sin CVE activa; se puede iterar en layouts y vistas sin riesgo de seguridad conocido.
- El App Shell no bloqueante reduce la complejidad de hydratación en componentes nuevos.

### 4.2 Módulos de IA en Fase C
- Los Web Workers ya están en producción y pueden extenderse con modelos ligeros (Whisper, pipeline de audio).
- La cola de Background Sync permite registrar eventos de uso del modelo offline sin pérdida de datos.
- La arquitectura offline-first garantiza que los módulos de IA funcionen sin conectividad, clave para una PWA de hostelería.

### 4.3 Operativa y mantenimiento
- 103 tests unitarios verdes + 3 specs Playwright móviles (offline, hidratación, navegación).
- Build de producción verde (20 assets precacheados, SW generado).
- Dependencias sin vulnerabilidades HIGH conocidas en capas críticas.

---

## 5. Alternativas consideradas y descartadas

1. **Migrar a `@unplugin-pwa/vite`**: descartada para Fase A por cambio de API mayor y riesgo innecesario; `vite-plugin-pwa` 0.21.x cubre los requisitos offline.
2. **Mantener Zustand 4**: descartada porque Zustand 5 ofrece mejor tipado y control de persistencia, alineado con TypeScript Strict.
3. **Workers con `workerize-loader`**: descartada en favor del patrón nativo de Vite (`new Worker(new URL(...), { type: 'module' })`) por simplicidad y menor overhead.
4. **Servicio de licencia centralizado**: descartado para Fase A; la validación offline con Web Crypto API es suficiente para el modelo de licencia actual.

---

## 6. Criterios de validación

- [x] `npm run test:run` verde (103 tests).
- [x] `npm run build` verde (20 entradas precacheadas, SW generado).
- [x] Playwright móvil verde (offline, hidratación, navegación).
- [x] Dependencias sin CVE activa en capas core.
- [x] Documentación actualizada: ADR y DIARIO_DESARROLLO.

---

## 7. Próximos pasos

1. Pasar a **Fase B**: renovación UI/UX con base limpia.
2. Pasar a **Fase C**: módulos de IA (audio, transcripción, recomendaciones) sobre esta arquitectura.
3. Evaluar migración a `@unplugin-pwa/vite` en una fase posterior solo si se necesitan capacidades ESM-only del SW.
