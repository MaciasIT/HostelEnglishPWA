# HostelInglés PWA — Auditoría de Producto y Roadmap Funcional 2026

**Autor:** Asesoría de Producto  
**Fecha:** 2026-11-01  
**Versión actual del producto:** 2.5.2 (en despliegue)  
**Destinatario:** Michel Macias — Product Owner  

---

## 1. Diagnóstico del Estado Actual

### 1.1 Qué existe hoy (verificado en código)
| Área | Hallazgo | Evidencia |
|------|----------|-----------|
| **Corpus** | 640+ frases y 90+ diálogos JSON, con categorías por departamento. | `public/data/hostelenglish_dataset_clean.json` (5123 líneas), `conversations_extended_v4.json` (5247 líneas). |
| **Módulos** | Frases, Conversaciones, Dictado por voz, Flashcards, Quiz gamificado, Examen, Progreso. | `src/pages/*`, `src/features/*`. |
| **Gamificación** | Mundos, 3 vidas, rachas, barra de progreso, logros básicos (`first_exam`, `perfect_score`, `exam_master`). | `src/features/quiz/hooks/useQuizLogic.ts`, `src/store/slices/progressSlice.ts`. |
| **Modelo de avance** | Progreso por frase nivel 0→3, sin scheduler de repetición espaciada. | `src/models/schemas.ts`: `Progress_schema = record(string, 0..3)`. |
| **Offline / PWA** | Workbox, IndexedDB, mobile-first, dark mode, safe-area, a11y WCAG AA. | `vite.config.ts`, `src/components/AppInitializer.tsx`, README. |
| **Calidad** | TS Strict, Zustand sliced, 75 tests verdes, CI con quality gates. | `tsconfig.json`, `vitest.config.ts`, diario de desarrollo. |

### 1.2 Brechas detectadas vs. estándar 2026
1. **Sin repetición espaciada inteligente.** El progreso es lineal (0→3) y no considera olvido ni dificultad personal.
2. **Sin role-based learning.** No existen rutas diferenciadas (recepción vs. bar vs. mantenimiento).
3. **Sin práctica conversacional guiada por objetivos.** Los diálogos son pasivos (solo escuchar/reproducir).
4. **Sin retos diarios contextuales.** No hay misiones situacionales alineadas a turnos de trabajo.
5. **Sin métricas de fluidez laboral.** Las certificaciones miden acierto, no competencia comunicativa en escenario real.
6. **Dataset monolenguaje source.** Todo el corpus está predefinido; no hay generación dinámica de variantes ni dificultad adaptativa.

---

## 2. Benchmark EdTech Idiomas 2026

### 2.1 Tendencias verificadas (fuentes: Q1FY26 Duolingo, Oyelabs, ProLangSchool, VoxBooster 2026)
| Tendencia | Implicación para HostelInglés |
|-----------|------------------------------|
| **Microlearning adaptativo, no solo corto** | Sesiones de 2-3 min son el formato válido, pero deben secuenciar dificultad y feedback en bucle. |
| **AI conversation practice** | El mercado migra de “ejercicios de selección” a “hablar con un personaje en escenario”. Duolingo Max ya convierte Video Call y Roleplay en core product. |
| **Spaced Repetition inteligente** | FSRS (Free Spaced Repetition Scheduler) es el estándar abierto; Anki lo incluye desde v23.10 y apps como Taalhammer/ Synapse lo usan en producción desde sep-2026. |
| **Role-based adaptive paths** | LMS de hospitality (Axonify, Talkpal, Violet) segmentan por rol y operación. |
| **Gamificación con propósito** | Rachas y XP funcionan, pero el diferenciador es mastery-based progression (desbloqueo de capacidad real, no solo puntos). |
| **Fluency metrics, no solo accuracy** | ELSA Speak, Unshook y Luma Speak puntúan fluidez, gramática y pronunciación en reportes post-sesión. |

### 2.2 Posicionamiento competitivo propuesto
HostelInglés debe competir no como “Duolingo de hostelería”, sino como **entrenador de fluidez laboral offline-first, con escenarios propios del sector y scheduler local sin dependencia de cloud**.

---

## 3. Evolución del Modelo de Aprendizaje

### 3.1 De repetición fija a FSRS (Spaced Repetition System)
**Objetivo:** Reemplazar la escala 0→3 por un sistema que prediga el olvido y reprograme la práctica por frase.

| Elemento | Estado actual | Estado objetivo (FSRS) |
|----------|---------------|------------------------|
| Parámetros por ítem | Nivel fijo 0..3 | Dificultad, Estabilidad, Recuperabilidad (3 números por frase). |
| Decisión de revisión | Manual / aleatoria en flashcards | Intervalo calculado por modelo con objetivo de retención p.ej. 90%. |
| Carga de estudio | Constante o creciente | Reducción de repeticiones innecesarias hasta ~30-40% manteniendo retención. |
| Implementación | No existe | Usar `fsrs-js` / `ts-fsrs` en cliente; entrenar parámetros por defecto y refinar con historial local. |

**Entregable técnico:** Nuevo slice `reviewSlice.ts` con cola `duePhrases`, parámetros por frase, y migración de `progress` a `reviewMemory`.

### 3.2 Micro-lecciones para turnos rotatorios
- Lecciones por objetivo único (p.ej. “Check-in con tarjeta de crédito fallida”).
- Duración target: 2-3 minutos reales.
- Formato: objetivo → práctica → feedback → siguiente objetivo.
- Integración con `dailyActivity` para medir minutos activos, no solo eventos.

### 3.3 Rutas formativas dinámicas por rol
Segmentación inicial por departamento (Recepción, Bar, Restaurante, Limpieza, Mantenimiento). Cada rol define:
- Subconjunto priorizado de frases.
- Conversaciones obligatorias vs. optativas.
- Certificación inicial por rol + recertificación cada 90 días.

---

## 4. Módulos Nuevos y Mejoras de Gamificación

### 4.1 Módulo de Roleplay Conversacional Guiado
Tipo: **Práctica guiada por objetivo con retroalimentación estructurada.**

Flujo propuesto:
1. Elegir escenario (p.ej. “Huésped con reserva duplicada”).
2. La app guía con frases clave sugeridas y el usuario debe producirlas oralmente.
3. Speech Recognition valida pronunciación + léxico.
4. Post-sesión: informe con aciertos, errores recurrentes y frases para repasar.

Dependencias técnicas:
- Reutilizar `useSpeechRecognition` y motor TTS híbrido existente.
- Añadir `RoleplaySession` a `schemas.ts` y slice propio `roleplaySlice.ts`.
- Dataset de escenarios en `public/data/roleplays.json`.

### 4.2 Retos Diarios con Metas Situacionales
Tipo: **Micro-misión generada/priorizada diariamente.**

Ejemplos:
- “Hoy gestiona 3 quejas de alérgenos en restaurante.”
- “Completa 5 frases de check-in antes de las 14:00.”

Reglas:
- Un reto por día, rotación por departamento según preferencia.
- Recompensa: XP + bonificador de racha + desbloqueo de escenario de roleplay.
- Si se pierde un día, el reto se reemplaza (no se acumulan deudas).

### 4.3 Certificaciones y Métricas de Fluidez Laboral
Evolución del módulo de Examen:
- **Certificación por rol** (recepción, bar, etc.) con validez 90 días.
- **Métrica de fluidez** = velocidad media de respuesta oral + precisión léxica + tasa de aciertos en roleplay.
- **Insignias verificables** (badges) exportables o compartibles.
- Dashboard de competencias por categoría (heatmap).

---

## 5. Priorización y Fases — Matriz Valor vs. Complejidad

### 5.1 Criterios
- **Valor:** impacto en retención, diferenciación competitiva, engagement diario.
- **Complejidad:** esfuerzo estimado (XS <1h, S 1-2h, M 2-4h, L >4h, XL >8h) y riesgo técnico.

### 5.2 Matriz

| Iniciativa | Valor | Complejidad | Fase sugerida |
|------------|-------|-------------|---------------|
| **FSRS-6 (scheduler)** | Alto | L | Fase 1 |
| **Retos diarios** | Alto | S | Fase 1 |
| **Role-based paths** | Alto | M | Fase 1 |
| **Micro-lecciones objectives** | Alto | M | Fase 2 |
| **Roleplay conversacional** | Muy alto | XL | Fase 2 |
| **Certificaciones por rol** | Alto | L | Fase 2 |
| **Fluency metrics** | Medio | M | Fase 2 |
| **Gamificación avanzada (team quests)** | Medio | M | Fase 3 |
| **AI-generated variants** | Alto | XL | Fase 3 |

### 5.3 Secuencia de Fases

#### Fase 1 — Motor de estudio adaptativo (8-10 semanas)
- FSRS-6 local + migración de datos.
- Retos diarios (engine + UI).
- Selección de rol al onboarding y filtros por rol en dashboard.
- **Criterio de salida:** usuario puede completar una sesión de 2-3 min con ítems programados por FSRS y recibe reto diario.

#### Fase 2 — Práctica conversacional y certificación (10-12 semanas)
- Micro-lecciones guiadas por objetivo.
- Roleplay conversacional MVP (5 escenarios piloto).
- Certificación por rol + informe de fluidez básico.
- **Criterio de salida:** un rol (p.ej. Recepción) tiene path completo: frases → flashcards → roleplay → examen → certificación.

#### Fase 3 — Excelencia y escala (6-8 semanas)
- Ampliación de roleplays a 20+ escenarios.
- Team quests (social ligero, sin backend).
- AI-assisted content generation (variantes de frases y distractores).
- **Criterio de salida:** cobertura de los 5 departamentos core con métricas comparables.

---

## 6. MVP del Roadmap 2026

### 6.1 Alcance incluido (MVP Fase 1)
- Migración de `progress` a `reviewMemory` con FSRS-6.
- Cola de repaso diaria generada localmente.
- Reto diario contextual por rol.
- Selección de rol en onboarding y filtrado por rol en Frases/Flashcards/Quiz.
- Sesiones de 2-3 min con contador.

### 6.2 Alcance excluido del MVP
- Roleplay conversacional con IA generativa (queda Fase 2).
- Backend / cuenta multidispositivo (sigue offline-first).
- Contenido generado automáticamente por IA (queda Fase 3).

### 6.3 Supuestos
1. Michel mantiene la restricción offline-first y sin backend.
2. El corpus base (640 frases + 90 diálogos) es suficiente para seedar FSRS; el crecimiento se hará por JSON, no por scraping.
3. Los usuarios objetivo aceptan onboarding corto (rol + nivel inicial).

### 6.4 Riesgos y mitigación inicial
| Riesgo | Mitigación |
|--------|------------|
| FSRS percibido como “caja negra” | UI que muestre “próxima repetición en X días” y opción de repasar ya. |
| Sobrecarga cognitiva al elegir rol | Default “General” + cambio libre posterior. |
| Dependencia de IA para roleplay | Escenarios guionizados primero; IA como co-pilot, no core. |
| Churn por sesiones “demasiado cortas” | Medir minutos activos y ajustar longitud mínima por cohorte. |

---

## 7. Métricas de Éxito

| Métrica | Fórmula | Umbral | Periodicidad |
|---------|---------|--------|-------------|
| **Retención D7** | Usuarios con ≥4 sesiones en 7 días ÷ activos día 1 | ≥ 35% | Semanal |
| **Tiempo medio de sesión** | Suma de `dailyActivity` minutos ÷ sesiones | 2.5 – 4 min | Semanal |
| **Carga de repaso FSRS** | ítems vencidos al día ÷ total en cola | ≤ 18% | Diario |
| **Completitud de reto diario** | retos completados ÷ retos asignados | ≥ 60% | Diario |
| **Certificaciones por rol** | certificados emitidos ÷ usuarios con ≥7 días | ≥ 15% | Mensual |

---

## 8. Arquitectura de Datos — Cambios Propuestos

### 8.1 Esquema extendido (borrador)
```ts
// Añadir a src/models/schemas.ts
export const ReviewMemorySchema = z.record(
  z.string(),
  z.object({
    difficulty: z.number(),
    stability: z.number(),
    retrievability: z.number(),
    dueDate: z.string().datetime(),
    lapses: z.number().default(0),
    reps: z.number().default(0),
  })
);

export const RoleplaySessionSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  date: z.string(),
  score: z.number(),
  fluencyScore: z.number(),
  weakPhrases: z.array(z.string()),
});

export const DailyChallengeSchema = z.object({
  date: z.string(),
  role: z.string(),
  challengeId: z.string(),
  completed: z.boolean(),
  completedAt: z.string().datetime().optional(),
});
```

### 8.2 Migración
- `DataMigrator` ya existe; extender para transformar `progress` 0→3 a FSRS inicial ( difficulty= alto si nivel=0, stability= día si nivel=2, etc.).
- Mantener `achievements` como array de strings; añadir nuevos: `fsrs_week`, `role_master_<role>`, `streak_30`.

---

## 9. Handoff y Próximos Roles

### 9.1 Siguientes pasos inmediatos
1. **Validar este roadmap con Michel** (aprobación de fases y criterios de éxito).
2. **ux-engineer:** Diseñar flujos de onboarding de rol y pantalla de reto diario.
3. **systems-architect:** Validar integración de `fsrs-js` en cliente, tamaño bundle y migración de esquema.
4. **Dev:** Implementar Fase 1 en rama `feat/fsrs-daily-challenges`.

### 9.2 Entradas bloqueantes
- Decisión de Michel sobre mostrar/ocultar métricas de fluidez en dashboard público.
- Confirmación de que el corpus actual (640 frases) es el set base o se amplía antes de Fase 2.

---

## 10. Resumen Ejecutivo

**Elevator pitch:** HostelInglés pasa de app de frases a **entrenador de fluidez laboral offline-first para hostelería**, combinando FSRS, retos diarios por rol y roleplay conversacional guiado, medido en competencia real y no en aciertos aislados.

**Problema central:** El personal de hostelería necesita práctica contextual y continua en turnos rotatorios; las apps genéricas no se adaptan a sus escenarios ni a su tiempo disponible.

**Diferenciación:** Sectorización real (roles + escenarios), scheduler espaciado local sin cloud, y práctica oral con motor fonético híbrido ya operativo.

---

*Documento generado en base a auditoría de código, diario de desarrollo y benchmark de mercado 2026. No se modificó código fuente.*
