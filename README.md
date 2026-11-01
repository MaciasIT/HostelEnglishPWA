# HostelInglés PWA

![CI/CD](https://github.com/MaciasIT/HostelEnglishPWA/actions/workflows/deploy.yml/badge.svg)
[![Version](https://img.shields.io/badge/version-2.6.0-emerald?style=for-the-badge)](https://github.com/MaciasIT/HostelEnglishPWA/releases)
[![Security](https://img.shields.io/badge/Security-Audit_Passed-green?style=for-the-badge&logo=shield)](./AUDITORIA_360_HostelEnglishPWA.md)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0.16-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-545%20Passed-success?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/agpl-3.0)

**HostelInglés** es una Progressive Web App (PWA) interactiva y offline-first de nivel profesional, diseñada específicamente para capacitar al personal de hostelería en el dominio del inglés y euskera aplicados a situaciones laborales reales. Combina diseño de vanguardia, inteligencia artificial on-device, síntesis de voz neuronal y rigor pedagógico.

➡️ **[Visita la Demo en Vivo](https://maciasit.github.io/HostelEnglishPWA/)** ⬅️

---

## 🎨 Identidad Visual 2026: «Cyber-Hospitality & Tech»

La aplicación ha sido rediseñada desde sus cimientos bajo una dirección de arte moderna, profesional y de alta gama:
- **Atmósfera:** Base carbón mate profundo (`#090D12`), tarjetas y superficies en `#121820` / `#182230`, y acentos verde esmeralda eléctrico (`#10B981` / `#34D399`) combinados con sutiles toques cian.
- **Home Dinámica:** Nueva portada interactiva que sustituye los assets estáticos por un panel de control con métricas en vivo, accesos rápidos por departamento y selector de modos de estudio.
- **Dashboard & Gamificación:** Visualización de rachas con badges dinámicos en llamas, progreso diario, métricas de fluidez y contraste optimizado según estándares **WCAG AAA**.

---

## 🤖 Capa de Inteligencia Artificial & Audio On-Device

HostelInglés implementa una arquitectura híbrida pionera que prioriza la computación local y la privacidad del usuario:

1. **Motor de Roleplay Procedural e Imprevistos:**
   - Generación en tiempo real de situaciones hosteleras no guionizadas a través de 5 departamentos (Recepción, Restaurante, Bar, Pisos, Mantenimiento).
   - Simulación de perfiles de clientes diversos (apresurado, exigente, diplomático, turista despistado) y selector de acentos lingüísticos (UK, US, Australiano, Internacional).
2. **Evaluador de Cortesía Hostelera (*Politeness Evaluator*):**
   - Análisis sintáctico y semántico del registro utilizado por el usuario, premiando fórmulas de diplomacia profesional (*«Could you please...»*, *«I would be delighted to...»*) frente a respuestas cortantes.
3. **Síntesis de Voz Neuronal Local (Piper TTS):**
   - Soporte para modelos de voz realistas ejecutados localmente mediante WebGPU/WASM, con degradación suave a síntesis cloud y Web Speech API nativo.
4. **Transcripción y Reconocimiento Fonético (Whisper / Transformers.js):**
   - Validación de pronunciación en tiempo real en el módulo de dictado con alineación de secuencias mediante DTW (*Dynamic Time Warping*).
5. **Soporte Fonético Avanzado (Euskera):**
   - Motor híbrido de transcripción fonética G2P (*grapheme-to-phoneme*) vasco-español que permite una pronunciación fluida y natural del euskera en cualquier dispositivo sin requerir librerías externas.
   - Fonética **IPA (Alfabeto Fonético Internacional)** curada en todo el corpus para guiar la correcta articulación en inglés.

---

## ✨ Funcionalidades y Corpus Lingüístico

- 📊 **Corpus Enriquecido (770+ frases):** Vocabulario integral clasificado por áreas operativas: Recepción, Bar/Cafetería, Sala, Cocina/Alérgenos, Pisos y Asistencia Técnica.
- 💬 **100+ Diálogos Interactivos:** Escenarios de nivel A2 a B2 que abarcan gestión de quejas graves, protocolos de intoxicación o alergia cruzada, check-in VIP y peticiones complejas.
- 🌐 **Matriz de Variantes Regionales:** Diccionario integrado con 41 equivalencias críticas entre inglés británico, americano y australiano (*bill/check*, *aubergine/eggplant*, *chips/fries/crisps*).
- 🧠 **Repetición Espaciada Inteligente (FSRS):** Algoritmo basado en el modelo *Free Spaced Repetition Scheduler* para optimizar los intervalos de retención de la memoria a largo plazo.
- 🎮 **Gamificación y Modos de Aprendizaje:**
  - **Módulo de Frases:** Práctica por bloques o maratón con reproducción secuencial.
  - **Quiz de Mundos:** Sistema progresivo con vidas, rachas y multiplicadores.
  - **Módulo de Dictado:** Escucha y transcribe con evaluación fonética.
  - **Certificación de Examen:** Evaluaciones integrales con diagnóstico detallado de áreas de mejora.
- 📱 **Experiencia Mobile-First & PWA:** Totalmente operable offline, con almacenamiento local en IndexedDB y Service Worker configurado con Workbox 7.

---

## 📖 Guía de Uso e Instalación PWA

### Instalación en el Dispositivo (Móvil y Escritorio)
HostelInglés funciona como una aplicación nativa completa mediante tecnología PWA:
- **Android (Chrome):** Pulsa el botón emergente «Instalar App» en la barra de navegación o accede al menú de tres puntos de Chrome y selecciona **«Instalar aplicación»**.
- **iOS (Safari):** Toca el botón **Compartir** de Safari (icono de cuadrado con flecha hacia arriba) y elige **«Añadir a la pantalla de inicio»**.
- **Escritorio (Chrome / Edge / Brave):** Pulsa el icono de instalación en la barra de direcciones superior o instala desde el menú del navegador.

> [!NOTE]
> **Permisos del Navegador:**
> - **Micrófono:** Requerido para el módulo de Dictado y reconocimiento de voz (ASR).
> - **Almacenamiento Local (IndexedDB):** Imprescindible para conservar tu progreso, rachas, configuración de idioma y descargar los modelos y datasets offline.

### Cómo entrenar con las nuevas funciones de IA
1. **Accede a la sección Roleplay:** Selecciona tu departamento (Recepción, Restaurante, Bar, Pisos o Mantenimiento).
2. **Selector de Acentos:** Cambia dinámicamente entre acento británico (UK), americano (US), australiano (AUS) o internacional para afinar tu oído.
3. **Modo Imprevisto Procedural:** Pulsa **«Simular Imprevisto»** para generar un giro no guionizado en la conversación (p. ej. cliente con alergia severa o queja de última hora).
4. **Panel de Cortesía Hostelera:** Al responder, el evaluador analizará si tu registro cumple el estándar de cortesía diplomática (*Polite Hospitality English*) y te ofrecerá alternativas profesionales en caso de respuestas demasiado directas.

---

## 💻 Guía de Desarrollo Local

### Requisitos Previos
- **Node.js**: v22 LTS o superior (`node -v`).
- **npm**: v10 o superior (`npm -v`).

### Puesta en Marcha

```bash
# 1. Clonar el repositorio
git clone https://github.com/MaciasIT/HostelEnglishPWA.git
cd HostelEnglishPWA

# 2. Instalar dependencias (con flag legacy-peer-deps por compatibilidad React 19)
npm install --legacy-peer-deps

# 3. Iniciar servidor de desarrollo local
npm run dev
```

El servidor local arrancará por defecto en `http://localhost:5173/HostelEnglishPWA/`.

### Verificación de Calidad y Tests

```bash
# Ejecutar suite de pruebas unitarias e integración (Vitest)
npm run test:run

# Comprobación de tipos TypeScript
npx tsc -b

# Compilar paquete de producción (Vite + Service Worker PWA)
npm run build

# Previsualizar el bundle compilado localmente
npm run preview
```

---

## 🛠️ Stack Tecnológico

| Área | Tecnología | Versión / Detalle |
|---|---|---|
| **Frontend Core** | React | `19.0.0` (Strict Mode) |
| **Enrutamiento** | React Router | `v8` (`react-router/dom`) |
| **Lenguaje** | TypeScript | `5.4.5` (Strict Type-checking) |
| **Build & Bundler** | Vite | `8.0.16` (Rolldown engine) |
| **Motor de Estilos** | Tailwind CSS | `4.0.0` (Arquitectura `@theme` y Lightning CSS) |
| **Gestión de Estado** | Zustand | `5.0.16` (Sliced Architecture) |
| **Animaciones** | Framer Motion | `12.38.0` |
| **Modelos de IA** | Transformers.js & WebLLM | `@huggingface/transformers` + `@mlc-ai/web-llm` |
| **Runtimes WASM/GPU**| ONNX Runtime Web | `1.22.0-dev` con aceleración WebGPU |
| **Audio** | Piper TTS + Web Speech API | Arquitectura jerárquica con caché local |
| **PWA & Offline** | vite-plugin-pwa / Workbox | Service Worker con precaché de 12 MiB para modelos |
| **Persistencia** | IndexedDB (`idb`) | Almacenamiento local de progreso, métricas y licencias |
| **Testing** | Vitest + RTL + Playwright | **83 suites / 545 tests** unitarios e integración (100% verdes) |

---

## 🏗️ Calidad y CI/CD

El proyecto cuenta con un pipeline automatizado de integración y entrega continua en GitHub Actions:
- **Node.js 22 LTS**: Entorno de ejecución estandarizado.
- **Quality Gates**: Auditoría de dependencias (`--audit-level=critical`), verificación estricta de tipos (`tsc -b`), linter de código y ejecución de los 545 tests unitarios.
- **Despliegue Continuo**: Compilación optimizada y publicación instantánea en GitHub Pages.

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia **GNU Affero General Public License v3.0 (AGPL-3.0)**. Garantiza la libertad de uso, estudio y colaboración abierta para la comunidad.

⚠️ **Uso Comercial:** Para implantaciones privadas, marcas blancas o despliegues empresariales cerrados, consulta los términos en la [Licencia Comercial](docs/LICENCIA-COMERCIAL.md) o ponte en contacto con el autor.

---

*Desarrollado con dedicación técnica por Michel Macías y el ecosistema de agentes.*
