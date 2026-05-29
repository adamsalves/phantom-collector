import './styles/index.css';
import Phaser from 'phaser';
import { gameConfig } from './game/config';

// Inicializa a instância principal do Phaser 3
export const game = new Phaser.Game(gameConfig);

// Desbloqueia automaticamente o contexto de áudio em navegadores na primeira interação
const unlockAudio = (): void => {
  const ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  if (ctx) {
    const dummyCtx = new ctx();
    if (dummyCtx.state === 'suspended') {
      const resume = (): void => {
        dummyCtx.resume();
        window.removeEventListener('click', resume);
        window.removeEventListener('keydown', resume);
      };
      window.addEventListener('click', resume);
      window.addEventListener('keydown', resume);
    }
  }
};

unlockAudio();
