const Theme = {
  bg: "#FDF5E6",
  gold: "#FFCC00",
  darkText: "#5D4037",
  accent: "#8F4C55",
};

const InstructionsText =
  "SINGLE PLAYER:\nUse A/D or ARROWS to move.\nJump on platforms to go up.\nAvoid enemies and bullets!\n\n" +
  "2 PLAYERS MODE:\nPlayer 1: A/D keys\nPlayer 2: Left/Right Arrows\n\n" +
  "MOBILE:\nTap and hold Left/Right side of screen.";

const gameNameText = "JUMPER";

class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  preload() {
    this.load.image("defaultSkin", "images/defaultSkin.png");
    this.load.image("player1", window.player1Skin || "images/defaultSkin.png");
    this.load.image("player2", window.player2Skin || "images/defaultSkin.png");
  }

  create() {
    const { width, height } = this.scale;
    this.centerX = width / 2;
    this.centerY = height / 2;

    this.cameras.main.setBackgroundColor(Theme.bg);

    this.player1Preview = this.add.sprite(
      this.centerX,
      this.centerY - 250,
      "player1",
    );
    this.player2Preview = this.add
      .sprite(this.centerX + 100, this.centerY - 250, "player2")
      .setVisible(false);

    this.setupCharacterVisuals(this.player1Preview);
    this.setupCharacterVisuals(this.player2Preview);

    this.menuElements = this.add.group();

    this.showInitialMenu();
  }

  clearMenu() {
    this.menuElements.clear(true, true);
  }

  showInitialMenu() {
    this.clearMenu();

    this.player1Preview.setX(this.centerX).setVisible(true);
    this.player2Preview.setVisible(false);

    const highScore = localStorage.getItem("bestScore") || 0;
    const scoreText = this.add
      .text(this.centerX, this.centerY - 180, "BEST SCORE: " + highScore, {
        fontSize: "20px",
        fontFamily: "Courier New",
        fill: Theme.accent,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const titleText = this.add
      .text(this.centerX, this.centerY - 80, gameNameText, {
        fontSize: "52px",
        fontFamily: "serif",
        fill: Theme.darkText,
        align: "center",
        stroke: "#ffffff",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const startBtn = this.createStyledButton(
      this.centerX,
      this.centerY + 40,
      "START",
      "#88B04B",
    );
    startBtn.on("pointerdown", () => {
      if (!this.sys.game.device.os.desktop) {
        window.gameMode = "single";
        this.scene.start("MainScene");
      } else {
        this.showModeSelection();
      }
    });

    const elements = [scoreText, titleText, startBtn];

    if (!this.sys.game.device.os.desktop) {
      const uploadBtn = this.createStyledButton(
        this.centerX,
        this.centerY + 120,
        "UPLOAD SKIN",
        "#9FA8DA",
      );
      uploadBtn.on("pointerdown", () => this.handleUpload(1));

      const howToBtn = this.createStyledButton(
        this.centerX,
        this.centerY + 200,
        "HOW TO PLAY",
        "#9FA8DA",
      );
      howToBtn.on("pointerdown", () => this.showInstructions());

      elements.push(uploadBtn, howToBtn);
    } else {
      const howToBtn = this.createStyledButton(
        this.centerX,
        this.centerY + 130,
        "HOW TO PLAY",
        "#9FA8DA",
      );
      howToBtn.on("pointerdown", () => this.showInstructions());

      elements.push(howToBtn);
    }

    const resetBtn = this.add
      .text(this.centerX, this.scale.height - 50, "Reset score", {
        fontSize: "14px",
        fill: "#A1887F",
        textDecoration: "underline",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    resetBtn.on("pointerdown", () => {
      localStorage.removeItem("bestScore");
      this.scene.restart();
    });

    elements.push(resetBtn);

    this.menuElements.addMultiple(elements);
  }

  showInstructions() {
    this.clearMenu();

    const title = this.add
      .text(this.centerX, this.centerY - 170, "HOW TO PLAY", {
        fontSize: "32px",
        fontFamily: "Courier New",
        fill: Theme.darkText,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const isMobile = !this.sys.game.device.os.desktop;
    const fontSize = isMobile ? "16px" : "18px";
    const lineSpacing = isMobile ? 4 : 10;

    const text = this.add
      .text(this.centerX, this.centerY, InstructionsText, {
        fontSize: fontSize,
        fontFamily: "Courier New",
        fill: Theme.darkText,
        align: "center",
        lineSpacing: lineSpacing,
        wordWrap: { width: this.scale.width - 50 },
      })
      .setOrigin(0.5);

    const backBtn = this.createStyledButton(
      this.centerX,
      this.centerY + 200,
      "BACK",
      Theme.accent,
    );
    backBtn.on("pointerdown", () => this.showInitialMenu());

    this.menuElements.addMultiple([title, text, backBtn]);
  }

  showModeSelection() {
    this.clearMenu();
    this.player1Preview.setX(this.centerX);
    this.player1Preview.setVisible(true);

    const highScore = localStorage.getItem("bestScore") || 0;
    const scoreText = this.add
      .text(this.centerX, this.centerY - 180, "BEST SCORE: " + highScore, {
        fontSize: "20px",
        fontFamily: "Courier New",
        fill: Theme.accent,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const titleText = this.add
      .text(this.centerX, this.centerY - 80, gameNameText, {
        fontSize: "52px",
        fontFamily: "serif",
        fill: Theme.darkText,
        align: "center",
        stroke: "#ffffff",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const singleBtn = this.createStyledButton(
      this.centerX,
      this.centerY + 40,
      "SINGLE PLAYER",
      "#88B04B",
    );
    const multiBtn = this.createStyledButton(
      this.centerX,
      this.centerY + 130,
      "2 PLAYERS",
      "#F4C2C2",
    );
    const backBtn = this.createStyledButton(
      this.centerX,
      this.centerY + 220,
      "BACK",
      Theme.accent,
    );

    singleBtn.on("pointerdown", () => this.showSinglePlayerMenu());
    multiBtn.on("pointerdown", () => this.showMultiPlayerMenu());
    backBtn.on("pointerdown", () => this.showInitialMenu());

    this.menuElements.addMultiple([
      singleBtn,
      multiBtn,
      backBtn,
      titleText,
      scoreText,
    ]);
  }

  showSinglePlayerMenu() {
    this.clearMenu();
    window.gameMode = "single";

    const highScore = localStorage.getItem("bestScore") || 0;
    const scoreText = this.add
      .text(this.centerX, this.centerY - 180, "BEST SCORE: " + highScore, {
        fontSize: "20px",
        fontFamily: "Courier New",
        fill: Theme.accent,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const titleText = this.add
      .text(this.centerX, this.centerY - 80, gameNameText, {
        fontSize: "52px",
        fontFamily: "serif",
        fill: Theme.darkText,
        align: "center",
        stroke: "#ffffff",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const playBtn = this.createStyledButton(
      this.centerX,
      this.centerY + 40,
      "PLAY",
      "#88B04B",
    );
    const uploadBtn = this.createStyledButton(
      this.centerX,
      this.centerY + 130,
      "UPLOAD SKIN",
      "#9FA8DA",
    );
    const backBtn = this.createStyledButton(
      this.centerX,
      this.centerY + 220,
      "BACK",
      Theme.accent,
    );

    playBtn.on("pointerdown", () => this.scene.start("MainScene"));
    uploadBtn.on("pointerdown", () => this.handleUpload(1));
    backBtn.on("pointerdown", () => this.showModeSelection());

    this.menuElements.addMultiple([
      playBtn,
      uploadBtn,
      backBtn,
      titleText,
      scoreText,
    ]);
  }

  showMultiPlayerMenu() {
    this.clearMenu();
    window.gameMode = "multi";

    const highScore = localStorage.getItem("bestScore") || 0;
    const scoreText = this.add
      .text(this.centerX, this.centerY - 180, "BEST SCORE: " + highScore, {
        fontSize: "20px",
        fontFamily: "Courier New",
        fill: Theme.accent,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const titleText = this.add
      .text(this.centerX, this.centerY - 80, gameNameText, {
        fontSize: "52px",
        fontFamily: "serif",
        fill: Theme.darkText,
        align: "center",
        stroke: "#ffffff",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.player1Preview.setPosition(this.centerX - 100, this.centerY - 250);
    this.player2Preview
      .setVisible(true)
      .setPosition(this.centerX + 100, this.centerY - 250);

    const playBtn = this.createStyledButton(
      this.centerX,
      this.centerY + 10,
      "PLAY",
      "#88B04B",
    );
    const up1 = this.createStyledButton(
      this.centerX,
      this.centerY + 90,
      "SKIN PLAYER 1",
      "#9FA8DA",
    );
    const up2 = this.createStyledButton(
      this.centerX,
      this.centerY + 160,
      "SKIN PLAYER 2",
      "#F4C2C2",
    );
    const backBtn = this.createStyledButton(
      this.centerX,
      this.centerY + 230,
      "BACK",
      Theme.accent,
    );

    playBtn.on("pointerdown", () => this.scene.start("MainScene"));
    up1.on("pointerdown", () => this.handleUpload(1));
    up2.on("pointerdown", () => this.handleUpload(2));
    backBtn.on("pointerdown", () => {
      this.player2Preview.setVisible(false);
      this.showModeSelection();
    });

    this.menuElements.addMultiple([
      playBtn,
      up1,
      up2,
      backBtn,
      titleText,
      scoreText,
    ]);
  }

  setupCharacterVisuals(sprite) {
    if (!sprite) return;
    const targetSize = 70;
    this.tweens.killTweensOf(sprite);

    const updateScale = () => {
      const ratio = Math.min(
        targetSize / sprite.width,
        targetSize / sprite.height,
      );
      sprite.setScale(ratio);
    };

    updateScale();

    this.tweens.add({
      targets: sprite,
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: "Linear",
    });
  }

  handleUpload(playerNum) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const oldURL = playerNum === 1 ? window.player1Skin : window.player2Skin;
      if (oldURL) URL.revokeObjectURL(oldURL);

      const fileURL = URL.createObjectURL(file);
      if (playerNum === 1) window.player1Skin = fileURL;
      else window.player2Skin = fileURL;

      this.updateCharacterImage(fileURL, playerNum);
    };
    input.click();
  }

  updateCharacterImage(url, playerNum) {
    const textureKey = `player${playerNum}`;
    const preview = playerNum === 1 ? this.player1Preview : this.player2Preview;

    if (preview) {
      preview.setVisible(false);
    }

    if (this.textures.exists(textureKey)) {
      this.textures.remove(textureKey);
    }
    this.load.image(textureKey, url);
    this.load.once("complete", () => {
      if (!preview || !preview.active) return;
      preview.setTexture(textureKey);
      preview.setVisible(true);
      this.setupCharacterVisuals(preview);
    });

    this.load.start();
  }

  createStyledButton(x, y, label, color) {
    const btn = this.add
      .text(x, y, label, {
        fontSize: "24px",
        fontFamily: "Courier New",
        backgroundColor: color,
        fill: "#fff",
        padding: { x: 20, y: 10 },
        fontStyle: "bold",
        fixedWidth: 300,
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on("pointerover", () => btn.setAlpha(0.8).setScale(1.05));
    btn.on("pointerout", () => btn.setAlpha(1).setScale(1));

    return btn;
  }
}

class PauseScene extends Phaser.Scene {
  constructor() {
    super("PauseScene");
  }
  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4);

    this.add
      .text(width / 2, height / 2 - 100, "MEDITATION", {
        fontSize: "42px",
        fill: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const resumeBtn = this.createBtn(
      width / 2,
      height / 2,
      "CONTINUE",
      "#88B04B",
    );
    resumeBtn.on("pointerdown", () => {
      this.scene.stop();
      this.scene.resume("MainScene");
    });

    const restartBtn = this.createBtn(
      width / 2,
      height / 2 + 80,
      "RESTART",
      "#F4C2C2",
    );
    restartBtn.on("pointerdown", () => {
      this.scene.stop();
      this.scene.get("MainScene").scene.restart();
    });

    const menuBtn = this.createBtn(
      width / 2,
      height / 2 + 160,
      "MENU",
      "#9FA8DA",
    );
    menuBtn.on("pointerdown", () => {
      this.scene.stop();
      this.scene.stop("MainScene");
      this.scene.start("MainMenuScene");
    });
  }

  createBtn(x, y, txt, clr) {
    return this.add
      .text(x, y, txt, {
        fontSize: "24px",
        backgroundColor: clr,
        padding: 10,
        fixedWidth: 200,
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }
  init(data) {
    this.finalScore = data.score || 0;
    this.bestScore = data.best || 0;
  }
  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4);

    this.add
      .text(width / 2, height / 2 - 120, "THE GARDEN FELL", {
        fontSize: "42px",
        fill: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 40, "Score: " + this.finalScore, {
        fontSize: "28px",
        fill: "#FDF5E6",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 10, "Best score: " + this.bestScore, {
        fontSize: "20px",
        fill: Theme.gold,
      })
      .setOrigin(0.5);

    const restartBtn = this.add
      .text(width / 2, height / 2 + 100, "TRY AGAIN", {
        fontSize: "32px",
        backgroundColor: "#88B04B",
        padding: 15,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    restartBtn.on("pointerdown", () => {
      this.scene.stop();
      this.scene.get("MainScene").scene.restart();
    });

    const menuBtn = this.add
      .text(width / 2, height / 2 + 180, "RETREAT", {
        fontSize: "24px",
        fill: "#fff",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    menuBtn.on("pointerdown", () => {
      this.scene.stop();
      this.scene.stop("MainScene");
      this.scene.start("MainMenuScene");
    });
  }
}
