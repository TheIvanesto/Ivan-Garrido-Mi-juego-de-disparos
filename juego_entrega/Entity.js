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
        this.image.className =  this.constructor.name;
        this.image.style.position = "absolute";
        this.image.style.height = this.height === "auto" ? "auto" : `${this.height}px`;
        this.image.style.width = this.width === "auto" ? "auto" : `${this.width}px`;
        this.image.style.top = `${this.y}px`;
        this.image.style.left = `${this.x}px`;
        document.body.appendChild(this.image);

        // Fallback de imágenes: intentar svg/png, con/sin slash, y /juego_entrega/ si procede
        const candidates = [];
        const add = (s) => { if (!s) return; if (!candidates.includes(s)) candidates.push(s); };
        add(this.myImage);
        if (this.myImage) {
            if (this.myImage.match(/\.png$/i)) add(this.myImage.replace(/\.png$/i, '.svg'));
            if (this.myImage.match(/\.svg$/i)) add(this.myImage.replace(/\.svg$/i, '.png'));
            if (this.myImage.startsWith('/')) add(this.myImage.slice(1)); else add('/' + this.myImage);
            if (!this.myImage.includes('/juego_entrega/')) add('/juego_entrega/' + this.myImage.replace(/^\//, ''));
        }

        let idx = 0;
        console.info('Entity(subfolder): image candidates for', this.myImage, candidates);
        const tryNext = () => {
            if (idx >= candidates.length) {
                console.error('Entity(subfolder): no candidate loaded for', this.myImage);
                return;
            }
            const src = candidates[idx];
            console.debug('Entity(subfolder): trying src', src, 'for', this.myImage);
            this.image.onerror = () => { console.warn('Entity(subfolder): failed to load', src); idx++; tryNext(); };
            this.image.onload = () => { console.info('Entity(subfolder): loaded', src); };
            this.image.src = src;
        };
        tryNext();
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
