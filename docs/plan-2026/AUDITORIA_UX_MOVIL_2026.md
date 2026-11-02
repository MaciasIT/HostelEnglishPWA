# Auditoría UX/UI móvil 2026 — HostelEnglishPWA

**Fecha:** 2026-11-02  
**Estado:** correcciones aplicadas; regresión automatizada en verde.  
**Base examinada:** aplicación web en Chromium con viewports emulados de 360×800, 375×667 y 393×852. No se conectaron dispositivos físicos.

## Resumen ejecutivo

Se revisaron las rutas principales y estados de estudio en los tres tamaños solicitados. La batería E2E móvil comprueba reflow (`window.innerWidth === document.documentElement.clientWidth` y `scrollWidth === clientWidth`), navegación, controles representativos de al menos 44×44 px, los tres modos de quiz, dos paneles modales, diálogos y los flujos principales de frases, dictado y flashcards.

**Resultado funcional:** 20/20 pruebas Playwright E2E y 577/577 pruebas unitarias aprobadas; build de producción y `tsc --noEmit` aprobados. La suite emula tamaños de pantalla; no equivale a una prueba sobre Galaxy/iPhone reales.

### Puntuación de accesibilidad

WCAG no define una puntuación numérica universal de conformidad. Para evitar presentar un porcentaje como certificación, este informe usa una **rúbrica interna de evidencia móvil** (seis grupos): reflow, oclusión del contenido, áreas táctiles AAA, uso de controles, contraste/estados, y ampliación/zonas seguras físicas.

- **2/6 grupos completamente demostrados (33% de evidencia AAA en esta rúbrica):** reflow y ausencia de oclusión del enunciado en los estados de feedback probados.
- **Áreas táctiles:** cumplimiento demostrado en controles representativos; cobertura incompleta de cada control de toda la aplicación.
- **No verificados con medición:** contraste AAA (7:1 en texto normal), ampliación al 200%, espaciado tipográfico global, escala de grises y safe-area no nula de dispositivos físicos.
- **Conclusión:** la aplicación **no se declara conforme con WCAG AAA**. El 33% es cobertura de esta rúbrica, no un porcentaje WCAG oficial.

## Checklist por vista

| Vista / flujo | Resultado en 360×800, 375×667 y 393×852 | Evidencia y hallazgos |
|---|---|---|
| Inicio / Home | ✓ Reflow en las tres medidas | Ruta visitada y `main` visible. Sin desbordamiento horizontal en el estado inicial. No se midió duración de scroll ni se hizo prueba con usuarios físicos. |
| Dashboard | ✓ Reflow en las tres medidas | Ruta visitada y `main` visible; no se detectó overflow horizontal. Las métricas se revisaron con datos de prueba/locales, no con una prueba de lectura asistida. |
| Frases / estudio | ✓ Flujo principal | Inicio de sesión de 10 frases y botón TTS identificable, táctil y sin overflow. Audio español y destino llevan etiquetas accesibles. Los filtros de la ruta actual usan chips. |
| Conversaciones | ✓ Flujo principal | Se abre una conversación real desde la lista y se verifica el control de reproducción completa. Cabecera y burbujas usan composición responsive; sin overflow en el diálogo activo. No se verificó escucha por voz en un dispositivo real. |
| Roleplay | ✓ Selección y objetivo | Se selecciona una situación, se muestra el objetivo y el CTA de inicio cumple el mínimo táctil. Chips de departamento elevados a 44 px. No se inició reconocimiento de voz/LLM ni se validó la waveform con micrófono físico. |
| Quiz — Múltiple, V/F y Ordenar | ✓ 3 modos × 3 medidas | En cada modo, el enunciado continúa visible por encima del bottom-sheet; se muestra la respuesta modelo, con etiqueta y control para escuchar. Sin overflow tras responder. En Ordenar se eliminaron transiciones compartidas que interceptaban pulsaciones consecutivas en palabras. |
| Dictado | ✓ Flujo principal | Reproducción de la frase, entrada etiquetada y estado de comprobación visibles; sin overflow. El selector Zustand de `useDictationLogic` se estabilizó con `useShallow` para evitar un bucle/crash al montar la ruta. La evaluación de voz real no se simuló. |
| Flashcards | ✓ Flujo principal | Se gira la tarjeta y se comprueba el control de reproducción en la cara traducida. Áreas táctiles aumentadas; sin overflow. |
| Progreso | ✓ Reflow | Ruta visitada y sin overflow horizontal en las tres medidas. Los gráficos responsivos se verificaron por el estado de la vista, no con una comparación visual exhaustiva de cada serie/dataset. |
| Examen / certificación | ✓ Configuración del flujo | Se cambian los modos Global y Por Rol, aparece/desaparece el campo de nombre y los controles principales cumplen 44 px. El formulario se compactó en móvil. El selector del hook de examen también se estabilizó con `useShallow`. No se descargó ni imprimió un diploma durante E2E. |
| Configuración / rol | ✓ Modal | El modal de puesto queda dentro del viewport, permite scroll y se cierra con Escape; sin overflow al cerrarlo. |
| Ajustes de voz | ✓ Bottom-sheet | Abre en Frases, permanece dentro del viewport, permite scroll, muestra el control avanzado, cierra con Escape y devuelve el foco al disparador. |
| Navegación móvil | ✓ Menú superior e inferior | Menú, tema, perfil y cinco enlaces de navegación se comprobaron con bounding boxes ≥44×44 px en cada viewport. |

### `<select>` y filtros

- En los flujos E2E probados no apareció ningún `<select>` visible con apariencia nativa.
- La búsqueda de fuente encontró un único elemento HTML `<select>` en `src/features/phrases/components/PhraseFilterHub.tsx`; aplica `appearance-none` y padding/estilo visible. La ruta activa de Frases emplea chips accesibles.
- `VoiceSettings` presenta acentos y velocidades como grupos de botones con `aria-pressed`, no como desplegable nativo.

## Correcciones aplicadas

1. **Navegación y safe areas:** reserva superior para la safe area y espaciador inferior móvil que considera `safe-area-inset-bottom`; controles de TopNav/tema con objetivos táctiles ampliados.
2. **Introducciones, módulos y pantallas cortas:** tamaños y espaciado móvil compactados en `ModuleIntro`, `QuizContainer` y configuración del examen; títulos/cabeceras se adaptan a anchuras estrechas.
3. **Modales y paneles:** reglas reutilizables de safe area, límite de altura y scroll interno para selección de rol y upgrade; VoiceSettings probado como panel de borde inferior y retorno de foco.
4. **Lectura y controles de estudio:** TTS de frases con nombres accesibles y área mínima; navegación de flashcards y controles de roleplay ampliados; filtros de situación de 44 px.
5. **Feedback de Quiz:** el bottom-sheet ahora expone la respuesta modelo tanto para acierto como para error; cambia a superficie semántica del tema y mantiene texto/icono, no solo color, para comunicar el resultado.
6. **Quiz Ordenar:** botones de palabras sin `layoutId` compartido para que una animación de traslado no bloquee el siguiente toque; se añadieron `data-testid` estables a opciones/respuesta para E2E.
7. **Examen:** formulario más compacto en móvil, botones de elección con `aria-pressed`, inputs/acciones con altura mínima táctil.
8. **Estado de aplicación:** uso de `useShallow` en los selectores que montan Dictado y Examen; la auditoría en navegador detectó que esos selectores devolvían objetos nuevos y disparaban el aviso de snapshot inestable.
9. **Diplomas:** botones PNG/PDF y control de copia del código de verificación ampliados a la dimensión mínima táctil.
10. **Regresión:** se añadió `e2e/ux-mobile-audit.spec.ts`, que recorre 11 rutas en tres viewports y ejercita quiz, modales, TTS, dictado, flashcards, diálogo, roleplay y examen.

## Puntuación / rúbrica reproducible

El porcentaje de evidencia se calcula como `grupos completamente demostrados / 6`, sin sumar resultados parciales:

| Grupo | Estado | Prueba / límite |
|---|---|---|
| Reflow móvil | ✅ | 11 rutas × 3 viewports; assertions de `innerWidth`, `clientWidth` y `scrollWidth`. Estados activos también se recorren. |
| Evitar oclusión de aprendizaje | ✅ | Enunciado del quiz permanece por encima del feedback en los tres modos y viewports; paneles de rol/voz no exceden la altura del viewport. |
| Target size AAA | ◐ | Controles representativos se miden ≥44×44 px. No se midieron todos los enlaces, chips, iconos y acciones de todas las vistas. |
| Controles/teclado | ◐ | `<select>` visible comprobado; Escape y retorno de foco validados en modales. No hay recorrido completo por teclado de cada pantalla. |
| Contraste AAA y estados | ⏳ | No se ejecutó una herramienta de contraste ni escala de grises sobre todos los temas/estados; no se certifica 7:1. |
| Zoom, tipografía y safe areas físicas | ⏳ | Sin prueba a 200% ni dispositivo físico con inset superior/inferior distinto de cero. |

**Resultado de rúbrica:** 2/6 (33%) completamente demostrados; 2 parciales; 2 pendientes. **Conformidad WCAG AAA: no determinada/no certificada.**

## Verificación ejecutada

| Comando | Resultado |
|---|---|
| `npm run test:run -- --reporter=dot` | ✅ 88 archivos, 577 pruebas aprobadas. |
| `npm run test:e2e -- --reporter=line` | ✅ 20/20 pruebas Playwright aprobadas. Incluye 12 grupos de auditoría (4 por viewport). |
| `npm run build` | ✅ Vite/PWA producción generados. |
| `npx tsc --noEmit -p tsconfig.json` | ✅ Sin errores. |

Hay warnings no bloqueantes en tests preexistentes (`act(...)`, canvas no implementado en jsdom e IndexedDB mock `withTimeout`) y aviso de Vite por `__dirname`; el proceso acabó con código 0. El E2E offline también registra fallos de fetch intencionados al entrar en modo offline y aprueba.

## Límites y siguiente paso recomendado

- Repetir en teléfonos físicos para verificar notch/home indicator, safe areas reales, teclado virtual, TTS y reconocimiento de voz.
- Medir contraste AA/AAA en los dos temas, probar 200%/400% de zoom y revisar etiquetas pequeñas/estados con herramienta de accesibilidad y lector de pantalla.
- Confirmar visualmente gráficos/diplomas con varios estados de datos y ejecutar una descarga PNG/PDF real.
- Los checks del menú inferior verifican tamaño y visibilidad; la emulación Playwright mantiene insets de hardware en cero, por lo que no sustituye esa validación física.
