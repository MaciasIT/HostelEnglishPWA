#!/usr/bin/env python3
import subprocess
import sys

BOARD = "hostel-english-2026"
WORKSPACE = "dir:/home/m1txel/Escritorio/02_Proyectos/Michel_Macias_Repos/HostelEnglishPWA"

TASKS = [
    {
        "id": "C-01",
        "title": "[FC-01] AudioManager centralizado + selector por dispositivo",
        "assignee": "ia",
        "parents": ["t_eff07782"],
        "body": """# [FC-01] AudioManager centralizado + selector por dispositivo

## Contexto y Diagnóstico
HostelInglés PWA utiliza actualmente Web Speech API como única vía de audio, lo que genera inconsistencias severas entre navegadores y dispositivos (voces robóticas en Android, fallos silenciosos en iOS Safari y ausencia de síntesis en euskera). En `docs/plan-2026/04_CAPA_IA_Y_AUDIO_2026.md` se define una arquitectura de audio de tres niveles: síntesis on-device con Piper (WebGPU/WASM), streaming cloud híbrido y fallback nativo.

## Objetivo
Implementar `src/services/audio/AudioManager.ts` como singleton centralizado que detecte las capacidades del cliente (`navigator.gpu`, memoria, soporte WebAudio) y seleccione la mejor ruta de reproducción de forma transparente.

## Tareas Concretas
1. Crear `src/services/audio/AudioManager.ts`:
   - Detección de soporte WebGPU y estimación de memoria disponible.
   - Selector de motor: Piper on-device > Cloudflare Workers AI / Streaming API > Web Speech Synthesis.
   - Pre-carga en background de modelos o buffers de audio para turnos sin latencia.
   - Caché local en IndexedDB / CacheStorage de fragmentos frecuentes.
2. Integrar el componente visual de audio (Waveform y estados: idle, playing, error).
3. Tests unitarios en Vitest con mocks de Web Audio y Web Speech API.

## Criterios de Aceptación
- Selector automático por capacidades verificado en pruebas.
- Cero fallos silenciosos: si falla Piper o la red, conmuta a Web Speech API sin interrumpir la lección.
- Commit semántico en `feat/fase-c-ia-audio`: `feat(audio): AudioManager centralizado con selector adaptativo por dispositivo`.
- Llamar a `kanban_complete`."""
    },
    {
        "id": "C-02",
        "title": "[FC-02] ASR en Web Worker (Transformers.js Whisper)",
        "assignee": "ia",
        "parents": ["C-01"],
        "body": """# [FC-02] ASR en Web Worker (Transformers.js Whisper)

## Contexto y Diagnóstico
La entrada por voz actual depende de `webkitSpeechRecognition`, que requiere conexión a Google/Apple y falla completamente sin cobertura Wi-Fi/4G en cocinas o sótanos de hotel. En `docs/plan-2026/04_CAPA_IA_Y_AUDIO_2026.md` se prescribe transcripción on-device con Whisper Base / Tiny mediante `@huggingface/transformers` ejecutándose en un Web Worker.

## Objetivo
Crear `src/workers/whisperWorker.ts` y el hook `useWhisperASR()` para transcribir grabaciones de voz en el hilo de fondo sin congelar la UI de la PWA.

## Tareas Concretas
1. Implementar Web Worker con Transformers.js cargando modelo cuantizado `onnx-community/whisper-tiny` o `whisper-base`.
2. Interfaz por paso de mensajes: `{ action: 'transcribe', audioBuffer: Float32Array, language: 'en' | 'es' | 'eu' }`.
3. Cold start optimizado (< 3 s con caché de IndexedDB) y fallback suave a Web Speech API si el hardware no soporta WASM SIMD/WebGPU.
4. Hook React `useWhisperASR.ts` con estados de carga, transcripción y porcentaje de descarga del modelo.
5. Tests unitarios con mock de Web Worker.

## Criterios de Aceptación
- Transcripción completa sin red tras descargar el modelo inicial.
- Cero congelamientos de frame en la interfaz durante el cálculo.
- Commit semántico en `feat/fase-c-ia-audio`: `feat(asr): reconocimiento de voz on-device en Web Worker con Whisper`.
- Llamar a `kanban_complete`."""
    },
    {
        "id": "C-07",
        "title": "[FC-07] WebLLM/Transformers.js LLM en Worker para roleplay",
        "assignee": "ia",
        "parents": ["t_eff07782"],
        "body": """# [FC-07] WebLLM/Transformers.js LLM en Worker para roleplay

## Contexto y Diagnóstico
Para lograr un roleplay conversacional dinámico en hostelería sin coste recurrente por llamada de API en la nube, el plan maestro contempla ejecutar un modelo SLM local (Llama-3.2-1B-Instruct o Qwen-2.5-1.5B) directamente en el navegador del usuario vía WebGPU (`@mlc-ai/web-llm` o Transformers.js).

## Objetivo
Configurar el runtime de inferencia local en un Web Worker dedicado con streaming de respuestas token a token.

## Tareas Concretas
1. Configurar Web Worker para WebLLM con modelo `Llama-3.2-1B-Instruct-q4f16_1-MLC` (o similar ultra-ligero ~700 MB VRAM).
2. Streaming SSE / canal de mensajes hacia el hilo principal con eventos `onToken`, `onComplete`, `onError`.
3. Control estricto de memoria y liberación de contexto (`context window` de 1024 tokens máx para hostelería).
4. Indicador de carga inicial y almacenamiento del modelo en Cache Storage / OPFS.

## Criterios de Aceptación
- Inferencia funcional en dispositivos con WebGPU a > 20 tok/s.
- Detección transparente si no hay WebGPU para habilitar el fallback cloud (FC-08).
- Commit semántico en `feat/fase-c-ia-audio`: `feat(llm): motor SLM on-device en Web Worker para roleplay local`.
- Llamar a `kanban_complete`."""
    },
    {
        "id": "C-08",
        "title": "[FC-08] Fallback API (Workers AI / Gemini) para sin WebGPU",
        "assignee": "ia",
        "parents": ["C-07"],
        "body": """# [FC-08] Fallback API (Workers AI / Gemini) para sin WebGPU

## Contexto y Diagnóstico
Muchos móviles de gama de entrada en hostelería (dispositivos Android baratos o iPhones antiguos) carecen de soporte completo de WebGPU o memoria suficiente para cargar un modelo de 1B localmente.

## Objetivo
Implementar cliente de inferencia híbrido con fallback a API en streaming (Cloudflare Workers AI o endpoint proxy Gemini 2.5 Flash / Llama 3.2 3B).

## Tareas Concretas
1. Implementar `src/services/ai/cloudLLMClient.ts` con `fetch` streaming (ReadableStream).
2. Manejo de desconexión: si se pierde la red durante la llamada, reaccionar con reintento o mensaje de degradación offline.
3. Switch automático transparente: si `isWebGPUSupported()` es falso, el gestor de roleplay invoca esta ruta sin que el usuario note diferencias de interfaz.
4. Métrica de latencia y uso registrada localmente en IndexedDB.

## Criterios de Aceptación
- Los dispositivos sin WebGPU pueden completar roleplays exactamente igual.
- Fallback seguro sin fugas de API keys en cliente.
- Commit semántico en `feat/fase-c-ia-audio`: `feat(ai): cliente fallback a API en streaming para dispositivos sin WebGPU`.
- Llamar a `kanban_complete`."""
    },
    {
        "id": "C-03",
        "title": "[FC-03] Roleplay conversacional MVP (5 escenarios de hostelería)",
        "assignee": "ia",
        "parents": ["C-01", "C-07"],
        "body": """# [FC-03] Roleplay conversacional MVP (5 escenarios de hostelería)

## Contexto y Diagnóstico
Memorizar frases sueltas no entrena la espontaneidad requerida en un mostrador o sala de restaurante. En `docs/plan-2026/01_PRODUCTO_ROADMAP_2026.md` el módulo de Roleplay es el diferencial competitivo clave: la IA adopta el rol de cliente en situaciones concretas y evalúa la capacidad de resolución del trabajador.

## Objetivo
Crear el módulo interactivo `src/features/roleplay/` con los primeros 5 escenarios canónicos de hostelería:
1. Recepción: Check-in tardío sin reserva confirmada.
2. Restaurante: Cliente con intolerancia al gluten y alérgenos en carta.
3. Bar: Pedido complejo de coctelería y recomendación de tapas locales.
4. Pisos: Queja del huésped por toallas o amenities faltantes.
5. Mantenimiento: Reporte de aire acondicionado con fuga de agua en habitación.

## Tareas Concretas
1. Modelado de datos de escenarios (`RoleplayScenarioSchema`) con objetivo, prompts del sistema y vocabulario clave esperado.
2. Interfaz de diálogo interactiva con burbujas de conversación, entrada por voz (ASR), reproducción de voz del cliente (TTS) y waveform reactivo.
3. Máquina de estados: turno de usuario -> grabación/transcripción -> generación de respuesta cliente -> verificación de objetivo completado (3 a 5 turnos).
4. Tests unitarios en Vitest.

## Criterios de Aceptación
- Flujo conversacional fluido de 3 a 5 turnos completable en 2-3 minutos.
- El cliente IA no alucina fuera del escenario hostelero configurado.
- Commit semántico en `feat/fase-c-ia-audio`: `feat(roleplay): motor de roleplay conversacional con 5 escenarios iniciales`.
- Llamar a `kanban_complete`."""
    },
    {
        "id": "C-04",
        "title": "[FC-04] Pistas situacionales en tiempo real y corrección post-turno",
        "assignee": "ia",
        "parents": ["C-03"],
        "body": """# [FC-04] Pistas situacionales en tiempo real y corrección post-turno

## Contexto y Diagnóstico
En una conversación de práctica, si el usuario se bloquea o no sabe qué decir, la sesión se abandona. En `docs/plan-2026/04_CAPA_IA_Y_AUDIO_2026.md` se define un sistema de andamiaje pedagógico: sugerencias discretas si pasan más de 8 segundos sin respuesta y corrección constructiva tras cada intervención.

## Objetivo
Implementar el motor de asistencia en tiempo real durante el roleplay.

## Tareas Concretas
1. Detección de inactividad (> 8 s): mostrar botón sutil 'Pista' con sugerencia de frase o palabras clave en pantalla.
2. Evaluador sintáctico y de cortesía post-turno: analizar la frase dicha por el usuario y resaltar mejoras (ej. usar 'Could you please...' en vez de 'Give me...').
3. Tarjeta de resumen de feedback al terminar el escenario (puntuación de amabilidad, vocabulario técnico usado, áreas de mejora).

## Criterios de Aceptación
- Andamiaje no invasivo que ayuda a terminar el roleplay sin frustración.
- Tests unitarios de lógica de feedback.
- Commit semántico en `feat/fase-c-ia-audio`: `feat(roleplay): pistas en tiempo real y corrección contextual post-turno`.
- Llamar a `kanban_complete`."""
    },
    {
        "id": "C-05",
        "title": "[FC-05] PhoneticScorer: espeak-ng + DTW + catálogo de pronunciación",
        "assignee": "ia",
        "parents": ["C-02"],
        "body": """# [FC-05] PhoneticScorer: espeak-ng + DTW + catálogo de pronunciación

## Contexto y Diagnóstico
Las aplicaciones convencionales dan un acierto/fallo binario basado en coincidencia de texto, lo que no ayuda a mejorar el acento ni la inteligibilidad. En `docs/plan-2026/04_CAPA_IA_Y_AUDIO_2026.md` se especifica un pipeline fonético basado en fonemización con `espeak-ng` y alineación temporal DTW.

## Objetivo
Implementar `src/services/audio/phoneticScorer.ts` para evaluar la calidad fonética de la respuesta oral del usuario frente a la frase objetivo en inglés o euskera.

## Tareas Concretas
1. Integrar fonemizador ligero (conversión de texto a símbolos IPA/SAMPA).
2. Algoritmo DTW (Dynamic Time Warping) para alinear los fonemas esperados con la transcripción fonética del ASR.
3. Catálogo de errores habituales de hispanohablantes:
   - Vocales tensas vs laxas (ej. 'ship' vs 'sheep').
   - Consonantes oclusivas y fricativas (ej. 'b' vs 'v', 'th').
   - Elisión de consonantes finales (ej. past simple '-ed').
4. Cálculo de puntuaciones compuestas (0-100): Accuracy, Completeness, Fluency y Prosody.

## Criterios de Aceptación
- Correlación superior a 0.7 en tests de referencia con muestras fonéticas controladas.
- Tests unitarios en Vitest con casos límite.
- Commit semántico en `feat/fase-c-ia-audio`: `feat(scoring): motor de evaluación fonética con DTW y catálogo de pronunciación`.
- Llamar a `kanban_complete`."""
    },
    {
        "id": "C-06",
        "title": "[FC-06] Feedback visual de pronunciación y mapa de fonemas",
        "assignee": "frontend",
        "parents": ["C-05"],
        "body": """# [FC-06] Feedback visual de pronunciación y mapa de fonemas

## Contexto y Diagnóstico
El usuario necesita ver con total claridad qué palabra o sílaba pronunció de forma ininteligible para corregirla en el siguiente intento.

## Objetivo
Crear el componente `src/features/pronunciation/components/PhoneticFeedbackCard.tsx` que renderice el desglose de pronunciación por palabra con código de color semántico (verde, ámbar, rojo) y consejos articulatorios.

## Tareas Concretas
1. Componente visual que resalte cada palabra de la frase según su puntuación fonética individual.
2. Al pulsar en una palabra con advertencia (ámbar/rojo), desplegar tooltip con explicación fonética en español (ej. 'Intenta pronunciar la s líquida sin añadir una e al inicio').
3. Gráfica radial de 4 ejes: Precisión Léxica, Ritmo/Fluidez, Entonación y Completitud.
4. Botón de reproducción de la referencia nativa vs la grabación del usuario para comparar de oído.

## Criterios de Aceptación
- Componente responsive y accesible adaptado a tokens de diseño 2026.
- Tests de renderizado con Testing Library.
- Commit semántico en `feat/fase-c-ia-audio`: `feat(ui): componente de feedback fonético interactivo y mapa de palabras`.
- Llamar a `kanban_complete`."""
    },
    {
        "id": "C-09",
        "title": "[FC-09] Soporte de euskera: Piper Basque + Whisper-base-eu",
        "assignee": "ia",
        "parents": ["C-01", "C-02"],
        "body": """# [FC-09] Soporte de euskera: Piper Basque + Whisper-base-eu

## Contexto y Diagnóstico
En la versión histórica de la app, el euskera se apoyaba en un apaño fonético (`euToEsPhonetic`) para leerlo con motores TTS en castellano, generando una pronunciación artificial e inexacta. En Navarra y Euskadi, la correcta atención al cliente en euskera es un valor diferencial clave en hostelería.

## Objetivo
Reemplazar cualquier parche fonético e integrar modelos nativos de voz en euskera: síntesis con Piper Basque (voces Antton y Maider) y transcripción con Whisper-base-eu.

## Tareas Concretas
1. Descarga y empaquetado de modelos ONNX optimizados de Piper en euskera (`eu_ES-antton-medium` / `eu_ES-maider-medium`).
2. Configuración en `AudioManager` para conmutar automáticamente a la voz en euskera al reproducir frases en euskera.
3. Soporte del reconocedor ASR en euskera en `whisperWorker.ts`.
4. Eliminar definitivamente el código legado `euToEsPhonetic` de `src/services/`.

## Criterios de Aceptación
- Reproducción natural en euskera sin acento castellano forzado.
- 100% de tests unitarios pasando verde.
- Commit semántico en `feat/fase-c-ia-audio`: `feat(euskera): soporte de síntesis y ASR nativo en euskera con Piper y Whisper`.
- Llamar a `kanban_complete`."""
    },
    {
        "id": "C-10",
        "title": "[FC-10] Ampliar roleplays a 20+ escenarios por departamento",
        "assignee": "dev",
        "parents": ["C-04"],
        "body": """# [FC-10] Ampliar roleplays a 20+ escenarios por departamento

## Contexto y Diagnóstico
Con el motor MVP de roleplay validado en FC-03, se requiere una biblioteca completa de escenarios que cubra los 5 departamentos de hostelería para ofrecer valor real en toda la operativa del hotel o restaurante.

## Objetivo
Estructurar y redactar 20+ escenarios profesionales en `public/data/roleplays.json` (mínimo 4 por departamento):
- Recepción (check-in, check-out, overbooking, indicaciones turísticas).
- Restaurante (toma de comanda, recomendación de vinos, gestión de queja por comida fría, cobro con división de cuenta).
- Bar / Cafetería (servicio en terraza con prisa, alérgenos en tapas, cafés especiales, cobro de propinas).
- Pisos / Gobernanza (solicitud de plancha/cuna, objeto olvidado en habitación, mantenimiento de limpieza, reporte de rotura).
- Mantenimiento (avería de ascensor, fuga en baño, corte de luz, cambio de cerradura electrónica).

## Tareas Concretas
1. Diseñar el JSON validado contra `RoleplayScenarioSchema` con objetivos claros, prompts de cliente y criterios de éxito.
2. Integrar selector de escenarios agrupados por departamento con filtro rápido.
3. Tests de integridad de datos en Vitest.

## Criterios de Aceptación
- Al menos 20 escenarios detallados y testeados.
- Validación de esquemas con Zod sin errores.
- Commit semántico en `feat/fase-c-ia-audio`: `feat(content): catálogo de 20 escenarios de roleplay para los 5 departamentos`.
- Llamar a `kanban_complete`."""
    },
    {
        "id": "C-11",
        "title": "[FC-11] AI-assisted content generation (variantes/distractores)",
        "assignee": "caos",
        "parents": ["t_eff07782"],
        "body": """# [FC-11] AI-assisted content generation (variantes/distractores)

## Contexto y Diagnóstico
En `docs/plan-2026/01_PRODUCTO_ROADMAP_2026.md` se plantea la generación asistida por IA para evitar que los exámenes de tipo test repitan siempre las mismas 4 opciones predecibles, enriqueciendo la variedad de distractores sin requerir curación manual exhaustiva.

## Objetivo
Crear `src/services/aiContentGenerator.ts` como herramienta interna y opt-in para generar variantes contextuales de frases y distractores verosímiles pero erróneos (errores comunes de concordancia o preposiciones en inglés).

## Tareas Concretas
1. Generador de variantes sintácticas para una misma intención (ej. 'Could I have the bill?' -> 'May we get the check, please?').
2. Generador de distractores gramaticales de alta calidad para preguntas de selección múltiple.
3. Suite de tests unitarios verificando que las opciones generadas cumplen la estructura requerida.

## Criterios de Aceptación
- Generación coherente y validada con esquemas Zod.
- Tests unitarios en Vitest.
- Commit semántico en `feat/fase-c-ia-audio`: `feat(ai): generador asistido de variantes de frases y distractores de examen`.
- Llamar a `kanban_complete`."""
    },
    {
        "id": "C-12",
        "title": "[FC-12] Métricas de fluidez + reporte post-sesión y diploma QR",
        "assignee": "dev",
        "parents": ["C-06", "C-10"],
        "body": """# [FC-12] Métricas de fluidez + reporte post-sesión y diploma QR

## Contexto y Diagnóstico
El cierre del ciclo de aprendizaje requiere consolidar todas las métricas acumuladas (FSRS, roleplay y fonética) en un informe visual claro de 'Fluidez Laboral' y permitir la descarga del certificado con código de verificación QR.

## Objetivo
Construir el dashboard de reporte post-sesión y el generador de diploma oficial de certificación por rol con código QR offline.

## Tareas Concretas
1. Fórmula de Fluidez Laboral: media ponderada entre velocidad media de respuesta (segundos por frase), precisión fonética (accuracy) y tasa de resolución en roleplays.
2. Componente de resumen post-sesión (`PostSessionSummaryModal.tsx`) con XP ganada, racha actualizada y frases para reforzar.
3. Generador de diploma visual con canvas o SVG exportable a PNG/PDF, incluyendo nombre del alumno, departamento, nota y código de verificación Ed25519 con QR.
4. Tests unitarios de cálculo de métricas y renderizado.

## Criterios de Aceptación
- Reporte claro y visual de métricas de fluidez.
- Diploma descargable en alta resolución con código verificable.
- Commit semántico en `feat/fase-c-ia-audio`: `feat(progress): métricas compuestas de fluidez laboral y diploma verificable con QR`.
- Llamar a `kanban_complete`."""
    }
]

def main():
    key_to_real_id = {}
    
    for t in TASKS:
        resolved_parents = []
        for p in t["parents"]:
            if p in key_to_real_id:
                resolved_parents.append(key_to_real_id[p])
            else:
                resolved_parents.append(p)
                
        cmd = [
            "hermes", "kanban", "--board", BOARD, "create",
            t["title"],
            "--assignee", t["assignee"],
            "--workspace", WORKSPACE,
            "--body", t["body"]
        ]
        for p in resolved_parents:
            cmd.extend(["--parent", p])
            
        print(f"Creating task {t['title']}...")
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"Error creating {t['title']}: {res.stderr}")
            sys.exit(1)
        
        # Parse output for task id
        out = res.stdout.strip()
        print(f"Result: {out}")
        # Typical output: 'Created task t_xxxxxxxx: ...'
        import re
        m = re.search(r'(t_[0-9a-f]+)', out)
        if m:
            real_id = m.group(1)
            key_to_real_id[t["id"]] = real_id
            print(f"Mapped {t['id']} -> {real_id}")
        else:
            print(f"Warning: could not parse task id from: {out}")

    print("\nAll Fase C tasks successfully injected into Kanban board!")

if __name__ == "__main__":
    main()
