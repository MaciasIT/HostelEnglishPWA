# [Fase-UI-03] Auditoría de Calidad, Tests y Verificación E2E — Informe de Cierre

**Perfil:** caos (Ingeniería de Caos / QA destructivo)
**Rama:** `main` · **HEAD:** `25694da` (pulido UI-02, Cyber-Hospitality)
**Fecha:** 2026-11-02

---

## Resumen ejecutivo

Rediseño visual de la Opción 2 (Cyber-Hospitality) **validado en verde**. No se detectó
ninguna regresión funcional ni de selectores. Gates principales:

| Gate | Resultado |
|------|-----------|
| `npx tsc -b` | ✅ 0 errores |
| `npm run test:run` | ✅ 507/507 (81 ficheros) |
| `npm run test:e2e` | ✅ 8/8 (Pixel 7 + viewport escritorio) |
| `npm run build` | ✅ 1.34 s (< 2 s) · precache 25 entradas correcto |
| Persistencia IndexedDB tras F5 | ✅ verificada (clave `appState.theme`) |

---

## 1. Verificación de tipos y tests unitarios

### `npx tsc -b`
- Salida limpia, **código de salida 0**, sin errores ni warnings de tipos.

### `npm run test:run`
- **507/507 tests pasados** en 81 ficheros (duración 12.73 s de suite, sin contar entorno).
- Sin regresiones en selectores existentes tras el rediseño de `Dashboard`,
  `DashboardModule`, `DailyChallengeCard` y `UpgradeProButton` (los componentes tocados
  por `ui-polish`).

---

## 2. Pruebas End-to-End (Playwright)

`npm run test:e2e` → **8 passed** (11.3 s), proyecto `chromium-mobile` (Pixel 7) y
viewport de escritorio (1280×800) para el spec de navegación desktop.

Cobertura de specs:
- `hydration.spec.ts` — hidratación lenta de IndexedDB no bloquea el App Shell (sin pantalla negra).
- `navigation.spec.ts` — BottomNav móvil (5 pestañas) + SideNav drawer + sidebar escritorio persistente.
- `offline.spec.ts` — carga inicial → modo offline → pantallas siguen renderizando sin error.
- `persistence.spec.ts` — rol y tema sobreviven a F5 (**IndexedDB** `hostelenglish-v1`/`appState`).
- `theme.spec.ts` — oscuro por defecto, cambio a claro persiste en localStorage, modo automático.

### Persistencia en IndexedDB tras F5 — CONFIRMADA
El spec de persistencia abre `indexedDB.open('hostelenglish-v1')`, lee la clave
`hostelenglish-storage` del objectStore `appState` y verifica que `state.prefs.theme === 'light'`
**antes** de recargar; tras `page.reload()` comprueba que la clase `.light` sigue en `<html>`,
que el modal de onboarding no reaparece y que el radio "Modo claro" queda marcado. Es una
verificación real del camino de producción (no una simulación), por lo que la persistencia
Zustand→IndexedDB queda acreditada.

---

## 3. Build y empaquetado PWA

`npm run build` → **1.34 s** (objetivo < 2 s), 2287 módulos transformados.

`dist/sw.js` (generateSW v1.3.0):
- **Precache 25 entradas (8922 KiB)** incluyendo shell (`index.html`, `404.html`), assets
  JS/CSS, iconos PWA y datasets (`data/*.json`).
- `navigateFallback` → `/HostelEnglishPWA/`.
- rutas `runtimeCaching` correctas: NetworkFirst (JSON de datos, timeout 3 s), CacheFirst
  (audio, imágenes, modelos IA on-device con `maximumFileSizeToCacheInBytes` 12 MiB).
- Registro `SKIP_WAITING` y `cleanupOutdatedCaches` presentes.

---

## Hallazgos

### Hallazgo 1 — `vite.config.js` duplicado no versionado (severidad: media)
- **Evidencia:** `vite.config.js` aparece en `git status --porcelain` como `??`; existe además
  `vite.config.ts` (versionado). Ambos son funcionalmente idénticos (sólo difieren en
  indentación). Vite 8 prefiere `.js` sobre `.ts`, y el build lo confirma al emitir el warning
  `__dirname` referenciando `vite.config.js:136:31`.
- **Impacto:** dos ficheros de configuración con el mismo contenido = riesgo de *drift* de
  fuente de verdad. Además, el loader nativo de Vite 8 marca `__dirname` como no soportado
  (romperá cuando `configLoader: 'native'` sea el default).
- **Acción recomendada:** eliminar uno de los dos (conservar `vite.config.ts`), sustituir
  `__dirname` por `import.meta.dirname`, y commitear. Eliminar el warning nativo.
- **Confianza:** alta.

### Hallazgo 2 — `favicon.ico` vacío (severidad: baja)
- **Evidencia:** `public/favicon.ico` tiene 0 bytes; su `revision` en `dist/sw.js` es
  `d41d8cd98f00b204e9800998ecf8427e` (MD5 de cadena vacía).
- **Impacto:** precache de un icono nulo; el navegador cae al favicon por defecto. Cósmético.
- **Acción recomendada:** generar un favicon real o eliminar la referencia.
- **Confianza:** alta.

### Hallazgo 3 — entradas de precache duplicadas (severidad: informativa)
- **Evidencia:** en `dist/sw.js`, `favicon.ico`, `icons/icono.png`, `icons/pwa-192x192.png`,
  `icons/pwa-512x512.png` y `manifest.webmanifest` aparecen **dos veces** (misma `revision`),
  por solapamiento entre `includeAssets` y `globPatterns`.
- **Impacto:** sin efecto funcional (revisiones idénticas); redundancia menor.
- **Acción recomendada:** opcionalmente retirar las rutas ya cubiertas de `includeAssets`.
- **Confianza:** alta.

### Hallazgo 4 — cache-buster `?v=` derrota el precache/runtimeCaching offline (severidad: media — preexistente)
- **Evidencia:** `dataSlice.ts` carga `data/hostelenglish_dataset_clean.json?v=${Date.now()}`
  (y lo mismo para `conversations_extended_v4.json`). En el spec offline se observa
  `No se pudo cargar el dataset de frases. TypeError: Failed to fetch`. El `urlPattern`
  `/\/data\/.*\.json$/` y `precacheAndRoute` exigen URL sin query, por lo que el buster
  impide servir desde caché en modo offline.
- **Impacto:** **no es regresión de este rediseño** (dataSlice no se tocó), pero contradice el
  objetivo *offline-first*: en offline real, Frases/Quiz no cargan sus datos. Los tests pasan
  porque la app degrada con gracia (array vacío + `console.warn`).
- **Acción recomendada:** reemplazar el buster por versionado de build (hash) o `contentType`
  de workbox; o hacer que las rutas de caché toleren query strings.
- **Confianza:** alta (reproducido por lectura del regex + observación del warning offline).

### Hallazgo 5 — artefactos de construcción sin versionar (severidad: informativa)
- **Evidencia:** `git status` muestra sin versionar: `docs/plan-2026/05_REDISENO_VISUAL_OPCION_2.md`,
  `preview_disenos.html`, `scripts/inject_fase_c.py`, `scripts/update_components.py` (además de
  `vite.config.js` del Hallazgo 1).
- **Impacto:** residuos de la fase UI (preview de diseño + scripts de inyección). El doc de
  rediseño y el preview probablemente deban commitearse o descartarse deliberadamente.
- **Acción recomendada:** decidir destino (commit del doc/preview relevante, borrado del resto).
- **Confianza:** alta.

---

## Qué no he podido comprobar
- **Revisión visual en navegador** del rediseño (Dashboard, llama/racha en DailyChallengeCard,
  badges de módulos, resplandor del botón Pro): validada por código, tipos, tests y ratios de
  contraste calculados por `ui-polish`, pero **sin captura visual** (el propio handoff de
  `ui-polish` lo dejó "pendiente"). Recomiendo un pase visual manual en navegador antes de dar
  por cerrado el rediseño a nivel perceptual.
- **Multiplataforma real** (iOS Safari, Android Chrome instalado como PWA): la suite E2E corre
  en Chromium headless; no se probó Safari/WebKit ni la instalación PWA real sobre dispositivo.
- **Comportamiento en producción de GitHub Pages**: `sw.js` con MIME `text/html` es un problema
  conocido **sólo en dev** (en producción el servidor sirve MIME correcto). No verificado contra
  el entorno de despliegue real.

---

## Siguiente paso
Revisión visual humana del rediseño (capturas del Dashboard y DailyChallengeCard en móvil y
escritorio), y decisión de limpieza sobre el duplicado `vite.config.js` y los 5 ficheros no
versionados.