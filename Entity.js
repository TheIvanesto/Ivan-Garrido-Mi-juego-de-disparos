/**
 * Cada uno de los elementos del juego
 */
class Entity {
    /**
     * Inicializa un elemento del juego
     * @param game {Game} La instancia del juego al que pertenece el elemento
     * @param width {Number} Ancho del elemento
     * @param height {Number} Alto del elemento
     * @param x {Number} Posición horizontal del elemento
     * @param y {Number} Posición vertical del elemento
     * @param speed {Number} Velocidad del elemento
     * @param myImage {String} Ruta de la imagen del elemento
     */
    constructor (game, width, height, x, y, speed, myImage) {
        this.game = game;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.myImage = myImage;
        this.image = new Image();
        // placeholder while we resolve the correct asset path
        this.image.src = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="#222"/><text x="50%" y="55%" font-size="12" fill="#fff" text-anchor="middle">Cargando</text></svg>');
        // Resolve the correct asset path among several candidates (original, relative, root, subfolder)
        (async () => {
            try {
                const resolved = await resolveAssetPath(this.myImage);
                if (resolved) this.image.src = resolved;
            } catch (e) {
                // leave placeholder or the original string
                try { this.image.src = this.myImage; } catch (err) {}
            }
        })();
        this.image.className =  this.constructor.name;
        this.image.style.position = "absolute";
        this.image.style.height = this.height === "auto" ? "auto" : `${this.height}px`;
        this.image.style.width = this.width === "auto" ? "auto" : `${this.width}px`;
        this.image.style.top = `${this.y}px`;
        this.image.style.left = `${this.x}px`;
        document.body.appendChild(this.image);
    }

    remove() {
      document.body.removeChild(this.image);
    }

    /**
     * Actualiza la posición del elemento en la pantalla
     */
    render () {
        this.image.style.top = `${this.y}px`;
        this.image.style.left = `${this.x}px`;
    }
}

// Helper: intenta varias ubicaciones para encontrar un asset que cargue correctamente
// Usa un Image() temporal con onload/onerror para evitar problemas con respuestas HTML reescritas por el host.
function resolveAssetPath(originalPath, timeout = 3000) {
    if (!originalPath) return Promise.resolve(null);
    const candidates = [];
    candidates.push(originalPath);
    if (!originalPath.startsWith('./') && !originalPath.startsWith('/')) candidates.push('./' + originalPath);
    if (!originalPath.startsWith('/')) candidates.push('/' + originalPath);
    if (!originalPath.startsWith('/juego_entrega/')) candidates.push('/juego_entrega/' + (originalPath.startsWith('./') ? originalPath.slice(2) : originalPath.replace(/^\//, '')));

    return new Promise((resolve) => {
        let i = 0;
        const tryNext = () => {
            if (i >= candidates.length) return resolve(null);
            const c = candidates[i++];
            const img = new Image();
            let done = false;
            const onSuccess = () => { if (!done) { done = true; cleanup(); resolve(c); } };
            const onFail = () => { if (!done) { done = true; cleanup(); tryNext(); } };
            const cleanup = () => { clearTimeout(timer); img.onload = img.onerror = null; };
            const timer = setTimeout(onFail, timeout);
            img.onload = onSuccess;
            img.onerror = onFail;
            // try to load
            try { img.src = c; } catch (e) { onFail(); }
        };
        tryNext();
    });
}
