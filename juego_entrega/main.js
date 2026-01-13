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
    // Use small inline yellow bullets to guarantee visibility
    SHOT_PICTURE_PLAYER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="8" height="16" viewBox="0 0 8 16"><rect width="8" height="16" rx="2" fill="%23ffd400"/></svg>',
    SHOT_PICTURE_OPPONENT = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="8" height="16" viewBox="0 0 8 16"><rect width="8" height="16" rx="2" fill="%23ffd400"/></svg>',
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
function initGame() {
    try {
        game = new Game();
        game.start();
    } catch (err) {
        console.error('Error iniciando el juego:', err);
        try { showDebugOverlay('Error iniciando el juego: ' + (err.stack || err.message)); } catch(e){}
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    // DOM already ready
    initGame();
}

// Sanity check: if the game didn't start (common cause: old Service Worker cached files),
// show a small fix hint allowing the user to clear caches and reload.
setTimeout(() => {
    try {
        if (window.game && !window.game.started) {
            showDebugOverlay('Advertencia: el juego no ha arrancado correctamente.\nPulsa "Fix Cache" para limpiar caches y recargar.');
            let el = document.getElementById('debug-overlay');
            if (el && !document.getElementById('fix-sw-btn')) {
                const btn = document.createElement('button');
                btn.id = 'fix-sw-btn';
                btn.className = 'gamebutton';
                btn.textContent = 'Fix Cache';
                btn.style.marginTop = '8px';
                btn.addEventListener('click', async () => {
                    try {
                        const regs = await navigator.serviceWorker.getRegistrations();
                        await Promise.all(regs.map(r => r.unregister()));
                    } catch (e) {}
                    try { await caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))); } catch(e){}
                    location.reload();
                });
                el.appendChild(btn);
            }
        }
    } catch (e) {}
}, 2000);

// Global error overlay to surface runtime errors when debugging on remote hosts
function showDebugOverlay(msg) {
    let el = document.getElementById('debug-overlay');
    if (!el) {
        el = document.createElement('div');
        el.id = 'debug-overlay';
        document.body.appendChild(el);
    }
    el.textContent = msg;
}

window.addEventListener('error', (e) => {
    const msg = `Error: ${e.message}\nAt: ${e.filename}:${e.lineno}:${e.colno}`;
    console.error(msg);
    try { showDebugOverlay(msg); } catch (err) {}
});

window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason ? (ev.reason.stack || ev.reason) : 'Unknown rejection';
    const msg = `Unhandled Rejection:\n${reason}`;
    console.error(msg);
    try { showDebugOverlay(msg); } catch (err) {}
});

// Register service worker on secure origins (HTTPS) or localhost
const ENABLE_SERVICE_WORKER = ('serviceWorker' in navigator) && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
if (ENABLE_SERVICE_WORKER) {
    // register at site root to cover whole app
    // Try multiple locations for the service worker to be robust across root/subfolder deployments
    const swCandidates = ['/sw.js', './sw.js', '/juego_entrega/sw.js'];
    (async function registerSW() {
        for (const swPath of swCandidates) {
            try {
                const registration = await navigator.serviceWorker.register(swPath);
                console.log('Service Worker registrado con éxito desde', swPath, registration);

                // If there's an updated SW waiting, tell it to skipWaiting
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }

                // Listen for updates found
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // New content available, request skipWaiting
                                console.log('Nueva versión disponible - solicitando activación...');
                                newWorker.postMessage({ type: 'SKIP_WAITING' });
                            }
                        }
                    });
                });
                return; // if succeeded, stop trying other paths
            } catch (err) {
                console.warn('Registro SW falló en', swPath, err && err.message);
                // try next candidate
            }
        }
        console.warn('No se pudo registrar ningún Service Worker. Ningún candidato funcionó.');
    })();
    
    // Reload when the controlling worker changes (after skipWaiting)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Controlador de service worker cambiado. Recargando página...');
        window.location.reload();
    });
    
    
} else {
    console.log('Service Worker no registrado: entorno no seguro o no soportado');
}
} else {
    console.log('Service Worker no registrado: entorno no seguro o no soportado');
}

// beforeinstallprompt handler to show custom install button
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installButton = document.getElementById('installButton');
    if (installButton) {
        installButton.style.display = 'inline-block';
        // ensure we don't attach multiple handlers
        if (!installButton.dataset.handler) {
            installButton.addEventListener('click', async () => {
                // If we have the prompt event, use it
                if (deferredPrompt) {
                    installButton.style.display = 'none';
                    deferredPrompt.prompt();
                    const choiceResult = await deferredPrompt.userChoice;
                    if (choiceResult.outcome === 'accepted') {
                        console.log('Usuario aceptó la instalación');
                    } else {
                        console.log('Usuario rechazó la instalación');
                    }
                    deferredPrompt = null;
                } else {
                    // Fallback: show manual instructions modal
                    const modal = document.getElementById('install-modal');
                    if (modal) modal.style.display = 'flex';
                }
            });
            installButton.dataset.handler = 'true';
        }
    }
});

// Show install button proactively with fallback that opens modal with instructions
document.addEventListener('DOMContentLoaded', () => {
    const installButton = document.getElementById('installButton');
    const modalClose = document.getElementById('install-modal-close');
    const modal = document.getElementById('install-modal');

    // Don't show install button if already in standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (installButton && !isStandalone) {
        installButton.style.display = 'inline-block';
        if (!installButton.dataset.handler) {
            installButton.addEventListener('click', async () => {
                if (deferredPrompt) {
                    installButton.style.display = 'none';
                    deferredPrompt.prompt();
                    const choiceResult = await deferredPrompt.userChoice;
                    if (choiceResult.outcome === 'accepted') {
                        console.log('Usuario aceptó la instalación');
                    } else {
                        console.log('Usuario rechazó la instalación');
                    }
                    deferredPrompt = null;
                } else {
                    if (modal) modal.style.display = 'flex';
                }
            });
            installButton.dataset.handler = 'true';
        }
    }

    if (modalClose && modal) {
        modalClose.addEventListener('click', () => { modal.style.display = 'none'; });
    }
});

// Optional: hide install button if appinstalled
window.addEventListener('appinstalled', () => {
    console.log('PWA instalada');
    const installButton = document.getElementById('installButton');
    if (installButton) installButton.style.display = 'none';
});