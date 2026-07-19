# PRD — Área Infantil: Registro y entrega segura de niños

**Proyecto:** Prácticum 2026 · Classical Conversations RD
**Página:** `ninos.html` (panel interno, protegido con contraseña)
**Estado:** Prototipo funcional listo · pendiente validación con el equipo
**Fecha:** 18 de julio de 2026

---

## 1. Contexto y problema

Durante el Prácticum (sábado 25 de julio de 2026, 9:00 a.m.–4:00 p.m.), los padres asisten a la jornada de formación mientras sus hijos permanecen en el **Área Infantil** (la boleta de niño incluye almuerzo y cuidado). Hoy no existe ningún sistema para:

1. **Recibir** a los niños con los datos mínimos de seguridad (quién es el padre, teléfono, alergias).
2. Darle al padre un **comprobante** que acredite que él —y solo él o alguien autorizado— puede recogerlos.
3. **Entregar** a los niños verificando ese comprobante, dejando constancia de quién los recogió y qué voluntario los entregó.

El riesgo que se mitiga es el central de todo ministerio infantil: que un niño sea entregado a la persona equivocada, o que no exista registro de quién lo recibió y lo entregó.

## 2. Investigación: cómo lo resuelven los sistemas existentes

Se investigaron los módulos de check-in infantil de **ChurchSuite**, **Planning Center Check-Ins**, **KidCheck** y **Breeze ChMS**. Hallazgos clave:

| Sistema | Mecanismo de seguridad | Entrega (check-out) |
|---|---|---|
| ChurchSuite | Etiqueta del niño + etiqueta de recogida del padre con **código único por sesión**; QR opcional | El líder compara el código de ambas etiquetas; app puede escanear QR |
| Planning Center | Código **aleatorio de 4 caracteres, nuevo en cada check-in, nunca se repite**; la etiqueta del padre **omite datos sensibles** del niño | Solo en estación atendida por staff; el autoservicio **no permite** check-out |
| KidCheck | Códigos idénticos "candado y llave" + marca de agua; alertas de **guardianes no autorizados**; recibo digital por SMS con QR | Protocolo de ticket perdido: el niño queda con el staff, se compara foto/cédula del guardián registrado y se deja constancia |
| Breeze | Etiqueta del niño + etiqueta del padre con código de 3–4 dígitos; **alergias impresas automáticamente** | Comparación visual del código por el staff |

**Invariantes de seguridad comunes a los cuatro** (y que este producto adopta):

1. Comprobante de **dos partes**: identificación del niño + ticket de recogida del padre, unidos por un código aleatorio.
2. El **check-out siempre lo ejecuta el staff autenticado**, nunca el padre por autoservicio.
3. **Ticket perdido ⇒ verificación por documento de identidad** contra los datos registrados, y la entrega queda marcada como excepción.
4. **Bitácora inmutable**: cada recepción y entrega registra hora, quién entregó/recogió al niño y qué voluntario lo procesó.
5. **Alergias visibles** en el ticket y en la lista del staff.
6. **Lista de emergencia** imprimible con todos los niños presentes y los teléfonos de contacto (protocolo de evacuación).
7. Plan B de baja tecnología: códigos cortos que puedan **escribirse a mano** si falla el internet o no hay impresora.

Fuentes principales: documentación de soporte de ChurchSuite (Getting started with Check-In, QR codes, Printing registers), Planning Center (Checking out, Security), KidCheck (Check-out procedures, Security labels, backup plan) y Breeze (Children's check-in, Setting up Check In).

## 3. Objetivos

- Registrar familias y niños en **menos de 60 segundos** por familia en la mesa de recepción.
- Generar un **ticket de recogida** que el padre pueda llevarse **sin impresora**: foto a la pantalla o mensaje de WhatsApp.
- Permitir la entrega verificada por código en **menos de 20 segundos**.
- Mantener una **bitácora completa** del día, exportable (CSV).
- Verse y sentirse parte del mismo sitio del Prácticum (misma paleta, tipografías y componentes).

### No-objetivos (v1)

- Auto-registro de padres desde su teléfono (kiosko self-service).
- Impresión de etiquetas adhesivas con impresora térmica.
- Sincronización multi-dispositivo en tiempo real (ver §9, Fase 2).
- Cuentas individuales por voluntario con permisos distintos.
- Integración con la compra de boletas de Stripe (los datos se capturan en sitio).

## 4. Usuarios y roles

| Rol | Descripción | Acceso |
|---|---|---|
| **Voluntario del Área Infantil** | Opera la mesa de recepción/entrega. Escribe su nombre al iniciar sesión; ese nombre queda sellado en cada movimiento. | Contraseña compartida del equipo |
| **Padre / madre / tutor** | Entrega y recoge a sus hijos. **No usa la aplicación**: solo recibe su ticket (foto o WhatsApp) y presenta el código al recoger. | Ninguno |
| **Coordinador** | Mismo acceso que un voluntario; usa la lista de emergencia, el historial y la exportación. | Contraseña compartida |

## 5. Flujos principales

### 5.1 Recepción (check-in)

1. El voluntario inicia sesión (nombre + contraseña del equipo).
2. En **«Recibir niños»** captura: nombre del padre/tutor, teléfono WhatsApp, personas autorizadas (opcional) y cada niño (nombre, edad, alergias/notas).
3. Al pulsar **«Recibir y generar ticket»**: se crea la familia con un número secuencial (`F-07`) y un **PIN aleatorio de 4 dígitos**, todos los niños quedan «Presentes», y se registra el movimiento con hora y voluntario.
4. Se muestra el **ticket de recogida**: el padre le toma foto, o el voluntario lo envía por WhatsApp con un toque (mensaje pre-redactado al número capturado). También puede imprimirse.

> Decisión: **un código por familia**, no por niño. Es el modelo de Planning Center (una etiqueta de seguridad por check-in, compartida por hermanos). Para 60 familias en un solo salón, simplifica el ticket sin perder seguridad; cada niño se entrega individualmente de todas formas (§5.2).

### 5.2 Entrega (check-out)

1. En **«Presentes»**, el voluntario busca al niño (por nombre, familia o código) y pulsa **«Entregar»**.
2. El modal muestra el resumen del niño (familia, padre, teléfono, alergias) y pide el **código del ticket**.
   - Código correcto → confirmación verde, se habilita la entrega.
   - Código incorrecto → advertencia roja; el botón permanece bloqueado.
3. Se captura **quién recoge** (pre-llenado con el padre; el hint muestra los autorizados).
4. **Ticket perdido:** un desplegable explícito exige verificar **cédula u otro documento** y anotarlo; la entrega queda registrada como «verificada por documento» (excepción auditable).
5. Al confirmar: movimiento «Entregado» con hora, persona que recogió, método de verificación y voluntario.

### 5.3 Reingreso

Si un niño salió (p. ej., almorzó con sus padres) y regresa, desde **«Historial»** el botón **«Reingresar»** lo devuelve a «Presentes» conservando el mismo código familiar. (Los sistemas grandes regeneran el código en cada check-in; a esta escala se prioriza no emitir un segundo ticket.)

### 5.4 Emergencia y cierre del día

- **«Lista de emergencia»** imprime en un toque la tabla de todos los niños presentes con edad, alergias, familia y teléfono (protocolo de evacuación de ChurchSuite).
- Al final del día, el contador **«Presentes ahora»** debe llegar a **0**: cualquier niño restante es una alerta que obliga a llamar al padre (teléfono en la lista).
- **«Exportar CSV»** descarga la bitácora completa como respaldo.

## 6. Diseño de la interfaz — elementos y su razón de ser

La página reutiliza el sistema visual del sitio: paleta (`--navy #0F2142`, `--orange #E8743A`, `--cream #F6EEE3`), tipografías Cormorant Garamond / EB Garamond, y los componentes existentes (`.btn`, `.eyebrow`, ornamento, tarjetas estilo `.pay`/`.pi`, steppers visuales). Razón: el equipo ya conoce ese lenguaje y el ticket que recibe el padre se percibe como parte oficial del evento.

| Elemento | Diseño | Por qué |
|---|---|---|
| **Pantalla de acceso** | Fondo navy tipo hero, logo CC, campos «Tu nombre» + «Contraseña del equipo» | El nombre no es cosmético: **firma cada movimiento** de la bitácora (invariante #4). La contraseña única de equipo evita gestionar cuentas el día del evento |
| **Barra superior** | Logo + «Área Infantil», voluntario activo y botón «Salir» | Siempre visible quién está operando; cambiar de turno = salir y entrar con otro nombre |
| **Tarjetas de estadísticas** | «Presentes ahora» (verde) / «Registrados» / «Entregados» | El número operativo clave es *presentes*: es la carga real del área y debe ser 0 al cierre. Mismo estilo `.stat` del sitio |
| **Pestañas** | Recibir · Presentes (con contador) · Historial | Tres momentos del día = tres vistas. El badge naranja en «Presentes» da el conteo sin entrar |
| **Formulario familiar** | Padre + teléfono + autorizados, luego filas de niños con «+ Agregar otro niño» | Modelo familia→niños refleja cómo llegan (una madre con 3 hijos = un solo registro). Las filas dinámicas evitan formularios largos |
| **Campo alergias/notas por niño** | Texto libre por fila; se muestra como **chip rojo** en la lista y en el ticket | Invariante #5: la alergia debe perseguir al niño en cada pantalla, no vivir enterrada en un registro |
| **Ticket de recogida** | Cabecera navy con logo, código gigante `F-07 · 4832`, lista de niños, instrucciones | Legible en una foto de teléfono (los padres no cargan impresora). El PIN aleatorio de 4 dígitos se puede **dictar o escribir a mano** si todo falla (invariante #7) |
| **Botón «Enviar por WhatsApp»** | `wa.me` al teléfono capturado con el ticket pre-redactado | Equivalente de bajo costo al recibo digital por SMS de KidCheck; el comprobante queda en el teléfono del padre, imposible de perder |
| **Lista «Presentes»** | Avatar con iniciales, nombre + chips (alergia, código familiar), hora de entrada, botón «Entregar» | Todo lo que el voluntario necesita para decidir está en la fila; búsqueda por cualquier dato porque en la práctica llegan diciendo «vengo por Lucas» |
| **Modal de entrega con PIN** | Campo de código grande, validación en vivo (verde/rojo), botón bloqueado hasta verificar | La verificación **precede** a la entrega y el botón deshabilitado lo fuerza físicamente (invariantes #2 y #3). El campo grande permite que el padre mismo lo digite |
| **Desplegable «ticket perdido»** | Cerrado por defecto, con advertencia ámbar y campo de documento obligatorio | La excepción existe pero **cuesta un paso extra** y deja rastro distinto («verificada por documento»), igual que el protocolo de KidCheck |
| **Historial** | Cronología inversa: Recibido (verde) / Entregado (naranja) con detalle de personas y voluntario; botón «Reingresar» cuando aplica | Es la bitácora auditable del día; los colores separan de un vistazo entradas y salidas |
| **Lista de emergencia** | Botón en «Presentes» → tabla imprimible (solo `@media print`) | En evacuación no se navega una app: se imprime o se muestra la tabla completa con teléfonos |
| **Exportar CSV** | Descarga toda la bitácora con BOM UTF-8 (abre bien en Excel) | Respaldo y rendición de cuentas post-evento |

## 7. Modelo de datos

Almacenado como JSON (v1: `localStorage`, clave `practicum2026_ninos_v1`):

```js
{
  families: [{
    id, famNo,            // secuencial: F-01, F-02…
    pin,                  // 4 dígitos aleatorios — el código de recogida
    parent, phone, auth,  // tutor principal, WhatsApp, autorizados (texto)
    children: [{ id, name, age, notes }],
    createdAt
  }],
  log: [{                 // bitácora "append-only": nunca se edita ni borra
    ts, type,             // "in" | "out"
    childId, famId,
    vol,                  // voluntario autenticado que procesó
    who,                  // persona que entregó/recogió al niño
    method,               // "registro" | "codigo" | "documento" | "reingreso"
    note                  // p. ej. documento verificado
  }]
}
```

El estado de un niño (Presente/Entregado) **se deriva del último movimiento de la bitácora**, no se guarda aparte: elimina la posibilidad de inconsistencia entre lista y registro.

## 8. Seguridad

- **En producción (Netlify):** la contraseña se valida en el servidor (`ninos-login.mjs`) contra la variable de entorno **`NINOS_PASSWORD`**, con comparación en tiempo constante. El servidor devuelve un token (HMAC derivado de la contraseña) que autoriza las llamadas al estado compartido (`ninos-state.mjs`). La contraseña real nunca se guarda en el navegador.
- **Modo local (fallback):** si las funciones no responden (desarrollo local, sitio estático), la página cae a la comparación con hash SHA-256 en el navegador (contraseña `practicum2026`) y los datos viven solo en ese dispositivo. El indicador de la barra superior muestra el modo activo: «Sincronizado», «Sin conexión» o «Modo local».
- `noindex, nofollow` para no aparecer en buscadores; la URL no se enlaza desde la página pública.
- Los datos de los niños solo viajan entre el navegador y las funciones del propio sitio, salvo el ticket enviado por WhatsApp al propio padre.

## 9. Fases

**Fase 1 — Prototipo (hecha):** `ninos.html` autónomo con `localStorage`. Un solo dispositivo. Sigue funcionando como fallback sin conexión.

**Fase 2 — Producción (hecha):**
1. **Login en el servidor:** `netlify/functions/ninos-login.mjs` valida contra `NINOS_PASSWORD` y emite un token de sesión.
2. **Estado compartido multi-dispositivo:** `netlify/functions/ninos-state.mjs` guarda familias y bitácora en **Netlify Blobs** (store `ninos`). Cada dispositivo empuja sus cambios (con reintento implícito: siempre envía su estado completo) y consulta cada 20 s y al volver a la pestaña. La fusión es una **unión por id** — las familias son inmutables y la bitácora es append-only, así que ningún dispositivo puede sobrescribir ni borrar lo de otro, y una escritura perdida se recupera en el siguiente ciclo.
3. `localStorage` pasa a ser la caché local/offline; si se cae el internet, la mesa sigue operando y sincroniza al volver.

**Configuración requerida en Netlify:** definir la variable de entorno **`NINOS_PASSWORD`** (Site settings → Environment variables) con la contraseña real del equipo antes del evento. Sin ella, las funciones responden error y la página queda en modo local.

**Fase 3 — Opcional futuro:** QR en el ticket (escaneo en vez de digitar el PIN) y pre-registro vinculado a la compra en Stripe (metadata `kids`).

> Nota de la fusión multi-dispositivo: dos mesas registrando a la vez pueden emitir el mismo número de familia (`F-07`) con PIN distinto; el código completo (familia + PIN) sigue siendo único y la verificación de entrega no se ve afectada.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Se borra el `localStorage` (limpiar historial, modo incógnito) | El estado vive también en Netlify Blobs: al volver a entrar se descarga completo. Exportar CSV a media jornada como respaldo adicional |
| Padre sin teléfono/foto del ticket | El código cabe en un papel escrito a mano; fallback de cédula siempre disponible |
| Se cae el internet del local | La página sigue operando con la caché local y muestra «Sin conexión»; sincroniza al volver la señal |
| Olvidar configurar `NINOS_PASSWORD` en Netlify | La página cae a modo local (un solo dispositivo) — verificar el indicador «Sincronizado» al montar la mesa |
| Contraseña filtrada | Es solo la primera barrera; la entrega física siempre exige además el PIN del ticket o cédula |

## 11. Métricas de éxito (día del evento)

- 100 % de los niños entregados con código verificado o excepción documentada (0 entregas sin registro).
- «Presentes ahora» = 0 al cierre, sin niños sin reclamar más de 15 min después de las 4:00 p.m.
- Tiempo medio de recepción por familia < 60 s; de entrega < 20 s.
