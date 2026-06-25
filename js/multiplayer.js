class MultiplayerManager {
    constructor(audio) {
        this.audio = audio;
        this.network = null;
        this.myGame = null;
        this.oppGame = null;
        this.myRenderer = null;
        this.oppRenderer = null;
        this.playerId = null;
        this.amTop = true;
        this.shareTop = 50;
        this.shareBottom = 50;
        this.state = "idle";
        this._overlayState = null;
        this._overlayBound = false;
        this._resizeObs = null;
    }

    bindOverlayEvents() {
        if (this._overlayBound) return;
        this._overlayBound = true;

        const overlay = document.getElementById("mpOverlay");
        if (!overlay) return;

        overlay.addEventListener("click", (e) => {
            const id = e.target.id;
            if (id === "mpBackBtn" || id === "mpCancelBtn") {
                e.preventDefault();
                if (window.backToMenu) window.backToMenu();
            }
        });
    }

    setState(state) {
        if (this.state === state) return;
        this.state = state;
        this.updateOverlay();
    }

    updateOverlay() {
        const overlay = document.getElementById("mpOverlay");
        if (!overlay) return;

        if (this._overlayState === this.state) return;
        this._overlayState = this.state;

        overlay.className = "mp-overlay";

        const messages = {
            searching: '<div class="overlay-content"><h2>Поиск игрока...</h2><div class="spinner"></div><button type="button" class="menu-btn secondary" id="mpCancelBtn">Отмена</button></div>',
            won: '<div class="overlay-content win"><h2>ПОБЕДА!</h2><button type="button" class="menu-btn" id="mpBackBtn">В меню</button></div>',
            lost: '<div class="overlay-content lose"><h2>ПОРАЖЕНИЕ</h2><button type="button" class="menu-btn" id="mpBackBtn">В меню</button></div>',
            opponent_left: '<div class="overlay-content"><h2>Соперник отключился</h2><button type="button" class="menu-btn" id="mpBackBtn">В меню</button></div>',
            disconnected: '<div class="overlay-content"><h2>Нет связи с сервером</h2><p>Откройте <strong>http://localhost:3000</strong><br>и запустите <code>npm start</code> в папке server</p><button type="button" class="menu-btn" id="mpBackBtn">В меню</button></div>'
        };

        if (messages[this.state]) {
            overlay.classList.add("active");
            overlay.innerHTML = messages[this.state];
        } else {
            overlay.classList.remove("active");
            overlay.innerHTML = "";
        }
    }

    initNetwork(url) {
        if (this.network) this.network.disconnect();

        this.network = new Network(url);

        this.network.on("welcome", (msg) => {
            this.playerId = msg.playerId;
        });

        this.network.on("match_found", (msg) => {
            this.amTop = this.playerId === msg.players[0];
            this.shareTop = 50;
            this.shareBottom = 50;
            this.setState("playing");
            this.setupGames(msg.players);
        });

        this.network.on("opponent_state", (msg) => {
            if (this.oppGame && msg.state) {
                this.oppGame.importState(msg.state);
            }
            if (msg.shareTop !== undefined) {
                this.applyOpponentShare(msg.shareTop);
            }
        });

        this.network.on("line_clear", (msg) => {
            this.applyOpponentShare(msg.shareTop);
        });

        this.network.on("opponent_over", () => {
            this.setState("won");
        });

        this.network.on("opponent_left", () => {
            this.setState("opponent_left");
        });

        this.network.on("close", () => {
            if (this.state === "searching") {
                this.setState("disconnected");
            }
        });
    }

    setupGames(players) {
        const topCanvas = document.getElementById("canvasTop");
        const bottomCanvas = document.getElementById("canvasBottom");
        this.myRenderer = new Renderer(this.amTop ? topCanvas : bottomCanvas);
        this.oppRenderer = new Renderer(this.amTop ? bottomCanvas : topCanvas);

        const myPrefix = this.amTop ? "p1" : "p2";
        const oppPrefix = this.amTop ? "p2" : "p1";

        this.myGame = new Game(this.myRenderer, {
            prefix: myPrefix,
            isMultiplayer: true,
            playerId: this.playerId,
            audio: this.audio,
            onLineClear: (_id, lines) => this.onLineClear(lines),
            onGameOver: () => this.onGameOver(),
            onStateChange: (state) => this.sendState(state)
        });

        this.oppGame = new Game(this.oppRenderer, {
            prefix: oppPrefix,
            isMultiplayer: true,
            isRemote: true,
            playerId: this.amTop ? players[1] : players[0]
        });

        if (this.audio) {
            this.audio.init();
            this.audio.resume();
            this.audio.startMusic();
        }
        this.updatePlayerLabels();
        this.setupResizeObserver();
        this.updateSplit();
    }

    updatePlayerLabels() {
        const top = document.getElementById("playerTop");
        const bottom = document.getElementById("playerBottom");
        const labelTop = document.getElementById("labelTop");
        const labelBottom = document.getElementById("labelBottom");

        top?.classList.toggle("is-me", this.amTop);
        bottom?.classList.toggle("is-me", !this.amTop);

        if (labelTop) labelTop.textContent = this.amTop ? "Вы" : "Соперник";
        if (labelBottom) labelBottom.textContent = !this.amTop ? "Вы" : "Соперник";
    }

    setupResizeObserver() {
        if (this._resizeObs) return;

        this._resizeObs = new ResizeObserver(() => this.resizeBoards());

        const wrapTop = document.getElementById("boardWrapTop");
        const wrapBottom = document.getElementById("boardWrapBottom");
        if (wrapTop) this._resizeObs.observe(wrapTop);
        if (wrapBottom) this._resizeObs.observe(wrapBottom);
    }

    resizeBoards() {
        const wrapTop = document.getElementById("boardWrapTop");
        const wrapBottom = document.getElementById("boardWrapBottom");

        if (this.myRenderer) {
            this.myRenderer.fitToContainer(this.amTop ? wrapTop : wrapBottom);
        }
        if (this.oppRenderer) {
            this.oppRenderer.fitToContainer(this.amTop ? wrapBottom : wrapTop);
        }
    }

    sendState(state) {
        if (!this.network || this.state !== "playing") return;
        this.network.send("state", {
            state,
            shareTop: this.amTop ? this.shareTop : this.shareBottom
        });
    }

    onLineClear(lines) {
        const gain = lines * 3;
        if (this.amTop) {
            this.shareTop = Math.min(95, this.shareTop + gain);
            this.shareBottom = 100 - this.shareTop;
        } else {
            this.shareBottom = Math.min(95, this.shareBottom + gain);
            this.shareTop = 100 - this.shareBottom;
        }
        this.updateSplit();

        if (this.network) {
            this.network.send("line_clear", {
                lines,
                shareTop: this.amTop ? this.shareTop : this.shareBottom
            });
        }

        if (this.shareTop >= 95 || this.shareBottom >= 95) {
            this.setState((this.amTop ? this.shareTop : this.shareBottom) >= 95 ? "won" : "lost");
            if (this.network) this.network.sendGameOver();
        }
    }

    applyOpponentShare(theirShare) {
        if (this.amTop) {
            this.shareBottom = theirShare;
            this.shareTop = 100 - theirShare;
        } else {
            this.shareTop = theirShare;
            this.shareBottom = 100 - theirShare;
        }
        this.updateSplit();

        if (this.shareTop >= 95 || this.shareBottom >= 95) {
            const myShare = this.amTop ? this.shareTop : this.shareBottom;
            this.setState(myShare >= 95 ? "won" : "lost");
        }
    }

    onGameOver() {
        this.setState("lost");
        if (this.network) this.network.sendGameOver();
    }

    updateSplit() {
        const top = document.getElementById("playerTop");
        const bottom = document.getElementById("playerBottom");
        if (top) top.style.flex = `${this.shareTop} 0 0%`;
        if (bottom) bottom.style.flex = `${this.shareBottom} 0 0%`;
        requestAnimationFrame(() => this.resizeBoards());
    }

    update(input, keyMap) {
        if (this.state !== "playing" || !this.myGame) return;

        this.myGame.update(input, keyMap);
        if (this.myGame.lineAnim.active) {
            this.myGame.lineAnim.update(performance.now());
        }
    }

    render() {
        if (this.myGame) this.myGame.render();
        if (this.oppGame) this.oppGame.render();
    }

    async startMatchmaking() {
        this.bindOverlayEvents();
        this.setState("searching");

        const wsUrl = getWebSocketUrl();
        this.initNetwork(wsUrl);

        try {
            await this.network.connect();
            this.network.findMatch();
        } catch (_) {
            this.setState("disconnected");
        }
    }

    cleanup() {
        if (this._resizeObs) {
            this._resizeObs.disconnect();
            this._resizeObs = null;
        }
        if (this.network) this.network.disconnect();
        this.network = null;
        this.myGame = null;
        this.oppGame = null;
        this.myRenderer = null;
        this.oppRenderer = null;
        this.state = "idle";
        this._overlayState = null;
        this.shareTop = 50;
        this.shareBottom = 50;

        document.getElementById("playerTop")?.classList.remove("is-me");
        document.getElementById("playerBottom")?.classList.remove("is-me");
        document.getElementById("labelTop").textContent = "Игрок 1";
        document.getElementById("labelBottom").textContent = "Игрок 2";

        this.updateSplit();
        this.updateOverlay();
        if (this.audio) this.audio.stopMusic();
    }
}
