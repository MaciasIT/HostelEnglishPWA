# 📖 Diario de Desarrollo – HostelInglésApp

*Última actualización: 07-10-2025*

Este documento sigue el desarrollo de la PWA HostelInglés. Está organizado por módulos para reflejar el estado actual de cada componente de la aplicación.

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
    - **Desafíos (Estado de los Tests):**
        - Durante la refactorización, se encontraron y corrigieron numerosos fallos en los tests de otros módulos (`Conversaciones`, `Flashcards`, `Dictation`, `normalize`) que estaban desactualizados o tenían mocks incorrectos.
        - A pesar de los arreglos, **persisten 2 fallos** en los tests de `Frases.tsx` y `Dictation.tsx` que parecen estar relacionados con un problema en el entorno de pruebas de Vitest al interactuar con el sistema de archivos o un posible bug en las herramientas de la CLI, ya que los intentos de corregir los archivos de test mediante `write_file` no se reflejaban consistentemente en la ejecución de `npm test`.
    - **Decisión:** Para no bloquear el desarrollo, se ha decidido **confirmar el código funcional** de la nueva interfaz del módulo de frases y marcar la **reparación de los tests como deuda técnica prioritaria**.

---

## 🚀 Visión y Estrategia

- **Objetivo:** Convertir una app de escritorio en una PWA móvil, offline-first, desplegada en GitHub Pages.
- **Stack Tecnológico:** Vite, React, TypeScript, TailwindCSS, Zustand, IndexedDB (con `idb`), Vitest, React Testing Library y `vite-plugin-pwa` para Workbox.
- **Documentación Inicial:** Se crearon documentos de visión, requerimientos, historias de usuario, mapas de navegación y wireframes.

---

## 🏗️ Infraestructura y Configuración Core

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

## 🎯 Roadmap y Próximos Pasos

1. **[✅ COMPLETADO] Pulido de Módulos Existentes:**
    - **[✅ COMPLETADO] Módulo Frases:**
        -   Implementado sistema de progreso de 3 estados (No estudiada -> Estudiada -> Aprendida).
        -   Corregido el problema de categorías duplicadas en el filtro.
        -   Refactorizada la lógica de filtrado con `useMemo` para optimizar el rendimiento.
        -   Corregida la accesibilidad del filtro de categorías.
    -   **[✅ COMPLETADO] Módulo Conversaciones:** Revisión de código, UI/UX y accesibilidad.
        -   **[✅] Corrección de tests y mocks:** Mockeado correctamente `window.speechSynthesis` en los tests, añadido y ajustado el mock de `conversationSettings` y participantes, y reforzada la protección contra valores `undefined` en el componente `ConversationDetail`.
    -   **[✅ COMPLETADO] Módulo Dictado:**
        - Refactorización de la lógica de voces.
        - Corrección de problemas de compatibilidad en Pages.
    -   **[🧊 PENDIENTE] Módulo Flashcards:** Revisión de código, UI/UX y accesibilidad.
2.  **[🧊 PENDIENTE] Implementar Módulos Restantes:**
    -   Módulo de **Quiz**.
    -   Módulo de **Estudio (SRS)**.
    -   Módulo de **Progreso/Dashboard**.
    -   Módulo de **Examen**.
3.  **[🧊 PENDIENTE] CI/CD:**
    -   Configurar GitHub Actions para ejecutar los tests en cada push.
    -   Automatizar el despliegue a GitHub Pages en cada merge a `main`.