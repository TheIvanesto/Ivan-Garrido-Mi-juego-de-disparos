const OPPONENT_HEIGHT = 5,
    OPPONENT_PICTURE = "assets/malo.png",
    OPPONENT_PICTURE_DEAD = "assets/malo_muerto.png",
    OPPONENT_SPEED = 5,
    OPPONENT_WIDTH = 5,
    GAME_OVER_PICTURE = "assets/game_over.png",
    KEY_LEFT = "LEFT",
    KEY_RIGHT = "RIGHT",
    KEY_SHOOT = "SHOOT",
    MIN_TOUCHMOVE = 20,
    PLAYER_HEIGHT = 5,
    PLAYER_PICTURE = "assets/bueno.png",
    PLAYER_PICTURE_DEAD = "assets/bueno_muerto.png",
    PLAYER_SPEED = 20,
    PLAYER_WIDTH = 5,
    SHOT_HEIGHT = 1.5,
    SHOT_SPEED = 20,
    SHOT_PICTURE_PLAYER = "assets/shot1.png",
    SHOT_PICTURE_OPPONENT = "assets/shot2.png",
    SHOT_WIDTH = 1.5;

function getRandomNumber (range) {
    return Math.floor(Math.random() * range);
}

function collision (div1, div2) {
    const a = div1.getBoundingClientRect(),
        b = div2.getBoundingClientRect();
    return !(a.bottom < b.top || a.top > b.bottom || a.right < b.left || a.left > b.right);

}
var game;
window.deferredInstallPrompt = null;

document.addEventListener("DOMContentLoaded", () => {
        // Inicializar UI mínima si no existe
        if (!document.getElementById('topbar')) {
            const topbar = document.createElement('div');
            topbar.id = 'topbar';
            topbar.innerHTML = `
              <div class="left-controls">
                <button id="pause" class="gamebutton">Pausa</button>
                <button id="reset" class="gamebutton">NUEVA PARTIDA</button>
                <button id="installButton" class="gamebutton" style="display:none;">Instalar</button>
              </div>
            `;
            document.body.insertBefore(topbar, document.body.firstChild);
        }

        // Crear y arrancar el juego
        game = new Game();
        game.start();

        // Registrar service worker (ruta raíz)
        registerServiceWorkerMultiPath(['./sw.js','/sw.js','/juego_entrega/sw.js']);

        // Setup install button
        setupInstallButton();

        // Exponer botón de arreglar cache si es necesario
        setupFixCacheButton();
    }
);

function setupInstallButton() {
    const installBtn = document.getElementById('installButton');
    if (!installBtn) return;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredInstallPrompt = e;
        installBtn.style.display = 'inline-block';
    });

    installBtn.addEventListener('click', async () => {
        if (window.deferredInstallPrompt) {
            window.deferredInstallPrompt.prompt();
            const result = await window.deferredInstallPrompt.userChoice;
            if (result && result.outcome === 'accepted') {
                installBtn.style.display = 'none';
                window.deferredInstallPrompt = null;
            }
        } else {
            // Mostrar instrucciones de instalación como fallback
            const modal = document.getElementById('install-modal');
            if (modal) modal.style.display = 'block';
        }
    });
}

// Reutilizar registerServiceWorkerMultiPath y setupFixCacheButton de la versión en juego_entrega
async function registerServiceWorkerMultiPath(paths) {
    if (!('serviceWorker' in navigator)) return;
    if (!location.protocol.startsWith('https') && location.hostname !== 'localhost') return;

    for (const p of paths) {
        console.debug('SW: attempting to register', p);
        try {
            const reg = await navigator.serviceWorker.register(p);
            handleRegistration(reg);
            console.log('Service worker registrado en', p, 'scope=', reg.scope);
            return;
        } catch (e) {
            console.warn('Registro SW falló en', p, e);
        }
    }
}

function handleRegistration (registration) {
    if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                    if (confirm('Hay una nueva versión. ¿Recargar para actualizar?')) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                }
            }
        });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}

function setupFixCacheButton() {
    // Mostrar botón si detectamos un worker waiting
    const debug = document.getElementById('debug-overlay') || (() => {
        const d = document.createElement('div');
        d.id = 'debug-overlay';
        document.body.appendChild(d);
        return d;
    })();

    debug.innerHTML = `<button id="fix-sw-btn" class="gamebutton" style="display:none;">Fix Cache</button>`;
    const fixBtn = document.getElementById('fix-sw-btn');

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg && reg.waiting) {
                fixBtn.style.display = 'inline-block';
            }
        }).catch(()=>{});
    }

    fixBtn.addEventListener('click', async () => {
        try {
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