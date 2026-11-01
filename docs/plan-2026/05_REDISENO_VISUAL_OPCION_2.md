# [Fase-UI-2026] Rediseño Visual Completo: Opción 2 Cyber-Hospitality & Tech

## Contexto y Decisión de Diseño
El usuario (Michel) y su familia han seleccionado formalmente la **Opción 2: «Cyber-Hospitality & Tech»** como la nueva identidad visual y estética de **HostelEnglish PWA 2026**.
La app debe dejar atrás la estética estática y azul oscura genérica anterior y transmitir un salto visual contemporáneo, ágil y de alto impacto (estilo Duolingo Pro / Linear / Raycast adaptado a hostelería moderna).

## Requerimientos de Implementación

### 1. Tokens de Diseño y Paleta Global (`src/styles/index.css`)
- **Fondo base (`--ds-background`):** `#090D12` (negro carbón mate profundo).
- **Superficies (`--ds-surface`, `--ds-surface-elevated`):** `#111720` / `#16202C` con frosted glass y bordes translúcidos (`rgba(255, 255, 255, 0.08)`).
- **Acento de marca (`--color-accent`):** Reemplazar el naranja anterior por **Verde Esmeralda Flúor / Menta Eléctrico (`#10B981`)** con hover (`#34D399`) y resplandor suave (`rgba(16, 185, 129, 0.35)`).
- **Contraste WCAG AAA:** `--ds-on-accent: #022c22` (garantiza ratio > 7:1 sobre el verde brillante).
- **Anillo de foco (`--ds-focus-ring`):** `#10B981`.

### 2. Rediseño Completo de la Portada (`src/pages/Home.tsx`)
- **Hero contemporáneo de alto impacto:**
  - Badge superior luminoso: `✨ HostelEnglish 2026 Pro · On-Device AI & Audio`.
  - Título con gradiente esmeralda a cian: *«HostelEnglish 2026: El inglés y euskera de hostelería con IA en tu dispositivo»*.
  - Botón principal de acción con gradiente esmeralda (`bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/25`).
- **Sustitución de la imagen estática vieja (`pwa-512x512.png`):**
  - Integrar en el Hero un escaparate visual interactivo y dinámico:
    - Widget de racha diaria: `🔥 14 DÍAS`.
    - Simulador de conversación Roleplay (Sarah: *"Good evening, is my room ready?"* / Respuesta con botón de micrófono).
    - Anillo de calificación de voz circular con forma de onda: `98% EXCELLENT!`.
- **Especialidades por Departamento:**
  - 4 tarjetas modernas con accesos directos (*Sala & Comedor*, *Barra & Coctelería*, *Recepción* y *Cocina*).
- **Métricas 2026:**
  - `100% On-Device (Zero Server Lag)` · `Algoritmo FSRS-6` · `20+ Escenarios Roleplay` · `Certificaciones QR`.

### 3. Ajustes de UI en Dashboard y Componentes de Navegación
- Sincronizar badges de racha en `src/features/dashboard/components/DailyChallengeCard.tsx` y `Dashboard.tsx`.
- Ajustar acentos en `TopNav.tsx`, `SideNav.tsx` y `BottomNav.tsx` para una estética homogénea en toda la PWA.

### 4. Criterios de Aceptación y Calidad (Quality Gates)
- `npx tsc -b` debe compilar limpio con 0 errores.
- `npm run test:run` debe pasar los 507 tests al 100%.
- `npm run build` debe generar el bundle de producción sin fallos.
