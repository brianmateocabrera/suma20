class Carta {
    constructor(valor, color) {
        this.valor = valor;
        this.color = color;
    }
}

class Mazo {
    constructor(colores, valores) {
        this.colores = colores;
        this.valores = valores;
        this.cartas = [];
        this.crear();
        this.mezclar();
    }

    crear() {
        this.cartas = [];
        for (let color of this.colores) {
            for (let valor of this.valores) {
                this.cartas.push(new Carta(valor, color));
            }
        }
    }

    mezclar() {
        // Mejora 1: Algoritmo de mezcla Fisher-Yates
        for (let i = this.cartas.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cartas[i], this.cartas[j]] = [this.cartas[j], this.cartas[i]];
        }
    }

    sacarCarta() {
        return this.cartas.pop();
    }
}

class Juego {
    constructor() {
        this.colores = ["rojo", "azul", "amarillo", "verde"];
        this.colorMap = {
            rojo: "firebrick",
            azul: "royalblue",
            amarillo: "goldenrod",
            verde: "seagreen"
        };
        this.valores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

        this.mazo = new Mazo(this.colores, this.valores);
        this.mesa = [];
        this.descarte = [];
        this.seleccionadas = [];
        this.puntaje = 0;
        this.maxPuntaje = parseInt(localStorage.getItem("maxScore")) || 0;

        this.iniciar();
    }

    iniciar() {
        this.mazo.crear();
        this.mazo.mezclar();
        this.mesa = [];
        this.descarte = [];
        this.seleccionadas = [];
        this.puntaje = 0;
        this.maxPuntaje = parseInt(localStorage.getItem("maxScore")) || 0;
        this.actualizarPantalla();
    }

    siguienteTurno() {
    if (this.mazo.cartas.length === 0) return;

    const carta = this.mazo.sacarCarta();

    // Obtener referencias del DOM
    const deckZone = document.getElementById("deckZone");
    const tableZone = document.getElementById("tableZone");

    // Crear un contenedor invisible como destino temporal
    const contenedorTemporal = document.createElement("div");
    contenedorTemporal.classList.add("placeholder-carta");
    tableZone.appendChild(contenedorTemporal);

    // Obtener elementos reales para animar
    const cartaMazo = deckZone.querySelector(".card-back");
    const cartaMesa = contenedorTemporal;

    // Agregar un pequeño delay (como en tu versión original)
    setTimeout(() => {
        if (cartaMesa && cartaMazo) {
            Juego.animarMovimientoCarta(cartaMazo, cartaMesa, () => {
                // 🔄 Solo después de la animación mostramos la carta real
                this.mesa.push(carta);
                this.actualizarPantalla();

                // Eliminamos el placeholder
                tableZone.removeChild(contenedorTemporal);

                this.verificarFinJuego();
            });
        }
    }, 50);
}


    seleccionarCarta(index) {
        const i = this.seleccionadas.indexOf(index);
        if (i !== -1) {
            this.seleccionadas.splice(i, 1);
        } else {
            this.seleccionadas.push(index);
        }
        this.validarSeleccion();
        this.actualizarPantalla();
    }

    validarSeleccion() {
        const seleccionadas = this.seleccionadas.map(i => this.mesa[i]);
        const suma = seleccionadas.reduce((acc, c) => acc + c.valor, 0);
        if (suma === 20) {
            this.aplicarCombinacion([...this.seleccionadas]);
            this.seleccionadas = [];
        }
    }

    aplicarCombinacion(indices) {
        const seleccionadas = indices.map(i => this.mesa[i]);
        const tableZone = document.getElementById("tableZone");
        const discardZone = document.getElementById("discardZone");

        indices.forEach(i => {
            const elem = tableZone.children[i];
            if (elem) Juego.animarMovimientoCarta(elem, discardZone);
        });

        this.descarte.push(...seleccionadas);
        this.mesa = this.mesa.filter((_, i) => !indices.includes(i));
        this.seleccionadas = [];

        if (this.mesa.length === 0) {
            this.puntaje++;
            if (this.puntaje > this.maxPuntaje) {
                this.maxPuntaje = this.puntaje;
                localStorage.setItem("maxScore", this.maxPuntaje);
            }
            const scoreElem = document.getElementById("score");
            scoreElem.classList.add("animated");
            setTimeout(() => scoreElem.classList.remove("animated"), 600);
        }

        this.actualizarPantalla();
        this.verificarFinJuego();
    }

    verificarFinJuego() {
        const sinCartas = this.mazo.cartas.length === 0;
        const sinOpciones =
            Juego.encontrarCombinaciones(this.mesa).length === 0;

        if (sinCartas && sinOpciones) {
            const tableZone = document.getElementById("tableZone");
            const discardZone = document.getElementById("discardZone");

            this.mesa.forEach((carta, index) => {
                const elem = tableZone.children[index];
                if (elem) Juego.animarMovimientoCarta(elem, discardZone);
            });

            this.descarte.push(...this.mesa);
            this.mesa = [];
            this.seleccionadas = [];

            this.actualizarPantalla();

            setTimeout(() => this.mostrarModalFin(), 600);
        }
    }

    mostrarModalFin() {
        document.getElementById("finalScore").textContent = this.puntaje;
        document.getElementById("modalOverlay").style.display = "flex";
    }

    cerrarModal() {
        document.getElementById("modalOverlay").style.display = "none";
        this.iniciar();
    }

    actualizarPantalla() {
        Juego.renderZone(
            "deckZone",
            this.mazo.cartas,
            true,
            "Mazo",
            this.colorMap
        );
        Juego.renderZone(
            "tableZone",
            this.mesa,
            false,
            "Mesa",
            this.colorMap,
            this.seleccionadas,
            i => this.seleccionarCarta(i)
        );
        Juego.renderZone(
            "discardZone",
            this.descarte,
            true,
            "Descarte",
            this.colorMap
        );
        document.getElementById("score").textContent = this.puntaje;
        document.getElementById("max-score").textContent = this.maxPuntaje;
        this.mostrarOpciones();
    }

    mostrarOpciones() {
        const opciones = Juego.encontrarCombinaciones(this.mesa);
        const contenedor = document.getElementById("options");
        contenedor.innerHTML = '<h3 style="color:white;">Opciones:</h3>';

        if (opciones.length === 0) {
            contenedor.innerHTML +=
                '<p style="color:white;">No hay combinaciones disponibles.</p>';
        } else {
            opciones.forEach((combo, index) => {
                const btn = document.createElement("button");
                // Mejora 3: uso de función formatearCombinacion
                btn.textContent = `Opción ${
                    index + 1
                }: ${Juego.formatearCombinacion(combo, this.mesa)}`;
                btn.onclick = () => this.aplicarCombinacion(combo);
                contenedor.appendChild(btn);
            });
        }
    }

    static formatearCombinacion(combo, cartas) {
        return combo.map(i => cartas[i].valor).join(" + ");
    }

    static encontrarCombinaciones(cards, objetivo = 20) {
        const resultados = [];
        function buscar(comb, start, suma) {
            if (suma === objetivo) return resultados.push([...comb]);
            if (suma > objetivo) return;
            for (let i = start; i < cards.length; i++) {
                comb.push(i);
                buscar(comb, i + 1, suma + cards[i].valor);
                comb.pop();
            }
        }
        buscar([], 0, 0);
        return resultados;
    }

    static renderZone(
        id,
        cards,
        back = false,
        label = "",
        colorMap = {},
        seleccionadas = [],
        onSelect
    ) {
        const zone = document.getElementById(id);
        zone.innerHTML = "";

        if (back && cards.length > 0) {
            if (id === "discardZone") {
                zone.appendChild(
                    Juego.renderCard(cards[cards.length - 1], colorMap)
                );
            } else {
                const div = document.createElement("div");
                div.className = "card-back";

                const logo = document.createElement("div");
                logo.className = "logo";
                logo.textContent = "Suma20";

                div.appendChild(logo);
                zone.appendChild(div);
            }
        } else {
            cards.forEach((card, index) => {
                zone.appendChild(
                    Juego.renderCard(
                        card,
                        colorMap,
                        index,
                        seleccionadas,
                        onSelect
                    )
                );
            });
        }

        if (id !== "tableZone") {
            const labelDiv = document.createElement("div");
            labelDiv.className = "count-label";
            labelDiv.textContent = `${label}: ${cards.length}`;
            zone.appendChild(labelDiv);
        }
    }

    static renderCard(
        card,
        colorMap,
        index = null,
        seleccionadas = [],
        onSelect
    ) {
        const div = document.createElement("div");
        div.className = "card";
        div.textContent = card.valor;
        const cssColor = colorMap[card.color];
        div.style.borderColor = cssColor;
        div.style.color = cssColor;
        if (index !== null) {
            div.dataset.index = index;
            if (seleccionadas.includes(index)) div.classList.add("selected");
            // Mejora 2: verificación de que onSelect existe
            if (onSelect) {
                div.onclick = () => onSelect(index);
            }
        }
        return div;
    }

    static animarMovimientoCarta(origen, destino, callback) {
        const clone = origen.cloneNode(true);
        const rectO = origen.getBoundingClientRect();
        const rectD = destino.getBoundingClientRect();

        clone.classList.add("carta-animada");
        document.body.appendChild(clone);

        clone.style.left = `${rectO.left}px`;
        clone.style.top = `${rectO.top}px`;
        clone.style.width = `${rectO.width}px`;
        clone.style.height = `${rectO.height}px`;

        requestAnimationFrame(() => {
            clone.style.transform = `translate(${rectD.left - rectO.left}px, ${
                rectD.top - rectO.top
            }px)`;
        });

        setTimeout(() => {
            document.body.removeChild(clone);
            if (callback) callback();
        }, 500);
    }
}

// Inicialización global
let juego;
function iniciarJuego() {
    juego = new Juego();
}

function nextTurn() {
    juego.siguienteTurno();
}

function cerrarModal() {
    juego.cerrarModal();
}

iniciarJuego();
