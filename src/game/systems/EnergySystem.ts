import Phaser from 'phaser';
import { GAME, CRISIS } from '../utils/constants';
import { getEnergyDecay } from '../utils/difficulty';
import { soundManager } from '../audio/SoundGenerator';

export class EnergySystem {
  private scene: Phaser.Scene;
  private energy: number = GAME.MAX_ENERGY;
  private maxEnergy: number = GAME.MAX_ENERGY;
  private decayRate: number = 0.15;

  private heartbeatAudio: { stop: () => void } | null = null;
  private heartbeatBpm: number | null = null;
  private nextFlashTime: number = 0;
  private nextShakeTime: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public init(level: number): void {
    this.energy = this.maxEnergy;
    this.decayRate = getEnergyDecay(level);
    this.heartbeatAudio = null;
    this.heartbeatBpm = null;
    this.nextFlashTime = 0;
    this.nextShakeTime = 0;
  }

  public update(time: number, delta: number): boolean {
    if (this.energy <= 0) return false;

    this.energy -= this.decayRate * (delta / 16.666);
    this.handleCrisisFeedback(time);

    if (this.energy <= 0) {
      this.energy = 0;
      this.stopHeartbeat();
      return false;
    }
    return true;
  }

  public recover(amount: number): void {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  public takeDamage(amount: number): void {
    this.energy = Math.max(0, this.energy - amount);
  }

  public getEnergy(): number {
    return this.energy;
  }

  public getMaxEnergy(): number {
    return this.maxEnergy;
  }

  public getPercentage(): number {
    return this.energy / this.maxEnergy;
  }

  public isCritical(): boolean {
    return this.energy <= CRISIS.CRITICAL_THRESHOLD;
  }

  public isAgonic(): boolean {
    return this.energy <= CRISIS.AGONIC_THRESHOLD;
  }

  public isDead(): boolean {
    return this.energy <= 0;
  }

  private handleCrisisFeedback(time: number): void {
    if (this.isCritical()) {
      const targetBpm = this.isAgonic()
        ? CRISIS.HEARTBEAT_AGONIC_BPM
        : CRISIS.HEARTBEAT_CRITICAL_BPM;

      if (this.heartbeatAudio === null || this.heartbeatBpm !== targetBpm) {
        if (this.heartbeatAudio) {
          this.heartbeatAudio.stop();
        }
        this.heartbeatAudio = soundManager.playCrisisHeartbeat(targetBpm);
        this.heartbeatBpm = targetBpm;
      }

      if (time > this.nextFlashTime) {
        this.scene.cameras.main.flash(400, 255, 0, 0);
        this.nextFlashTime = time + CRISIS.FLASH_INTERVAL;
      }

      if (this.isAgonic() && time > this.nextShakeTime) {
        this.scene.cameras.main.shake(100, 0.005);
        this.nextShakeTime = time + CRISIS.SHAKE_INTERVAL;
      }
    } else {
      this.stopHeartbeat();
    }
  }

  public stopHeartbeat(): void {
    if (this.heartbeatAudio) {
      this.heartbeatAudio.stop();
      this.heartbeatAudio = null;
      this.heartbeatBpm = null;
    }
  }

  public advanceCrisisTimers(pauseDuration: number): void {
    this.nextFlashTime += pauseDuration;
    this.nextShakeTime += pauseDuration;
  }

  public cleanup(): void {
    this.stopHeartbeat();
  }
}
