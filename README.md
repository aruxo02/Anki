# Anki App

Este proyecto es un ejemplo sencillo de una aplicación estilo Anki para web y móvil (vía Capacitor).

## Backend

En la carpeta `server` se encuentra una API escrita con Express y MongoDB. Proporciona registro y login de usuarios mediante JWT, creación de mazos y tarjetas, importación/exportación en CSV y un listado de mazos públicos.

Para iniciar el servidor:

```bash
cd server
npm install
node index.js
```

El servidor se ejecutará en `http://localhost:3001`.

## Frontend

La carpeta `client` contiene una interfaz muy básica en HTML y React (vía CDN). Para probarla, basta con abrir `client/index.html` en un navegador que tenga acceso al servidor backend.

Esta interfaz permite autenticarse, crear mazos y listarlos. Es un punto de partida para integrar con Capacitor y añadir más funcionalidades.
