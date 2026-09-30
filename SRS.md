# SRS - amargómetro.

## 1. Propósito
App pública para anotar los mates del día y obtener un resumen propio ("wrapped"), con identidad uruguaya, joda pero cuidada.

## 2. Requisitos duros
- RD-1. Los datos viven **solo** en el navegador de cada usuario (`localStorage`). Sin backend, sin cuentas, sin envío de datos a terceros.
- RD-2. La UI aclara explícitamente "Tus datos viven en tu navegador": franja fija arriba y bloque completo con acciones de datos.
- RD-3. Costo cero: sitio estático, sin servicios de pago.
- RD-4. Sin Google (ni Fonts ni otros): fuentes self-hosted, sin analítica de terceros.
- RD-5. Solo pnpm.

## 3. Requisitos funcionales
- RF-1. Anotar un mate con un toque, con tipo (amargo, dulce, con yuyos, lavado) y Deshacer.
- RF-2. Cargar un mate con fecha y hora pasadas. No se aceptan futuras.
- RF-3. Listar los mates de hoy y borrar uno (con Deshacer).
- RF-4. Barras de los últimos 7 días con conteo.
- RF-5. Wrapped por período (semana = 7 días con hoy, mes = 30 días, todo): total, litros, racha, tipo dominante, hora pico y titular según la franja.
- RF-6. Compartir imagen 1080x1920 generada en el cliente (Web Share con archivo; si no hay, descarga PNG).
- RF-7. Exportar a JSON, importar desde JSON (suma sin duplicar por hora+tipo; descarta entradas inválidas) y borrar todo con confirmación propia (sin diálogos nativos).
- RF-8. Historial por día.
- RF-9. Tema claro / oscuro: sigue al sistema, con override guardado en el navegador.

## 4. Datos
- Clave `amargometro:v1`: `{ "v": 1, "entries": [{ "id": string, "t": epoch_ms, "k": "amargo|dulce|yuyos|lavado" }] }`.
- Preferencias locales: `amargometro:tema`, `amargometro:tipo`.
- Litros = mates x 150 ml. Es una estimación y se dice así.
- Racha: días consecutivos con al menos un mate; si hoy todavía no hay, cuenta desde ayer.
- Días y horas en la zona horaria del dispositivo.

## 5. No funcionales
- Mobile-first, probado en 390 y 1280; sin desbordes.
- Controles reales (botones), sin valores por defecto del navegador visibles.
- Accesible: foco visible, `aria-label` en controles de icono, `aria-live` en avisos, respeta `prefers-reduced-motion`.
- Si `localStorage` falla (modo privado estricto), se avisa y se sugiere exportar.

## 6. Fuera de alcance
Cuentas, sincronización entre dispositivos, ranking o comparación con otros usuarios, notificaciones, analítica de eventos por mate.

## 7. Verificación
`pnpm test` (lógica) y prueba manual con capturas en 390 y 1280, claro y oscuro, estado vacío y con datos.
