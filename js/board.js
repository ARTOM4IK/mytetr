class Board {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.grid = [];
        this.clearingLines = [];
        this.clear();
    }

    clear() {
        this.grid = [];
        this.clearingLines = [];
        for (let y = 0; y < this.rows; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.cols; x++) {
                this.grid[y][x] = 0;
            }
        }
    }

    inside(x, y) {
        return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
    }

    get(x, y) {
        if (y < 0 || y >= this.rows || x < 0 || x >= this.cols) return 0;
        return this.grid[y][x];
    }

    set(x, y, value) {
        this.grid[y][x] = value;
    }

    collision(piece) {
        for (let y = 0; y < piece.matrix.length; y++) {
            for (let x = 0; x < piece.matrix[y].length; x++) {
                if (!piece.matrix[y][x]) continue;

                const boardX = piece.x + x;
                const boardY = piece.y + y;

                if (boardX < 0 || boardX >= this.cols) return true;
                if (boardY >= this.rows) return true;
                if (boardY >= 0 && this.grid[boardY][boardX] !== 0) return true;
            }
        }
        return false;
    }

    merge(piece) {
        for (let y = 0; y < piece.matrix.length; y++) {
            for (let x = 0; x < piece.matrix[y].length; x++) {
                if (!piece.matrix[y][x]) continue;
                const by = piece.y + y;
                const bx = piece.x + x;
                if (by >= 0) {
                    this.grid[by][bx] = piece.color;
                }
            }
        }
    }

    findFullLines() {
        const full = [];
        for (let y = this.rows - 1; y >= 0; y--) {
            let isFull = true;
            for (let x = 0; x < this.cols; x++) {
                if (this.grid[y][x] === 0) {
                    isFull = false;
                    break;
                }
            }
            if (isFull) full.push(y);
        }
        return full;
    }

    markClearing(lines) {
        this.clearingLines = lines;
    }

    removeLines(lines) {
        if (lines.length === 0) return 0;

        const sorted = [...lines].sort((a, b) => a - b);
        for (const lineY of sorted) {
            this.grid.splice(lineY, 1);
            this.grid.unshift(new Array(this.cols).fill(0));
        }
        this.clearingLines = [];
        return sorted.length;
    }

    clearLines() {
        const full = this.findFullLines();
        return this.removeLines(full);
    }
}
