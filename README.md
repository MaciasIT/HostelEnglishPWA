# HostelInglésApp

PWA de aprendizaje de inglés para hostelería.

## Tecnologías Utilizadas

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Zustand](https://img.shields.io/badge/zustand-%2320232a.svg?style=for-the-badge&logo=zustand&logoColor=white) <!-- No official logo, using generic -->
![Vitest](https://img.shields.io/badge/vitest-%236E9AD6.svg?style=for-the-badge&logo=vitest&logoColor=white)
![Testing-Library](https://img.shields.io/badge/testing--library-E33332?style=for-the-badge&logo=testing-library&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=github-actions&logoColor=white)

## Arranque Rápido

Para poner en marcha el proyecto, sigue estos pasos:

```bash
npm install
npm run dev
```

## Datasets

Coloca tus datasets en `public/data/`:
- `hostelenglish_dataset_clean.json`
- `conversations_extended_v4.json`

## Notas de Desarrollo


## Características PWA

- Soporte completo para Service Worker y modo offline (activado con vite-plugin-pwa).
- Manifest.json y pantalla de instalación personalizada (botón Instalar app).
- Notificaciones push: solicita permiso y muestra notificación de bienvenida.
- Permiso de micrófono: hook preparado para futuras funciones de dictado.
- Tests TDD para todas las nuevas funcionalidades PWA.

Para un historial detallado de las decisiones técnicas, problemas resueltos y mejoras implementadas, consulta el [Diario de Desarrollo](docs/DIARIO_DESARROLLO.md).

> Este repo incluye páginas vacías para que el router compile sin errores.