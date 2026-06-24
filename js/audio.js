class Audio {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.musicGain = null;
        this.sfxGain = null;
        this.musicOsc = null;
        this.musicInterval = null;
    }

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.musicGain = this.ctx.createGain();
            this.sfxGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.08;
            this.sfxGain.gain.value = 0.25;
            this.musicGain.connect(this.ctx.destination);
            this.sfxGain.connect(this.ctx.destination);
        } catch (_) {
            this.enabled = false;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    playTone(freq, duration, type = "square", gain = 0.15) {
        if (!this.enabled || !this.ctx) return;

        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(gain, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    move() { this.playTone(180, 0.04, "square", 0.08); }
    rotate() { this.playTone(260, 0.05, "triangle", 0.1); }
    softDrop() { this.playTone(120, 0.03, "square", 0.06); }
    hardDrop() { this.playTone(90, 0.12, "sawtooth", 0.15); }
    lock() { this.playTone(150, 0.06, "square", 0.1); }

    lineClear(count) {
        const freqs = [440, 554, 659, 880];
        for (let i = 0; i < count; i++) {
            setTimeout(() => this.playTone(freqs[i] || 880, 0.15, "sine", 0.2), i * 80);
        }
    }

    tetris() {
        [523, 659, 784, 1047].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 0.2, "sine", 0.25), i * 100);
        });
    }

    levelUp() { this.playTone(660, 0.3, "sine", 0.2); }
    gameOver() { this.playTone(110, 0.6, "sawtooth", 0.2); }
    hold() { this.playTone(330, 0.08, "triangle", 0.12); }

    startMusic() {
        if (!this.enabled || !this.ctx || this.musicInterval) return;

        let step = 0;
        const melody = [262, 294, 330, 349, 392, 349, 330, 294];
        this.musicInterval = setInterval(() => {
            if (!this.enabled) return;
            this.playTone(melody[step % melody.length], 0.18, "sine", 0.06);
            step++;
        }, 400);
    }

    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }

    setEnabled(val) {
        this.enabled = val;
        if (!val) this.stopMusic();
    }
}
