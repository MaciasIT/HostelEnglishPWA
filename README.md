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
-   ✍️ **Módulo de Dictado**: Pon a prueba tu comprensión auditiva y escritura transcribiendo las frases que escuchas.
-   🃏 **Módulo de Flashcards**: Memoriza vocabulario de forma rápida y efectiva con tarjetas interactivas.
-   ⚙️ **Configuración de Voz**: Personaliza la voz, velocidad y tono para adaptar la experiencia de aprendizaje.
-   📊 **Progreso Persistente**: Tu progreso se guarda localmente en tu dispositivo gracias a IndexedDB.
-   📱 **Instalable (PWA)**: Añade la aplicación a la pantalla de inicio de tu móvil y úsala sin conexión.

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
│   ├── db/              # Lógica de interacción con IndexedDB
│   ├── hooks/           # Hooks personalizados (useSpeech, useAudio...)
│   ├── pages/           # Componentes de página para cada módulo (Frases, Home...)
│   ├── router/          # Configuración de React Router
│   ├── store/           # Store global de Zustand (useAppStore)
│   └── utils/           # Funciones de utilidad (normalize, etc.)
└── ...
```

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

## Características PWA

- Soporte completo para Service Worker y modo offline (activado con vite-plugin-pwa).
- Manifest.json y pantalla de instalación personalizada (botón Instalar app).
- Notificaciones push: solicita permiso y muestra notificación de bienvenida.
- Permiso de micrófono: hook preparado para futuras funciones de dictado.
- Tests TDD para todas las nuevas funcionalidades PWA.

Para un historial detallado de las decisiones técnicas, problemas resueltos y mejoras implementadas, consulta el [Diario de Desarrollo](docs/DIARIO_DESARROLLO.md).

3.  **Inicia el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    ¡La aplicación estará disponible en `http://localhost:5173`!

## 🧪 Pruebas

Para ejecutar la suite de tests y verificar la integridad del código, usa:

```bash
npm test
```

> **⚠️ Advertencia de Estado Actual:**
> Actualmente, hay 2 tests fallando de forma intermitente en los módulos de `Frases` y `Dictado`. Esto es una **deuda técnica conocida** y está pendiente de ser solucionada.

## 🚢 Despliegue

El despliegue a GitHub Pages está **totalmente automatizado** con GitHub Actions. Cada vez que se hace un `push` o `merge` a la rama `main`, el workflow se dispara, ejecuta los tests, construye la aplicación y la despliega.
