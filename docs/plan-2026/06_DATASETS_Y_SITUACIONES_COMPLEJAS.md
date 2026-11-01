# Dataset de situaciones hosteleras complejas y cortesía profesional

**Producto:** HostelEnglish PWA 2026  
**Versión:** 1.0 — especificación de producto  
**Estado:** Propuesta funcional para validación del Product Owner; no constituye aprobación de implementación  
**Audiencia:** producto, contenido, UX, IA y desarrollo de roleplay  
**Base:** `01_PRODUCTO_ROADMAP_2026.md`, `04_CAPA_IA_Y_AUDIO_2026.md` y `PLAN_MAESTRO_HOSTELENGLISH_2026.md`

---

## 1. Propósito y límites

Este documento convierte situaciones habituales de alta fricción en material estructurado para practicar inglés profesional en recepción, restaurante, bar, limpieza y operaciones. El objetivo pedagógico es que el alumno pueda **aclarar, reconocer el impacto, comunicar límites con tacto, proponer una acción realista y cerrar confirmando el siguiente paso**; no se evalúa que memorice una frase única.

El catálogo contiene **30 escenarios**, cada uno con rol, objetivo, apertura sugerida y reglas de ramificación. Las frases inglesas son ejemplos de práctica, no promesas de que el establecimiento pueda prestar un servicio, asumir un coste o conceder una compensación.

### Límites de seguridad y veracidad

- En alergias, celiaquía, contaminación cruzada, intoxicación, lesión, incendio o amenaza, el roleplay debe priorizar el procedimiento real del establecimiento y la seguridad sobre la cortesía o la continuidad de la conversación.
- El personal no debe asegurar que un plato es seguro si no ha confirmado ingredientes, manipulación y contaminación cruzada con cocina/protocolo. Si hay duda, debe decirlo claramente, detener la recomendación/servicio y escalar.
- En una emergencia real: activar el protocolo local, avisar al responsable y a los servicios de emergencia cuando corresponda. La aplicación no sustituye formación, asesoramiento médico, normativa alimentaria ni instrucciones del establecimiento.
- No inventar disponibilidad, políticas, causas, compensaciones, alérgenos, precios ni acciones ya realizadas. Si no se sabe, comprobar y volver con información confirmada.
- El roleplay es una simulación educativa, no una guía operativa legal. Los protocolos de seguridad y compensación reales deben configurarse y aprobarse por el establecimiento.

### Prioridad recomendada para el piloto

La recomendación de producto es pilotar cinco escenarios representativos de recepción, restaurante y seguridad alimentaria, alineados con el MVP de cinco roleplays previsto en el roadmap: **01 overbooking, 02 espera de mesa, 03 plato incorrecto, 13 alergia severa y 20 early check-in**. Es una propuesta, no una decisión aprobada; la selección final corresponde a Michel. El escenario 13 exige revisión especializada del protocolo antes de publicarse como simulación.

---

## 2. Modelo de cada escenario

Cada unidad de contenido debería poder representarse con los siguientes campos, independientemente de que el primer MVP use JSON estático o el formato de datos que defina arquitectura:

| Campo | Uso |
|---|---|
| `id`, `title`, `department`, `tags` | Identidad estable, área y búsqueda/filtrado. |
| `learner_role`, `guest_context`, `difficulty` | Rol del alumno, contexto inicial y nivel lingüístico. |
| `opening_guest_line` | Primer turno del cliente; breve y no ambiguo. |
| `learning_objective` | Resultado comunicativo observable, no una frase a recitar. |
| `criticality` | `standard`, `high` o `safety-critical`; determina los límites del diálogo. |
| `decision_tree` | Nodos/ramas del escenario, datos por confirmar y salidas válidas. |
| `guest_variants` | Variaciones de tono, acento inteligible y nivel de inglés sin cambiar los hechos. |
| `target_expressions` | Expresiones objetivo con función comunicativa y registro. |
| `unsafe_or_false_claims` | Afirmaciones que no se pueden premiar (p. ej., garantizar “no traces” sin confirmación). |
| `success_criteria` | Lista de conductas lingüísticas y de proceso que se evalúan. |
| `escalation_exit` | Condición de salida del roleplay a responsable, protocolo o emergencia. |

No almacenar nacionalidad, acento o nivel de inglés del cliente como atributos inferidos de una persona real. Son **parámetros de ficción y accesibilidad didáctica** del escenario.

---

## 3. Catálogo de 30 situaciones críticas

### Convenciones de ramificación

Los códigos `T1–T7` llevan a árboles de decisión definidos en la sección 4. Los pasos de la columna **Lógica** describen la variación mínima del caso: aclarar el hecho, distinguir lo que el empleado sabe de lo que debe confirmar y ofrecer únicamente opciones autorizadas.

### A. Quejas, conflictos y recuperación del servicio

| ID | Situación / rol principal | Objetivo de aprendizaje | Apertura sugerida del cliente | Lógica y salida válida |
|---|---|---|---|---|
| 01 | **Overbooking de habitaciones** · Recepción | Reconocer el perjuicio, verificar reserva y disponibilidad y explicar alternativas sin culpar ni prometer. | “I have a confirmed reservation, but you say there’s no room for me.” | `T1`: confirmar nombre/reserva y hechos → consultar responsable y opciones autorizadas (alojamiento alternativo, traslado, reembolso u otra solución según política) → explicar quién hace qué y cuándo. Escalar de inmediato si no hay alternativa confirmada o la persona queda sin alojamiento seguro. |
| 02 | **Mesa retrasada 45 minutos** · Restaurante | Gestionar una espera que excede lo comunicado, dar una actualización honesta y presentar opciones reales. | “We’ve been waiting for our table for 45 minutes.” | `T2`: disculparse y comprobar estado/tiempo real → ofrecer esperar con actualización, cancelar o alternativa solo si existen → no inventar minutos ni prioridad. Confirmar la opción elegida. |
| 03 | **Plato enviado incorrectamente** · Restaurante | Aceptar el error, comprobar el pedido y coordinar corrección teniendo en cuenta restricciones alimentarias. | “This isn’t what I ordered.” | `T2`: retirar/contener el plato según protocolo → verificar comanda y necesidad dietética → pedir reemplazo con plazo confirmado → no cobrar/compensar salvo política aprobada. Si revela alérgeno o riesgo, pasar a `T5`. |
| 04 | **Queja por ruido nocturno** · Recepción / guardia | Mostrar escucha, obtener ubicación y actuar sin confrontar ni revelar datos de otros huéspedes. | “There’s been loud noise outside my room all night.” | `T2`: disculparse y concretar habitación, horario y urgencia → avisar al responsable/seguridad para actuación discreta → confirmar seguimiento; ofrecer cambio solo si está disponible. Si hay amenazas o violencia, `T7`. |
| 05 | **Copa rota en la mesa** · Restaurante / bar | Proteger a las personas, controlar la zona y ofrecer atención sin minimizar el incidente. | “A glass has broken right beside my child.” | `T7`: pedir que nadie toque los fragmentos, señalizar/aislar y avisar al equipo → preguntar si alguien se ha cortado → seguir protocolo de lesión si procede → limpiar/retirar con seguridad y verificar que la zona queda libre. No manipular fragmentos cerca del cliente. |
| 06 | **Habitación no preparada a la llegada** · Recepción / housekeeping | Disculparse, comprobar estado con operaciones y dar opciones con hora verificada. | “I’ve checked in, but the room hasn’t been cleaned.” | `T2`: confirmar habitación y estado sin discutir → coordinar limpieza prioritaria y tiempo confirmado → si no está disponible, consultar alternativa aprobada. No indicar que la habitación está lista hasta verificarlo. |
| 07 | **Aire acondicionado/calefacción averiado** · Recepción / mantenimiento | Recoger síntomas y urgencia, coordinar inspección y ofrecer solución según disponibilidad. | “The air conditioning in my room isn’t working.” | `T2`: comprobar habitación y condiciones relevantes → enviar mantenimiento con franja acordada → si no puede resolverse, consultar cambio de habitación/equipo alternativo aprobado. Escalar si hay riesgo para salud o seguridad. |
| 08 | **Objeto perdido** · Recepción / housekeeping | Recoger descripción y lugar/hora, gestionar búsqueda y proteger la privacidad. | “I think I left my wallet in the lounge.” | `T2`: registrar descripción y datos de contacto mínimos → consultar lost-and-found según protocolo → nunca confirmar que se encontró hasta verificar propiedad y custodia → acordar actualización. Si contiene documentos/efectivo, escalar según norma del establecimiento. |
| 09 | **Posible doble cargo** · Recepción / caja | Separar cargo pendiente de cargo contabilizado, revisar comprobante y explicar siguiente paso sin atribuir causas. | “You’ve charged my card twice.” | `T3`: identificar importes/fechas con el huésped y revisar sistema autorizado → distinguir autorización pendiente de cargo liquidado solo si el sistema lo confirma → escalar a caja/manager y dar plazo de seguimiento verificable. No pedir número completo de tarjeta ni datos sensibles en voz alta. |
| 10 | **Room service muy retrasado** · Restaurante / room service | Informar del estado real, disculparse y permitir una elección clara sin prometer un tiempo no confirmado. | “My order was supposed to arrive 30 minutes ago.” | `T2`: verificar pedido/cocina → compartir actualización confirmada y opción de mantener/cancelar según política → confirmar habitación y pedido sin exponer datos a terceros. Si hay requisito dietético, volver a confirmar con cocina. |
| 11 | **Cliente alterado o agresivo** · Recepción / responsable | Mantener lenguaje calmado, límites claros y distancia; buscar apoyo y no escalar verbalmente. | “This is ridiculous. Get me someone who can fix it now!” | `T7`: escuchar sin interrumpir y ofrecer responsable → si hay insultos, marcar límite respetuoso → si existe amenaza/violencia, alejarse, pedir apoyo/seguridad y seguir protocolo. No debatir, tocar ni bloquear la salida. |
| 12 | **Queja de accesibilidad / servicio no accesible** · Recepción / restaurante | Preguntar qué ajuste necesita la persona, no asumir la necesidad y verificar recursos antes de confirmar. | “The accessible entrance is blocked.” | `T2`: reconocer el problema y aclarar el ajuste requerido → retirar obstáculo o buscar alternativa segura confirmada → avisar a responsable y actualizar a la persona. Nunca prometer una adaptación no disponible ni pedir información médica innecesaria. |

### B. Seguridad alimentaria, alérgenos y requisitos dietéticos

| ID | Situación / rol principal | Objetivo de aprendizaje | Apertura sugerida del cliente | Lógica y salida válida |
|---|---|---|---|---|
| 13 | **Alergia severa a frutos secos** · Restaurante / cocina | Reconocer severidad, parar antes de recomendar, comunicar con cocina y no garantizar seguridad sin confirmación. | “I have a severe nut allergy. Is this dish safe?” | `T5`: preguntar solo lo necesario para transmitir la restricción → informar a cocina/encargado y confirmar ingredientes **y** riesgo de contacto cruzado conforme al protocolo → si no se puede confirmar, decir que no puede asegurarse y no recomendar/servir ese plato → activar procedimiento de emergencia ante reacción. Prohibido responder “It’s definitely safe” sin verificación. |
| 14 | **Celiaquía estricta, sin trazas** · Restaurante / cocina | Distinguir preferencia de requisito estricto, verificar preparación y comunicar incertidumbre con transparencia. | “I have coeliac disease. I need food with no gluten cross-contact.” | `T5`: confirmar requisito estricto y transmitirlo explícitamente → cocina confirma ingredientes, utensilios/superficies y procedimiento → si no puede garantizarse conforme al protocolo del local, explicarlo y ofrecer solo alternativa verificada o no recomendar. No usar “gluten-free” como garantía de ausencia de trazas sin base. |
| 15 | **Intolerancias múltiples** · Restaurante / cocina | Registrar con precisión la lista, confirmar qué puede comer y evitar improvisar una combinación. | “I can’t have dairy, onions or garlic.” | `T5`: repetir la lista para confirmar → consultar cocina sobre ingredientes/preparación → distinguir alergia de intolerancia sin diagnosticar → proponer opciones solo tras confirmación. Si hay incertidumbre, explicitarla y escalar. |
| 16 | **Petición halal o kosher** · Restaurante / cocina | Preguntar qué criterio necesita el cliente y aclarar límites del menú sin asumir equivalencias religiosas. | “Do you have a halal meal?” / “Is this kosher?” | `T5`: aclarar si pregunta por certificación/preparación específica o por ingredientes → consultar responsable y documentación/proceso existente → describir con exactitud qué se puede confirmar → no etiquetar como halal/kosher ni equiparar alternativas vegetarianas sin autorización/certificación. |
| 17 | **Sospecha de contaminación cruzada** · Cocina / encargado | Detener el servicio de un plato cuyo contacto cruzado se sospecha y evitar reutilizarlo como si fuera seguro. | “I think that utensil touched food containing peanuts.” | `T5`: detener y separar el plato/utensilio → avisar a cocina y responsable → rehacer únicamente siguiendo el procedimiento aplicable y desde un proceso seguro, o comunicar que no se puede servir → si hubo exposición/reacción, activar protocolo de emergencia. No retirar solo el ingrediente visible. |
| 18 | **Cliente informa posible enfermedad tras comer** · Responsable / restaurante | Escuchar y recopilar datos objetivos, priorizar atención y preservar el procedimiento interno, sin diagnosticar ni negar. | “I’ve been feeling ill since I ate here.” | `T7`: preguntar si necesita asistencia urgente y actuar según protocolo → avisar al manager → registrar hora/plato/datos requeridos por el procedimiento, con discreción → no atribuir causa ni afirmar que el alimento no puede ser responsable → preservar trazabilidad según política. |
| 19 | **Plato poco hecho o temperatura preocupante** · Restaurante / cocina | Retirar o detener el consumo, escuchar el motivo y coordinar revisión sin discutir el criterio del cliente. | “This chicken looks undercooked.” | `T5`: disculparse y pedir que no continúe comiéndolo → retirar sin re-servir → cocina/manager revisa y sigue protocolo de seguridad → ofrecer una nueva preparación solo si está autorizada y confirmada; si hay síntomas, `T7`. |

### C. Peticiones VIP y servicios especiales

| ID | Situación / rol principal | Objetivo de aprendizaje | Apertura sugerida del cliente | Lógica y salida válida |
|---|---|---|---|---|
| 20 | **Early check-in denegado por ocupación completa** · Recepción | Explicar la limitación sin culpabilizar, comprobar el estado real y ofrecer opciones existentes. | “I’m a VIP guest. Surely my room can be ready before check-in?” | `T1`: comprobar reserva/estado de habitación y ocupación → comunicar lo que sí se sabe → ofrecer guardar equipaje, espacio de espera u otra opción solo si existe → indicar hora de próxima actualización, no hora ficticia de entrega. Escalar petición VIP sin saltarse seguridad/limpieza. |
| 21 | **Reserva de última hora** · Recepción / reservas | Confirmar fechas, ocupación, número de personas y condiciones antes de dar precio o disponibilidad. | “Do you have a room for tonight?” | `T1`: aclarar noches/personas/tipo → comprobar disponibilidad y tarifa actuales → exponer condiciones relevantes y pedir confirmación antes de cerrar → si completo, ofrecer alternativas verificadas o explicar que no hay disponibilidad. No inventar precio. |
| 22 | **Cóctel personalizado fuera de carta** · Bar | Aclarar ingredientes/preferencias y comprobar capacidad, existencias y precio antes de aceptar. | “Could you make something with gin, basil and grapefruit?” | `T4`: preguntar preferencia relevante (dulzor/alcohol, alergias) → confirmar ingredientes y precio/disponibilidad con bar → aceptar variación posible o proponer alternativa real → no prometer una receta si faltan ingredientes; confirmar antes de preparar. |
| 23 | **Petición de mejora por aniversario** · Recepción | Reconocer la ocasión sin implicar upgrade gratuito; verificar disponibilidad, precio y política. | “It’s our anniversary. Could we have a suite upgrade?” | `T1`: felicitar brevemente → consultar disponibilidad y si hay coste/condición → ofrecer opciones confirmadas → pedir autorización del cliente para cualquier suplemento. No inferir beneficio por estatus o prometer cortesías. |
| 24 | **Late checkout no disponible** · Recepción | Comunicar ocupación/política con tacto y ofrecer alternativas logísticas existentes. | “Could we keep the room until 4 p.m.?” | `T1`: consultar disponibilidad y hora límite real → explicar el límite con claridad → ofrecer guardar equipaje/espacio/alternativa solo si existe y aclarar coste → confirmar la decisión. No conceder sin registrar/validar. |
| 25 | **Traslado reservado no llega** · Recepción / concierge | Confirmar datos del traslado, contactar al proveedor y evitar asegurar que está en camino hasta obtener respuesta. | “Our airport transfer hasn’t arrived.” | `T2`: confirmar nombre, hora y punto de recogida → revisar reserva/contactar proveedor → compartir actualización verificada → proponer opción alternativa con coste/tiempo confirmados. Si hay urgencia de viaje, priorizar escalado. |

### D. Incidencias de servicio y operación

| ID | Situación / rol principal | Objetivo de aprendizaje | Apertura sugerida del cliente | Lógica y salida válida |
|---|---|---|---|---|
| 26 | **Pago rechazado en el mostrador** · Recepción / caja | Mantener la privacidad, explicar que el sistema no autoriza el pago sin atribuir culpa y proponer un siguiente paso seguro. | “Why was my card declined? There’s money in the account.” | `T3`: no verbalizar datos financieros sensibles → comunicar solo el estado que muestra el terminal → ofrecer otro método o contacto con emisor en privado según política → no retener tarjeta ni anotar número/CVV. |
| 27 | **Nombre o fecha no coincide con la reserva** · Recepción | Resolver discrepancia con preguntas neutrales y verificación segura, protegiendo datos personales. | “I booked under a different name, but I can’t find it.” | `T3`: pedir identificador mínimo (nombre/fecha/canal) en privado → comprobar variantes ortográficas y sistema → no revelar reservas de terceros → si no se localiza, contactar canal/responsable y explicar alternativas verificadas. |
| 28 | **Familia solicita cuna/cama adicional no confirmada** · Recepción / housekeeping | Confirmar edad/necesidad logística sin solicitar datos excesivos y revisar disponibilidad, seguridad y coste. | “We requested a cot for our baby, but it isn’t in the room.” | `T1`: disculparse y confirmar solicitud/habitación → consultar existencia y tiempo de entrega → ofrecer solo equipo disponible y permitido para esa habitación → comunicar coste si aplica antes de enviar. Escalar si no hay solución segura. |
| 29 | **Pérdida de llave / huésped bloqueado fuera** · Recepción | Verificar identidad conforme a política antes de emitir acceso y proteger al huésped y a terceros. | “I’ve lost my key. Can you let me into my room?” | `T3`: mostrar empatía → verificar identidad y ocupación conforme al procedimiento, sin saltarse controles → desactivar llave perdida si aplica y emitir acceso autorizado → si falla verificación, escalar sin revelar número/ocupantes de habitación. |
| 30 | **Alarma, evacuación o emergencia médica** · Todo el personal | Dar instrucciones breves y claras, activar el procedimiento real y obtener apoyo; no seguir una conversación de roleplay normal. | “There’s a fire alarm / someone has collapsed.” | `T7`: seguridad inmediata → activar alarma/protocolo local y avisar al responsable/servicios de emergencia según procedimiento → instrucciones simples, sin ascensores si así lo indica el plan local → confirmar ubicación/ayuda disponible sin inventar. Salida inmediata del roleplay estándar y prioridad a la emergencia. |

### Clasificación de criticidad por escenario

La criticidad indica cómo debe comportarse el tutor, no la gravedad real de un incidente concreto. `Estándar` mantiene el roleplay normal; `Alta` requiere verificación y/o seguimiento explícito; `Seguridad crítica` activa los gates de seguridad, privacidad o emergencia, detiene la simulación normal si procede y exige salida segura.

| ID | Nivel | Motivo y regla del tutor |
|---|---|---|
| 01 | Alta | Riesgo de dejar al huésped sin alojamiento; verificación y manager. |
| 02 | Alta | Incumplimiento significativo de espera; no inventar disponibilidad/plazo. |
| 03 | Alta | Error de comanda puede revelar un riesgo dietético; preguntar y derivar a T5 si procede. |
| 04 | Alta | Perturba descanso/seguridad; derivar a seguridad crítica ante amenaza. |
| 05 | Seguridad crítica | Cristales y posible lesión; aislar zona y activar procedimiento de lesión. |
| 06 | Alta | Habitación no apta; no confirmar entrada/estado sin verificación. |
| 07 | Alta | Avería puede afectar seguridad o bienestar; escalar según condiciones. |
| 08 | Estándar | Búsqueda/custodia; proteger datos y no confirmar hallazgo no verificado. |
| 09 | Alta | Posible perjuicio económico y datos financieros; revisión autorizada y privacidad. |
| 10 | Alta | Retraso y potencial requisito dietético; comprobar estado/pedido. |
| 11 | Seguridad crítica | Agresión/amenaza potencial; priorizar distancia, apoyo y protocolo. |
| 12 | Alta | Acceso seguro y adaptación; no prometer una solución no disponible. |
| 13 | Seguridad crítica | Alergia severa; cero garantías sin confirmación, parada y escalado. |
| 14 | Seguridad crítica | Requisito estricto de celiaquía/contacto cruzado; no asegurar sin verificación. |
| 15 | Alta | Varias restricciones; confirmar lista y preparación, no improvisar. |
| 16 | Alta | Requisito religioso que exige descripción exacta; no atribuir certificación. |
| 17 | Seguridad crítica | Sospecha de contaminación; parar servicio y activar procedimiento. |
| 18 | Seguridad crítica | Posible enfermedad y necesidad de atención/proceso; no diagnosticar ni negar. |
| 19 | Seguridad crítica | Posible alimento inseguro; detener consumo/servicio y escalar a cocina. |
| 20 | Alta | Ocupación y expectativa VIP; no saltarse limpieza ni prometer habitación. |
| 21 | Estándar | Disponibilidad, tarifa y condiciones deben ser verificadas antes de aceptar. |
| 22 | Alta | Personalización/ingredientes; escalar a T5 si aparece alergia. |
| 23 | Estándar | Posible coste/upgrade; confirmar política y aceptación antes de comprometer. |
| 24 | Estándar | Capacidad y coste; no conceder excepción sin autorización. |
| 25 | Alta | Traslado fallido con impacto de viaje; actualizar solo con información confirmada. |
| 26 | Alta | Operación financiera; no solicitar credenciales ni datos completos en voz alta. |
| 27 | Alta | Datos personales/reserva; verificación segura y no divulgación. |
| 28 | Alta | Equipo para bebé; comprobar disponibilidad y uso seguro. |
| 29 | Seguridad crítica | Control de acceso a habitación; no entregar llave sin verificación. |
| 30 | Seguridad crítica | Emergencia; detener roleplay normal y activar el protocolo local. |

---

## 4. Árboles de decisión

Los siguientes árboles describen decisiones del diálogo y del tutor, no protocolos operativos universales. En producción, los nodos de emergencia deben apuntar al procedimiento aprobado por cada establecimiento. `STOP` significa que el roleplay deja de premiar fluidez y pasa a reforzar seguridad, claridad y escalado.

### T0 — Apertura común: escuchar, reconocer y aclarar

```text
Cliente expresa problema/petición
  ├─ ¿Hay señal de peligro inmediato, lesión, reacción alérgica, violencia o emergencia?
  │    ├─ Sí → T7 (o T5 si es un riesgo alimentario) → STOP si requiere actuación real.
  │    └─ No
  ├─ Reconocer impacto + disculpa apropiada (si el servicio falló; no admitir causa no confirmada)
  ├─ ¿Falta un dato para identificar el caso?
  │    ├─ Sí → hacer 1 pregunta breve y pertinente; repetir para confirmar.
  │    └─ No → resumir problema en una frase.
  ├─ ¿La solución depende de sistema/cocina/manager/política?
  │    ├─ Sí → decir que se va a comprobar; no prometer resultado.
  │    └─ No → presentar opciones autorizadas.
  └─ Confirmar elección + responsable + siguiente actualización; comprobar comprensión.
```

### T1 — Disponibilidad, reserva y servicios condicionados

```text
Identificar reserva/fechas/servicio con los datos mínimos
  ├─ ¿El sistema/responsable confirma disponibilidad y condiciones?
  │    ├─ Sí → explicar opción, precio/condición si aplica → pedir aceptación → registrar/confirmar.
  │    └─ No / incierto → no asegurar disponibilidad ni precio.
  ├─ ¿Hay alternativa real y autorizada?
  │    ├─ Sí → presentar 1–2 opciones claramente distintas y sus condiciones.
  │    └─ No → explicar límite + escalar al responsable + acordar hora de actualización.
  └─ ¿La situación deja a la persona sin alojamiento/servicio seguro o es una petición urgente?
       ├─ Sí → escalado prioritario a manager; permanecer en contacto según protocolo.
       └─ No → cerrar con el siguiente paso confirmado.
```

### T2 — Queja, retraso o fallo de servicio

```text
Reconocer el efecto + disculparse sin especular sobre causa
  ├─ ¿El dato/estado puede comprobarse ahora?
  │    ├─ Sí → consultar operación → dar estado real y, si está disponible, plazo confirmado.
  │    └─ No → indicar quién lo comprobará y cuándo habrá actualización.
  ├─ ¿La persona desea solución inmediata o prefiere esperar?
  │    ├─ Solución → ofrecer solo opciones permitidas/disponibles.
  │    └─ Esperar → confirmar hora/canal de actualización; no abandonar el seguimiento.
  ├─ ¿Hay daño, riesgo alimentario, amenaza, accesibilidad o queja repetida grave?
  │    ├─ Sí → T5/T7 o manager según caso.
  │    └─ No → confirmar opción, responsable y cierre.
```

### T3 — Pagos, identidad y privacidad

```text
Mover conversación/datos sensibles a un canal discreto y autorizado
  ├─ ¿Se requiere dato financiero completo, CVV, contraseña o documento por voz?
  │    ├─ Sí → NO solicitarlo; usar flujo seguro del establecimiento.
  │    └─ No → continuar con identificador mínimo.
  ├─ ¿El sistema confirma el cargo, autorización o identidad?
  │    ├─ Sí → explicar solo el estado confirmado y próximo paso.
  │    └─ No → no inferir; revisar con caja/manager/canal de reserva.
  └─ ¿No se puede verificar con seguridad?
       ├─ Sí → no entregar acceso, divulgar reservas ni procesar una operación; escalar.
       └─ No → resolver dentro de la política y confirmar.
```

### T4 — Petición fuera de carta / personalización

```text
Aclarar preferencia y restricciones relevantes del cliente
  ├─ ¿Alergia/intolerancia o ingrediente de riesgo mencionado?
  │    ├─ Sí → T5 antes de sugerir o preparar.
  │    └─ No → consultar ingredientes/existencias/capacidad.
  ├─ ¿Bar/cocina confirma que puede hacerlo y el precio?
  │    ├─ Sí → comunicar composición/precio relevantes y pedir confirmación.
  │    └─ No → ofrecer alternativa verificada o explicar el límite con amabilidad.
  └─ Preparar solo después de confirmar la elección; no improvisar ingredientes ni coste.
```

### T5 — Alérgenos, celiaquía y riesgo alimentario

```text
Cliente comunica alergia/requisito estricto/sospecha de contaminación
  ├─ ¿Hay reacción, síntomas graves o exposición con riesgo inmediato?
  │    ├─ Sí → STOP; activar protocolo de emergencia local y buscar ayuda inmediata.
  │    └─ No
  ├─ ¿El plato aún no se ha servido/consumido?
  │    ├─ Sí → detener recomendación/servicio; no retirar solo el ingrediente visible.
  │    └─ No → detener consumo si procede; avisar a responsable/cocina; activar protocolo según síntomas.
  ├─ ¿Responsable/cocina confirma ingredientes + manipulación/contacto cruzado según protocolo?
  │    ├─ Sí → comunicar con precisión el alcance confirmado; seguir el procedimiento del local.
  │    └─ No / duda → decir claramente que no se puede confirmar seguridad; no recomendar ni servir ese plato.
  └─ Ofrecer solo una alternativa verificada o explicar que no es posible satisfacer el requisito.
```

### T6 — Petición de estatus VIP, excepción o compensación

```text
Reconocer la petición/ocasión sin discutir el estatus
  ├─ ¿La política y la disponibilidad están confirmadas?
  │    ├─ Sí → comunicar condición/coste y pedir aceptación antes de comprometer el servicio.
  │    └─ No → consultar manager; evitar promesa implícita de upgrade/cortesía.
  ├─ ¿La petición no puede concederse?
  │    ├─ Sí → explicar el límite con tacto + una alternativa existente si la hay.
  │    └─ No → confirmar detalles y registrar en el sistema autorizado.
  └─ No se altera seguridad, limpieza, privacidad, capacidad ni trato justo para satisfacer la petición.
```

### T7 — Seguridad, lesión, violencia o emergencia

```text
¿Hay peligro inmediato para cliente/personal?
  ├─ Sí → dejar de negociar/roleplay; tomar distancia/proteger zona según formación;
  │        activar protocolo local, responsable, seguridad o servicios de emergencia según proceda.
  └─ No → determinar si hace falta atención, responsable o contención del área.
¿Hay lesión/síntomas/amenaza activa?
  ├─ Sí → pedir ayuda prioritaria; no diagnosticar ni intervenir fuera de formación.
  └─ No → gestionar incidente conforme a protocolo; informar de la siguiente acción confirmada.
En todo caso: lenguaje corto, instrucciones inequívocas, no atribuir culpa, no prometer desenlace.
```

### Mapeo de casos a árboles

- `T1`: 01, 06, 20, 21, 23, 24, 28.
- `T2`: 02, 03, 04, 06, 07, 08, 10, 12, 25.
- `T3`: 09, 26, 27, 29.
- `T4`: 22.
- `T5`: 03 (si aparece riesgo), 13, 14, 15, 16, 17, 19.
- `T6`: 20, 23, 24 (cuando se pide excepción/compensación).
- `T7`: 04 (si hay amenaza), 05, 11, 18 (si síntomas urgentes), 30.
- Todo escenario comienza con `T0`; los árboles se combinan cuando cambian los hechos. La seguridad prevalece sobre el árbol de cortesía/servicio.

---

## 5. Matriz de cortesía profesional — Polite Hospitality English

### Escala de adecuación

La cortesía se evalúa por adecuación al contexto, claridad, respeto y honestidad, no por longitud ni por acumular fórmulas indirectas. En una emergencia, una instrucción breve y directa puede ser profesional y preferible a una frase ceremoniosa.

| Nivel | Definición observable | Ejemplo ante un retraso | Qué debe aprender el alumno |
|---|---|---|---|
| **1. Inaceptable** | Despectivo, culpabiliza, amenaza, ridiculiza o da una certeza falsa. | “That’s not my problem.” / “It’s definitely safe, don’t worry.” | Identificar por qué daña la relación o introduce riesgo; no premiar aunque la gramática sea correcta. |
| **2. Seco** | Transmite una orden o límite sin reconocimiento ni contexto; puede sonar brusco. | “Wait.” / “You’ll have to ask someone else.” | Añadir reconocimiento y siguiente paso sin ocultar el límite. |
| **3. Neutro** | Correcto y comprensible, pero poco personalizado o no informa de qué ocurrirá. | “Sorry. It’s delayed.” | Precisar qué se comprobará, opción disponible o cuándo habrá actualización. |
| **4. Profesional** | Reconoce el impacto, usa lenguaje respetuoso y propone una acción realista, sin prometer lo no confirmado. | “I’m sorry for the delay. Let me check the latest update for you.” | Patrón recomendado por defecto: reconocimiento + acción verificable + seguimiento. |
| **5. Excelencia Hostelera** | Profesional, empático, claro y adaptado; preserva autonomía del cliente y confirma el cierre. | “I’m very sorry you’ve had to wait. I’ll check with the team now and come back with an accurate update. Would you prefer to wait here or explore another option?” | Demostrar tacto sin exceso de disculpas, vaguedad, servilismo o falsa seguridad. |

**Regla de puntuación:** una respuesta de nivel 5 no puede compensar un error de seguridad, una promesa falsa o una violación de privacidad. En esos casos el resultado máximo debe limitarse según el criterio crítico del escenario.

### Estructura recomendada de respuesta

1. **Reconocer:** “I understand this is frustrating.” / “I’m sorry this has affected your evening.”
2. **Aclarar sin interrogar:** “May I confirm the booking name and arrival date?”
3. **Actuar o comprobar:** “Let me check with the kitchen before I recommend anything.”
4. **Explicar opciones y límites:** “I can’t confirm that it’s safe, so I don’t want to recommend it.”
5. **Cerrar:** “I’ll speak to the manager now and update you in ten minutes.” Solo usar el plazo si se puede cumplir; si no, acordar un plazo realista.

### Banco de expresiones diplomáticas por función

| Función | Inglés recomendado | Nota de uso |
|---|---|---|
| Disculpa por un fallo/retraso | “I sincerely apologize for the delay.” | Formal; apropiada para un inconveniente relevante. No repetir mecánicamente. |
| Disculpa natural y directa | “I’m very sorry about the wait.” | Alternativa más conversacional y clara. |
| Reconocer impacto | “I understand how frustrating this must be.” | No afirma causa ni responsabilidad que aún no se ha comprobado. |
| Pedir un momento | “Thank you for your patience while I check that for you.” | Mejor que “Wait”; evitar si no se va a comprobar. |
| Consultar a responsable | “Allow me to check with the restaurant manager right away.” | “Maître d’” es posible en algunos contextos, pero “restaurant manager” suele ser más claro para público internacional. Frase solicitada “Allow me to check with the maître right away” puede aparecer como variante didáctica. |
| Petición cortés | “Would you be so kind as to confirm the booking name?” | Muy indirecta/formal; útil con peticiones breves. No encadenarla con otras fórmulas. |
| Ofrecer asistencia | “How may I help you resolve this?” | Mantiene colaboración y agencia. |
| Comprobar una preferencia | “Would you prefer to wait, or shall I check another option?” | Presentar opciones que existen, no opciones hipotéticas. |
| Aclarar una limitación | “I’m afraid we can’t guarantee that at the moment.” | Sigue con qué se puede comprobar u ofrecer. |
| No saber / confirmar | “I don’t want to give you the wrong information. Let me confirm that with the team.” | Convierte incertidumbre en una acción concreta. |
| Riesgo alimentario sin confirmación | “I can’t confirm that this dish is safe for your allergy, so I don’t want to recommend it.” | Transparencia prioritaria; no suavizar hasta que parezca un “probablemente sí”. |
| Confirmar un compromiso | “I’ll speak to the manager now and update you by [confirmed time].” | El marcador debe sustituirse por un plazo real y factible. |
| Cerrar con cortesía | “Is there anything else I can help you with before you go?” | Usar solo cuando la incidencia esté resuelta o derivada claramente. |
| Privacidad de pago | “For your privacy, let’s handle the payment details through the secure terminal.” | No pedir ni repetir número completo/CVV en voz alta. |

### Sustituciones a enseñar

| Evitar | Preferir | Motivo |
|---|---|---|
| “Calm down.” | “I can see you’re upset. I’m here to help.” | No ordena la emoción del cliente. |
| “You have to…” | “The available option is…” / “What I can do is…” | Comunica límites sin sonar punitivo. |
| “It’s not my fault.” | “Let me find out what happened and what we can do next.” | Evita culpar y vuelve a la acción. |
| “No problem” ante lesión/riesgo | “I’m sorry this happened. I’ll get the manager now.” | No minimiza un incidente serio. |
| “It should be fine” (alérgenos) | “I’ll confirm with the kitchen; I can’t assure you until it’s checked.” | Elimina garantías infundadas. |
| “Maybe in five minutes” | “I’ll check the current estimate and update you.” | Evita plazos inventados. |
| “We don’t do that.” | “I’m afraid that service isn’t available, but I can check [alternative] if you’d like.” | Límite explícito + alternativa real, sin crear obligación. |

---

## 6. Variantes de cliente: registro, acento e inteligibilidad

### Principio de diseño

Los perfiles siguientes son **variantes de actuación**, no reglas sobre cómo se comporta una nacionalidad. Nacionalidad no determina cortesía, nivel, personalidad, comprensión ni expectativas. Los acentos deben ser naturales y legibles; no caricaturizarlos mediante ortografía fonética. El contenido debe conservar el mismo problema, riesgo y criterio de éxito entre variantes. La configuración de acento nunca debe penalizar al alumno por comprender una variedad distinta.

| Perfil didáctico | Rasgos conversacionales posibles (no obligatorios) | Adaptación del alumno | Evitar |
|---|---|---|---|
| **Británico formal** | Uso posible de mitigadores (“I’m afraid…”, “Would it be possible…?”), indirectas y variantes léxicas británicas según el personaje. | Escuchar la petición implícita; responder con claridad respetuosa y confirmar qué acción desea. | Estereotipar a toda persona británica como reservada; premiar solo fórmulas excesivamente formales. |
| **Estadounidense directo** | Petición explícita, preferencia por opciones y resolución rápida en algunos personajes; vocabulario puede variar (p. ej. *reservation*, *check*, *takeout*). | Responder de forma concisa, concreta y proactiva; mantener cortesía y no interpretar claridad como hostilidad. | Asumir exigencia, impaciencia o superioridad por nacionalidad. |
| **Australiano coloquial** | Contracciones, saludo informal y expresiones coloquiales ocasionales; ritmo/vocales australianos auténticos en audio cuando estén disponibles. | Mantener un inglés profesional y natural; pedir aclaración con tacto si una expresión no se entiende. No es necesario imitar slang. | Usar ortografía fonética, caricaturas, exceso de jerga o evaluar imitación de acento. |
| **Viajero internacional no nativo** | Puede usar frases breves, pausas, reformulaciones o vocabulario limitado; el acento varía y no debe codificarse como una nacionalidad concreta. | Usar frases cortas, una pregunta cada vez, vocabulario frecuente; confirmar comprensión sin infantilizar. | Hablar más alto como sustituto de claridad, corregir al cliente, asumir poca inteligencia o inferir origen. |

### Configuración de variación para roleplay

- Separar los controles `register` (formal/neutral/colloquial), `speech_rate` (normal/lento) y `accent_variant` (si existe audio) de `guest_nationality` y de la dificultad del escenario.
- Proveer botón o instrucción accesible para **repetir, ralentizar y mostrar transcripción**, en especial para alumnado no nativo. La configuración actual del producto debe validar el modo exacto.
- Mantener intención, hechos y dificultad de decisión equivalentes al variar la voz. No permitir que el modelo invente nuevos riesgos, políticas o datos de reserva.
- El alumno puede solicitar aclaración: “Could you say that again a little more slowly, please?” Esta respuesta cuenta como estrategia comunicativa válida.

---

## 7. Criterios de evaluación y calidad del dataset

### Rúbrica por turno

Puntuar cada dimensión de 0 a 2: `0 = ausente/contraproducente`, `1 = parcial`, `2 = claro y adecuado`.

1. **Reconocimiento y cortesía:** identifica el impacto sin culpar ni sonar despectivo.
2. **Claridad lingüística:** frase comprensible, apropiada al nivel del piloto y sin ambigüedad crítica.
3. **Aclaración:** pregunta solo lo necesario; repite datos sensibles con discreción.
4. **Acción realista:** distingue lo confirmado de lo pendiente y no inventa disponibilidad, coste ni política.
5. **Cierre:** indica opción, responsable y siguiente paso; confirma comprensión.
6. **Seguridad y privacidad (gate):** cumple límites específicos del caso. `0` en un gate crítico marca el turno como **no competente**, sin compensación por la puntuación total.

### Criterios de aceptación del contenido

- Dataset completo: **30 IDs únicos** consecutivos del `01` al `30`, con departamento, objetivo, apertura, lógica de ramificación y salida válida.
- Cada escenario tiene un objetivo observable y al menos una condición de escalado, explícita o aplicable vía `T5/T7`.
- Todo lo marcado `safety-critical` contiene el límite de seguridad/no garantía y una salida de escalado; no se puntúa solo cortesía.
- Ninguna línea modelo inventa precio, tiempo, disponibilidad, reembolso o certificación dietética.
- Variantes de acento cambian la forma del diálogo, nunca la política, el riesgo, la verdad de los hechos ni el criterio de aprobación.
- En roleplay, el alumno puede pedir repetición/clarificación; un acento o error de reconocimiento no debe convertirse automáticamente en fallo de cortesía.
- Un lector de contenido puede localizar para cada caso: objetivo, primer turno, hechos verificables, opciones permitidas, criterio de escalado y expresiones objetivo.

### Métricas propuestas para el piloto

| Métrica | Fórmula | Umbral inicial propuesto | Periodicidad |
|---|---|---:|---|
| Cobertura estructural | Escenarios con todos los campos obligatorios / 30 | 100 % antes de publicación | Por release |
| Éxito de gestión | Sesiones no críticas con dimensiones 1–5 ≥ 1 y sin datos inventados / sesiones evaluables | ≥ 80 % en piloto, a validar con usuarios y calibración | Semanal |
| Seguridad crítica | Turnos que respetan todos los gates de seguridad / turnos críticos | 100 %; cualquier fallo bloquea esa variante | Por build/contenido |
| Comprensión entre variantes | Tasa de resolución del mismo objetivo por registro/acento | Brecha ≤ 10 puntos porcentuales tras muestra comparable; revisar si la muestra es pequeña | Por iteración |
| Claridad del siguiente paso | Sesiones que terminan con acción/seguimiento explícito / sesiones completadas | ≥ 85 % en piloto | Semanal |

Estos umbrales son hipótesis iniciales de evaluación, no métricas aprobadas ni resultados observados. Deben validarse con pruebas de contenido y participantes; no afirmar una tasa de éxito antes de medirla.

---

## 8. Priorización y handoff

### MoSCoW de contenido

- **MUST para el piloto:** cinco escenarios acordados por Product Owner; al menos uno por área prioritaria; gate de seguridad para cualquier escenario alimentario; matriz de cortesía niveles 1–5; T0 y árboles pertinentes; transcripción/clarificación accesible.
- **SHOULD:** completar el paquete de 30 escenarios; variantes de formalidad y claridad internacional; rúbrica de turno y métrica de calidad estructural.
- **COULD:** variaciones de expresiones regionales con comprobación por hablantes; rutas por departamento y dificultad adaptativa; audio de distintos acentos con prueba de inteligibilidad.
- **WON’T en este documento:** diagnosticar enfermedades, certificar comida, codificar protocolos legales universales, atribuir rasgos psicológicos a nacionalidades, comprometer compensaciones comerciales o elegir arquitectura/runtime de roleplay.

### Dependencias y decisiones

- **Producto / Michel:** confirmar qué cinco escenarios abren el MVP y aprobar criterios y severidades. La selección sugerida aparece en la sección 1; no se da por aprobada.
- **Operaciones/alimentación con conocimiento competente:** validar wording y salidas de 13–19; aportar protocolos reales del establecimiento si la simulación va a enseñar procedimientos. La app no debe publicar un “safety flow” operativo genérico como si fuera universal.
- **UX:** asegurar opciones claras, lectura rápida, repetición/transcripción y estados de escalado que no premien presión social ni respuestas largas.
- **IA/Contenido:** mantener hechos y límites de la tabla como invariantes del personaje; probar variaciones de registro/acento sin caricatura ni deriva factual.
- **Arquitectura/Desarrollo:** decidir el formato ejecutable del dataset y cómo se representa una interrupción de seguridad; este documento no selecciona schema técnico definitivo.

### Siguiente paso recomendado

Michel valida la selección de los cinco escenarios piloto y el encuadre de seguridad de los casos alimentarios. Tras esa decisión, el rol de contenido/IA puede convertir las fichas seleccionadas a diálogos guionizados y criterios de evaluación verificables sin alterar políticas operativas.
