const GlobalWorld = {
  platforms: [],
  lastY: 0,
  nextId: 0,
  lastPlatformX: 200,
  minY: 100,
  maxY: 140,

  generatePlatformData(sceneWidth, startY) {
    this.nextId++;

    const horizontalGap = 60;
    const jumpReach = 150;
    let minX = Math.max(50, this.lastPlatformX - jumpReach);
    let maxX = Math.min(sceneWidth - 50, this.lastPlatformX + jumpReach);
    let x = Phaser.Math.Between(minX, maxX);

    if (Math.abs(x - this.lastPlatformX) < horizontalGap) {
      x = x > sceneWidth / 2 ? x - horizontalGap : x + horizontalGap;
    }

    this.lastPlatformX = x;

    const isExtra = Math.random() > 0.7;
    const distanceUp = Math.abs(startY - 600);
    const canSpawnEnemy = distanceUp > 1500;
    const enemyChance = Phaser.Math.Between(1, 100) > 85;
    const hasEnemy = canSpawnEnemy && !isExtra && enemyChance;
    let extraSibling = null;
    const needsSibling = hasEnemy || Math.random() < 0.2;

    if (needsSibling) {
      const offsetValue = Phaser.Math.Between(90, 150);
      const direction = Math.random() > 0.5 ? 1 : -1;
      let siblingX = x + offsetValue * direction;

      if (siblingX < 40) {
        siblingX = x + offsetValue;
      } else if (siblingX > sceneWidth - 40) {
        siblingX = x - offsetValue;
      }

      extraSibling = {
        id: "plat_sib_" + this.nextId,
        x: siblingX,
        y: startY,
      };
    }

    return {
      id: "plat_" + this.nextId,
      x: x,
      y: startY,
      isExtra: isExtra,
      isMoving: !isExtra && Math.random() > 0.85,
      enemyType: hasEnemy ? (Math.random() > 0.8 ? "shooter" : "enemy") : null,
      speed: 100,
      range: 60,
      extraSibling: extraSibling,
    };
  },

  init(sceneWidth, sceneHeight) {
    this.platforms = [];
    this.lastY = sceneHeight - 50;
    this.lastPlatformX = sceneWidth / 2;

    for (let i = 0; i < 50; i++) {
      this.lastY -= Phaser.Math.Between(this.minY, this.maxY);
      this.platforms.push(this.generatePlatformData(sceneWidth, this.lastY));
    }
  },

  extend(sceneWidth, currentTopY) {
    this.lastY = currentTopY;
    for (let i = 0; i < 5; i++) {
      this.lastY -= Phaser.Math.Between(this.minY, this.maxY);
      const newData = this.generatePlatformData(sceneWidth, this.lastY);
      this.platforms.push(newData);
    }
    if (this.platforms.length > 80) {
      this.platforms = this.platforms.slice(-60);
    }
  },
};