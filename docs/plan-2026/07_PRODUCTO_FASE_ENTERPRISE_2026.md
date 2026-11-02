# HostelEnglish PWA — Especificación de Producto: Fase Enterprise & Shift-Readiness 2026

**Autor:** Asesoría de Producto / Project Manager (Antigravity)  
**Fecha:** 2026-11-02  
**Versión de destino:** v2.7.0 Enterprise  
**Destinatario:** Michel Macias — Product Owner & Enjambre de Agentes  

---

## 1. Visión Estratégica & Justificación de Negocio

Tras haber consolidado el 100% de las fases fundacionales (Stack React 19, Design System Cyber-Hospitality, IA y Audio On-Device, FSRS-6, Roleplays procedurales y Hardening móvil exhaustivo), HostelEnglish se encuentra en una posición inmejorable para dar el salto de **herramienta de estudio individual** a **estándar de capacitación y certificación profesional para el sector hotelero y gastronómico**.

### Propuesta de Valor 2026-Plus:
1. **Shift-Readiness (Preparación de Turno Inmediata):**  
   El personal de sala, barra y recepción no estudia en escritorios; estudia en el trayecto en transporte público o en los 5 minutos previos a abrir el servicio. La app debe ofrecer accesos directos instantáneos (PWA Shortcuts), badges de repaso pendientes en el icono del móvil y un **Modo Hora Punta (Rush Hour)** con simulación de ruido ambiental real.
2. **Audio Portfolio & Credenciales Verificables:**  
   Los trabajadores hosteleros necesitan demostrar su nivel oral real a empleadores y directores de hotel. La app incorporará un portafolio de audio local con las mejores intervenciones orales del alumno y credenciales verificables con estándar OpenBadges.
3. **Especialización de Alto Valor (Coctelería, Enología y Alérgenos Críticos):**  
   Los puestos de mayor propina y remuneración exigen vocabulario muy técnico de vinos, coctelería internacional y protocolos estrictos de alérgenos y contaminación cruzada.
4. **Sincronización P2P Zero-Knowledge:**  
   Transferencia de progreso del móvil a la tablet o PC del hotel mediante código QR cifrado, manteniendo la filosofía estricta de privacidad y coste cero de servidor (Zero-Cloud).

---

## 2. Mapa de Épicas y Backlog de Tarjetas

```
┌────────────────────────────────────────────────────────────────────────┐
│                   FASE ENTERPRISE & SHIFT-READINESS                     │
├────────────────────────────────┬───────────────────────────────────────┤
│ [PM-01] PWA Shortcuts & Badge  │ [PM-02] Modo Rush Hour & AudioContext │
│ [PM-03] Corpus Coctelería/Vino │ [PM-04] Portafolio de Voz & Badges    │
│ [PM-05] Sync P2P Zero-Knowledge│ [PM-06] Dashboard Auditoría B2B      │
│ [PM-07] QA Destructivo & Caos  │                                       │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 3. Detalle de Épicas

### Épica 1: [PM-01] PWA Shortcuts y Badging API de Repaso
- **Problema:** Abrir la app y navegar hasta el repaso diario requiere 3 toques.
- **Solución:**
  - Configurar `shortcuts` en `manifest.webmanifest`:
    1. *Roleplay Rápido* (`/roleplay`)
    2. *Repaso FSRS* (`/frases?tab=due`)
    3. *Reto del Día* (`/roleplay?reto=cortesia`)
  - Integrar `navigator.setAppBadge(count)` para reflejar en el icono de la pantalla de inicio del smartphone el número de frases que vencen hoy en FSRS-6.

### Épica 2: [PM-02] Modo "Hora Punta" (*Rush Hour*) y Simulación Acústica de Sala
- **Problema:** Practicar en silencio no prepara para la realidad de una sala llena con murmullo, platos sonando o timbres de comanda.
- **Solución:**
  - Sintetizador de ambiente acústico en Web Audio API (`AudioContext`) con toggle de ruido blanco/cafetería ajustable en volumen (10%, 25%, 50%).
  - Modo contrarreloj de 2 minutos: responder a 5 comandas o quejas rápidas manteniendo fórmulas de cortesía profesional.

### Épica 3: [PM-03] Expansión de Corpus: Coctelería de Autor, Sumillería y Alérgenos
- **Problema:** Falta vocabulario especializado para restaurantes gastronómicos, coctelerías de autor y hoteles boutique.
- **Solución:**
  - 120 nuevas frases de alto nivel: notas de cata de vinos (tánico, afrutado, mineral, barrica, maridaje), preparación de cócteles (dry shake, double strain, smoked, rimmed), y anafilaxia/celiaquía estricta.
  - 10 nuevos escenarios de roleplay procedurales en estas áreas.

### Épica 4: [PM-04] Portafolio de Pronunciación y Credencial Verificable
- **Problema:** El diploma actual solo valida un código alfanumérico estático.
- **Solución:**
  - Grabación opcional de las 3 intervenciones orales más sobresalientes del alumno almacenadas en IndexedDB (`audio/webm` o `audio/ogg`).
  - Vista de "Mi Portafolio de Voz" con reproductor accesible.
  - Metadatos JSON-LD estructurados para certificados según estándar OpenBadges 3.0 / Europass.

### Épica 5: [PM-05] Sincronización P2P Zero-Knowledge (Respaldo QR)
- **Problema:** Al cambiar de teléfono o usar la PWA en el ordenador, el usuario pierde su racha y progreso.
- **Solución:**
  - Generador de payload de sincronización comprimido (JSON -> Gzip -> Base64) expuesto en un código QR dinámico.
  - Escáner con cámara para transferir de dispositivo a dispositivo en 2 segundos sin servidores.
  - Opción de exportar/importar archivo de respaldo `.he-backup`.

### Épica 6: [PM-06] Dashboard B2B de Capacitación de Equipo
- **Problema:** Los encargados y directores de hotel no tienen forma de comprobar el nivel de inglés de su plantilla.
- **Solución:**
  - Vista agregada `/equipo`: el encargado puede importar los códigos de verificación de sus empleados y ver una matriz de competencias por departamento (% recepción certificada, puntos débiles colectivos en alérgenos).

### Épica 7: [PM-07] Auditoría de Caos y Pruebas Destructivas
- **Problema:** La adición de audio de fondo continuo y almacenamiento de blobs de audio puede degradar el rendimiento o la memoria.
- **Solución:**
  - Pruebas destructivas de memoria en IndexedDB, fugas de `AudioNode` y stress-test de renderizado de QR masivos.
