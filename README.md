# HostelInglés PWA

![CI/CD](https://github.com/m1txel/HostelEnglishPWA/actions/workflows/deploy.yml/badge.svg)
[![Version](https://img.shields.io/badge/version-2.2.0-orange?style=for-the-badge)](https://github.com/m1txel/HostelEnglishPWA/releases)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/agpl-3.0)

**HostelInglés** es una Progressive Web App (PWA) interactiva, diseñada para ayudar al personal de hostelería a dominar el inglés esencial para su trabajo diario.

➡️ **[Visita la Demo (m1txel)](https://m1txel.github.io/HostelEnglishPWA/)** ⬅️

➡️ **[Visita la Demo (maciasit)](https://maciasit.github.io/HostelEnglishPWA/)** ⬅️

---

## 🌍 Idiomas y Soporte Fonético (Euskera)
Recientemente hemos implementado el soporte completo para **Euskera**. 
Dado que la mayoría de dispositivos carecen de un motor de síntesis de voz (TTS) nativo en Euskera, hemos desarrollado un **Motor Híbrido de Traducción Fonética**. Este sistema engaña inteligentemente a los motores de voz (como las voces en Español) transformando la escritura vasca (tx, ts, tz, z, x) a su equivalente fonético. Esto garantiza que todos los usuarios puedan escuchar una pronunciación excelente y realista del euskera, sin necesidad de instalar paquetes de idioma adicionales.

⚠️ **Ayuda necesaria**: Al ser una implementación reciente, buscamos la colaboración de **personas nativas en euskera** para seguir validando y mejorando el dataset y los matices fonéticos. ¡Tu ayuda es bienvenida!

---

## ✨ Funcionalidades Clave

-   🗣️ **Módulo de Frases**: Filtra frases por categoría y elige el tamaño de tu sesión de estudio.
-   💬 **Módulo de Conversaciones**: Simula diálogos reales (check-in, bar, etc.) y practica tu rol.
-   ✍️ **Módulo de Dictado**: Pon a prueba tu comprensión auditiva y escritura con reconocimiento de voz.
-   🃏 **Módulo de Flashcards**: Memoriza vocabulario de forma rápida con tarjetas interactivas.
-   🧠 **Módulo de Quiz**: Gamificado con **Mundos (categorías)**, niveles de 10 preguntas, sistema de 3 vidas y rachas de aciertos.
-   🎓 **Módulo de Examen**: Certifica tus habilidades con resultados detallados y revisión de errores en modal.
-   ⚙️ **Configuración de Voz**: Personaliza la voz, velocidad y tono.
-   📊 **Progreso Persistente**: Dashboard visual con tus estadísticas guardadas en IndexedDB.
-   🖥️ **Optimización Desktop**: Interfaz compacta para PC (escala 80%) para una mejor visibilidad sin scroll excesivo.
-   📱 **Instalable (PWA)**: Añade la aplicación a tu pantalla de inicio y úsala sin conexión.

## 🚀 Arquitectura y Diseño

La aplicación sigue una arquitectura basada en componentes con React, promoviendo la reutilización y la modularidad.

-   **Gestión de Estado**: Se utiliza [Zustand](https://github.com/pmndrs/zustand) para una gestión eficiente y reactiva.
-   **Enrutamiento**: [React Router](https://reactrouter.com/) gestiona las diferentes vistas.
-   **Estilado**: [Tailwind CSS](https://tailwindcss.com/) para un diseño responsivo "Mobile First".
-   **PWA**: Configurada con [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) para capacidades offline.

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

## 📂 Estructura del Proyecto

```
/
├── public/              # Archivos estáticos, iconos, manifest y datasets
├── src/
│   ├── components/      # Componentes de UI reutilizables
│   ├── db/              # Lógica de persistencia (IndexedDB)
│   ├── hooks/           # Hooks personalizados
│   ├── pages/           # Vistas principales de cada módulo
│   ├── store/           # Estado global (Zustand)
│   └── utils/           # Funciones de utilidad
└── ...
```

## 🧪 Estrategia de Testing

Se ha implementado una estrategia de pruebas robusta utilizando **Vitest** y **React Testing Library**. Priorizamos el enfoque **TDD** (Test-Driven Development) para asegurar la calidad de cada nueva funcionalidad.

---
Para un historial detallado de las decisiones técnicas y mejoras implementadas, consulta el [Diario de Desarrollo](docs/DIARIO_DESARROLLO.md).

## 📄 Licencia

Este proyecto está bajo la licencia **GNU Affero General Public License v3.0 (AGPL-3.0)**. Esta licencia garantiza que el software siga siendo libre y abierto para todos los usuarios, incluso cuando se utiliza a través de una red.

Puedes leer el texto completo en el archivo [LICENSE](./LICENSE).