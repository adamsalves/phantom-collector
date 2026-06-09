export class SoundGenerator {
  private ctx: AudioContext | null = null;

  constructor() {
    // Inicialização tardia para respeitar as políticas de autoplay dos navegadores
  }

  private initContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playCoin(): void {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      // Primeiro tom do arpejo
      const osc1 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'square'; // Som clássico 8-bit
      osc1.frequency.setValueAtTime(987.77, now); // Nota B5
      osc1.frequency.setValueAtTime(1318.51, now + 0.08); // Nota E6

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);
    } catch (e) {
      console.warn('Falha ao reproduzir áudio Retro Coin:', e);
    }
  }

  public playHurt(): void {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Falha ao reproduzir áudio Retro Hurt:', e);
    }
  }

  public playPowerup(): void {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {
      console.warn('Falha ao reproduzir áudio Retro Powerup:', e);
    }
  }

  public playLevelClear(): void {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50]; // C5, E5, G5, C6, G5, C6
      const duration = 0.12;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * duration);

        gain.gain.setValueAtTime(idx === notes.length - 1 ? 0.1 : 0.08, now + idx * duration);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * duration - 0.01);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * duration);
        osc.stop(now + (idx + 1) * duration);
      });
    } catch (e) {
      console.warn('Falha ao reproduzir áudio Level Clear:', e);
    }
  }

  public playGameOver(): void {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      const notes = [392.00, 349.23, 311.13, 261.63]; // G4, F4, D#4, C4 (Triste decrescente)
      const duration = 0.22;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * duration);

        gain.gain.setValueAtTime(0.12, now + idx * duration);
        gain.gain.linearRampToValueAtTime(0.001, now + (idx + 1) * duration - 0.02);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * duration);
        osc.stop(now + (idx + 1) * duration);
      });
    } catch (e) {
      console.warn('Falha ao reproduzir áudio Game Over:', e);
    }
  }

  public playCoinSilver(): void {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1174.66, now); // D6
      osc.frequency.setValueAtTime(1567.98, now + 0.08); // G6

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn('Falha ao reproduzir áudio Silver Coin:', e);
    }
  }

  public playCoinRainbow(): void {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const duration = 0.06;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * duration);

        gain.gain.setValueAtTime(0.06, now + idx * duration);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (idx + 1) * duration - 0.005);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * duration);
        osc.stop(now + (idx + 1) * duration);
      });
    } catch (e) {
      console.warn('Falha ao reproduzir áudio Rainbow Coin:', e);
    }
  }

  public playPause(): void {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn('Falha ao reproduzir áudio Pause:', e);
    }
  }

  public playCrisisHeartbeat(bpm: number = 60): { stop: () => void } {
    try {
      const ctx = this.initContext();
      let isPlaying = true;
      let timerId: ReturnType<typeof setTimeout> | null = null;

      const playBeat = () => {
        if (!isPlaying || ctx.state === 'suspended') return;
        try {
          const now = ctx.currentTime;
          
          // Lub (primeira batida)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(50, now);
          gain1.gain.setValueAtTime(0.12, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.12);

          // Dub (segunda batida)
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(45, now + 0.15);
          gain2.gain.setValueAtTime(0.09, now + 0.15);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15 + 0.15);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.15);
          osc2.stop(now + 0.15 + 0.15);
        } catch (e) {
          console.warn('Falha ao reproduzir áudio Heartbeat:', e);
        }

        const intervalMs = (60 / bpm) * 1000;
        timerId = setTimeout(playBeat, intervalMs);
      };

      playBeat();

      return {
        stop: () => {
          isPlaying = false;
          if (timerId) clearTimeout(timerId);
        }
      };
    } catch (e) {
      console.warn('Falha ao iniciar Heartbeat:', e);
      return { stop: () => {} };
    }
  }
}

// Exportando uma única instância global para compartilhar o AudioContext entre as cenas
export const soundManager = new SoundGenerator();
