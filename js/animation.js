class LineClearAnimation {
    constructor() {
        this.active = false;
        this.lines = [];
        this.startTime = 0;
        this.duration = LINE_CLEAR_DURATION;
        this.onComplete = null;
    }

    start(lines, onComplete) {
        this.active = true;
        this.lines = [...lines];
        this.startTime = performance.now();
        this.onComplete = onComplete;
    }

    update(now) {
        if (!this.active) return false;

        if (now - this.startTime >= this.duration) {
            this.active = false;
            if (this.onComplete) this.onComplete();
            return false;
        }

        return true;
    }

    getProgress(now) {
        if (!this.active) return 1;
        return Math.min(1, (now - this.startTime) / this.duration);
    }

    isLineClearing(y) {
        return this.active && this.lines.includes(y);
    }
}
