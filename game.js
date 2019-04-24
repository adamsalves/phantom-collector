class mainScene {
  preload() {
    this.load.image('player', 'assets/player.png');
    this.load.image('coin', 'assets/coin.png');
  }

  create() {
    //elements
    this.player = this.physics.add.sprite(100, 100, 'player');
    this.coin = this.physics.add.sprite(300, 300, 'coin');
    
    //score
    this.score = 0;

    let style = { font: '20px Arial', fill: '#fff' };

    this.scoreText = this.add.text(20, 20, 'score: ' + this.score, style);

    //move
    this.arrow = this.input.keyboard.createCursorKeys();

  }

  update() {
    // If the player is overlapping with the coin
    if (this.physics.overlap(this.player, this.coin)) {
      // Call the new hit() method
      this.hit();
    }
    // Handle horizontal movements
    if (this.arrow.right.isDown) {
      // If the right arrow is pressed, move to the right
      this.player.x += 3;
    } else if (this.arrow.left.isDown) {
      // If the left arrow is pressed, move to the left
      this.player.x -= 3;
    } 

    // Do the same for vertical movements
    if (this.arrow.down.isDown) {
      this.player.y += 3;
    } else if (this.arrow.up.isDown) {
      this.player.y -= 3;
    } 

  }

  hit() {
    // Create a new tween 
    this.tweens.add({
      targets: this.player, // on the player 
      duration: 200, // for 200ms 
      scaleX: 1.2, // that scale vertically by 20% 
      scaleY: 1.2, // and scale horizontally by 20% 
      yoyo: true, // at the end, go back to original scale 
    });
    // Change the position x and y of the coin randomly
    this.coin.x = Phaser.Math.Between(100, 600);
    this.coin.y = Phaser.Math.Between(100, 300);

    // Increment the score by 10
    this.score += 10;

    // Display the updated score on the screen
    this.scoreText.setText('score: ' + this.score);

  }

}

new Phaser.Game({
  width: 700,
  height: 400,
  backgroundColor: '#3498db',
  scene: mainScene,
  physics: { default: 'arcade' },
  parent: 'game',
});