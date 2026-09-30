# amargómetro.

Anotá tus mates del día y mirá tu propio wrapped (semana, mes o todo).

**Tus datos viven en tu navegador.** No hay cuentas, servidor, base de datos ni analítica de eventos. Todo se guarda en `localStorage` del dispositivo donde lo usás. Si borrás los datos del navegador, se van: por eso hay Exportar e Importar (JSON).

## Qué hace

- Un toque para anotar un mate (amargo, dulce, con yuyos, lavado), con Deshacer.
- Cargar uno de antes (fecha y hora a mano) y borrar mates sueltos.
- Wrapped de semana / mes / todo: hora pico, litros estimados (150 ml por mate), racha, estilo.
- Imagen compartible 1080x1920 generada en el propio navegador, sin footer de dominio.
- Exportar / importar / borrar todo. Importar suma sin duplicar.
- Tema claro / oscuro (sigue al sistema, se puede forzar).

## Desarrollo

Sin build. HTML + CSS + JS nativo (módulos ES) y fuentes self-hosted (Space Grotesk y DM Mono, de Fontsource).

```sh
pnpm dev     # sirve en http://localhost:4173
pnpm test    # tests de la lógica (lib.js) con node:test
```

Solo pnpm. No hay dependencias.

## Identidad

Brand kit de lucasramos.uy ([`brand`](https://github.com/lucasramosuy/brand)): papel + tinta + un acento propio, la yerba `#5c7350`. Wordmark `amargómetro.` con el punto en acento. Contenido claro; el wrapped es la tarjeta oscura.

## Estructura

| Archivo | Qué es |
| --- | --- |
| `index.html`, `styles.css`, `app.js` | La app |
| `lib.js` | Lógica pura: normalizar, estadísticas, racha, titulares |
| `test/` | Tests de `lib.js` |
| `SRS.md` | Requisitos |
