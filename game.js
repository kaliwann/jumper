class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }
  preload() {
    this.load.image("pause", "images/pause.png");
    this.load.image("enemy", "images/enemy.png");
    this.load.image("shooter", "images/shooter.png");
    this.load.image("pinkBullet", "images/pinkFlower.png");
    this.load.image("shield", "images/shield.png");
    const settings = this.game.playerSettings;
    const skinKey =
      settings && settings.isDuo
        ? `customSkinURL_${settings.id}`
        : "customSkinURL";
    const textureKey =
      settings && settings.isDuo ? `player_${settings.id}` : "player";

    const skinURL = window[skinKey];

    if (skinURL) {
      if (this.textures.exists(textureKey)) {
        this.textures.remove(textureKey);
      }
      this.load.image(textureKey, skinURL);
    } else {
      this.load.image(textureKey, "images/defaultSkin.png");
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
    this.maxY = 140;
    this.centerX = this.scale.width / 2;
    this.bottomY = this.scale.height;
    this.platformSpeed = 130;
    this.maxPlatformSpeed = 400;
    this.baseGravity = 800;
    this.baseJumpForce = 480;
    this.playerSpeed = 300;
    this.lastShieldScore = 0;
    this.isShielded = false;
    this.shieldGraphic = null;

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

    this.bonuses = this.physics.add.group({
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

    const settings = this.game.playerSettings;

    if (settings.id === 2) {
      this.playerKeys = this.input.keyboard.createCursorKeys();
    } else {
      this.playerKeys = this.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      });
    }

    this.lastPlatformX = this.scale.width / 2;
    let currentY = this.scale.height - 50;

    if (this.game.playerSettings.id === 1) {
      GlobalWorld.minY = this.minY;
      GlobalWorld.maxY = this.maxY;
      GlobalWorld.init(this.scale.width, this.scale.height);
    }

    if (this.game.playerSettings.id === 1) {
      GlobalWorld.init(this.scale.width, this.scale.height);
    }

    GlobalWorld.platforms.forEach((data) => {
      this.createPhysicalPlatform(data);
    });
    this.player = this.createPlayer();
    this.setupPlayerCollisions(this.player);

    this.isLeftTouching = false;
    this.isRightTouching = false;

    this.input.addPointer(1);

    this.input.activePointer.isDown = false;
  }

  createPlayer() {
    const settings = this.game.playerSettings;
    const textureKey =
      settings && settings.isDuo ? `player_${settings.id}` : "player";
    let p;
    p = this.add.sprite(this.centerX, this.bottomY - 70, textureKey);
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
      if (!this.isShielded) {
        this.gameOver();
      }
    });

    this.physics.add.collider(player, this.ground, () => {
      player.body.setVelocityY(-500);
    });

    this.physics.add.overlap(player, this.bullets, () => {
      if (!this.isShielded) {
        this.gameOver();
      }
    });

    this.physics.add.overlap(this.player, this.bonuses, (player, bonus) => {
      bonus.destroy();
      this.activateShield();
    });

    this.physics.world.on("worldbounds", (body) => {
      if (body.gameObject === player && body.blocked.down) {
        this.gameOver();
      }
    });
    player.body.onWorldBounds = true;
  }

  createPhysicalPlatform(data) {
    const isTooClose = this.platforms
      .getChildren()
      .some((p) => Math.abs(p.y - data.y) < 30 && Math.abs(p.x - data.x) < 50);
    if (isTooClose) return;

    this.renderPlatform(data);

    if (data.extraSibling) {
      this.renderPlatform({
        ...data.extraSibling,
        isExtra: false,
        isMoving: false,
        enemyType: null,
      });
    }
  }

  renderPlatform(data) {
    let color = data.isExtra ? 0xadd8e6 : 0xb2d3a8;
    let rect = this.add.rectangle(data.x, data.y, 80, 20, color);
    rect.setStrokeStyle(2, data.isExtra ? 0x4682b4 : 0x88b04b);

    rect.globalId = data.id;
    rect.isExtra = data.isExtra;
    this.physics.add.existing(rect);
    this.platforms.add(rect);
    rect.body.setImmovable(true);
    rect.body.checkCollision.up = false;

    if (data.isMoving) {
      rect.isMoving = true;
      rect.speed = data.speed;
      rect.minX = Math.max(40, data.x - data.range);
      rect.maxX = Math.min(this.scale.width - 40, data.x + data.range);
      rect.body.setVelocityX(rect.speed);
      rect.setFillStyle(0xffd1dc);
    }

    if (data.enemyType === "enemy") this.spawnEnemy(rect);
    if (data.enemyType === "shooter") this.spawnShooter(rect);
  }

  spawnShieldBonus() {
    let bonus = this.add.image(this.scale.width / 2, -50, "shield");
    bonus.setDisplaySize(40, 40);
    this.physics.add.existing(bonus);
    this.bonuses.add(bonus);
    bonus.body.setVelocityY(200);
  }

  activateShield() {
    this.isShielded = true;

    if (this.shieldGraphic) this.shieldGraphic.destroy();

    this.shieldGraphic = this.add.circle(
      this.player.x,
      this.player.y,
      45,
      0x00bfff,
      0.5,
    );
    this.shieldGraphic.setDepth(5);

    this.time.delayedCall(8000, () => {
      this.isShielded = false;
      if (this.shieldGraphic) {
        this.shieldGraphic.destroy();
        this.shieldGraphic = null;
      }
    });
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
    this.player.body.setVelocityX(0);
    this.platforms.setVelocityY(0);
    this.platforms.setVelocityX(0);
    this.enemies.setVelocityY(0);

    const settings = this.game.playerSettings;
    let isAction = false;

    if (settings && settings.isDuo) {
      if (this.playerKeys) {
        isAction = this.playerKeys.left.isDown || this.playerKeys.right.isDown;
      }
    } else {
      const cursors = this.input.keyboard.createCursorKeys();
      const wasd = this.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      });

      isAction =
        cursors.left.isDown ||
        cursors.right.isDown ||
        wasd.left.isDown ||
        wasd.right.isDown ||
        this.input.activePointer.isDown;
    }

    if (isAction) {
      this.STATE_GAME = this.STATE_PLAYING;

      if (this.tapToStart) {
        this.tapToStart.destroy();
      }

      this.platforms.getChildren().forEach((platform) => {
        if (platform.isMoving && platform.body) {
          platform.body.setVelocityX(platform.speed);
        }
      });

      if (!settings.isDuo && this.input.activePointer.isDown) {
        if (this.input.activePointer.x < this.scale.width / 2) {
          this.player.body.setVelocityX(-this.playerSpeed);
        } else {
          this.player.body.setVelocityX(this.playerSpeed);
        }
      }
    }
  }

  handlePlayingState() {
    this.player.body.setVelocityX(0);

    const settings = this.game.playerSettings;
    let leftPressed = false;
    let rightPressed = false;

    if (settings.isDuo) {
      if (this.playerKeys) {
        leftPressed = this.playerKeys.left.isDown;
        rightPressed = this.playerKeys.right.isDown;
      }
    } else {
      const cursors = this.input.keyboard.createCursorKeys();
      const wasd = this.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
      });

      leftPressed = cursors.left.isDown || wasd.left.isDown;
      rightPressed = cursors.right.isDown || wasd.right.isDown;

      const pointer = this.input.activePointer;
      if (pointer.isDown) {
        if (pointer.x < this.scale.width / 2) {
          leftPressed = true;
        } else {
          rightPressed = true;
        }
      }
    }

    if (leftPressed) {
      this.player.body.setVelocityX(-this.playerSpeed);
      this.player.setFlipX(false);
    } else if (rightPressed) {
      this.player.body.setVelocityX(this.playerSpeed);
      this.player.setFlipX(true);
    }

    const spawnMargin = 100;
    const screenTop = this.cameras.main.scrollY;

    GlobalWorld.platforms.forEach((data) => {
      const exists = this.platforms
        .getChildren()
        .some((p) => p.globalId === data.id);

      if (
        !exists &&
        data.y < screenTop - spawnMargin &&
        data.y > screenTop - 1000
      ) {
        this.createPhysicalPlatform(data);
      }
    });

    let realHighestY = Infinity;
    this.platforms.children.iterate((p) => {
      if (p.active && p.y < realHighestY) realHighestY = p.y;
    });
    if (realHighestY === Infinity) realHighestY = this.player.y;

    if (this.game.playerSettings.id === 1) {
      if (this.player.y < realHighestY + 1500) {
        GlobalWorld.extend(this.scale.width, realHighestY);
      }
    }

    this.platforms.children.iterate((platform) => {
      if (!platform) return;

      platform.body.checkCollision.up = true;

      if (platform.y > this.scale.height + this.cameras.main.scrollY + 100) {
        platform.destroy();
      }

      if (platform.isMoving && platform.body) {
        if (platform.x <= platform.minX)
          platform.body.setVelocityX(platform.speed);
        else if (platform.x >= platform.maxX)
          platform.body.setVelocityX(-platform.speed);
      }
    });

    if (this.ground && this.ground.active) {
      this.ground.body.setVelocityY(100);
      if (this.ground.y > this.scale.height + 100) this.ground.destroy();
    }

    this.score += 0.1;
    this.scoreText.setText("Score: " + Math.trunc(this.score));

    let currentScore = Math.trunc(this.score);
    if (
      currentScore > 0 &&
      currentScore % 100 === 0 &&
      currentScore !== this.lastShieldScore
    ) {
      this.lastShieldScore = currentScore;
      this.spawnShieldBonus();
    }

    if (this.isShielded && this.shieldGraphic) {
      this.shieldGraphic.x = this.player.x;
      this.shieldGraphic.y = this.player.y;
    }

    if (this.platformSpeed < this.maxPlatformSpeed) {
      this.platformSpeed += 0.05;
    } else {
      this.platformSpeed = this.maxPlatformSpeed;
    }
    let difficultyMultiplier = this.platformSpeed / 100;
    let progress = (this.platformSpeed - 100) / (this.maxPlatformSpeed - 100);
    this.minY = 100 + 70 * progress;
    this.maxY = 140 + 140 * progress;

    GlobalWorld.minY = this.minY;
    GlobalWorld.maxY = this.maxY;

    if (this.platformSpeed > 200) {
      this.player.body.setGravityY(
        this.baseGravity * (difficultyMultiplier * 0.9),
      );
    } else {
      this.player.body.setGravityY(
        this.baseGravity * (difficultyMultiplier * 0.7),
      );
    }
    this.platforms.setVelocityY(this.platformSpeed);
    this.enemies.setVelocityY(this.platformSpeed);

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
        if (now - enemy.lastFired > 4000) {
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

    const settings = this.game.playerSettings;
    const scoreKey =
      settings && settings.isDuo ? `bestScore_${settings.id}` : "bestScore";

    let highScore = localStorage.getItem(scoreKey) || 0;

    if (finalScore > highScore) {
      highScore = finalScore;
      localStorage.setItem(scoreKey, highScore);
    }

    this.scene.launch("GameOverScene", {
      score: finalScore,
      best: highScore,
    });
    this.scene.pause();
  }
}

function createGameInstance(containerId, playerConfig) {
  const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
  const gameWidth = isMobile
    ? window.innerWidth / (playerConfig.isDuo ? 2 : 1)
    : 600;
  const gameHeight = isMobile ? window.innerHeight : 600;

  const config = {
    type: Phaser.AUTO,
    parent: containerId,
    width: gameWidth,
    height: gameHeight,
    input: {
      keyboard: true,
      mouse: true,
      touch: true,
      activePointers: 1,
    },
    disableContextMenu: true,
    scale: {
      mode: isMobile ? Phaser.Scale.FIT : Phaser.Scale.NONE,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 800 }, debug: false },
    },
    scene: [MainMenuScene, MainScene, GameOverScene, PauseScene],
  };

  const game = new Phaser.Game(config);
  game.playerSettings = playerConfig;
  return game;
}

window.game1 = createGameInstance("player1-root", { id: 1, isDuo: false });
