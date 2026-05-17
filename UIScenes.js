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
const DefaultCharacterKey = "defaultSkin";
const CharacterSkins = {
  defaultSkin: "images/defaultSkin.png",
  redSkin: "images/redSkin.png",
};

class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenuScene");
  }

  preload() {
    this.load.image("defaultSkin", CharacterSkins.defaultSkin);
    this.load.image("redSkin", CharacterSkins.redSkin);

    const settings = this.game.playerSettings;

    let skinKey = "customSkinURL";
    let textureKey = "player";

    if (settings && settings.isDuo) {
      skinKey = `customSkinURL_${settings.id}`;
      textureKey = `player_${settings.id}`;
    }

    const selectedCharacter = this.getSelectedCharacterKey();
    const selectedSkinPath =
      CharacterSkins[selectedCharacter] || CharacterSkins[DefaultCharacterKey];
    const savedSkin = window[skinKey] || selectedSkinPath;
    this.load.image(textureKey, savedSkin);
  }

  create() {
    const { width, height } = this.scale;
    this.centerX = width / 2;
    this.centerY = height / 2;

    this.cameras.main.setBackgroundColor(Theme.bg);
    const settings = this.game.playerSettings;
    const textureKey =
      settings && settings.isDuo ? `player_${settings.id}` : "player";

    this.playerPreview = this.add.sprite(
      this.centerX,
      this.centerY - 250,
      textureKey,
    );
    this.setupCharacterVisuals(this.playerPreview);

    this.menuElements = this.add.group();
    this.backButton = this.add
      .text(20, 20, "BACK", {
        fontSize: "20px",
        fontFamily: "Courier New",
        backgroundColor: Theme.accent,
        fill: "#fff",
        padding: { x: 12, y: 8 },
        fontStyle: "bold",
      })
      .setOrigin(0, 0)
      .setDepth(20)
      .setScrollFactor(0)
      .setVisible(false)
      .setInteractive({ useHandCursor: true });
    this.backButton.on("pointerover", () => this.backButton.setAlpha(0.8));
    this.backButton.on("pointerout", () => this.backButton.setAlpha(1));
    this.backButton.on("pointerdown", () => {
      if (this.onBackAction) {
        this.onBackAction();
      }
    });

    this.showInitialMenu();
  }

  clearMenu() {
    this.menuElements.clear(true, true);
  }

  setBackAction(action) {
    this.onBackAction = action || null;
    this.backButton.setVisible(Boolean(this.onBackAction));
  }

  showInitialMenu() {
    this.clearMenu();
    this.setBackAction(null);
    this.playerPreview.setX(this.centerX).setVisible(true);

    const settings = this.game.playerSettings;
    const scoreKey =
      settings && settings.isDuo ? `bestScore_${settings.id}` : "bestScore";
    const highScore = localStorage.getItem(scoreKey) || 0;

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

    const isDesktop = this.sys.game.device.os.desktop;

    if (!isDesktop || (settings && settings.isDuo)) {
      this.mobileMenu(scoreText, titleText);
    } else {
      const startBtn = this.createStyledButton(
        this.centerX,
        this.centerY + 40,
        "START",
        "#88B04B",
      );
      startBtn.on("pointerdown", () => this.showModeSelection());

      const howToBtn = this.createStyledButton(
        this.centerX,
        this.centerY + 130,
        "HOW TO PLAY",
        "#9FA8DA",
      );
      howToBtn.on("pointerdown", () => this.showInstructions());

      const selectCharacterBtn = this.createStyledButton(
        this.centerX,
        this.centerY + 220,
        "SELECT CHARACTER",
        "#F4C2C2",
      );
      selectCharacterBtn.on("pointerdown", () =>
        this.showCharacterSelection(() => this.showInitialMenu()),
      );

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

      this.menuElements.addMultiple([
        scoreText,
        titleText,
        startBtn,
        howToBtn,
        selectCharacterBtn,
        resetBtn,
      ]);
    }
  }

  mobileMenu(scoreText, titleText) {
    const settings = this.game.playerSettings;
    const isDuo = settings && settings.isDuo;

    if (!isDuo) {
      const startBtn = this.createStyledButton(
        this.centerX,
        this.centerY + 40,
        "START",
        "#88B04B",
      );

      startBtn.on("pointerdown", () => {
        const settings = this.game.playerSettings;
        if (!settings || !settings.isDuo || settings.id === 1) {
          if (typeof WorldSeed !== "undefined") WorldSeed.platforms = [];
        }
        this.scene.start("MainScene");
      });
      this.menuElements.add(startBtn);
    }

    const uploadBtn = this.createStyledButton(
      this.centerX,
      this.centerY + 120,
      "UPLOAD SKIN",
      "#9FA8DA",
    );
    uploadBtn.on("pointerdown", () => this.handleUpload());

    const howToBtn = this.createStyledButton(
      this.centerX,
      this.centerY + 200,
      "HOW TO PLAY",
      "#9FA8DA",
    );
    howToBtn.on("pointerdown", () => this.showInstructions());

    const selectCharacterBtn = this.createStyledButton(
      this.centerX,
      this.centerY + 280,
      "SELECT CHARACTER",
      "#F4C2C2",
    );
    selectCharacterBtn.on("pointerdown", () =>
      this.showCharacterSelection(() => this.showInitialMenu()),
    );

    const resetBtn = this.add
      .text(this.centerX, this.scale.height - 50, "Reset score", {
        fontSize: "14px",
        fill: "#A1887F",
        textDecoration: "underline",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    resetBtn.on("pointerdown", () => {
      const settings = this.game.playerSettings;
      const scoreKey =
        settings && settings.isDuo ? `bestScore_${settings.id}` : "bestScore";
      localStorage.removeItem(scoreKey);
      this.scene.restart();
    });

    this.menuElements.addMultiple([
      scoreText,
      titleText,
      uploadBtn,
      howToBtn,
      selectCharacterBtn,
      resetBtn,
    ]);
  }

  showModeSelection() {
    this.clearMenu();
    this.setBackAction(() => this.showInitialMenu());
    this.playerPreview.setX(this.centerX);
    this.playerPreview.setVisible(true);

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

    singleBtn.on("pointerdown", () => this.showSinglePlayerMenu());

    const settings = this.game.playerSettings;

    if (!settings || !settings.isDuo) {
      const duoBtn = this.createStyledButton(
        this.centerX,
        this.centerY + 130,
        "2 PLAYERS",
        "#F4C2C2",
      );

      duoBtn.on("pointerdown", () => {
        duoBtn.setVisible(false);
        window.game1.destroy(true);

        window.game1 = createGameInstance("player1-root", {
          id: 1,
          isDuo: true,
        });
        window.game2 = createGameInstance("player2-root", {
          id: 2,
          isDuo: true,
        });

        const ctrlPanel = document.getElementById("multiplayer-controls");
        const startBtn = document.getElementById("multi-start-btn");
        const restartBtn = document.getElementById("multi-restart-btn");
        const menuBtn = document.getElementById("multi-menu-btn");

        if (ctrlPanel) {
          ctrlPanel.style.display = "flex";
          startBtn.style.display = "block";

          const resetGlobalState = () => {
            if (typeof GlobalWorld !== "undefined") {
              GlobalWorld.platforms = [];
              GlobalWorld.nextId = 0;
            }
          };

          startBtn.onclick = () => {
            resetGlobalState();
            [window.game1, window.game2].forEach((game) => {
              const currentScene = game.scene.getScene("MainMenuScene");
              if (currentScene) currentScene.scene.start("MainScene");
            });
            startBtn.style.display = "none";
          };

          restartBtn.onclick = () => {
            resetGlobalState();
            [window.game1, window.game2].forEach((game) => {
              const mainScene = game.scene.getScene("MainScene");
              const gameOver = game.scene.getScene("GameOverScene");
              const pause = game.scene.getScene("PauseScene");

              if (gameOver) game.scene.stop("GameOverScene");
              if (pause) game.scene.stop("PauseScene");

              if (mainScene) {
                mainScene.scene.restart();
                game.scene.resume("MainScene");
              } else {
                game.scene.start("MainScene");
              }
            });
            startBtn.style.display = "none";
          };

          menuBtn.onclick = () => {
            ctrlPanel.style.display = "none";
            window.game1.destroy(true);
            window.game2.destroy(true);
            window.game1 = createGameInstance("player1-root", {
              id: 1,
              isDuo: false,
            });
          };
        }
      });
    }

    this.menuElements.addMultiple([singleBtn, titleText, scoreText]);
  }

  showSinglePlayerMenu() {
    this.clearMenu();
    this.setBackAction(() => this.showModeSelection());

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
    playBtn.on("pointerdown", () => this.scene.start("MainScene"));

    const uploadBtn = this.createStyledButton(
      this.centerX,
      this.centerY + 130,
      "UPLOAD SKIN",
      "#9FA8DA",
    );
    uploadBtn.on("pointerdown", () => this.handleUpload());

    const selectCharacterBtn = this.createStyledButton(
      this.centerX,
      this.centerY + 220,
      "SELECT CHARACTER",
      "#F4C2C2",
    );
    selectCharacterBtn.on("pointerdown", () =>
      this.showCharacterSelection(() => this.showSinglePlayerMenu()),
    );

    this.menuElements.addMultiple([
      playBtn,
      uploadBtn,
      selectCharacterBtn,
      titleText,
      scoreText,
    ]);
  }

  showCharacterSelection(onBack) {
    this.clearMenu();
    this.setBackAction(onBack);

    const title = this.add
      .text(this.centerX, this.centerY - 220, "SELECT CHARACTER", {
        fontSize: "32px",
        fontFamily: "Courier New",
        fill: Theme.darkText,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const selectedCharacter = this.getSelectedCharacterKey();
    const characterKeys = Object.keys(CharacterSkins);

    characterKeys.forEach((characterKey, index) => {
      const x = this.centerX + (index === 0 ? -110 : 110);
      const y = this.centerY - 40;
      const isSelected = selectedCharacter === characterKey;

      const frame = this.add
        .rectangle(
          x,
          y,
          140,
          140,
          isSelected ? 0xb2d3a8 : 0xffffff,
          isSelected ? 1 : 0.85,
        )
        .setStrokeStyle(4, isSelected ? 0x88b04b : 0xa1887f)
        .setInteractive({ useHandCursor: true });

      const icon = this.add
        .sprite(x, y - 10, characterKey)
        .setDisplaySize(70, 70)
        .setInteractive({ useHandCursor: true });

      const label = this.add
        .text(x, y + 50, characterKey.replace("Skin", ""), {
          fontSize: "18px",
          fontFamily: "Courier New",
          fill: Theme.darkText,
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      const handlePick = () => {
        this.selectCharacter(characterKey);
        this.showCharacterSelection(onBack);
      };

      frame.on("pointerdown", handlePick);
      icon.on("pointerdown", handlePick);

      this.menuElements.addMultiple([frame, icon, label]);
    });

    this.menuElements.add(title);
  }

  showInstructions() {
    this.clearMenu();
    this.setBackAction(() => this.showInitialMenu());

    const title = this.add
      .text(this.centerX, this.centerY - 170, "HOW TO PLAY", {
        fontSize: "32px",
        fontFamily: "Courier New",
        fill: Theme.darkText,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const text = this.add
      .text(this.centerX, this.centerY, InstructionsText, {
        fontSize: "16px",
        fontFamily: "Courier New",
        fill: Theme.darkText,
        align: "center",
        lineSpacing: 8,
        wordWrap: { width: this.scale.width - 50 },
      })
      .setOrigin(0.5);

    this.menuElements.addMultiple([title, text]);
  }

  setupCharacterVisuals(sprite) {
    if (!sprite) return;
    const targetSize = 70;
    this.tweens.killTweensOf(sprite);

    const ratio = Math.min(
      targetSize / sprite.width,
      targetSize / sprite.height,
    );
    sprite.setScale(ratio);

    this.tweens.add({
      targets: sprite,
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: "Linear",
    });
  }

  handleUpload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const settings = this.game.playerSettings;
      const skinKey =
        settings && settings.isDuo
          ? `customSkinURL_${settings.id}`
          : "customSkinURL";

      if (window[skinKey]) {
        URL.revokeObjectURL(window[skinKey]);
      }

      const fileURL = URL.createObjectURL(file);
      window[skinKey] = fileURL;

      this.updateCharacterImage(fileURL);
    };
    input.click();
  }

  updateCharacterImage(url) {
    const settings = this.game.playerSettings;
    const textureKey =
      settings && settings.isDuo ? `player_${settings.id}` : "player";
    const preview = this.playerPreview;

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

  getCharacterStorageKey() {
    const settings = this.game.playerSettings;
    return settings && settings.isDuo
      ? `selectedCharacter_${settings.id}`
      : "selectedCharacter";
  }

  getSelectedCharacterKey() {
    const key = this.getCharacterStorageKey();
    const savedCharacter = localStorage.getItem(key);
    if (savedCharacter && CharacterSkins[savedCharacter]) {
      return savedCharacter;
    }
    return DefaultCharacterKey;
  }

  selectCharacter(characterKey) {
    if (!CharacterSkins[characterKey]) return;

    const key = this.getCharacterStorageKey();
    localStorage.setItem(key, characterKey);

    const settings = this.game.playerSettings;
    const skinKey =
      settings && settings.isDuo
        ? `customSkinURL_${settings.id}`
        : "customSkinURL";
    const selectedSkinPath = CharacterSkins[characterKey];

    if (window[skinKey]) {
      URL.revokeObjectURL(window[skinKey]);
      delete window[skinKey];
    }

    this.updateCharacterImage(selectedSkinPath);
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
        fixedWidth: 280,
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

    const settings = this.game.playerSettings;
    if (!settings.isDuo) {
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
    }

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
      .text(width / 2, height / 2 - 120, "GAME OVER", {
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

    const handleRestart = () => {
      if (this.game.playerSettings.isDuo) return;
      this.scene.stop();
      const mainScene = this.scene.get("MainScene");
      if (mainScene) {
        mainScene.scene.restart();
      }
    };

    if (!this.game.playerSettings.isDuo) {
      const restartBtn = this.add
        .text(width / 2, height / 2 + 100, "TRY AGAIN", {
          fontSize: "32px",
          backgroundColor: "#88B04B",
          padding: 15,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      restartBtn.on("pointerdown", handleRestart);
    }

    this.input.keyboard.on("keydown-SPACE", handleRestart);

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
