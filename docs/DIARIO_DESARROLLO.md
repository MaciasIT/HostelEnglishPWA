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

## Día 6 – Inicialización de Repositorio Git
- Se inicializó un repositorio Git local en el directorio del proyecto.
- Se realizó el primer commit con la configuración inicial del proyecto y los cambios de PWA.

## Día 7 – Migración de Persistencia a IndexedDB
- Se creó el directorio `src/db`.
- Se implementó `src/db/index.ts` para gestionar la base de datos IndexedDB utilizando la librería `idb`.
- Se configuró una única object store (`appState`) en IndexedDB para almacenar el estado persistente de la aplicación.
- Se modificó `src/store/useAppStore.ts` para integrar el middleware `persist` de Zustand con el almacenamiento personalizado de IndexedDB.
- Se ajustaron las funciones `getItem`, `setItem` y `removeItem` del `storage` personalizado para serializar y deserializar el estado completo del store de Zustand y guardarlo/cargarlo en la object store `appState` de IndexedDB.

## Día 8 – Implementación y Estructuración del Módulo Frases
- Se crearon los directorios `src/components` y `src/hooks` para organizar los componentes y hooks del proyecto.
- Se implementaron los componentes `PhraseCard.tsx` y `BottomNav.tsx` en `src/components`.
- Se implementaron los hooks `useSpeech.ts` y `useAudio.ts` en `src/hooks`.
- Se modificó `src/pages/Frases.tsx` para integrar la lógica de carga de frases, búsqueda, filtrado, reproducción de audio (TTS y archivos) y la funcionalidad de marcar frases como estudiadas, utilizando los nuevos componentes y hooks, así como el estado global de Zustand.

## Día 9 – Corrección de Configuración PWA y Estructura de Iconos
- Se identificaron y corrigieron los problemas de registro del Service Worker (MIME type incorrecto) y los errores 404 de los iconos PWA.
- Se añadió `devOptions: { enabled: true }` al plugin `VitePWA` en `vite.config.ts` para asegurar la generación del Service Worker en desarrollo.
- Se movieron los archivos placeholder de los iconos (`pwa-192x192.png`, `pwa-512x512.png`) al subdirectorio `public/icons`.
- Se actualizaron las rutas de los iconos en el `manifest` dentro de `vite.config.ts` para que apunten correctamente a `icons/pwa-192x192.png` y `icons/pwa-512x512.png`.

## Día 10 – Implementación Inicial del Módulo Conversaciones
- Se implementó el componente `ConversationList.tsx` en `src/components` para mostrar la lista de conversaciones.
- Se modificó `src/pages/Conversaciones.tsx` para integrar `ConversationList` y manejar la selección de conversaciones, mostrando una vista de detalle/interacción básica.

## Día 11 – Corrección de Registro de Service Worker y Manifest
- Se modificó `vite.config.ts` para cambiar `registerType` a `"prompt"` y asegurar la configuración adecuada de `workbox`.
- Se eliminó el bloque de registro manual del Service Worker en `src/main.tsx`, dejando que `vite-plugin-pwa` se encargue de la inyección del script de registro.
- Se eliminó el `manifest.json` estático en `public/` para evitar conflictos con el manifest generado dinámicamente.
- Se actualizó la referencia al manifest en `index.html` para que apunte a `/HostelEnglish/manifest.webmanifest`.

## Día 12 – Implementación del Enrutamiento de la Aplicación
- Se implementó `src/router/AppRouter.tsx` para definir las rutas de la aplicación utilizando `react-router-dom`.
- Se configuró el `basename` en el `Router` para `/HostelEnglish/` para el despliegue en GitHub Pages.
- Se definieron rutas para `Home`, `Frases`, `Conversaciones`, y placeholders para `Progreso`, `Flashcards`, `Quiz`, `Estudio`, `Examen` y `Dashboard`.

## Día 13 – Corrección de Errores de Desarrollo y Estructura de Páginas
- Se crearon los componentes de página faltantes (`Progreso.tsx`, `Flashcards.tsx`, `Quiz.tsx`, `Estudio.tsx`, `Examen.tsx`, `Dashboard.tsx`) en `src/pages` para resolver errores de importación en el enrutamiento.
- Se comentó temporalmente la propiedad `base` en `vite.config.ts` y se eliminó el `basename` del `Router` en `src/router/AppRouter.tsx` para solucionar problemas de Service Worker y manifest en el entorno de desarrollo.

## Día 14 – Implementación del Módulo de Conversaciones y Correcciones Finales
- Se añadió el estado `conversations` y la acción `loadConversations` en `src/store/useAppStore.ts` para cargar los datos de las conversaciones.
- Se creó `src/components/AppInitializer.tsx` para llamar a `loadFrases` y `loadConversations` al inicio de la aplicación.
- Se modificó `src/main.tsx` para usar `AppInitializer`.
- Se actualizó `src/pages/Conversaciones.tsx` para obtener las conversaciones del estado global y renderizar `ConversationList` o `ConversationDetail`.
- Se modificó `src/components/ConversationList.tsx` para recibir las conversaciones como prop y eliminar su lógica de carga interna.
- Se creó `src/components/ConversationDetail.tsx` para mostrar los turnos de una conversación y reproducir el audio (con fallback a TTS).
- Se actualizó `src/hooks/useAudio.ts` para incluir `audioSpeed`, fallback a TTS y cambiar a un *named export*.
- Se corrigió la importación de `useAudio` en `src/pages/Frases.tsx` para usar el *named import*.
- Se integraron todos los iconos de navegación en `src/components/BottomNav.tsx`.

---

## Próximos pasos
1. Migrar persistencia de **localStorage → IndexedDB (idb)**.  
2. Implementar **Conversaciones** (rol + turnos + audio).  
3. Iterar en **Flashcards, Quiz, Estudio, Examen y Dashboard**.  
4. Configurar **tests con Vitest + RTL**.  
5. CI/CD → GitHub Actions para tests + deploy automático en Pages.  

---

👉 Este diario se actualizará cada vez que avancemos con un módulo, decisión técnica o documentación nueva.