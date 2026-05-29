const MAX_NAME_LENGTH = 8;
const ALLOWED_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';

export function showNameInput(scene: Phaser.Scene): Promise<string | null> {
  return new Promise((resolve) => {
    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;

    const container = scene.add.container(0, 0).setDepth(100);

    const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x0d041a, 0.85);
    container.add(overlay);

    const title = scene.add.text(width / 2, height / 2 - 60, 'NEW HIGH SCORE!', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '18px',
      color: '#ffd700'
    }).setOrigin(0.5).setShadow(0, 0, '#ffd700', 6, true, true);
    container.add(title);

    const promptText = scene.add.text(width / 2, height / 2 - 25, 'ENTER YOUR NAME', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#00f0ff'
    }).setOrigin(0.5);
    container.add(promptText);

    let name = '';

    const nameDisplay = scene.add.text(width / 2, height / 2 + 20, '_', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(nameDisplay);

    const cursorTween = scene.tweens.add({
      targets: nameDisplay,
      alpha: { from: 1, to: 0.2 },
      duration: 400,
      yoyo: true,
      repeat: -1
    });

    const hint = scene.add.text(width / 2, height / 2 + 65, 'ENTER TO CONFIRM  |  ESC TO CANCEL', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#666666'
    }).setOrigin(0.5);
    container.add(hint);

    const updateDisplay = () => {
      const displayName = name + (name.length < MAX_NAME_LENGTH ? '_' : '');
      nameDisplay.setText(displayName);
    };

    const destroy = (result: string | null) => {
      container.destroy();
      resolve(result);
    };

    const handler = (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();

      if (event.key === 'Enter') {
        destroy(name || '---');
        return;
      }

      if (event.key === 'Escape') {
        destroy(null);
        return;
      }

      if (event.key === 'Backspace') {
        name = name.slice(0, -1);
        updateDisplay();
        return;
      }

      if (name.length >= MAX_NAME_LENGTH) return;
      if (!ALLOWED_KEYS.includes(key)) return;

      name += key;
      updateDisplay();
    };

    scene.input.keyboard?.on('keydown', handler);

    const originalPause = scene.physics.world?.isPaused;
    if (!originalPause) {
      scene.physics.world?.pause();
    }

    container.on('destroy', () => {
      cursorTween.stop();
      scene.input.keyboard?.off('keydown', handler);
      if (!originalPause) {
        scene.physics.world?.resume();
      }
    });
  });
}
