# 📖 Diario de Desarrollo – HostelInglésApp

## Día 1 – Idea y visión inicial
- Partimos de una **app de escritorio previa** con módulos de aprendizaje de inglés para hostelería.  
- Nueva meta: llevarla a **PWA móvil**, instalable y usable offline, desplegada en **GitHub Pages**.  
- Decidimos documentar antes de escribir código.

**Documentos creados:**
- `Documento_Vision_HostelInglesApp.pdf` → resumen del producto, objetivos, público, diferenciadores.
- `Documentos_Requerimientos_HostelInglesApp.pdf` → alcance MVP, requisitos funcionales y no funcionales.
- `Documento_UserStories_HostelInglesApp.pdf` → historias de usuario del MVP.
- `Documento_UserStories_Extendidas_HostelInglesApp.pdf` → incluye Conversaciones, Flashcards, Quiz, Examen, Estudio, Dashboard.
- `Mapa_Navegacion_Texto_HostelInglesApp.pdf` y diagrama visual `.png`.
- `Wireframes_Texto_HostelInglesApp.pdf` → bocetos en texto de todas las pantallas.
- `Modulo_Conversaciones.pdf` y wireframes visuales → flujo detallado del módulo.

## Día 2 – Estructura y datasets
- Revisamos datasets (`hostelenglish_dataset_clean.json`, `conversations_extended_v4.json`) → válidos para la PWA.  
- Diseñamos la **estructura de carpetas profesional** (`src/pages`, `src/components`, `src/store`, `src/router`, etc.).  
- Creamos `Estructura_Final_HostelInglesApp.pdf` y `Roadmap_Tecnico_HostelInglesApp.pdf`.  

## Día 3 – Guías refinadas
- Refinamos guías v1:
  - **Diseño** → tokens de color, tipografía, spacing, componentes base, accesibilidad mínima.  
  - **Testing** → pirámide de pruebas, casos clave por módulo, integración en CI.  
  - **Offline** → Workbox (App Shell SWR, datasets y audios Cache First con LRU, persistencia IndexedDB, aviso de nueva versión).  
- Documento: `Guias_v1_Refinadas_HostelInglesApp.pdf`.

## Día 4 – Primer módulo: Frases
- Decidimos empezar con el **módulo Frases** como vertical slice.
- Implementación en ZIP:
  - `Frases.tsx` con listado, búsqueda, filtros, contador de resultados.  
  - `PhraseCard.tsx` con ES/EN, audio, marcar como estudiada/favorito.  
  - Hooks `useSpeech.ts`, `useAudio.ts` (TTS + fallback mp3).  
  - Estado global con `Zustand` (`useAppStore.ts`).  
  - Persistencia inicial con `localStorage` (migrable a IndexedDB).  
  - `BottomNav.tsx` con navegación principal.

## Día 5 – Configuración PWA
- Se instaló `vite-plugin-pwa` para facilitar la configuración de la PWA.
- Se modificó `vite.config.ts` para:
  - Añadir `base: '/HostelEnglish/'` para el despliegue en GitHub Pages.
  - Integrar el plugin `VitePWA` para la generación automática del `service-worker.js` y la configuración del `manifest.json`.
- Se crearon archivos placeholder para los iconos PWA (`pwa-192x192.png`, `pwa-512x512.png`) en el directorio `public`. **PENDIENTE: Reemplazar con imágenes reales.**
- Se registró el Service Worker en `src/main.tsx` para iniciar el proceso de cacheo y funcionalidad offline.

---

## Próximos pasos
1. Migrar persistencia de **localStorage → IndexedDB (idb)**.  
2. Implementar **Conversaciones** (rol + turnos + audio).  
3. Iterar en **Flashcards, Quiz, Estudio, Examen y Dashboard**.  
4. Configurar **tests con Vitest + RTL**.  
5. CI/CD → GitHub Actions para tests + deploy automático en Pages.  

---

👉 Este diario se actualizará cada vez que avancemos con un módulo, decisión técnica o documentación nueva.