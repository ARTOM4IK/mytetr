class UI {
    constructor() {
        this.screen = "menu";
        this.settings = {
            sound: true,
            music: true
        };
        this._keyCaptureHandler = null;
    }

    showScreen(name) {
        this.screen = name;
        document.querySelectorAll(".screen").forEach(el => {
            el.classList.toggle("active", el.id === name);
        });

        if (name !== "settingsScreen") {
            this.stopKeyCapture();
        }
    }

    renderKeybinds(keybinds) {
        const list = document.getElementById("keybindList");
        if (!list) return;

        list.innerHTML = "";

        for (const action of Keybinds.ORDER) {
            const row = document.createElement("div");
            row.className = "keybind-row";

            const label = document.createElement("span");
            label.className = "keybind-label";
            label.textContent = Keybinds.LABELS[action];

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "keybind-btn";
            btn.dataset.action = action;
            btn.textContent = Keybinds.formatCode(keybinds.get(action));

            btn.addEventListener("click", () => {
                this.startKeyCapture(keybinds, action, btn);
            });

            row.appendChild(label);
            row.appendChild(btn);
            list.appendChild(row);
        }
    }

    startKeyCapture(keybinds, action, btn) {
        this.stopKeyCapture();

        keybinds.listening = action;
        document.querySelectorAll(".keybind-btn").forEach(b => b.classList.remove("listening"));
        btn.classList.add("listening");
        btn.textContent = "…";

        this._keyCaptureHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight"].includes(e.code)) {
                return;
            }

            keybinds.set(action, e.code);
            keybinds.listening = null;
            this.renderKeybinds(keybinds);
            this.stopKeyCapture();
            this.updateControlsHint(keybinds);
        };

        document.addEventListener("keydown", this._keyCaptureHandler, true);
    }

    stopKeyCapture() {
        if (this._keyCaptureHandler) {
            document.removeEventListener("keydown", this._keyCaptureHandler, true);
            this._keyCaptureHandler = null;
        }
    }

    updateControlsHint(keybinds) {
        const hint = document.getElementById("controlsHint");
        if (!hint) return;

        const k = keybinds.getKeyMap();
        hint.innerHTML =
            `<p>${Keybinds.formatCode(k.left)} ${Keybinds.formatCode(k.right)} ${Keybinds.formatCode(k.down)} ${Keybinds.formatCode(k.rotate)} — движение / поворот</p>` +
            `<p>${Keybinds.formatCode(k.drop)} — hard drop &nbsp;|&nbsp; ${Keybinds.formatCode(k.hold)} — hold &nbsp;|&nbsp; ${Keybinds.formatCode(k.pause)} — пауза</p>`;
    }

    draw() {}
}
