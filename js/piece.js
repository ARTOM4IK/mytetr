class Piece {
    constructor(type) {
        this.type = type;
        this.rotation = 0;
        this.color = type + 1;
        this.x = 3;
        this.y = 0;
        this.matrix = ROTATIONS[type][0].map(row => [...row]);
        this.lockMoves = 0;
        this.lockTimer = 0;
        this.onGround = false;
    }

    resetPosition() {
        this.x = 3;
        this.y = 0;
        this.rotation = 0;
        this.matrix = ROTATIONS[this.type][0].map(row => [...row]);
        this.lockMoves = 0;
        this.lockTimer = 0;
        this.onGround = false;
    }

    getKickTable() {
        if (this.type === 0) return KICKS_I;
        if (this.type === 3) return KICKS_O;
        return KICKS_JLSTZ;
    }

    rotate(board, direction = 1) {
        const oldRotation = this.rotation;
        const newRotation = (oldRotation + direction + 4) % 4;
        const kickTable = this.getKickTable();
        const kickKey = `${oldRotation}-${newRotation}`;

        let kicks;
        if (this.type === 3) {
            kicks = KICKS_O;
        } else {
            kicks = kickTable[kickKey] || [[0, 0]];
        }

        const oldMatrix = this.matrix.map(r => [...r]);
        const oldX = this.x;
        const oldY = this.y;

        this.rotation = newRotation;
        this.matrix = ROTATIONS[this.type][newRotation].map(r => [...r]);

        for (const [dx, dy] of kicks) {
            this.x = oldX + dx;
            this.y = oldY + dy;

            if (!board.collision(this)) {
                if (this.onGround) {
                    this.lockMoves++;
                    this.lockTimer = performance.now();
                }
                return true;
            }
        }

        this.rotation = oldRotation;
        this.matrix = oldMatrix;
        this.x = oldX;
        this.y = oldY;
        return false;
    }

    move(dx, dy, board) {
        this.x += dx;
        this.y += dy;

        if (board.collision(this)) {
            this.x -= dx;
            this.y -= dy;
            return false;
        }

        if (this.onGround && (dx !== 0 || dy < 0)) {
            this.lockMoves++;
            this.lockTimer = performance.now();
        }

        return true;
    }

    updateLock(board, now) {
        if (!this.onGround) {
            const test = { x: this.x, y: this.y + 1, matrix: this.matrix };
            this.onGround = board.collision(test);
            if (this.onGround) {
                this.lockTimer = now;
                this.lockMoves = 0;
            }
            return false;
        }

        const test = { x: this.x, y: this.y + 1, matrix: this.matrix };
        if (!board.collision(test)) {
            this.onGround = false;
            return false;
        }

        if (now - this.lockTimer >= LOCK_DELAY || this.lockMoves >= MAX_LOCK_MOVES) {
            return true;
        }

        return false;
    }

    hardDrop(board) {
        let distance = 0;
        while (this.move(0, 1, board)) {
            distance++;
        }
        return distance;
    }

    ghostY(board) {
        let gy = this.y;
        const ghost = { x: this.x, y: gy, matrix: this.matrix };
        while (!board.collision({ ...ghost, y: gy + 1 })) {
            gy++;
        }
        return gy;
    }
}
