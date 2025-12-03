# HostelInglés PWA

![CI/CD](https://github.com/m1txel/HostelEnglishPWA/actions/workflows/deploy.yml/badge.svg)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**HostelInglés** es una Progressive Web App (PWA) interactiva, diseñada para ayudar al personal de hostelería a dominar el inglés esencial para su trabajo diario. ¡Aprende, practica y mejora tu confianza!

➡️ **[Visita la Demo (m1txel)](https://m1txel.github.io/HostelEnglishPWA/)** ⬅️

➡️ **[Visita la Demo (maciasit)](https://maciasit.github.io/HostelEnglishPWA/)** ⬅️

---

## ✨ Funcionalidades Clave

-   🗣️ **Módulo de Frases**: Filtra frases por categoría y elige el tamaño de tu sesión de estudio (10, 25 o todas) para un aprendizaje enfocado.
-   💬 **Módulo de Conversaciones**: Simula diálogos reales (check-in, bar, etc.) y practica tu rol.
-   ✍️ **Módulo de Dictado**: Pon a prueba tu comprensión auditiva y escritura transcribiendo las frases que escuchas. Incluye funcionalidad de reconocimiento de voz para una experiencia interactiva.
-   🃏 **Módulo de Flashcards**: Memoriza vocabulario de forma rápida y efectiva con tarjetas interactivas.
-   ⚙️ **Configuración de Voz**: Personaliza la voz, velocidad y tono para adaptar la experiencia de aprendizaje.
-   📊 **Progreso Persistente**: Tu progreso se guarda localmente en tu dispositivo gracias a IndexedDB, asegurando que no pierdas tu avance.
-   📱 **Instalable (PWA)**: Añade la aplicación a la pantalla de inicio de tu móvil y úsala sin conexión.
-   🔔 **Notificaciones Push**: Solicita permiso y muestra notificaciones de bienvenida, mejorando la interacción con el usuario.

## 🚀 Arquitectura y Diseño

La aplicación sigue una arquitectura basada en componentes con React, promoviendo la reutilización y la modularidad.

-   **Gestión de Estado**: Se utiliza [Zustand](https://github.com/pmndrs/zustand) para una gestión de estado global eficiente y escalable. Su diseño ligero y su curva de aprendizaje suave lo hacen ideal para manejar el estado de la aplicación de manera reactiva.
-   **Enrutamiento**: [React Router](https://reactrouter.com/) se emplea para la navegación declarativa dentro de la aplicación, gestionando las diferentes vistas de manera eficiente.
-   **Estilado**: [Tailwind CSS](https://tailwindcss.com/) se usa para un estilado utility-first, facilitando un desarrollo rápido de la UI y asegurando un diseño responsivo con un enfoque "Mobile First".
-   **PWA**: La aplicación está configurada como una Progressive Web App utilizando [vite-plugin-pwa](https://vite-pwa-org.netlify.app/). Esto permite capacidades offline, instalación en dispositivos y otras características de aplicaciones nativas. El `manifest.json` y el `service-worker.js` (gestionado por Workbox) aseguran la funcionalidad PWA.

## 🛠️ Stack Tecnológico

| Área                | Tecnología                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| **Framework**       | [React](https://reactjs.org/) con [TypeScript](https://www.typescriptlang.org/)                          |
| **Build Tool**      | [Vite](https://vitejs.dev/)                                                                            |
| **Estilos**         | [Tailwind CSS](https://tailwindcss.com/)                                                               |
| **Gestión de Estado** | [Zustand](https://github.com/pmndrs/zustand)                                                           |
| **Routing**         | [React Router](https://reactrouter.com/)                                                               |
| **Testing**         | [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)                    |
| **PWA & Offline**   | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (con Workbox) + [idb](https://github.com/jakearchibald/idb) |
| **CI/CD**           | [GitHub Actions](https://github.com/features/actions)                                                  |

## 📂 Estructura del Proyecto

Una descripción general de los directorios más importantes:

```
/
├── public/              # Archivos estáticos, iconos, manifest y datasets
├── src/
│   ├── components/      # Componentes de UI reutilizables (PhraseCard, SideNav...)
│   ├── db/              # Lógica de interacción con IndexedDB para persistencia de datos.
│   ├── hooks/           # Hooks personalizados (useSpeech, useAudio, useSpeechRecognition...) para lógica reutilizable.
│   ├── pages/           # Componentes de página para cada módulo (Frases, Dictation, Home...) que representan las vistas principales.
│   ├── router/          # Configuración de React Router para la navegación de la aplicación.
│   ├── store/           # Store global de Zustand (useAppStore) para la gestión del estado.
│   └── utils/           # Funciones de utilidad (normalize, shuffle, etc.) que proporcionan lógica auxiliar.
└── ...
```

## 🧪 Estrategia de Testing

Se ha implementado una estrategia de pruebas robusta utilizando **Vitest** como framework de pruebas y **React Testing Library** para la simulación del comportamiento del usuario y la aserción de la UI.

-   **Pruebas Unitarias y de Integración**: Se escriben tests para componentes críticos, páginas y la lógica de negocio (hooks, store), asegurando que cada parte de la aplicación funcione como se espera y se integre correctamente.
-   **Enfoque en el Comportamiento del Usuario**: React Testing Library fomenta la escritura de pruebas que se centran en cómo los usuarios interactúan con la aplicación, en lugar de en los detalles de implementación interna.
-   **Fiabilidad de las Pruebas**: Se prioriza la estabilidad de las pruebas para evitar fallos intermitentes. Esto incluye:
    -   Aislamiento de tests mediante la configuración específica dentro de cada caso de prueba.
    -   Uso de `cleanup` y `vi.clearAllMocks()` en los bloques `afterEach` para garantizar un estado limpio entre las ejecuciones de los tests.
    -   Manejo cuidadoso de mocks y asincronía en las pruebas de hooks (como `useSpeechRecognition`) para simular comportamientos de forma determinista.

## 🚀 Empezar

Sigue estos pasos para levantar el proyecto en tu máquina local.

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/m1txel/HostelEnglishPWA.git
    cd HostelEnglishPWA
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Inicia el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    ¡La aplicación estará disponible en `http://localhost:5173`!

## 🚢 Despliegue

El despliegue a GitHub Pages está **totalmente automatizado** con GitHub Actions. Cada vez que se hace un `push` o `merge` a la rama `main`, el workflow se dispara, ejecuta los tests, construye la aplicación y la despliega.

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si deseas mejorar el proyecto, considera los siguientes puntos:

-   **Reporting de Bugs**: Si encuentras un error, por favor, abre un issue detallado.
-   **Solicitudes de Características**: ¿Tienes una idea para una nueva funcionalidad? Abre un issue para discutirla.
-   **Pull Requests**: Para cambios de código, por favor, asegúrate de que tus tests pasen y añade nuevos tests si tu contribución lo requiere. Sigue las convenciones de Conventional Commits para tus mensajes de commit.

Para un historial detallado de las decisiones técnicas, problemas resueltos y mejoras implementadas, consulta el [Diario de Desarrollo](docs/DIARIO_DESARROLLO.md).