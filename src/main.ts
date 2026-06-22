import './styles/index.css';
import Phaser from 'phaser';
import { gameConfig } from './game/config';

// Inicializa a instância principal do Phaser 3
export const game = new Phaser.Game(gameConfig);
