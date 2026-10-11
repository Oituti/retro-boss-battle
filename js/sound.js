const Sound = {
    ctx: null,
    bgm: null,
    isMuted: false,
    isMegalovania: false,

    init() {
        try {
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this.ctx = new AudioContext();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        } catch (e) {}
    },

    playSynth(freq, type, duration, vol) {
        if (this.isMuted) return;
        try {
            this.init();
            if (!this.ctx) return;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    },

    playShoot() { this.playSynth(880, 'square', 0.06, 0.1); },
    playJump() {
        if (this.isMuted) return;
        try {
            this.init();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(160, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(650, this.ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.12);
        } catch (e) {}
    },
    playHit() { this.playSynth(120, 'sawtooth', 0.15, 0.2); },
    playCoreHit() { this.playSynth(1200, 'square', 0.05, 0.15); },
    playHeal() {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
            setTimeout(() => this.playSynth(freq, 'square', 0.12, 0.15), idx * 50);
        });
    },
    playExplosion() { this.playSynth(60, 'sawtooth', 0.4, 0.25); },

    startBGM() {
        this.stopBGM();
        if (this.isMuted) return;

        // 30%の確率で MEGALOVANIA (audio/megalovania.mp3) に決定！
        this.isMegalovania = Math.random() < 0.3;
        const bgmPath = this.isMegalovania ? 'audio/megalovania.mp3' : 'audio/bgm.mp3';

        try {
            this.bgm = new Audio(bgmPath);
            this.bgm.loop = true;
            this.bgm.volume = 0.5;
            this.bgm.playbackRate = 1.0;

            this.bgm.play().catch(() => {});
        } catch (e) {}
    },

    setPhase2Bgm() {
        if (!this.bgm) return;
        this.bgm.playbackRate = 1.25;
    },

    stopBGM() {
        if (this.bgm) {
            try {
                this.bgm.pause();
                this.bgm.currentTime = 0;
                this.bgm.playbackRate = 1.0;
            } catch (e) {}
            this.bgm = null;
        }
    }
};