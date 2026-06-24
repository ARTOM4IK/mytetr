class Game {
    constructor(renderer, options = {}) {
        this.renderer = renderer;
        this.prefix = options.prefix || "";
        this.isMultiplayer = options.isMultiplayer || false;
        this.isRemote = options.isRemote || false;
        this.playerId = options.playerId || null;
        this.onLineClear = options.onLineClear || null;
        this.onGameOver = options.onGameOver || null;
        this.onStateChange = options.onStateChange || null;

        this.board = new Board(ROWS, COLS);
        this.randomizer = new Randomizer();
        this.nextType = this.randomizer.next();
        this.holdType = null;
        this.holdUsed = false;
        this.scoreSystem = new Score();
        this.lineAnim = new LineClearAnimation();
        this.audio = options.audio || null;
        this.piece = null;

        this.lastFall = 0;
        this.fallDelay = this.scoreSystem.getDelay();
        this.state = options.isRemote ? "playing" : "playing";
        this.pendingLock = false;

        if (!this.isRemote) {
            this.spawnPiece();
        }
    }

    exportState() {
        return {
            grid: this.board.grid.map(r => [...r]),
            piece: this.piece ? {
                type: this.piece.type,
                rotation: this.piece.rotation,
                x: this.piece.x,
                y: this.piece.y,
                matrix: this.piece.matrix.map(r => [...r]),
                color: this.piece.color
            } : null,
            nextType: this.nextType,
            holdType: this.holdType,
            score: this.scoreSystem.score,
            lines: this.scoreSystem.lines,
            level: this.scoreSystem.level,
            state: this.state
        };
    }

    importState(data) {
        if (!data) return;
        if (data.grid) {
            this.board.grid = data.grid.map(r => [...r]);
        }
        if (data.piece) {
            this.piece = new Piece(data.piece.type);
            this.piece.rotation = data.piece.rotation;
            this.piece.x = data.piece.x;
            this.piece.y = data.piece.y;
            this.piece.matrix = data.piece.matrix.map(r => [...r]);
            this.piece.color = data.piece.color;
        }
        this.nextType = data.nextType ?? this.nextType;
        this.holdType = data.holdType ?? null;
        this.scoreSystem.score = data.score ?? 0;
        this.scoreSystem.lines = data.lines ?? 0;
        this.scoreSystem.level = data.level ?? 1;
        this.state = data.state ?? "playing";
        this.scoreSystem.updateUI(this.prefix);
        this.updateHoldCanvas();
        this.renderer.drawMiniPiece(this.prefix + "nextCanvas", this.nextType);
    }

    notifyStateChange() {
        if (this.onStateChange) this.onStateChange(this.exportState());
    }

    holdPiece() {
        if (this.holdUsed || this.isRemote || this.state !== "playing" || this.lineAnim.active) return;

        this.holdUsed = true;
        if (this.audio) this.audio.hold();

        if (this.holdType === null) {
            this.holdType = this.piece.type;
            this.spawnPiece();
        } else {
            const temp = this.holdType;
            this.holdType = this.piece.type;
            this.piece = new Piece(temp);
            if (this.board.collision(this.piece)) {
                this.triggerGameOver();
            }
        }

        this.updateHoldCanvas();
        this.notifyStateChange();
    }

    updateHoldCanvas() {
        const id = this.prefix + "holdCanvas";
        if (this.holdType !== null) {
            this.renderer.drawMiniPiece(id, this.holdType);
        } else {
            const c = document.getElementById(id);
            if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height);
        }
    }

    spawnPiece() {
        this.piece = new Piece(this.nextType);
        this.nextType = this.randomizer.next();
        this.holdUsed = false;
        this.pendingLock = false;

        this.renderer.drawMiniPiece(this.prefix + "nextCanvas", this.nextType);

        if (this.board.collision(this.piece)) {
            this.triggerGameOver();
        } else {
            this.notifyStateChange();
        }
    }

    triggerGameOver() {
        if (this.state === "gameover") return;
        this.state = "gameover";
        Save.save(this.scoreSystem.score);
        const bestEl = document.getElementById(this.prefix + "best");
        if (bestEl) bestEl.textContent = Save.load();
        if (this.audio) {
            this.audio.stopMusic();
            this.audio.gameOver();
        }
        if (this.onGameOver) this.onGameOver(this.playerId);
        this.notifyStateChange();
    }

    lockPiece() {
        this.board.merge(this.piece);
        if (this.audio) this.audio.lock();

        const fullLines = this.board.findFullLines();
        if (fullLines.length > 0) {
            this.board.markClearing(fullLines);
            this.state = "clearing";
            if (this.audio) {
                if (fullLines.length >= 4) this.audio.tetris();
                else this.audio.lineClear(fullLines.length);
            }
            this.lineAnim.start(fullLines, () => {
                const removed = this.board.removeLines(fullLines);
                this.scoreSystem.add(removed);
                if (this.scoreSystem.leveledUp() && this.audio) {
                    this.audio.levelUp();
                }
                this.scoreSystem.updateUI(this.prefix);
                this.fallDelay = this.scoreSystem.getDelay();
                if (this.onLineClear) this.onLineClear(this.playerId, removed);
                this.state = "playing";
                this.spawnPiece();
            });
        } else {
            this.scoreSystem.combo = 0;
            this.spawnPiece();
        }
        this.notifyStateChange();
    }

    hardDrop() {
        if (this.isRemote || this.state !== "playing" || this.lineAnim.active) return;

        const distance = this.piece.hardDrop(this.board);
        this.scoreSystem.addHardDrop(distance);
        this.scoreSystem.updateUI(this.prefix);
        if (this.audio) this.audio.hardDrop();
        this.lockPiece();
    }

    reset() {
        this.board.clear();
        this.scoreSystem.reset();
        this.randomizer = new Randomizer();
        this.nextType = this.randomizer.next();
        this.holdType = null;
        this.holdUsed = false;
        this.state = "playing";
        this.pendingLock = false;
        this.lastFall = performance.now();
        this.fallDelay = this.scoreSystem.getDelay();
        this.lineAnim.active = false;
        this.spawnPiece();
        this.scoreSystem.updateUI(this.prefix);
        if (this.audio) this.audio.startMusic();
    }

    handleInput(input, keyMap = {}) {
        if (this.isRemote) return;

        const left = keyMap.left || "ArrowLeft";
        const right = keyMap.right || "ArrowRight";
        const down = keyMap.down || "ArrowDown";
        const rotate = keyMap.rotate || "ArrowUp";
        const hold = keyMap.hold || "KeyC";
        const drop = keyMap.drop || "Space";
        const pause = keyMap.pause || "Escape";
        const restart = keyMap.restart || "KeyR";

        if (this.state === "gameover" && input.shouldRepeat(restart, 0, 300)) {
            this.reset();
            input.consume(restart);
            return;
        }

        if (this.state === "paused" && input.shouldRepeat(pause, 0, 300)) {
            this.state = "playing";
            if (this.audio) this.audio.startMusic();
            input.consume(pause);
            this.notifyStateChange();
            return;
        }

        if (this.state !== "playing" && this.state !== "clearing") return;
        if (this.lineAnim.active) return;

        let changed = false;

        if (input.shouldRepeat(pause, 0, 300)) {
            this.state = "paused";
            if (this.audio) this.audio.stopMusic();
            input.consume(pause);
            this.notifyStateChange();
            return;
        }

        if (input.shouldRepeat(left)) {
            if (this.piece.move(-1, 0, this.board)) {
                if (this.audio) this.audio.move();
                changed = true;
            }
        }

        if (input.shouldRepeat(right)) {
            if (this.piece.move(1, 0, this.board)) {
                if (this.audio) this.audio.move();
                changed = true;
            }
        }

        if (input.shouldRepeat(rotate, 0, 120)) {
            if (this.piece.rotate(this.board, 1)) {
                if (this.audio) this.audio.rotate();
                changed = true;
            }
        }

        if (input.pressed("KeyZ") || input.pressed("ControlLeft")) {
            if (this.piece.rotate(this.board, -1)) {
                if (this.audio) this.audio.rotate();
                changed = true;
            }
            input.consume("KeyZ");
            input.consume("ControlLeft");
        }

        if (input.shouldRepeat(down, DAS_DELAY, SOFT_DROP_ARR)) {
            if (this.piece.move(0, 1, this.board)) {
                this.scoreSystem.addSoftDrop();
                this.scoreSystem.updateUI(this.prefix);
                if (this.audio) this.audio.softDrop();
                changed = true;
            }
        }

        if (input.shouldRepeat(hold, 0, 200)) {
            this.holdPiece();
            input.consume(hold);
            return;
        }

        if (input.shouldRepeat(drop, 0, 200)) {
            this.hardDrop();
            input.consume(drop);
            return;
        }

        if (changed) this.notifyStateChange();
    }

    update(input, keyMap) {
        const now = performance.now();

        if (this.lineAnim.active) {
            this.lineAnim.update(now);
            return;
        }

        if (this.isRemote) return;

        this.handleInput(input, keyMap);

        if (this.state !== "playing") return;

        if (this.piece.updateLock(this.board, now)) {
            this.lockPiece();
            return;
        }

        if (now - this.lastFall > this.fallDelay) {
            this.lastFall = now;
            if (!this.piece.move(0, 1, this.board)) {
                this.piece.onGround = true;
                this.piece.lockTimer = now;
            } else {
                this.notifyStateChange();
            }
        }
    }

    render() {
        this.renderer.clear();
        this.renderer.drawGrid();
        this.renderer.drawBoard(this.board, this.lineAnim);
        if (this.piece && this.state !== "gameover") {
            this.renderer.drawGhost(this.board, this.piece);
            this.renderer.drawPiece(this.piece);
        }

        if (this.state === "paused") {
            this.renderer.drawOverlay("ПАУЗА", "Escape — продолжить", "#86b6ff");
        } else if (this.state === "gameover") {
            this.renderer.drawOverlay("GAME OVER", "R — начать заново", "#ff4060");
        }
    }
}
