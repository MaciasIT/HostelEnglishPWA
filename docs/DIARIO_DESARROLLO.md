# 📖 Diario de Desarrollo – HostelInglésApp

*Última actualización: 24-09-2025*

Este documento sigue el desarrollo de la PWA HostelInglés. Está organizado por módulos para reflejar el estado actual de cada componente de la aplicación.

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
- **[✅] Carga de Datos Inicial:**
    - Creado `AppInitializer.tsx` para cargar los datasets de frases y conversaciones al inicio.
    - El estado de Zustand se hidrata con los datos de los JSON.
- **[✅] Testing:**
    - Configurado **Vitest** y **React Testing Library**.
    - Entorno `jsdom` habilitado.
    - Creado `setupTests.ts` para los matchers de `jest-dom`.
    - Añadido "smoke test" inicial para `App.tsx`.

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

---

## 💬 Módulo: Conversaciones (`/pages/Conversaciones.tsx`)

- **[✅] Listado y Filtro:** Muestra la lista de conversaciones y permite filtrar por categoría.
- **[✅] Vista de Detalle:** Al seleccionar una conversación, navega a `ConversationDetail.tsx`.
- **[✅] Selección de Rol:** Dropdown para que el usuario elija su rol. Las líneas de diálogo del rol seleccionado se ocultan para una práctica interactiva.
- **[✅] Reproducción de Audio por Turno:** Botón para escuchar cada turno de la conversación.
- **[✅] Reproducción Completa:** Botón "Reproducir todo" para escuchar la conversación entera de forma secuencial.

---

## 🃏 Módulo: Flashcards (`/pages/Flashcards.tsx`)

- **[✅] Renderizado de Tarjetas:** Utiliza el componente `Flashcard.tsx`.
- **[✅] Efecto de Volteo:** La tarjeta se voltea al hacer clic, mostrando el anverso (EN) y el reverso (ES).
- **[✅] Filtro por Categoría:** Permite estudiar flashcards de una categoría específica.
- **[✅] Navegación:** Botones "Anterior" y "Siguiente" para moverse por el set de tarjetas filtrado.
- **[✅] Modo Aleatorio:** Botón "Aleatorio" para estudiar las tarjetas en un orden no secuencial.
- **[✅] Reproducción de Audio:** Botones en cada cara de la tarjeta para reproducir el audio correspondiente.

---

## 🎯 Roadmap y Próximos Pasos

1.  **[✅ COMPLETADO] Pulido de Módulos Existentes:**
    -   Se ha completado la **base de testing** para los módulos principales.
    -   **[✅ COMPLETADO] Módulo Frases:**
        -   Implementado sistema de progreso de 3 estados (No estudiada -> Estudiada -> Aprendida).
        -   Corregido el problema de categorías duplicadas en el filtro.
        -   Refactorizada la lógica de filtrado con `useMemo` para optimizar el rendimiento.
        -   Corregida la accesibilidad del filtro de categorías.
    -   **[🧊 PENDIENTE] Módulo Conversaciones:** Revisión de código, UI/UX y accesibilidad.
    -   **[🧊 PENDIENTE] Módulo Flashcards:** Revisión de código, UI/UX y accesibilidad.
2.  **[🧊 PENDIENTE] Implementar Módulos Restantes:**
    -   Módulo de **Quiz**.
    -   Módulo de **Estudio (SRS)**.
    -   Módulo de **Progreso/Dashboard**.
    -   Módulo de **Examen**.
3.  **[🧊 PENDIENTE] CI/CD:**
    -   Configurar GitHub Actions para ejecutar los tests en cada push.
    -   Automatizar el despliegue a GitHub Pages en cada merge a `main`.
