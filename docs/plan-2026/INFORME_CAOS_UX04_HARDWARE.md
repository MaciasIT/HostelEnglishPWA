# [UX-04] Validación Destructiva en Hardware Real — Informe de Caos

**Fecha:** 2026-11-02
**Perfil:** caos (QA destructivo)
**Alcance:** Safe-areas físicas, teclado virtual y flujos de audio móvil de HostelEnglishPWA.

---

## Resumen ejecutivo

Validación destructiva de los tres ejes críticos de hardware móvil que una suite
Chromium headless **no puede** cubrir (los insets `safe-area-inset-*` se mantienen en
`0px` y el teclado/micrófono nativos no son ejercitables). Resultado de la auditoría:

- **Safe-areas:** ya estaban correctamente implementadas (`viewport-fit=cover` +
  `env(safe-area-inset-*)` en TopNav, BottomNav, App, modales y FeedbackOverlay).
  Se identificó y corrigió la ausencia de valor de respaldo en una de las reglas.
- **Teclado virtual:** era el mayor hueco real. No existía `interactive-widget` en el
  viewport ni ningún `scrollIntoView` al enfocar los inputs de Dictado, búsqueda de
  frases o nombre de Examen. **Corregido** con meta nueva + hook reutilizable.
- **Audio (TTS/mic):** los disparos TTS están ligados a gesto de usuario (OK frente a
  autoplay), y el desbloqueo de `AudioContext` ya existe — pero **solo** en el camino
  Roleplay/AudioManager, no en el `playAudio` legado que usan Flashcard/Frases/
  Dicado/Conversaciones/Quiz. Documentado como hallazgo pendiente (no bloqueante).

---

## Hallazgo 1 — Safe-areas: correctas, con un fallback ausente

- **Severidad:** baja
- **Evidencia:** `src/components/BottomNav.tsx` usaba `pb-[env(safe-area-inset-bottom)]`
  sin valor de respaldo, a diferencia del resto de la app (`env(safe-area-inset-*,0px)`).
  En navegadores sin soporte de `env()` la declaración completa se descarta
  (padding-bottom = 0), en vez de degradar a un espaciador seguro.
- **Confianza:** alta (patrón consistente en el resto del código revisado).
- **Acción aplicada:** añadido `,0px` → `pb-[env(safe-area-inset-bottom,0px)]`.
  Test `BottomNav.test.tsx` actualizado para reflejar el token con fallback.
- **Acción recomendada (hardware):** verificar en un Android con navegación por gestos
  y en un iPhone con barra Home que los iconos de BottomNav no quedan bajo la barra de
  gestos. El espaciador inferior de `App.tsx`
  (`h-[calc(4rem+env(safe-area-inset-bottom,0px))]`) es correcto en código.

---

## Hallazgo 2 — Teclado virtual: hueco real corregido

- **Severidad:** alta (sin el fix, los botones "Comprobar"/"Enviar" pueden quedar
  ocultos detrás del teclado en pantallas cortas).
- **Evidencia:**
  - `index.html` no declaraba `interactive-widget`. Sin él, Chrome Android aplica el
    comportamiento por defecto y `fixed bottom-0` (BottomNav) / contenido inferior
    pueden quedar tapados al abrir el teclado.
  - Ningún input de texto (Dictado `DictationInput.tsx`, buscador `Frases.tsx` y
    `PhraseFilterHub.tsx`, nombre `ExamSetup.tsx`) tenía `scrollIntoView` ni
    consideración del `visualViewport`.
  - `grep` confirmó ausencia total de `visualViewport` / `interactive-widget` antes del cambio.
- **Confianza:** alta.
- **Acción aplicada:**
  1. `index.html`: viewport → `width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content`. Con `resizes-content`, el layout viewport se encoge al abrir el teclado y el contenido se refluye por encima de él.
  2. Nuevo `src/hooks/useSmoothFocusScroll.ts`: hook `useSmoothFocusScroll()` que, al
     recibir foco, espera un margen (`KEYBOARD_SETTLE_MS = 260ms`) a que el teclado
     termine de desplegarse y, si el elemento no es completamente visible dentro del
     `visualViewport` (zona no cubierta por el teclado), lo desplaza suavemente
     (`scrollIntoView({ behavior:'smooth', block:'nearest' })`). Un `blur` previo al
     timer cancela el desplazamiento pendiente.
  3. Cableado en los 4 inputs objetivo: `DictationInput.tsx`, `Frases.tsx`,
     `PhraseFilterHub.tsx`, `ExamSetup.tsx`.
- **Verificación:** nuevo `useSmoothFocusScroll.test.ts` (9 tests: viewport visual,
  visibilidad, scroll condicional y cancelación por blur) — 9/9 verde. Suite completa
  603/603 verde. `tsc --noEmit` y `vite build` limpios.
- **Acción recomendada (hardware):** en un teléfono físico, enfocar cada input y
  comprobar que el botón de comprobación/envío queda visible por encima del teclado.
  `interactive-widget` es soportado por Chrome 108+; en iOS el `visualViewport` del
  hook cubre el caso.

---

## Hallazgo 3 — Audio: TTS ligado a gesto (OK), desbloqueo AudioContext no unificado

- **Severidad:** media (no bloqueante ahora, riesgo latente de primer toque silencioso en iOS).
- **Evidencia:**
  - `src/utils/audio.ts#playAudio` (usado por Flashcard, PhraseCard, ConversationDetail,
    Dicado, Quiz, Conversaciones) usa Google TTS (`new Audio()`) para euskera online y
    `speechSynthesis` como respaldo. Ambos se disparan desde `onClick` (gesto de
    usuario), por lo que la política de autoplay se cumple tras el primer toque.
  - `src/services/audio/AudioManager.ts#primeAudioContext` crea/reanuda un
    `AudioContext` para desbloquear iOS, pero **solo** lo consume el camino Roleplay
    (`useRoleplayController.ts` a través de `useAudioManager`). El camino legado
    `playAudio` no desbloquea `AudioContext` — irrelevante para `speechSynthesis`/`<audio>`,
    pero sí para la futura ruta Piper on-device.
  - `src/hooks/useSpeechRecognition.ts` solicita permiso automático (`recognized.start();stop()`
    en montaje), que en iOS puede ser bloqueado sin gesto; el error `not-allowed` se
    trata con mensaje pero no hay re-solicitud tras retirar el permiso en ajustes.
  - `useWhisperASR` degrada a Web Speech si no hay WASM SIMD/WebGPU (`asrCapabilities.ts`).
- **Confianza:** media-alta (análisis de código; imposible ejercitar micrófono/TTS
  real en headless).
- **Acción recomendada (no aplicada por riesgo de sobredimensionar el alcance):**
  1. Unificar el desbloqueo de AudioContext: invocar `primeAudioContext` (o equivalente)
     en el primer gesto global, no solo en Roleplay, si se prevé Piper on-device.
  2. En `useSpeechRecognition`, no auto-solicitar permiso en montaje; mover la captura
     a un gesto explícito y ofrecer recuperación ante `not-allowed`.

---

## Qué no he podido comprobar

- **Hardware físico real.** No hay dispositivo Android/iOS conectado en este entorno
  headless. Los insets `safe-area-inset-*` permanecen en `0px` en Chromium y no es
  posible simular la cámara perforada/notch, la barra de gestos, el teclado en pantalla
  ni el micrófono/altavoz nativos.
- **CDP `Emulation.setSafeAreaInsets` no disponible** en el Chromium de Playwright 1.64.1
  (`'Emulation.setSafeAreaInsets' wasn't found`), por lo que no se pudo forzar un inset
  no nulo de forma nativa. La validación de safe-areas es por corrección de CSS, no por medición en dispositivo.
- **Distorsión de audio real** (TTS) y **captura de voz en ruido** (Whisper/mic): no
  ejercitables sin hardware.
- **La regresión E2E móvil completa** no se re-ejecutó en esta tarea (la suite
  `e2e/ux-mobile-audit.spec.ts` existente cubre reflow/touch targets y estaba en verde
  en la auditoría UX-01/UI-03 previa); los cambios de este informe son aditivos y no
  afectan a esos flujos.

## Siguiente paso

- Un humano con teléfono físico (Android gestural + iOS con notch) debe ejecutar el
  checklist del informe: (1) BottomNav no tapado por la barra de gestos, (2) Teclado
  virtual no oculta botones de comprobación/envío en Dictado/Frases/Examen, (3) Primer
  toque de TTS reproduce audio sin silencio en Safari iOS, (4) Denegar micrófono →
  reintentar tras re-habilitar en ajustes.

## Ficheros modificados por esta tarea

- `index.html` — `interactive-widget=resizes-content` en viewport meta.
- `src/hooks/useSmoothFocusScroll.ts` — nuevo (utilidad teclado virtual).
- `src/hooks/useSmoothFocusScroll.test.ts` — nuevo (9 tests).
- `src/components/BottomNav.tsx` — fallback `env(safe-area-inset-bottom,0px)`.
- `src/components/BottomNav.test.tsx` — aserción de fallback actualizada.
- `src/features/dictation/components/DictationInput.tsx` — `onFocus` + hook.
- `src/pages/Frases.tsx` — `onFocus` + hook (buscador).
- `src/features/phrases/components/PhraseFilterHub.tsx` — `onFocus` + hook (buscador).
- `src/features/exam/components/ExamSetup.tsx` — `onFocus` + hook (nombre).