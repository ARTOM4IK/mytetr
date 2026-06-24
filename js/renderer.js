class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.cellSize = Math.floor(canvas.width / COLS);
        this.boardW = this.cellSize * COLS;
        this.boardH = this.cellSize * ROWS;
    }

    fitToContainer(container) {
        if (!container) return;

        const rect = container.getBoundingClientRect();
        if (rect.height < 10 || rect.width < 10) return;

        const pad = 4;
        const availH = rect.height - pad;
        const availW = rect.width - pad;

        const cs = Math.max(8, Math.min(
            Math.floor(availH / ROWS),
            Math.floor(availW / COLS)
        ));

        const w = COLS * cs;
        const h = ROWS * cs;

        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
        }

        this.canvas.style.width = w + "px";
        this.canvas.style.height = h + "px";
        this.cellSize = cs;
        this.boardW = w;
        this.boardH = h;
    }

    clear() {
        this.ctx.fillStyle = "#060d18";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        const cs = this.cellSize;
        this.ctx.strokeStyle = "#1a2844";
        this.ctx.lineWidth = 1;

        for (let x = 0; x <= COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * cs, 0);
            this.ctx.lineTo(x * cs, this.boardH);
            this.ctx.stroke();
        }

        for (let y = 0; y <= ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * cs);
            this.ctx.lineTo(this.boardW, y * cs);
            this.ctx.stroke();
        }
    }

    drawNeonBlock(px, py, colorIndex, alpha = 1, clearing = false) {
        const ctx = this.ctx;
        const cs = this.cellSize;
        const color = COLORS[colorIndex - 1];
        const x = px * cs;
        const y = py * cs;
        const pad = 2;
        const size = cs - pad * 2;

        ctx.save();
        ctx.globalAlpha = alpha;

        if (clearing) {
            const flash = Math.sin(performance.now() * 0.02) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255,255,255,${0.6 + flash * 0.4})`;
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 20;
        } else {
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 12;
        }

        ctx.fillRect(x + pad, y + pad, size, size);

        ctx.shadowBlur = 0;

        const grad = ctx.createLinearGradient(x, y, x + cs, y + cs);
        grad.addColorStop(0, "rgba(255,255,255,0.35)");
        grad.addColorStop(0.5, "rgba(255,255,255,0.05)");
        grad.addColorStop(1, "rgba(0,0,0,0.3)");
        ctx.fillStyle = grad;
        ctx.fillRect(x + pad, y + pad, size, size);

        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + pad + 0.5, y + pad + 0.5, size - 1, size - 1);

        ctx.restore();
    }

    drawBoard(board, lineAnim = null) {
        for (let y = 0; y < board.rows; y++) {
            for (let x = 0; x < board.cols; x++) {
                const value = board.get(x, y);
                if (value === 0) continue;

                const isClearing = lineAnim && lineAnim.isLineClearing(y);
                let alpha = 1;
                if (isClearing) {
                    const progress = lineAnim.getProgress(performance.now());
                    alpha = 1 - progress * 0.8;
                }

                this.drawNeonBlock(x, y, value, alpha, isClearing);
            }
        }
    }

    drawGhost(board, piece) {
        const gy = piece.ghostY(board);
        const ctx = this.ctx;
        const color = COLORS[piece.color - 1];

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.55;
        ctx.setLineDash([4, 4]);
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;

        for (let y = 0; y < piece.matrix.length; y++) {
            for (let x = 0; x < piece.matrix[y].length; x++) {
                if (!piece.matrix[y][x]) continue;

                const cs = this.cellSize;
                const px = (piece.x + x) * cs + 3;
                const py = (gy + y) * cs + 3;
                const size = cs - 6;

                ctx.strokeRect(px, py, size, size);
            }
        }

        ctx.restore();
    }

    drawPiece(piece) {
        for (let y = 0; y < piece.matrix.length; y++) {
            for (let x = 0; x < piece.matrix[y].length; x++) {
                if (!piece.matrix[y][x]) continue;
                this.drawNeonBlock(piece.x + x, piece.y + y, piece.color);
            }
        }
    }

    drawMiniPiece(canvasId, type) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const matrix = ROTATIONS[type][0];
        const size = 28;
        const offsetX = (canvas.width - matrix[0].length * size) / 2;
        const offsetY = (canvas.height - matrix.length * size) / 2;

        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (!matrix[y][x]) continue;

                const color = COLORS[type];
                const px = offsetX + x * size;
                const py = offsetY + y * size;

                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 8;
                ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
                ctx.shadowBlur = 0;
            }
        }
    }

    drawOverlay(text, subtext, color = "#ffffff") {
        const ctx = this.ctx;
        ctx.fillStyle = "rgba(6,13,24,0.82)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = color;
        ctx.font = "bold 42px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 - 10);
        ctx.shadowBlur = 0;

        if (subtext) {
            ctx.fillStyle = "rgba(200,220,255,0.8)";
            ctx.font = "18px 'Segoe UI', Arial, sans-serif";
            ctx.fillText(subtext, this.canvas.width / 2, this.canvas.height / 2 + 35);
        }
    }
}
