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

// Toggle service worker registration for debugging (set to true to enable)
const ENABLE_SERVICE_WORKER = false;
// Register Service Worker (disabled by default during debugging)
if (ENABLE_SERVICE_WORKER && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(registration => {
            console.log('Service Worker registrado con éxito:', registration);
        })
        .catch(error => {
            console.error('Error al registrar el Service Worker:', error);
        });
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
                installButton.style.display = 'none';
                deferredPrompt.prompt();
                const choiceResult = await deferredPrompt.userChoice;
                if (choiceResult.outcome === 'accepted') {
                    console.log('Usuario aceptó la instalación');
                } else {
                    console.log('Usuario rechazó la instalación');
                }
                deferredPrompt = null;
            });
            installButton.dataset.handler = 'true';
        }
    }
});

// Optional: hide install button if appinstalled
window.addEventListener('appinstalled', () => {
    console.log('PWA instalada');
    const installButton = document.getElementById('installButton');
    if (installButton) installButton.style.display = 'none';
});