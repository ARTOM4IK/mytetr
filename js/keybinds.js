class Keybinds {
    static STORAGE_KEY = "tetris_keybinds";

    static DEFAULTS = {
        left: "ArrowLeft",
        right: "ArrowRight",
        down: "ArrowDown",
        rotate: "ArrowUp",
        rotateCCW: "KeyZ",
        hold: "KeyC",
        drop: "Space",
        pause: "Escape",
        restart: "KeyR"
    };

    static LABELS = {
        left: "Влево",
        right: "Вправо",
        down: "Софт дроп",
        rotate: "Поворот ↻",
        rotateCCW: "Поворот ↺",
        hold: "Hold",
        drop: "Hard drop",
        pause: "Пауза",
        restart: "Рестарт"
    };

    static ORDER = [
        "left", "right", "down", "rotate", "rotateCCW",
        "hold", "drop", "pause", "restart"
    ];

    constructor() {
        this.binds = this.load();
        this.listening = null;
    }

    load() {
        try {
            const raw = localStorage.getItem(Keybinds.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                const merged = { ...Keybinds.DEFAULTS };
                for (const action of Keybinds.ORDER) {
                    if (typeof parsed[action] === "string" && parsed[action]) {
                        merged[action] = parsed[action];
                    }
                }
                return merged;
            }
        } catch (_) {}
        return { ...Keybinds.DEFAULTS };
    }

    save() {
        localStorage.setItem(Keybinds.STORAGE_KEY, JSON.stringify(this.binds));
    }

    getKeyMap() {
        return { ...this.binds };
    }

    get(action) {
        return this.binds[action] || Keybinds.DEFAULTS[action];
    }

    set(action, code) {
        for (const key of Keybinds.ORDER) {
            if (key !== action && this.binds[key] === code) {
                this.binds[key] = Keybinds.DEFAULTS[key];
            }
        }
        this.binds[action] = code;
        this.save();
    }

    reset() {
        this.binds = { ...Keybinds.DEFAULTS };
        this.save();
    }

    static formatCode(code) {
        const special = {
            ArrowLeft: "←",
            ArrowRight: "→",
            ArrowUp: "↑",
            ArrowDown: "↓",
            Space: "Space",
            Escape: "Esc",
            ShiftLeft: "Shift",
            ShiftRight: "Shift",
            ControlLeft: "Ctrl",
            ControlRight: "Ctrl",
            Enter: "Enter",
            Backspace: "Backspace",
            Tab: "Tab"
        };
        if (special[code]) return special[code];
        if (code.startsWith("Key")) return code.slice(3);
        if (code.startsWith("Digit")) return code.slice(5);
        return code;
    }
}
