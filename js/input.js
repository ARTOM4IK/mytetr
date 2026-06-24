class Input {
    constructor() {
        this.keys = {};
        this.das = {};
        this.lastAction = {};

        window.addEventListener("keydown", (e) => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
                e.preventDefault();
            }
            if (!this.keys[e.code]) {
                this.das[e.code] = performance.now();
                this.lastAction[e.code] = 0;
            }
            this.keys[e.code] = true;
        });

        window.addEventListener("keyup", (e) => {
            this.keys[e.code] = false;
            delete this.das[e.code];
            delete this.lastAction[e.code];
        });
    }

    pressed(code) {
        return !!this.keys[code];
    }

    /**
     * Returns true when action should fire (initial press or DAS/ARR repeat).
     */
    shouldRepeat(code, dasDelay = DAS_DELAY, arrRate = ARR_RATE) {
        if (!this.keys[code]) return false;

        const now = performance.now();
        const dasStart = this.das[code];

        if (dasStart === undefined) return false;

        if (now - dasStart < dasDelay) {
            if (this.lastAction[code] === 0) {
                this.lastAction[code] = now;
                return true;
            }
            return false;
        }

        const last = this.lastAction[code] || dasStart;
        if (now - last >= arrRate) {
            this.lastAction[code] = now;
            return true;
        }

        return false;
    }

    consume(code) {
        this.keys[code] = false;
        delete this.das[code];
        delete this.lastAction[code];
    }
}
