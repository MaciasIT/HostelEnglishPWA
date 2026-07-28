# 📖 Diario de Desarrollo – HostelInglésApp

*Última actualización: 27-07-2026*

Este documento sigue el desarrollo de la PWA HostelInglés. Está organizado por hitos temporales para reflejar la evolución técnica del proyecto.

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
- **Stack Tecnológico:** React 18, TypeScript (Strict), Vite 8, TailwindCSS 3, Zustand (Sliced), IndexedDB, Vitest 4.
- **Licencia:** GNU Affero General Public License v3.0 (AGPL-3.0).
