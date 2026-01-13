# Shooter PWA

Este repositorio contiene un sencillo shooter adaptado para funcionar como Progressive Web App (PWA).

Instrucciones rápidas:

- Para probar localmente (registrar service worker) sirve la carpeta con HTTP (no `file://`). Por ejemplo:
  - `python -m http.server 8000` o `npx http-server -p 8000` en Windows PowerShell.
- Abre `http://localhost:8000/` y el juego debería cargarse y registrar el Service Worker.

Despliegue en Vercel:

- Puedes subir el repositorio tal cual. Si subes sólo la carpeta `juego_entrega`, en Vercel establece "Root Directory" a `juego_entrega`. Si subes la raíz, no hace falta cambiar nada.
- Si la versión desplegada muestra comportamientos extraños (scripts cacheados viejos), ejecuta el snippet de limpieza de caché desde la consola del navegador (DevTools):

```js
(async () => {
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const r of regs) await r.unregister();
  const keys = await caches.keys();
  for (const k of keys) await caches.delete(k);
  location.reload();
})();
```

Mejoras pendientes:

- Reemplazar los iconos placeholder por PNGs optimizados (192x192, 512x512) para mejorar la apariencia en la pantalla de inicio.
- Si desplegas usando la carpeta `juego_entrega` y los assets binarios no aparecen, copia `assets/` dentro de `juego_entrega/`.
