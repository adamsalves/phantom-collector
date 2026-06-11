import Phaser from 'phaser';

export function showFloatyText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string
): void {
  const floaty = scene.add.text(x, y, text, {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '10px',
    color
  }).setOrigin(0.5);

  scene.tweens.add({
    targets: floaty,
    y: y - 40,
    alpha: 0,
    duration: 1000,
    onComplete: () => floaty.destroy()
  });
}
