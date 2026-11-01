# 📖 Diario de Desarrollo – HostelInglésApp

*Última actualización: 02-11-2026*

Este documento sigue el desarrollo de la PWA HostelInglés. Está organizado por hitos temporales para reflejar la evolución técnica del proyecto.

---

## 🚀 Release v2.6.0: Rediseño «Cyber-Hospitality», Expansión de Datasets e IA Procedural (Fase D)
*Fecha: 02-11-2026*

- **[✅ COMPLETADO] Rediseño Visual «Cyber-Hospitality & Tech»:**
    - Identidad visual completa: paleta dark-carbon (`#090D12`), superficies estructuradas en `#121820`/`#182230` y acentos verde esmeralda eléctrico (`#10B981` / hover `#34D399`) con toques cian.
    - Reemplazo de la portada estática anterior por una Home interactiva con métricas en tiempo real, selector de departamento y acceso ágil a modos de estudio.
    - Pulido del Dashboard con badges de racha en llamas y contraste verificado bajo estándares WCAG AAA.
    - Documentado en `docs/plan-2026/05_REDISENO_VISUAL_OPCION_2.md` y auditado por QA en `docs/plan-2026/06_AUDITORIA_QA_FASE_UI_03.md`.

- **[✅ COMPLETADO] Expansión Masiva de Datasets y Variantes Regionales (FD-02):**
    - Corpus ampliado a **770+ frases** (+132 frases operativas) y **100+ diálogos interactivos** (+10 situaciones de alta complejidad).
    - Matriz de **41 variantes regionales UK / US / AUS** en `public/data/variants.json` para terminología clave de hostelería (*bill/check*, *chips/fries*, *aubergine/eggplant*).
    - Transcripción fonética IPA curada en todas las frases nuevas y turnos de diálogo.
    - Matriz de 30 situaciones hosteleras críticas documentada en `docs/plan-2026/06_DATASETS_Y_SITUACIONES_COMPLEJAS.md`.

- **[✅ COMPLETADO] Motor de Roleplay Procedural e IA de Cortesía (FD-03 / FD-04):**
    - Generador procedural de imprevistos hosteleros no guionizados (`proceduralRoleplayGenerator.ts`) para 5 áreas departamentales con perfiles de cliente y grados de dificultad.
    - Evaluador de cortesía profesional (`politenessEvaluator.ts`) con análisis instantáneo de diplomacia hostelera (*Polite Hospitality English*).
    - Integración completa en la interfaz de `Roleplay.tsx` con selector de acentos lingüísticos (UK, US, AUS, Internacional) y panel dinámico de retroalimentación.

- **[✅ COMPLETADO] Modernización de CI/CD y Calidad:**
    - Workflows actualizados a **Node.js 22 LTS** con auditoría `npm audit --audit-level=critical`.
    - Resolución de inconsistencias de tipos en `src/hooks/useTestHook.ts` y `src/hooks/useWorkerSearch.ts`.
    - **545 tests unitarios e integración pasando al 100%** (83 suites de Vitest).
    - Compilación limpia con Vite 8 en ~1.3s y pipelines de GitHub Actions (Quality Gates y Deploy a GitHub Pages) 100% en verde.

---

## 🧠 Cierre de Fase C: Capa de IA y Audio On-Device
*Fecha: 01-11-2026*

- **[✅ COMPLETADO] Arquitectura de Audio Jerárquica (FC-01 a FC-04):**
    - `AudioManager` centralizado con selección adaptativa según dispositivo (`navigator.gpu`, memoria RAM).
    - Soporte de síntesis local ultra-realista con modelos **Piper TTS** (WebGPU/WASM), streaming cloud híbrido y fallback nativo a Web Speech API.
    - Pre-caché PWA ampliado a 12 MiB en Workbox para pesos de modelos ONNX.
- **[✅ COMPLETADO] Reconocimiento Fonético y Whisper ASR (FC-05 a FC-06):**
    - Transcripción fonética local mediante `@huggingface/transformers` y alineación temporal DTW (*Dynamic Time Warping*) para el módulo de dictado.
- **[✅ COMPLETADO] Inferencia LLM Local y Cloudflare Fallback (FC-07 / FC-08):**
    - Runtimes WebLLM (`@mlc-ai/web-llm`) acelerados por WebGPU con fallback a Cloudflare Workers AI documentados en `docs/plan-2026/FC-07_LLM_ON_DEVICE.md` y `docs/plan-2026/FC-08_FALLBACK_LLM_CLOUD.md`.

---

## 🎨 Cierre de Fase B: Renovación UI/UX y Sistema de Diseño 2026
*Fecha: 01-11-2026*

- **[✅ COMPLETADO] Sistema de Diseño y Tokens Modernos:**
    - Arquitectura de tokens `@theme` en Tailwind CSS v4 con variables CSS normalizadas.
    - Rediseño de componentes base, tipografía Inter y micro-interacciones con Framer Motion 12.
    - Informe de cierre formal registrado en `docs/plan-2026/INFORME_CIERRE_FASE_B.md`.

---

## 🎯 Cierre de Fase A: Modernización de Stack y Resiliencia Offline Definitiva
*Fecha: 01-11-2026*

- **[✅ COMPLETADO] ADR y cierre de Fase A:**
    - Documentado `docs/adr/ADR-2026-001-stack-upgrade.md` con estado Aceptado.
    - Auditoría de calidad final: 103 tests unitarios verdes, build de producción limpio (20 assets, SW generado).
- **[✅ COMPLETADO] Upgrades de infraestructura:**
    - **React 19 + Router v8**: desbloqueo de CVE en react-router; migración a `react-router/dom`.
    - **Tailwind CSS v4**: compilación con Lightning CSS, arquitectura `@theme`.
    - **Zustand 5**: slices tipados con persistencia IndexedDB controlada.
    - **PWA Workbox 7**: offline-first definitivo con estrategias granulares y Background Sync.
- **[✅ COMPLETADO] Funcionalidades transversales:**
    - **Web Workers**: búsqueda tokenizada y métricas de retención fuera del hilo principal, con fallback síncrono en tests.
    - **Licencias offline**: validador Ed25519 nativo con Web Crypto API y slice Zustand dedicado.
    - **E2E móvil**: suite Playwright (offline, hidratación, navegación) en Chromium Pixel 7 headless.
- **[✅ COMPLETADO] Calidad:**
    - `npm run test:run`: 103 tests verdes.
    - `npm run build`: build limpio en 509ms, SW + precache 20 entries.
- **[✅ COMPLETADO] Fases Siguientes:** Completadas con éxito en Fase B (UI/UX), Fase C (Capa IA/Audio) y Fase D (Roleplay Procedural & Datasets).

---

## 🔧 Fix Pantalla Negra en Modo Standalone PWA (V2.5.2)
*Fecha: 03-08-2026*

- **[✅ COMPLETADO] Recovery de hidratación en AppInitializer:**
    - Añadido timeout de hidratación de 4s (`HYDRATION_TIMEOUT_MS`): si el store de Zustand no hidrata a tiempo, se muestra estado de sincronización en vez de quedarse en negro.
    - Detección de pantalla negra persistente (`BLACK_SCREEN_DELAY_MS` 2s) con pantalla de error y dos acciones: "Recargar" y "Continuar sin datos guardados" (limpia `useAppStore.persist.clearStorage()` y recarga).
    - Listener de `visibilitychange`: si la app vuelve a visible con el store ya hidratado, se recupera automáticamente sin pantalla de error.
- **[✅ COMPLETADO] Verificación local:**
    - `npm run build` verde (SW + precache 20 entries).
    - `npm run test -- --run` verde (22 ficheros / 75 tests).
- **[⬜ PENDIENTE] Validación en GitHub Pages:** fix en rama `feat/pwa-black-screen-fix`; pendiente merge a main y verificación en producción.
- **[⬜ PENDIENTE] Revisión visual/UI de la app desplegada:** pasada de UX/UI con capturas reales para definir modificaciones concretas.

---

## ✨ Release Segura, Hardening de Deploy y CVE Documentado (V2.5.1)
*Fecha: 27-07-2026*

- **[✅ COMPLETADO] Release v2.5.1:**
    - Alineación de metadatos de paquete y release para `2.5.1`.
    - CI endurecida con quality gates estructurados alrededor de TypeScript, lint, tests y build.
- **[✅ COMPLETADO] Hardening de Deploy en GitHub Pages:**
    - Añadidos `public/_headers`, `robots.txt`, `sitemap.xml` y `404.html` para controlar exposición pública y comportamiento offline.
- **[✅ COMPLETADO] CVE y decisión de migración registrada:**
    - Creado OpenSpec `openspec/changes/cve-react-router-v8`.
    - Documentado issue de seguridad y la decisión explícita de NO migrar a `react-router` v8 mientras la base permanezca en React 18.
    - Riesgo aceptado formalmente y trazado en repo para evitar reintentos sin plan de React 19.
- **[✅ PENDIENTE] Revisión visual/UI de la app desplegada:**
    - Queda pendiente una pasada de UX/UI con capturas reales para definir modificaciones concretas.

---

## ✨ UX Polish, Actualización de Dependencias y Estabilización (V2.5.0)
*Fecha: 20-07-2026*

- **[✅ COMPLETADO] UX Polish:**
    - Botón "Instalar App" ahora se oculta al hacer scroll hacia abajo y reaparece al subir (patrón estándar móvil).
    - Número de versión corregido en sidebar (2.2.0 → 2.5.0).

- **[✅ COMPLETADO] Actualización Masiva de Dependencias:**
    - Vite 7 → 8 (Rolldown en vez de esbuild), @vitejs/plugin-react 4 → 6 (sin Babel).
    - React Router 6.23 → 6.30, Vitest 3 → 4, PostCSS 8.5.9 → 8.5.20, ws 8.19 → 8.21.
    - 7 PRs de Dependabot mergeadas y verificadas (build + 75 tests OK).

- **[✅ CORREGIDO] Test de Dictado en CI:**
    - El mock de `speechSynthesis.getVoices()` devolvía array vacío → el hook de audio esperaba evento `onvoiceschanged` que nunca llegaba → test fallaba en GitHub Actions.
    - Solución: devolver una voz mock en `setupTests.ts`.

- **[✅ CORREGIDO] Documentación:**
    - README actualizado (badges Vite 8, enlaces MaciasIT, demo unificada).
    - CHANGELOG al día con todos los cambios acumulados.

---

## ✨ Expansión Masiva del Dataset y Saneamiento Global (V2.5)
*Fecha: 05-05-2026*

- **[✅ COMPLETADO] Expansión Estratégica de Datos:**
    - Crecimiento neto del dataset de **538 a 640 frases** (+120 frases premium).
    - Inclusión de **8 nuevas conversaciones de nivel intermedio-específico (B1)**, cubriendo situaciones críticas: servicio de vinos, gestión de alérgenos, resolución de conflictos con clientes ebrios, y protocolos de mantenimiento.
    - Saneamiento global de categorías: Reubicación de frases de emergencia, limpieza y mantenimiento que estaban dispersas.

- **[✅ COMPLETADO] Purga de Calidad y Re-indexación:**
    - Eliminación de frases ultra-simples y redundantes (ej: "Hi", "With") para optimizar la curva de aprendizaje.
    - Fusión de duplicados semánticos en Restaurante y Recepción.
    - Re-indexación completa de los IDs del JSON para garantizar la integridad estructural.

- **[✅ COMPLETADO] Validación Fonética del Euskera:**
    - Auditoría de las 640 traducciones al euskera para asegurar compatibilidad 100% con el motor fonético híbrido (uso correcto de tx, ts, tz, x).

---

## ✨ Refactorización Arquitectónica y UI Premium (V2.4)
*Fecha: 09-04-2026*

- **[✅ COMPLETADO] Transición a TypeScript Strict Mode:**
    - Activación de `strict: true` en `tsconfig.json`.
    - Eliminación masiva de tipos `any` en componentes de producción, elevando la seguridad y robustez del código.

- **[✅ COMPLETADO] Modularización de Zustand (Slices):**
    - División del "God Store" monolítico en slices independientes: `data`, `prefs`, `progress`, y `ui`.
    - Implementación del principio de responsabilidad única (SRP) en la gestión de estado.

- **[✅ COMPLETADO] Sistema de Diseño Premium y UX Móvil:**
    - **Navegación Móvil**: Creación de `BottomNav.tsx` con soporte para `safe-area-bottom` en dispositivos modernos.
    - **Tipografía Profesional**: Integración de la fuente 'Inter' como estándar global.
    - **Feedback Avanzado**: Implementación de **Skeletons** para estados de carga, notificaciones **Toast** y utilidades de **haptics** (vibración).
    - **A11y (Accesibilidad)**: Mejora de contrastes de grises y cumplimiento de estándares WCAG AA con atributos ARIA y `aria-live`.

---

## ✨ Sistema Híbrido de Text-to-Speech (TTS) y Parche Fonético (Euskera)
*Fecha: 09-03-2026*

- **[✅ COMPLETADO] Refactorización Multi-Idioma del Audio:**
    - Se refactorizaron completamente los hooks `useSpeech.ts` y `useAudio.ts`.
    - Solucionado el problema de lectura de español con voces inglesas.

- **[✅ COMPLETADO] Parche de Reconocimiento y TTS Híbrido:**
    - **Innovación - Traductor Fonético Dinámico:** Función `euToEsPhonetic` que transforma el texto en Euskera para obligar al TTS de español a pronunciarlo correctamente.
    - Actualización de CSP para permitir servicios de voz externos.

---

## ✨ Gamificación y Optimización (V2.3)
*Fecha: 02-02-2026*

- **[✅ COMPLETADO] Gamificación del Quiz:** Sistema de mundos, niveles, 3 vidas (❤️), rachas (🔥) y barra de progreso.
- **[✅ COMPLETADO] Refinado de Examen:** Animaciones de victoria con partículas y modal de revisión de errores.
- **[✅ COMPLETADO] Optimización Desktop:** Escala base del 85% para pantallas grandes para mejorar la densidad de información.

---

## 🚀 Visión y Estrategia

- **Objetivo:** Convertir una app de escritorio en una PWA móvil, offline-first, de nivel comercial.
- **Stack Tecnológico:** React 19, TypeScript (Strict), Vite 8, TailwindCSS 4, Zustand 5 (Sliced), IndexedDB, Vitest 4, Playwright.
- **Licencia:** GNU Affero General Public License v3.0 (AGPL-3.0).
