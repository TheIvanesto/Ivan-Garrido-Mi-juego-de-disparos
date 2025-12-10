/* Reemplazado por la versión limpia dentro de juego_entrega/main.js */
/* Copiada del archivo auto-contenido para evitar errores de sintaxis en la versión raíz */
/* Constantes de recursos y dimensiones (selección robusta según despliegue) */
let OPPONENT_HEIGHT, OPPONENT_PICTURE, OPPONENT_PICTURE_DEAD, OPPONENT_SPEED, OPPONENT_WIDTH, GAME_OVER_PICTURE, PLAYER_HEIGHT, PLAYER_PICTURE, PLAYER_PICTURE_DEAD, PLAYER_SPEED, PLAYER_WIDTH, SHOT_HEIGHT, SHOT_SPEED, SHOT_WIDTH;
if (location.pathname.includes('/juego_entrega/')) {
    // cuando se sirve desde /juego_entrega usamos los SVGs que incluimos en esa carpeta
    const BASE = '/juego_entrega';
    OPPONENT_HEIGHT = 5;
    OPPONENT_PICTURE = BASE + '/assets/malo.svg';
    OPPONENT_PICTURE_DEAD = BASE + '/assets/malo_muerto.svg';
    OPPONENT_SPEED = 5;
    OPPONENT_WIDTH = 5;
    GAME_OVER_PICTURE = BASE + '/assets/game_over.svg';
    PLAYER_HEIGHT = 5;
    PLAYER_PICTURE = BASE + '/assets/bueno.svg';
    PLAYER_PICTURE_DEAD = BASE + '/assets/bueno_muerto.svg';
    PLAYER_SPEED = 20;
    PLAYER_WIDTH = 5;
    SHOT_HEIGHT = 1.5;
    SHOT_SPEED = 20;
    SHOT_WIDTH = 1.5;
} else {
    // cuando se sirve desde la raíz usamos los PNGs disponibles en la raíz
    const BASE = '';
    OPPONENT_HEIGHT = 5;
    OPPONENT_PICTURE = BASE + '/assets/malo.png';
    OPPONENT_PICTURE_DEAD = BASE + '/assets/malo_muerto.png';
    OPPONENT_SPEED = 5;
    OPPONENT_WIDTH = 5;
    GAME_OVER_PICTURE = BASE + '/assets/game_over.png';
    PLAYER_HEIGHT = 5;
    PLAYER_PICTURE = BASE + '/assets/bueno.png';
    PLAYER_PICTURE_DEAD = BASE + '/assets/bueno_muerto.png';
    PLAYER_SPEED = 20;
    PLAYER_WIDTH = 5;
    SHOT_HEIGHT = 1.5;
    SHOT_SPEED = 20;
    SHOT_WIDTH = 1.5;
}

/* Constantes de teclas */
const KEY_LEFT = 'LEFT';
const KEY_RIGHT = 'RIGHT';
const KEY_SHOOT = 'SHOOT';
const MIN_TOUCHMOVE = 30;

/* Recursos/constantes para los proyectiles amarillos (asegurar visibilidad) */
const SHOT_PICTURE_PLAYER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"><rect width="10" height="20" fill="yellow" rx="2"/></svg>');
const SHOT_PICTURE_OPPONENT = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"><rect width="10" height="20" fill="orange" rx="2"/></svg>');

/* Variables globales */
window.deferredInstallPrompt = null;
window.game = undefined;

window.addEventListener('load', () => {
    document.body.classList.remove('loading');
    setupTopbar();
    window.game = new Game();
    window.game.start();
    registerServiceWorkerMultiPath(['./sw.js', '/sw.js', '/juego_entrega/sw.js']);
    setupInstallButton();
    setupFixCacheButton();
});

function setupTopbar() {
    const topbar = document.createElement('div');
    topbar.id = 'topbar';
    topbar.innerHTML = `\
      <div class="title">Shooter PWA</div>\
      <div class="controls">\
        <button id="reset" class="gamebutton">NUEVA PARTIDA</button>\
        <button id="pause" class="gamebutton">Pausa</button>\
        <button id="installButton" class="gamebutton" style="display:none">Instalar</button>\
      </div>\
    `;
    document.body.appendChild(topbar);
}

function setupInstallButton() {
    const installBtn = document.getElementById('installButton');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredInstallPrompt = e;
        if (installBtn) installBtn.style.display = 'inline-block';
    });
    if (installBtn) installBtn.addEventListener('click', async () => {
        if (window.deferredInstallPrompt) {
            window.deferredInstallPrompt.prompt();
            const choice = await window.deferredInstallPrompt.userChoice;
            if (choice && choice.outcome === 'accepted') {
                installBtn.style.display = 'none';
                window.deferredInstallPrompt = null;
            }
        } else {
            showInstallFallback();
        }
    });
}

function showInstallFallback() {
    const modal = document.createElement('div');
    modal.id = 'install-modal';
    modal.innerHTML = `\
        <div class="install-card">\
            <h3>Instalación</h3>\
            <p>Para instalar en iOS: toca el icono de compartir y selecciona "Añadir a pantalla de inicio".</p>\
            <button id="install-modal-close" class="gamebutton">Cerrar</button>\
        </div>\
    `;
    document.body.appendChild(modal);
    document.getElementById('install-modal-close').addEventListener('click', () => modal.remove());
}

function setupFixCacheButton() {
    const debug = document.createElement('div');
    debug.id = 'debug-overlay';
    debug.innerHTML = `\
      <button id="fix-sw-btn" class="gamebutton" style="display:none;">Fix Cache</button>\
    `;
    document.body.appendChild(debug);
    const fixBtn = document.getElementById('fix-sw-btn');
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg && reg.waiting) fixBtn.style.display = 'inline-block';
        }).catch(()=>{});
    }
    fixBtn.addEventListener('click', async () => {
        try {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const r of regs) await r.unregister();
            const cacheNames = await caches.keys();
            for (const name of cacheNames) await caches.delete(name);
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
    if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
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

// Exponer variables para pruebas
if (typeof module !== 'undefined') module.exports = {SHOT_PICTURE_PLAYER, SHOT_PICTURE_OPPONENT};