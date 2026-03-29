const AudioEngine = {
    ctx: null,
    init() { if (!this.ctx) { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } },
    playTone(freq, type, duration, volStart=0.1, volEnd=0) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(volStart, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(Math.max(volEnd, 0.01), this.ctx.currentTime + duration);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + duration);
    },
    attack() { 
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'square'; osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(this.ctx.destination); osc.start(); osc.stop(this.ctx.currentTime + 0.1);
    },
    hurt() { this.playTone(150, 'sawtooth', 0.2, 0.15, 0.01); },
    heal() { setTimeout(() => this.playTone(400, 'sine', 0.1, 0.1), 0); setTimeout(() => this.playTone(600, 'sine', 0.1, 0.1), 100); setTimeout(() => this.playTone(800, 'sine', 0.2, 0.1), 200); },
    levelUp() { setTimeout(() => this.playTone(523.25, 'square', 0.1, 0.1), 0); setTimeout(() => this.playTone(659.25, 'square', 0.1, 0.1), 150); setTimeout(() => this.playTone(783.99, 'square', 0.1, 0.1), 300); setTimeout(() => this.playTone(1046.50, 'square', 0.3, 0.1), 450); },
    click() { this.playTone(800, 'triangle', 0.05, 0.1); }
};