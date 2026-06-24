class Score {
    constructor() {
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = 0;
        this.prevLevel = 1;
    }

    add(cleared) {
        if (cleared === 0) {
            this.combo = 0;
            return;
        }

        this.combo++;
        const base = SCORE_TABLE[cleared] || 0;
        const comboBonus = this.combo > 1 ? (this.combo - 1) * 50 : 0;
        this.score += (base * this.level) + comboBonus;
        this.lines += cleared;
        this.prevLevel = this.level;
        this.level = Math.floor(this.lines / 10) + 1;
    }

    addHardDrop(cells) {
        this.score += cells * 2;
    }

    addSoftDrop() {
        this.score += 1;
    }

    reset() {
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = 0;
        this.prevLevel = 1;
    }

    leveledUp() {
        return this.level > this.prevLevel;
    }

    updateUI(prefix = "") {
        const scoreEl = document.getElementById(prefix + "score");
        const levelEl = document.getElementById(prefix + "level");
        const linesEl = document.getElementById(prefix + "lines");
        if (scoreEl) scoreEl.textContent = this.score;
        if (levelEl) levelEl.textContent = this.level;
        if (linesEl) linesEl.textContent = this.lines;
    }

    getDelay() {
        return getFallDelay(this.level);
    }
}
