class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }
  preload() {
    this.load.image("pause", "images/pause.png");
    this.load.image("enemy", "images/enemy.png");
    this.load.image("shooter", "images/shooter.png");
    this.load.image("pinkBullet", "images/pinkFlower.png");
    this.load.image("defaultSkin", "images/defaultSkin.png");
    if (window.player1Skin) {
      if (this.textures.exists("player1")) {
        this.textures.remove("player1");
      }
      this.load.image("player1", window.player1Skin);
    } else {
      this.load.image("player1", "images/defaultSkin.png");
    }

    if (window.player2Skin) {
      if (this.textures.exists("player2")) {
        this.textures.remove("player2");
      }
      this.load.image("player2", window.player2Skin);
    } else {
      this.load.image("player2", "images/defaultSkin.png");
    }
  }
  create() {
    this.cameras.main.setBackgroundColor("#FDF5E6");
    const { width, height } = this.scale;

    this.STATE_WAITING = "WAITING";
    this.STATE_PLAYING = "PLAYING";
    this.STATE_GAMEOVER = "GAMEOVER";
    this.STATE_GAME = this.STATE_WAITING;
    this.score = 0;
    this.minY = 100;
    this.maxY = 130;
    this.centerX = this.scale.width / 2;
    this.bottomY = this.scale.height;
    this.platformSpeed = 130;
    this.maxPlatformSpeed = 400;
    this.baseGravity = 800;
    this.baseJumpForce = 480;
    this.playerSpeed = 300;

    this.scoreText = this.add
      .text(20, 20, "Score: 0", {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "22px",
        fontStyle: "bold",
        fill: "#8F4C55",
      })
      .setDepth(5);

    this.tapToStart = this.add
      .text(this.scale.width / 2, this.scale.height - 80, "TAP TO START", {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "18px",
        fill: "#f6c3ca",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.pauseButton = this.add
      .sprite(width - 30, 30, "pause")
      .setInteractive({ useHandCursor: true });
    this.pauseButton.setDepth(5);
    this.pauseButton.on("pointerdown", () => {
      this.scene.pause();
      this.scene.launch("PauseScene");
    });

    this.enemies = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    this.platforms = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    this.bullets = this.physics.add.group({
      allowGravity: false,
      immovable: false,
    });

    this.ground = this.add.rectangle(
      this.centerX,
      this.bottomY,
      this.scale.width,
      100,
      0xff69b4,
    );
    this.physics.add.existing(this.ground);
    this.ground.body.setAllowGravity(false);
    this.ground.body.setImmovable(true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.lastPlatformX = this.scale.width / 2;
    let currentY = this.scale.height - 50;

    for (let i = 0; i < 10; i++) {
      currentY -= Phaser.Math.Between(this.minY, this.maxY);

      this.spawnPlatform(currentY);

      if (Phaser.Math.Between(1, 100) > 40) {
        this.spawnPlatform(currentY, null, true);
      }
    }

    const skin1 = this.textures.exists("player1") ? "player1" : "defaultSkin";
    const skin2 = this.textures.exists("player2") ? "player2" : "defaultSkin";

    if (window.gameMode === "multi") {
      this.player1 = this.createPlayer(
        this.centerX - 60,
        this.bottomY - 70,
        skin1,
      );
      this.player2 = this.createPlayer(
        this.centerX + 60,
        this.bottomY - 70,
        skin2,
      );

      if (!window.player1Skin && !window.player2Skin) {
        this.player2.setTint(0xffcccc);
      }

      this.setupPlayerCollisions(this.player1);
      this.setupPlayerCollisions(this.player2);
    } else {
      this.player = this.createPlayer(
        this.centerX,
        this.bottomY - 70,
        "player1",
      );
      this.setupPlayerCollisions(this.player);
    }

    this.isLeftTouching = false;
    this.isRightTouching = false;

    this.input.addPointer(1);
    this.input.activePointer.isDown = false;
  }

  createPlayer(x, y, skin) {
    let p;
    p = this.add.sprite(x, y, skin);
    p.setDisplaySize(50, 50);
    this.physics.add.existing(p);
    p.body.setCollideWorldBounds(true);
    p.setDepth(4);
    return p;
  }

  setupPlayerCollisions(player) {
    this.physics.add.collider(
      player,
      this.platforms,
      (p, platform) => {
        if (p.body.touching.down) {
          let dynamicJumpForce = this.baseJumpForce + this.platformSpeed * 0.8;
          p.body.setVelocityY(-dynamicJumpForce);

          if (platform.isExtra && !platform.isDisappearing) {
            platform.isDisappearing = true;

            this.time.delayedCall(200, () => {
              if (!platform.active) return;

              platform.body.enable = false;

              this.tweens.add({
                targets: platform,
                alpha: 0,
                scaleX: 0,
                duration: 200,
                onComplete: () => platform.destroy(),
              });
            });
          }
        }
      },
      (p, platform) => {
        return p.body.velocity.y > 0;
      },
    );

    this.physics.add.overlap(player, this.enemies, (enemy) => {
      this.gameOver();
    });

    this.physics.add.collider(player, this.ground, () => {
      player.body.setVelocityY(-500);
    });

    this.physics.add.overlap(player, this.bullets, () => {
      this.gameOver();
    });

    this.physics.world.on("worldbounds", (body) => {
      if (body.gameObject === player && body.blocked.down) {
        this.gameOver();
      }
    });
    player.body.onWorldBounds = true;
  }

  spawnPlatform(currentY, x = null, isExtra = false) {
    let finalX;
    if (x !== null) {
      finalX = x;
    } else if (isExtra) {
      finalX = this.getXWithGap(currentY, 110);
    } else {
      let range = this.scale.width / 3;
      let minX = Math.max(50, this.lastPlatformX - range);
      let maxX = Math.min(this.scale.width - 50, this.lastPlatformX + range);
      finalX = Phaser.Math.Between(minX, maxX);
      this.lastPlatformX = finalX;
    }

    let color = isExtra ? 0xadd8e6 : 0xb2d3a8;
    let rect = this.add.rectangle(finalX, currentY, 80, 20, color);
    rect.setStrokeStyle(2, isExtra ? 0x4682b4 : 0x88b04b);

    rect.isExtra = isExtra;

    this.physics.add.existing(rect);
    this.platforms.add(rect);

    rect.body.setImmovable(true);
    rect.body.checkCollision.up = false;
    rect.body.checkCollision.down = false;
    rect.body.checkCollision.left = false;
    rect.body.checkCollision.right = false;

    if (!isExtra && x === null && Phaser.Math.Between(1, 100) > 80) {
      rect.isMoving = true;
      rect.speed = 100;
      rect.minX = Math.max(40, finalX - 50);
      rect.maxX = Math.min(this.scale.width - 40, finalX + 50);
      rect.body.setVelocityX(rect.speed);
      rect.setFillStyle(0xffd1dc);
    }

    if (!isExtra && this.score > 20) {
      if (Phaser.Math.Between(1, 100) > 80) {
        if (Phaser.Math.Between(1, 100) > 50) {
          this.spawnShooter(rect);
        } else {
          this.spawnEnemy(rect);
        }

        let safeX = rect.x > this.centerX ? rect.x - 120 : rect.x + 120;
        safeX = Phaser.Math.Clamp(safeX, 50, this.scale.width - 50);

        this.spawnPlatform(rect.y + Phaser.Math.Between(0, 20), safeX, true);
      }
    }
  }

  getXWithGap(currentY, minDistance = 100) {
    let attempts = 0;
    let x;
    let isSafe = false;

    while (!isSafe && attempts < 15) {
      x = Phaser.Math.Between(50, this.scale.width - 50);
      isSafe = true;
      attempts++;

      this.platforms.children.iterate((p) => {
        if (Math.abs(p.y - currentY) < 10 && Math.abs(p.x - x) < minDistance) {
          isSafe = false;
        }
      });
    }
    return x;
  }

  update() {
    switch (this.STATE_GAME) {
      case "WAITING":
        this.handleWaitingState();
        break;
      case "PLAYING":
        this.handlePlayingState();
        break;
      case "GAMEOVER":
        break;
      default:
        break;
    }
  }

  handleWaitingState() {
    const isTouchAction = this.input.activePointer.isDown;
    if (window.gameMode === "multi") {
      this.player1.body.setVelocityX(0);
      this.player2.body.setVelocityX(0);
    } else {
      this.player.body.setVelocityX(0);
      if (isTouchAction) {
        if (this.input.activePointer.x < this.scale.width / 2) {
          this.player.body.setVelocityX(-this.playerSpeed);
        } else {
          this.player.body.setVelocityX(this.playerSpeed);
        }
      }
    }
    this.platforms.setVelocityY(0);
    this.platforms.setVelocityX(0);
    this.enemies.setVelocityY(0);

    const isKeyboardAction =
      this.cursors.right.isDown ||
      this.cursors.left.isDown ||
      this.keys.right.isDown ||
      this.keys.left.isDown;

    if (isKeyboardAction || isTouchAction) {
      this.STATE_GAME = this.STATE_PLAYING;
      this.tapToStart.destroy();

      this.platforms.getChildren().forEach((platform) => {
        if (platform.isMoving) {
          platform.body.setVelocityX(platform.speed);
        }
      });
    }
  }

  handlePlayingState() {
    if (window.gameMode === "multi") {
      this.player1.body.setVelocityX(0);
      this.player2.body.setVelocityX(0);
      if (this.cursors.left.isDown) {
        this.player2.body.setVelocityX(-this.playerSpeed);
        this.player2.setFlipX(false);
      } else if (this.cursors.right.isDown) {
        this.player2.body.setVelocityX(this.playerSpeed);
        this.player2.setFlipX(true);
      }
      if (this.keys.left.isDown) {
        this.player1.body.setVelocityX(-this.playerSpeed);
        this.player1.setFlipX(false);
      } else if (this.keys.right.isDown) {
        this.player1.body.setVelocityX(this.playerSpeed);
        this.player1.setFlipX(true);
      }
    } else {
      this.player.body.setVelocityX(0);
      if (this.cursors.left.isDown || this.keys.left.isDown) {
        this.player.body.setVelocityX(-this.playerSpeed);
        this.player.setFlipX(false);
      } else if (this.cursors.right.isDown || this.keys.right.isDown) {
        this.player.body.setVelocityX(this.playerSpeed);
        this.player.setFlipX(true);
      } else {
        const pointer = this.input.activePointer;
        if (pointer.isDown) {
          if (pointer.x < this.scale.width / 2) {
            this.player.body.setVelocityX(-this.playerSpeed);
            this.player.setFlipX(false);
          } else {
            this.player.body.setVelocityX(this.playerSpeed);
            this.player.setFlipX(true);
          }
        }
      }
    }

    if (this.ground && this.ground.active) {
      this.ground.body.setVelocityY(100);
      if (this.ground.y > this.scale.height + 100) this.ground.destroy();
    }

    this.score += 0.1;
    this.scoreText.setText("Score: " + Math.trunc(this.score));

    if (this.platformSpeed < this.maxPlatformSpeed) {
      this.platformSpeed += 0.05;
    } else {
      this.platformSpeed = this.maxPlatformSpeed;
    }
    let difficultyMultiplier = this.platformSpeed / 100;
    let progress = (this.platformSpeed - 100) / (this.maxPlatformSpeed - 100);
    this.minY = 100 + 50 * progress;
    this.maxY = 140 + 100 * progress;

    if (window.gameMode === "multi") {
      if (this.platformSpeed > 370) {
        this.player1.body.setGravityY(
          this.baseGravity * (difficultyMultiplier * 0.8),
        );
        this.player2.body.setGravityY(
          this.baseGravity * (difficultyMultiplier * 0.8),
        );
      } else {
        this.player1.body.setGravityY(
          this.baseGravity * (difficultyMultiplier * 0.7),
        );
        this.player2.body.setGravityY(
          this.baseGravity * (difficultyMultiplier * 0.7),
        );
      }
    } else {
      if (this.platformSpeed > 370) {
        this.player.body.setGravityY(
          this.baseGravity * (difficultyMultiplier * 0.8),
        );
      } else {
        this.player.body.setGravityY(
          this.baseGravity * (difficultyMultiplier * 0.7),
        );
      }
    }

    this.platforms.setVelocityY(this.platformSpeed);
    this.enemies.setVelocityY(this.platformSpeed);

    this.platforms.children.iterate((platform) => {
      if (!platform) return;

      platform.body.checkCollision.up = true;

      if (platform.isMoving) {
        if (platform.x <= platform.minX)
          platform.body.setVelocityX(platform.speed);
        else if (platform.x >= platform.maxX)
          platform.body.setVelocityX(-platform.speed);
      }

      const bottomEdge = this.cameras.main.scrollY + this.scale.height;

      if (platform.y > bottomEdge + 50) {
        let highestY = platform.y;
        this.platforms.children.each((p) => {
          if (p.y < highestY) highestY = p.y;
        });

        this.platforms.remove(platform, true, true);

        if (this.platforms.getLength() < 15) {
          let nextY = highestY - Phaser.Math.Between(this.minY, this.maxY);

          this.spawnPlatform(nextY);

          if (Phaser.Math.Between(1, 100) > 30) {
            this.spawnPlatform(nextY + Phaser.Math.Between(0, 20), null, true);
          }
        }
      }
    });

    this.enemies.children.iterate((enemy) => {
      if (!enemy) return;

      if (
        !enemy.parentPlatform ||
        !enemy.parentPlatform.active ||
        !enemy.parentPlatform.body
      ) {
        enemy.destroy();
        return;
      }

      enemy.x = enemy.parentPlatform.x;
      if (enemy.isShooter) {
        enemy.y = enemy.parentPlatform.y - 30;
      } else {
        enemy.y = enemy.parentPlatform.y - 40;
      }

      if (enemy.y > this.scale.height + 100) {
        enemy.destroy();
      }

      if (enemy.isShooter) {
        let now = this.time.now;
        if (now - enemy.lastFired > 2000) {
          this.fireBullet(enemy);
          enemy.lastFired = now;
        }
      }
    });

    this.bullets.children.iterate((bullet) => {
      if (bullet && bullet.y > this.scale.height + 50) bullet.destroy();
    });
  }

  spawnEnemy(platform) {
    let enemy = this.add.sprite(platform.x, platform.y, "enemy");
    enemy.setDisplaySize(70, 60);
    this.physics.add.existing(enemy);
    this.enemies.add(enemy);
    enemy.body.setAllowGravity(false);
    enemy.setDepth(3);
    enemy.parentPlatform = platform;

    this.tweens.add({
      targets: enemy,
      scaleX: enemy.scaleX * 1.1,
      scaleY: enemy.scaleY * 1.1,
      duration: 0,
      hold: 400,
      repeatDelay: 400,
      yoyo: true,
      repeat: -1,
      ease: "Stepped(1)",
    });
  }

  spawnShooter(platform) {
    let shooter = this.add.sprite(platform.x, platform.y, "shooter");
    shooter.setDisplaySize(70, 40);
    this.physics.add.existing(shooter);
    this.enemies.add(shooter);
    shooter.body.setAllowGravity(false);
    shooter.parentPlatform = platform;
    shooter.setDepth(3);

    shooter.lastFired = 0;
    shooter.isShooter = true;

    this.tweens.add({
      targets: shooter,
      scaleX: shooter.scaleX * 1.1,
      scaleY: shooter.scaleY * 1.1,
      duration: 0,
      hold: 400,
      repeatDelay: 400,
      yoyo: true,
      repeat: -1,
      ease: "Stepped(1)",
    });
  }

  fireBullet(shooter) {
    let bullet = this.add.image(shooter.x, shooter.y + 20, "pinkBullet");
    bullet.setDisplaySize(10, 10);
    this.physics.add.existing(bullet);
    this.bullets.add(bullet);
    bullet.setDepth(3);
    bullet.body.setVelocityY(this.platformSpeed + 120);
  }

  gameOver() {
    if (this.STATE_GAME === this.STATE_GAMEOVER) return;
    this.STATE_GAME = this.STATE_GAMEOVER;
    const finalScore = Math.trunc(this.score);

    let highScore = localStorage.getItem("bestScore") || 0;

    if (finalScore > highScore) {
      highScore = finalScore;
      localStorage.setItem("bestScore", highScore);
    }

    this.scene.launch("GameOverScene", {
      score: finalScore,
      best: highScore,
    });
    this.scene.pause();
  }
}

const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

const gameWidth = isMobile ? window.innerWidth : 600;
const gameHeight = isMobile ? window.innerHeight : 600;

const config = {
  type: Phaser.AUTO,
  width: gameWidth,
  height: gameHeight,
  scale: {
    mode: isMobile ? Phaser.Scale.FIT : Phaser.Scale.NONE,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 800 },
      debug: false,
    },
  },
  scene: [MainMenuScene, MainScene, GameOverScene, PauseScene],
};

const game = new Phaser.Game(config);
