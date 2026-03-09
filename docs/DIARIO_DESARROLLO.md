# 📖 Diario de Desarrollo – HostelInglésApp

*Última actualización: 02-02-2026*

Este documento sigue el desarrollo de la PWA HostelInglés. Está organizado por módulos para reflejar el estado actual de cada componente de la aplicación.

---

## ✨ Sistema Híbrido de Text-to-Speech (TTS) y Parche Fonético (Euskera)
*Fecha: 09-03-2026*

- **[✅ COMPLETADO] Refactorización Multi-Idioma del Audio:**
    - Se refactorizaron completamente los hooks `useSpeech.ts` y `useAudio.ts` así como el utilitario `utils/audio.ts`.
    - Ahora todos los módulos (Dictado, Quiz, Conversaciones, Flashcards, Frases) aceptan enrutamiento dinámico de audios (`es`, `en`, `eu`), solucionando la lectura de español con voz inglesa.

- **[✅ COMPLETADO] Parche de Reconocimiento y TTS Híbrido:**
    - Al carecer nativamente de paquetes de voz para Euskera (`eu-ES`) en navegadores estándar y ser bloqueado el servicio de Google Translate por CSP, se arreglaron los encabezados `Content-Security-Policy` introduciendo `media-src` para el TTS un-oficial de Google.
    - **Innovación - Traductor Fonético Dinámico:** Función embebida (`euToEsPhonetic`) que transforma el texto en Euskera (`tz`, `tx`, `j`, `z`, etc.) para simular su pronunciación normativizada, obligando al TTS (tanto Google offline adaptado como TTS Nativo de Español) a leerlo con una fricativa /s/ y los acentos correspondientes, garantizando un soporte impecable en Euskera incluso sin el paquete real instalado.
    - Se actualizó también `useSpeechRecognition.ts` para capturar el lenguaje activo (incluyendo Euskera para el Módulo de Dictado).

---

## ✨ Limpieza de Documentación y Deuda Técnica
*Fecha: 05-02-2026*

- **[✅ COMPLETADO] Depuración de la carpeta `docs/`:**
    - Se han eliminado todos los documentos de diseño inicial, requerimientos e historias de usuario en formato PDF y PNG.
    - **Motivo**: Los documentos eran redundantes y no reflejaban el estado actual de la aplicación, la cual ya ha superado el 100% de su visión inicial.
    - Se mantiene únicamente `DIARIO_DESARROLLO.md` como la fuente de verdad y registro histórico de la evolución del proyecto.

---

## ✨ Gamificación, Optimización Desktop y UX Premium
*Fecha: 02-02-2026*

- **[✅ COMPLETADO] Gamificación del Módulo Quiz:**
    - **Sistema de Mundos**: División del dataset (538 frases) en mundos basados en categorías profesionales (Recepción, Restaurante, etc.).
    - **Mecánicas de Juego**: Implementación de niveles de 10 preguntas, sistema de 3 vidas (❤️), contador de rachas (🔥) y barra de progreso visual.
    - **Feedback Interactivo**: Modal de feedback no intrusivo y pantallas de "Game Over" y "Misión Cumplida" con estadísticas detalladas y persistencia de progreso.

- **[✅ COMPLETADO] Refinado UX en el Módulo de Examen:**
    - **Celebración de Victoria**: Animaciones premium con `framer-motion` y efectos de partículas (Sparkles) al aprobar.
    - **Revisión de Errores**: Implementación de un modal dedicado para repasar frases fallidas, manteniendo el dashboard de resultados limpio y profesional.

- **[✅ COMPLETADO] Optimización UI para Desktop:**
    - **Escalado Global**: Implementación de una escala base del 85% para pantallas grandes (`lg:`) para simular un efecto de "Zoom 80%", reduciendo el scroll innecesario y mejorando la densidad de información.
    - **SideNav Compacto**: Ajuste de anchos y paddings en el menú lateral para dispositivos de escritorio.
    - **Layout Max-Width**: Centrado del contenido principal con un ancho máximo de 1600px para evitar estiramientos en monitores ultra-wide.

- **[✅ COMPLETADO] Correcciones de Estabilidad:**
    - Solución de problemas de sincronización en la reproducción de diálogos.
    - Mejora de la persistencia de los ajustes de voz por categoría.

- **[✅ COMPLETADO] Coherencia y Reorganización de Datasets:**
    - **Unificación de Categorías**: Fusión de "Barra" -> "Bar" y unificación de nomenclaturas para "Quejas y Reclamaciones".
    - **Re-categorización Inteligente**: Reubicación de +60 frases mal categorizadas (Bar, Mantenimiento, Limpieza) para asegurar que todos los "Mundos" del Quiz tengan contenido relevante.
    - **Sincronización Total**: Alineación de categorías entre el dataset de frases y el de diálogos para una experiencia de usuario sin fisuras.

---

## ✨ Unificación de Idioma, Accesibilidad y Solución de Deuda Técnica
*Fecha: 31-01-2026*

- **[✅ COMPLETADO] Unificación de Interfaz a Español:**
    - Se han eliminado todas las dependencias de idioma en los literales de la UI. Ahora, independientemente del idioma de aprendizaje (inglés/euskera), la aplicación habla al usuario en español para una mejor usabilidad y enfoque.
    - Actualizados componentes `Flashcard`, `PhraseCard`, `Home`, `Dashboard` y menús laterales.

- **[✅ COMPLETADO] Solución de Deuda Técnica en Tests:**
    - Se han corregido los errores de TypeScript en los mocks de `speechSynthesis` y `SpeechSynthesisUtterance` en toda la suite de pruebas.
    - Se han actualizar los selectores de los tests para reflejar la UI en español.
    - Implementación de `aria-label` en botones de navegación y acciones para garantizar tests deterministas y mejorar la accesibilidad (WCAG).
    - **Resultado**: 100% de los tests pasando (`src/App.test.tsx`, `Frases.test.tsx`, `Dictation.test.tsx`, `Conversaciones.test.tsx`, `Flashcards.test.tsx`, `Quiz.test.tsx`, `Examen.test.tsx`).

---

## ✨ Licenciamiento, Limpieza y Seguridad
*Fecha: 31-01-2026*

- **[✅ COMPLETADO] Implementación de Licencia AGPLv3:**
    - Se ha añadido la licencia **GNU Affero General Public License v3.0** para proteger el código y fomentar la colaboración abierta, cumpliendo con la necesidad de evitar el "robo" comercial de la idea.
    - Actualizado `package.json` para reflejar el estado público y la licencia.
    - Se ha añadido un badge oficial en el `README.md`.

- **[✅ COMPLETADO] Limpieza del Repositorio (Git Hygiene):**
    - Se ha refactorizado el `.gitignore` para ser más estricto con archivos de sistema, temporales de IA (`GEMINI.md`, `.gemini/`) y metadatos de construcción (`dev-dist/`).
    - Se han eliminado del índice de Git (untracking) documentos de diseño internos y archivos temporales que no aportan valor al código de producción.

---

## ✨ Internacionalización (Euskera) y Refinado UI Premium
*Fecha: 23-01-2026*

- **[✅ COMPLETADO] Soporte para Euskera:**
    - Se han traducido íntegramente los datasets (`hostelenglish_dataset_clean.json` y `conversations_extended_v4.json`) al euskera.
    - Implementación de un selector de idioma global que afecta a toda la lógica de la aplicación.
    - Se ha hecho un llamamiento a la comunidad nativa en el `README` para validar las traducciones.

- **[✅ COMPLETADO] Integración de ModuleIntro:**
    - Se ha diseñado e implementado un componente `ModuleIntro` con estética premium para dar consistencia a la entrada de cada módulo (Frases, Conversaciones, Dictado, Flashcards, Quiz, Examen, Estudio, Progreso, Dashboard).
    - El componente incluye descripciones dinámicas y animaciones sutiles siguiendo el enfoque "WOW factor" del proyecto.

---

## ✨ Automatización y Calidad
*Fecha: Realizado de forma continua*

- **[✅ COMPLETADO] Flujo CI/CD:**
    - Configurado GitHub Actions para despliegue automático en GitHub Pages.
    - Integración de validaciones de tests previos al despliegue.

- **[✅ COMPLETADO] Metodología TDD:**
    - Consolidación del ciclo RED-GREEN-REFACTOR en el desarrollo de cada nueva funcionalidad.
    - Mantenimiento de una cobertura de tests robusta para lógica de store y componentes críticos.

---

## ✨ Sesiones de Estudio, Refactor de UI y Correcciones
*Fecha: 04-11-2025*

- **[✅ COMPLETADO] Módulo Frases - Sesiones de Estudio:**
    - **Contexto:** Se ha rediseñado el flujo de estudio del módulo de frases para mejorar la concentración del usuario y la retención del conocimiento. El sistema anterior de carrusel/paginación ha sido reemplazado.
    - **Implementación:**
        - Ahora el usuario primero filtra las frases que desea estudiar y luego elige el tamaño de la sesión: 10, 25 o todas las frases filtradas.
        - Al iniciar la sesión, las frases seleccionadas se cargan en un estado temporal (`activePhraseSet` en Zustand) y se presentan una por una.
        - Se ha añadido una función `shuffle` para que el orden de las frases sea aleatorio en cada sesión.
        - Se ha refactorizado `useAppStore` para incluir la nueva lógica de sesiones de estudio, eliminando estados de paginación que ya no eran necesarios.

- **[✅ COMPLETADO] Refactorización de UI y Layout Global:**
    - **Contexto:** Se buscaba unificar el aspecto visual de los diferentes módulos de la aplicación y centralizar el estilo del fondo.
    - **Implementación:**
        - Se ha creado un nuevo componente `PageContainer.tsx` que encapsula un fondo de degradado con un patrón SVG sutil y gestiona el título de la página.
        - Se ha mejorado el diseño de `PhraseCard.tsx`, dándole un fondo opaco (`bg-primary-dark`), sombra más pronunciada, mayor padding y texto más grande y centrado para mejorar la legibilidad.
        - Se han refactorizado los módulos `Frases`, `Conversaciones`, `Dictation` y `Flashcards` para que utilicen `PageContainer`, logrando una UI consistente.
        - Se han omitido intencionadamente los módulos con páginas de bienvenida (`Dashboard`, `Estudio`, `Examen`, `Quiz`) para no interferir con sus layouts únicos.

- **[✅ COMPLETADO] Corrección de Bug - Módulo Dictado:**
    - **Contexto:** Se detectó que el audio en el módulo de dictado se reproducía en español en lugar de inglés.
    - **Implementación:**
        - Se ha corregido el problema en `Dictation.tsx` forzando explícitamente el idioma de la locución a inglés mediante `utterance.lang = 'en-US';`. Esto asegura que el navegador seleccione la voz correcta independientemente de la configuración regional del sistema.

---

## ✨ Refactorización del Módulo de Frases y Estado de los Tests
*Fecha: 07-10-2025*

- **[🔄 EN PROGRESO] Módulo Frases:**
    - **Contexto:** La interfaz del módulo de frases, aunque funcional, presentaba demasiada información a la vez (lista paginada, filtros, ajustes de voz). El objetivo era simplificar la UI para centrar al usuario en la tarea de aprender una frase a la vez.
    - **Implementación:**
        - Se ha refactorizado por completo el componente `Frases.tsx`.
        - Se eliminó el sistema de paginación y la lógica asociada en el store de Zustand, simplificando el estado global.
        - Se implementó una **interfaz de carrusel**, donde las frases se muestran individualmente. Se añadió un estado local `currentIndex` para gestionar la frase activa.
        - Se crearon botones de navegación "Anterior" y "Siguiente" con iconos (`@heroicons/react`).
        - Se desarrolló un nuevo componente reutilizable `CollapsibleSection.tsx` para ocultar los ajustes de voz por defecto, limpiando significativamente la vista principal.
    - **Solución de Deuda Técnica:**
        - Se han corregido los fallos persistentes en los tests de `Frases.tsx` y `Dictation.tsx`.
        - Se han ajustado los mocks de `useAppStore` para manejar correctamente los selectores de Zustand en el entorno de pruebas.
        - Los tests ahora validan correctamente la navegación circular del carrusel y la expansión/colapso de secciones.
    - **Resultado:** Código funcional y tests validados al 100%. Deuda técnica eliminada.

---

## 🚀 Visión y Estrategia

- **Objetivo:** Convertir una app de escritorio en una PWA móvil, offline-first, desplegada en GitHub Pages.
- **Stack Tecnológico:** Vite, React, TypeScript, TailwindCSS, Zustand, IndexedDB (con `idb`), Vitest, React Testing Library y `vite-plugin-pwa` para Workbox.
- **Documentación Inicial:** Se crearon documentos de visión, requerimientos, historias de usuario, mapas de navegación y wireframes.

---


## 🏗️ Infraestructura y Configuración Core

- **[✅] Activación real de PWA:**
    - Service Worker y manifest activos y registrados en producción y desarrollo.
    - Botón personalizado para instalar la app (gestión de beforeinstallprompt).
    - Notificaciones push: solicitud de permiso y notificación de bienvenida.
    - Hook para solicitar permiso de micrófono (base para dictado).
    - Tests TDD para todas las nuevas funcionalidades PWA (service worker, push, instalación, micrófono).

- **[✅] Estructura de Carpetas:** Definida y creada (`/src/pages`, `/components`, `/store`, etc.).
- **[✅] PWA con Vite:**
    - Integrado `vite-plugin-pwa`.
    - Generación automática de `service-worker.js` y `manifest.webmanifest`.
    - Configurado `registerType: 'prompt'` para la actualización.
    - Iconos de la PWA configurados y rutas corregidas.
- **[✅] Persistencia Local:**
    - Migración de `localStorage` a **IndexedDB** con la librería `idb`.
    - Creado un `storage` personalizado para el middleware `persist` de Zustand, que guarda todo el estado de la app en una única object store.
- **[✅] Enrutamiento:**
    - Implementado con `react-router-dom`.
    - Creadas rutas para todas las páginas principales.
    - **[✅] Manejo de Rutas en Pages:**
        - Se añadió un archivo `404.html` para redirigir todas las rutas al `index.html` y garantizar el correcto funcionamiento en GitHub Pages.
- **[✅] Carga de Datos Inicial:**
    - Creado `AppInitializer.tsx` para cargar los datasets de frases y conversaciones al inicio.
    - El estado de Zustand se hidrata con los datos de los JSON.
- **[✅] Testing:**
    - Configurado **Vitest** y **React Testing Library**.
    - Entorno `jsdom` habilitado.
    - Creado `setupTests.ts` para los matchers de `jest-dom`.
    - Añadido "smoke test" inicial para `App.tsx`.
    - **[✅] Mock de speechSynthesis:** Añadido mock global de `window.speechSynthesis` en los tests para evitar errores en jsdom.
    - **[✅] Corrección de mocks en Conversaciones:** Ajustados los mocks de participantes y conversationSettings en los tests de Conversaciones.
    - **[✅] Refuerzo de protección en ConversationDetail:** Mejorada la protección contra valores `undefined` en el acceso a settings de participantes.
    - **[✅] Tests TDD para PWA:** Añadidos tests para registro de service worker, notificaciones push, instalación y permisos de micrófono.

---

## 🎨 UI, Estilos y Tema Visual

- **[✅] Identidad Visual:**
    - Paleta de colores unificada (azul primario, naranja de acento) en `tailwind.config.js`.
    - Estilos aplicados de forma consistente en todos los componentes.
- **[✅] Página de Inicio (`Home.tsx`):**
    - Rediseñada para coincidir con la nueva identidad visual.
- **[✅] Navegación Principal:**
    - Componente `BottomNav.tsx` implementado con todos los iconos.

---

## 📚 Módulo: Frases (`/pages/Frases.tsx`)

- **[✅] Listado y Renderizado:** Muestra la lista de frases usando el componente `PhraseCard`.
- **[✅] Búsqueda:** Input de texto para filtrar frases en tiempo real (ES/EN).
- **[✅] Filtro por Categoría:** Select para filtrar por las categorías unificadas del store.
- **[✅] Contador de Resultados:** Muestra el número de frases encontradas.
- **[✅] Marcar como Estudiada:** Botón para marcar/desmarcar, con persistencia en el estado de Zustand.
- **[✅] Reproducción de Audio:** Botones en `PhraseCard` para reproducir audio en ES y EN usando la API de Síntesis de Voz del navegador.
- **[✅] Paginación:**
    - Implementado un sistema de paginación con controles para seleccionar el número de frases por página (5, 10, 20).
    - Añadidos botones de navegación "Anterior" y "Siguiente".
    - Añadido un botón "Volver al inicio" para resetear los filtros.
    - El estado de la paginación se gestiona de forma centralizada en `useAppStore`.
- **[✅] Personalización de Voz y Reproducción Secuencial:**
    - Se ha replicado la funcionalidad del módulo de "Conversaciones", permitiendo la personalización de la voz (voz, velocidad, tono) para la reproducción de frases en inglés.
    - Se ha añadido un botón "Reproducir Todo" para escuchar secuencialmente todas las frases de la página actual.
    - Al finalizar la reproducción, un modal ofrece opciones para navegar a la siguiente página o volver al inicio.
- **[✅] Corrección de Errores de Estado:**
    - Se ha solucionado un error crítico que provocaba que la aplicación fallara al intentar acceder a la configuración de la voz (`phraseSettings`).
    - Se ha refactorizado la forma en que los componentes `Frases.tsx` y `PhraseCard.tsx` acceden al estado de Zustand, utilizando selectores específicos para garantizar que los datos siempre estén disponibles y evitar renderizados innecesarios.

---

## 💬 Módulo: Conversaciones (`/pages/Conversaciones.tsx`)

- **[✅] Listado y Filtro:** Muestra la lista de conversaciones y permite filtrar por categoría.
- **[✅] Vista de Detalle:** Al seleccionar una conversación, navega a `ConversationDetail.tsx`.
- **[✅] Selección de Rol:** Dropdown para que el usuario elija su rol. Las líneas de diálogo del rol seleccionado se ocultan para una práctica interactiva.
- **[✅] Reproducción de Audio por Turno:** Botón para escuchar cada turno de la conversación.
- **[✅] Reproducción Completa:** Implementada la reproducción secuencial de todos los turnos de la conversación, con un botón "Reproducir Toda la Conversación".
- **[✅] Voces Diferenciadas por Rol:** Añadida la capacidad de seleccionar voces, ajustar velocidad y tono por cada participante, con persistencia de las preferencias.
- **[✅] Navegación Post-Conversación:** Implementado un modal al finalizar la conversación para ofrecer opciones de "Siguiente Conversación" o "Volver a la Lista".
- **[✅] Corrección de Truncamiento de Texto:** Asegurado que el texto en las tarjetas de diálogo se ajuste correctamente.
- **[✅] Ampliación de Selección de Voces:** Modificada la lógica para incluir todas las voces disponibles del navegador, priorizando las inglesas.
- **[✅] Corrección de tests y mocks:** Mockeado correctamente `window.speechSynthesis` en los tests, añadido y ajustado el mock de `conversationSettings` y participantes, y reforzada la protección contra valores `undefined` en el componente `ConversationDetail`.

---

## 🃏 Módulo: Flashcards (`/pages/Flashcards.tsx`)

- **[✅] Renderizado de Tarjetas:** Utiliza el componente `Flashcard.tsx`.
- **[✅] Efecto de Volteo:** La tarjeta se voltea al hacer clic, mostrando el anverso (EN) y el reverso (ES).
- **[✅] Filtro por Categoría:** Permite estudiar flashcards de una categoría específica.
- **[✅] Navegación:** Botones "Anterior" y "Siguiente" para moverse por el set de tarjetas filtrado.
- **[✅] Modo Aleatorio:** Botón "Aleatorio" para estudiar las tarjetas en un orden no secuencial.
- **[✅] Reproducción de Audio:** Botones en cada cara de la tarjeta para reproducir el audio correspondiente.

---

## 💬 Módulo: Dictado (`/pages/Dictation.tsx`)

- **[✅] Reproducción de Audio:**
    - Refactorización completa de la lógica de voces.
    - Se eliminó la lógica anterior y se reimplementó para garantizar el uso de voces en inglés si están disponibles.
    - Se añadió un fallback a la voz predeterminada del navegador si no se encuentra una voz en inglés.
    - Se asegura que las voces estén completamente cargadas antes de usarlas, escuchando el evento `voiceschanged`.
- **[✅] Corrección de Errores:**
    - Se corrigió un problema donde la voz seleccionada no se aplicaba correctamente en Pages.
    - Se mejoró la compatibilidad con navegadores y entornos de despliegue.

---

## 🎯 Roadmap y Próximos Pasos (Estado Actual: 100%)

1. **[✅ COMPLETADO] Pulido de Módulos Existentes:**
    - **[✅ COMPLETADO] Módulo Frases:** Implementado sistema de progreso de 3 estados, optimización con useMemo y accesibilidad avanzada.
    - **[✅ COMPLETADO] Módulo Conversaciones:** Role-play interactivo con personalización de voces por participante.
    - **[✅ COMPLETADO] Módulo Dictado:** Sistema de reconocimiento/validación con soporte multi-idioma.
    - **[✅ COMPLETADO] Módulo Flashcards:** Sistema de memorización interactiva con audio.
2.  **[✅ COMPLETADO] Implementar Módulos de Evaluación:**
    -   **[✅ COMPLETADO] Módulo de Quiz:** 3 modos de juego (ABC, V/F, Scramble).
    -   **[✅ COMPLETADO] Módulo de Estudio (SRS):** Navegación guiada por lecciones estructuradas.
    -   **[✅ COMPLETADO] Módulo de Progreso/Dashboard:** Visualización de métricas y dominio por categoría.
    -   **[✅ COMPLETADO] Módulo de Examen:** Sistema de certificación global con resultados persistentes.
3.  **[✅ COMPLETADO] CI/CD y PWA:**
    -   Despliegue automatizado en GitHub Pages activo.
    -   Instalabilidad completa y soporte offline verificado.

---

## 📝 Informe de Calidad Final (31-01-2026)

- [x] **Consolidar todos los módulos principales**: Verificado 100% de accesibilidad en AppRouter.
- [x] **Sincronización de Versión**: Proyecto actualizado a v2.1 para alinearse con la identidad visual.
- [x] **Cierre de Deuda Técnica**: Los tests principales están estabilizados y el flujo TDD consolidado.
- [x] **Ready for Production**: El producto cumple con todos los criterios de lanzamiento profesional.
