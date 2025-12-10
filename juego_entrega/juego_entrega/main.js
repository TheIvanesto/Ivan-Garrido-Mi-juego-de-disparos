/*
Main del juego: carga los recursos, registra el service worker y maneja la instalación (PWA)
*/

// Constantes de teclas
const KEY_LEFT = 'LEFT';
const KEY_RIGHT = 'RIGHT';
const KEY_SHOOT = 'SHOOT';
const MIN_TOUCHMOVE = 30;

// Recursos/constantes para los proyectiles amarillos (asegurar visibilidad)
const SHOT_PICTURE_PLAYER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"><rect width="10" height="20" fill="yellow" rx="2"/></svg>');
const SHOT_PICTURE_OPPONENT = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"><rect width="10" height="20" fill="orange" rx="2"/></svg>');

// Variables globales
window.deferredInstallPrompt = null;

// Referencia global al juego
window.game = undefined;

// Inicializar juego cuando el DOM esté listo
window.addEventListener('load', () => {
    document.body.classList.remove('loading');

    // Inicializar la interfaz básica
    setupTopbar();

    // Crear instancia del juego
    window.game = new Game();
    window.game.start();

    // Registrar service worker (intentando varias rutas por si el despliegue usa subcarpeta)
    registerServiceWorkerMultiPath(['./sw.js', '/sw.js', '/juego_entrega/sw.js']);

    // Instalar manejadores PWA
    setupInstallButton();

    // Mostrar botón de arreglar caché si detectamos problemas comunes (útil en despliegues)
    setupFixCacheButton();
});

function setupTopbar() {
    const topbar = document.createElement('div');
    topbar.id = 'topbar';
    topbar.innerHTML = `
      <div class="title">Shooter PWA</div>
      <div class="controls">
        <button id="reset" class="gamebutton">NUEVA PARTIDA</button>
        <button id="pause" class="gamebutton">Pausa</button>
        <button id="installButton" class="gamebutton" style="display:none">Instalar</button>
      </div>
    `;
    document.body.appendChild(topbar);
}

function setupInstallButton() {
    const installBtn = document.getElementById('installButton');

    // Detectar beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredInstallPrompt = e;
        installBtn.style.display = 'inline-block';
    });

    // Click handler para mostrar diálogo
    installBtn.addEventListener('click', async () => {
        if (window.deferredInstallPrompt) {
            window.deferredInstallPrompt.prompt();
            const choice = await window.deferredInstallPrompt.userChoice;
            if (choice && choice.outcome === 'accepted') {
                installBtn.style.display = 'none';
                window.deferredInstallPrompt = null;
            }
        } else {
            // Fallback: mostrar instrucciones para iOS
            showInstallFallback();
        }
    });
}

function showInstallFallback() {
    const modal = document.createElement('div');
    modal.id = 'install-modal';
    modal.innerHTML = `
        <div class="install-card">
            <h3>Instalación</h3>
            <p>Para instalar en iOS: toca el icono de compartir y selecciona "Añadir a pantalla de inicio".</p>
            <button id="install-modal-close" class="gamebutton">Cerrar</button>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('install-modal-close').addEventListener('click', () => modal.remove());
}

function setupFixCacheButton() {
    const debug = document.createElement('div');
    debug.id = 'debug-overlay';
    debug.innerHTML = `
      <button id="fix-sw-btn" class="gamebutton" style="display:none;">Fix Cache</button>
    `;
    document.body.appendChild(debug);

    const fixBtn = document.getElementById('fix-sw-btn');
    // Mostrar sólo si se detecta que el service worker controla la página con una versión antigua
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg && reg.waiting) {
                fixBtn.style.display = 'inline-block';
            }
        }).catch(()=>{});
    }

    fixBtn.addEventListener('click', async () => {
        try {
            // Unregister and clear cache
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const r of regs) {
                await r.unregister();
            }
            const cacheNames = await caches.keys();
            for (const name of cacheNames) {
                await caches.delete(name);
            }
            location.reload();
        } catch (e) {
            console.error('Error al limpiar cache:', e);
            alert('No se pudo limpiar la cache automáticamente. Por favor, borra la cache manualmente.');
        }
    });
}

async function registerServiceWorkerMultiPath(paths) {
    if (!('serviceWorker' in navigator)) return;
    if (!location.protocol.startsWith('https') && location.hostname !== 'localhost') return;

    for (const p of paths) {
        try {
            const reg = await navigator.serviceWorker.register(p);
            handleRegistration(reg);
            console.log('Service worker registrado en', p);
            return;
        } catch (e) {
            console.warn('Registro SW falló en', p, e);
        }
    }
}

function handleRegistration (registration) {
    // Si el worker está esperando, mostrar botón de Fix Cache
    if (registration.waiting) {
        // enviar mensaje para aplicar skipWaiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                    // Nueva versión disponible
                    if (confirm('Hay una nueva versión. ¿Recargar para actualizar?')) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                }
            }
        });
    });

    // Cuando el worker cambia de controlador, recargar para usar la nueva versión
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}

// Exponer variables para pruebas
if (typeof module !== 'undefined') module.exports = {SHOT_PICTURE_PLAYER, SHOT_PICTURE_OPPONENT};
