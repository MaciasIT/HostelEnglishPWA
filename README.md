# HostelInglés PWA

![CI/CD](https://github.com/m1txel/HostelEnglishPWA/actions/workflows/deploy.yml/badge.svg)
[![Version](https://img.shields.io/badge/version-2.5.0-orange?style=for-the-badge)](https://github.com/m1txel/HostelEnglishPWA/releases)
[![Security](https://img.shields.io/badge/Security-Audit_Passed-green?style=for-the-badge&logo=shield)](./AUDITORIA_360_HostelEnglishPWA.md)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/agpl-3.0)

**HostelInglés** es una Progressive Web App (PWA) interactiva de nivel profesional, diseñada para ayudar al personal de hostelería a dominar el inglés y el euskera esenciales para su trabajo diario.

➡️ **[Visita la Demo (m1txel)](https://m1txel.github.io/HostelEnglishPWA/)** ⬅️

➡️ **[Visita la Demo (maciasit)](https://maciasit.github.io/HostelEnglishPWA/)** ⬅️

---

## 🌍 Idiomas y Soporte Fonético (Euskera)
Hemos implementado una solución de vanguardia para el **Euskera**. 
Dado que la mayoría de dispositivos carecen de un motor de síntesis de voz (TTS) nativo en Euskera, hemos desarrollado un **Motor Híbrido de Traducción Fonética**. Este sistema transforma dinámicamente la escritura vasca (tx, ts, tz, z, x) a su equivalente fonético para el motor de voz en español. El resultado es una pronunciación realista y excelente del euskera sin necesidad de descargas adicionales.

---

## ✨ Funcionalidades Clave

-   📊 **Dataset Premium (640+ frases)**: Un corpus lingüístico masivo y saneado que cubre Recepción, Bar, Restaurante, Limpieza, Mantenimiento y más.
-   🗣️ **Módulo de Frases**: Sesiones de estudio personalizadas (10, 25 o modo maratón) con audio secuencial.
-   💬 **Módulo de Conversaciones**: 90+ diálogos interactivos de nivel profesional (A2/B1) que incluyen gestión de conflictos y alérgenos.
-   ✍️ **Módulo de Dictado**: Reconocimiento de voz en tiempo real para validar tu pronunciación y escritura.
-   🧠 **Módulo de Quiz Gamificado**: Sistema de "Mundos", 3 vidas, rachas de aciertos y niveles progresivos.
-   🎓 **Certificación de Examen**: Evalúa tus habilidades con reportes detallados y revisión inteligente de errores.
-   📱 **Experiencia Mobile-First (PWA)**: Barra de navegación inferior, feedback háptico, notificaciones Toast y soporte 100% offline.
-   🖥️ **Optimización Desktop**: Interfaz compacta (escala 80%) diseñada para la máxima productividad en PC.

---

## 🏗️ Arquitectura y Calidad de Código

-   **Frontend**: React con **TypeScript Strict Mode** para una seguridad total.
-   **Arquitectura**: [Feature-Based Architecture](https://feature-sliced.design/docs/get-started/tutorial). Lógica modularizada por dominios funcionales.
-   **Gestión de Estado**: **Zustand con Slices**, garantizando escalabilidad y el cumplimiento del principio de responsabilidad única (SRP).
-   **Persistencia**: IndexedDB para un almacenamiento de progreso robusto y persistente en el dispositivo.
-   **Accesibilidad (A11y)**: Cumplimiento de estándares WCAG AA, con navegación por teclado optimizada y roles ARIA completos.

## 🛠️ Stack Tecnológico

| Área | Tecnología |
|---|---|
| **Core** | React 18 + TypeScript (Strict) |
| **Build Tool** | Vite 7 |
| **Estilos** | Tailwind CSS 3 (Design Tokens) |
| **Estado** | Zustand 4 (Sliced) |
| **Animaciones** | Framer Motion |
| **PWA & Offline** | vite-plugin-pwa (Workbox) + idb |
| **Testing** | Vitest + React Testing Library |

---
Para un historial detallado de las decisiones técnicas y hitos de desarrollo, consulta el [Diario de Desarrollo](docs/DIARIO_DESARROLLO.md).

## 📄 Licencia

Este proyecto está bajo la licencia **GNU Affero General Public License v3.0 (AGPL-3.0)**. 

---
*Desarrollado con ❤️ por Michel Macias y Nex-OS.*
