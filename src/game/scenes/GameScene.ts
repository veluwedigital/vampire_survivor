
import { Player } from "../entities/Player";
import { FloorRenderer } from "../../rendering/FloorRenderer";
import { DamageNumberSystem } from "../systems/DamageNumberSystem";
import { EnemyManager } from "../systems/EnemyManager";
import { MovementWeaponSystem } from "../systems/MovementWeaponSystem";
import { OrbWeaponSystem } from "../systems/OrbWeaponSystem";
import { RocketWeaponSystem } from "../systems/RocketWeaponSystem";
import { WeaponSystem } from "../systems/WeaponSystem";
import {
  UpgradeSystem,
  type Upgrade,
} from "../systems/UpgradeSystem";
import { PickupManager } from "../systems/PickupManager";
import {
  StageManager,
  type StageEvent,
} from "../systems/StateManager";
import { AudioSystem } from "../systems/AudioSystem";

export type XPStats = {
  xp: number;
  level: number;
  xpToNextLevel: number;
};

type InputState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export class GameScene {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private floor = new FloorRenderer({
    scale: window.devicePixelRatio || 1,
  });

  private player: Player;
  private playerColor: string;
  private enemyManager: EnemyManager;

  private weaponSystem: WeaponSystem;
  private orbWeapon = new OrbWeaponSystem();
  private rocketWeapon = new RocketWeaponSystem();
  private movementWeapon = new MovementWeaponSystem();

  private damageNumbers = new DamageNumberSystem();
  private upgradeSystem = new UpgradeSystem();
  private stageManager = new StageManager();
  private pickupManager = new PickupManager();
  private audio = new AudioSystem();

  private victory = false;
  private paused = false;
  private gameOver = false;
  private pendingLevelUps = 0;

  private pickupSpawnTimer = 0;
  private pickupSpawnInterval = 5;

  private playerDamageTimer = 0;
  private readonly playerDamageCooldown = 0.75;
  private readonly contactDamage = 10;

  // Mouse aiming for the dash attack.
  private aimingDash = false;
  private mouseX = 0;
  private mouseY = 0;

  private onXPChange: (stats: XPStats) => void;
  private onLevelUp: (upgrades: Upgrade[]) => void;

  private lastXPStats = "";

  private input: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
  };
  private mobileInput: InputState = {
  up: false,
  down: false,
  left: false,
  right: false,
};

private mobileDirectionX = 0;
private mobileDirectionY = 0;

  private animationId = 0;
  private lastTime = 0;
  private running = false;

  private resizeObserver: ResizeObserver;
constructor(
  canvas: HTMLCanvasElement,
  onXPChange: (stats: XPStats) => void,
  onLevelUp: (upgrades: Upgrade[]) => void,
  playerColor: string = "#c62839"
) {
  this.playerColor = playerColor;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas 2D wordt niet ondersteund.");
    }

    this.canvas = canvas;
    this.ctx = ctx;

    this.onXPChange = onXPChange;
    this.onLevelUp = onLevelUp;

    this.resizeCanvas();

    this.player = new Player(
      this.canvas.clientWidth / 2,
      this.canvas.clientHeight / 2
    );
    this.player.body_color = playerColor;

    this.mouseX = this.player.x;
    this.mouseY = this.player.y;

    this.enemyManager = new EnemyManager(this.damageNumbers);
    this.weaponSystem = new WeaponSystem();

    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
    });

    this.resizeObserver.observe(this.canvas);

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    this.canvas.addEventListener(
      "mousemove",
      this.handleMouseMove
    );

    this.canvas.addEventListener(
      "click",
      this.handleCanvasClick
    );

    this.publishXP();
  }

  private resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private clearInput() {
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    this.aimingDash = false;
    this.mobileInput = {
  up: false,
  down: false,
  left: false,
  right: false,
};

this.mobileDirectionX = 0;
this.mobileDirectionY = 0;
  }

  private handleMouseMove = (event: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();

    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const isSpace = key === " " || key === "spacebar";

    if (
      isSpace ||
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
      ].includes(key)
    ) {
      event.preventDefault();
    }

    // Restart after Game Over or Victory.
    if (this.gameOver || this.victory) {
      if (key === "r" || key === "enter") {
        this.restart();
      }

      return;
    }

    if (this.paused) return;

    // Hold Space to aim the dash.
    if (isSpace) {
      if (!event.repeat) {
        this.aimingDash = true;
      }

      return;
    }

    if (key === "w" || key === "arrowup") {
      this.input.up = true;
    }

    if (key === "s" || key === "arrowdown") {
      this.input.down = true;
    }

    if (key === "a" || key === "arrowleft") {
      this.input.left = true;
    }

    if (key === "d" || key === "arrowright") {
      this.input.right = true;
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    if (key === " " || key === "spacebar") {
      event.preventDefault();

      if (this.aimingDash) {
        this.aimingDash = false;

        if (
          !this.paused &&
          !this.gameOver &&
          !this.victory
        ) {
          const directionX = this.mouseX - this.player.x;
          const directionY = this.mouseY - this.player.y;

          this.movementWeapon.startDash(
            directionX,
            directionY
          );
        }
      }

      return;
    }

    if (key === "w" || key === "arrowup") {
      this.input.up = false;
    }

    if (key === "s" || key === "arrowdown") {
      this.input.down = false;
    }

    if (key === "a" || key === "arrowleft") {
      this.input.left = false;
    }

    if (key === "d" || key === "arrowright") {
      this.input.right = false;
    }
  };

  private handleCanvasClick = (event: MouseEvent) => {
    if (!this.gameOver && !this.victory) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = width / 2 - buttonWidth / 2;
    const buttonY = height / 2 + 45;

    if (
      event.offsetX >= buttonX &&
      event.offsetX <= buttonX + buttonWidth &&
      event.offsetY >= buttonY &&
      event.offsetY <= buttonY + buttonHeight
    ) {
      this.restart();
    }
  };

  private publishXP() {
    const xpSystem = this.enemyManager.getXPSystem();

    const stats: XPStats = {
      xp: xpSystem.getXP(),
      level: xpSystem.getLevel(),
      xpToNextLevel: xpSystem.getXPToNextLevel(),
    };

    const statsKey =
      `${stats.xp}-${stats.level}-${stats.xpToNextLevel}`;

    if (statsKey === this.lastXPStats) return;

    this.lastXPStats = statsKey;
    this.onXPChange(stats);
  }

  start() {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();

    this.audio.playMusic();

    this.animationId = requestAnimationFrame(this.loop);
  }

  private loop = (time: number) => {
    if (!this.running) return;

    const deltaTime = Math.min(
      (time - this.lastTime) / 1000,
      0.05
    );

    this.lastTime = time;

    if (
      !this.paused &&
      !this.gameOver &&
      !this.victory
    ) {
      this.update(deltaTime);
    }

    this.render();

    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number) {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    // Update the StageManager before updating enemies.
    // This lets a newly spawned boss update in the same frame.
    const stageEvents = this.stageManager.update(deltaTime);
    this.handleStageEvents(stageEvents);

    if (this.victory) return;

    // Make each wave progressively harder.
    this.enemyManager.setDifficultyMultiplier(
      this.stageManager.getDifficultyMultiplier()
    );

    // Freeze normal movement while aiming or dashing.
    if (
      !this.aimingDash &&
      !this.movementWeapon.isDashing
    ) {
      this.player.update(
  deltaTime,
  {
    up: this.input.up || this.mobileInput.up,
    down: this.input.down || this.mobileInput.down,
    left: this.input.left || this.mobileInput.left,
    right: this.input.right || this.mobileInput.right,
  },
  width,
  height
);
    }

    // Update the dash attack.
    const dashPosition = this.movementWeapon.update(
      deltaTime,
      this.player.x,
      this.player.y,
      this.enemyManager,
      this.damageNumbers
    );

    // Keep the player inside the arena.
    this.player.x = Math.max(
      this.player.radius,
      Math.min(width - this.player.radius, dashPosition.x)
    );

    this.player.y = Math.max(
      this.player.radius,
      Math.min(height - this.player.radius, dashPosition.y)
    );

    this.playerDamageTimer = Math.max(
      0,
      this.playerDamageTimer - deltaTime
    );

    const previousLevel =
      this.enemyManager.getXPSystem().getLevel();

    // Update enemies and check whether the boss died.
    const bossDefeated = this.enemyManager.update(
      deltaTime,
      this.player.x,
      this.player.y,
      width,
      height
    );

    if (bossDefeated) {
      const events = this.stageManager.bossDefeated();
      this.handleStageEvents(events);
    }

    // Damage the player when an enemy touches them.
    this.checkEnemyContactDamage();

    if (this.gameOver) {
      this.publishXP();
      return;
    }

    if (this.victory) {
      this.publishXP();
      return;
    }

    const currentLevel =
      this.enemyManager.getXPSystem().getLevel();

    // Handle every level gained, including multiple levels at once.
    if (currentLevel > previousLevel) {
      this.pendingLevelUps += currentLevel - previousLevel;
      this.paused = true;

      this.clearInput();
      this.showNextLevelUp();
      this.publishXP();

      return;
    }

    this.weaponSystem.update(
      deltaTime,
      this.player.x,
      this.player.y,
      this.enemyManager,
      this.damageNumbers
    );

    this.orbWeapon.update(
      deltaTime,
      this.player.x,
      this.player.y,
      this.enemyManager
    );

    this.rocketWeapon.update(
      deltaTime,
      this.player.x,
      this.player.y,
      this.enemyManager
    );

    // Update pickups.
    this.pickupManager.update(this.player);
    this.pickupSpawnTimer += deltaTime;

    if (this.pickupSpawnTimer >= this.pickupSpawnInterval) {
      this.pickupSpawnTimer = 0;

        this.pickupManager.spawnRandomHealth(
          this.player.x,
          this.player.y
        );
    }

    this.damageNumbers.update(deltaTime);

    this.publishXP();
  }

  private handleStageEvents(events: StageEvent[]) {
    for (const event of events) {
      switch (event.type) {
        case "wave-start":
          console.log(`Wave ${event.wave} gestart`);
          break;

        case "wave-complete":
          console.log(`Wave ${event.wave} voltooid`);
          break;

        case "boss-spawn":
          console.log(`Boss van wave ${event.wave} verschijnt`);

          this.enemyManager.spawnBoss(
            this.canvas.clientWidth,
            this.canvas.clientHeight
          );
          break;

        case "victory":
          this.victory = true;
          this.paused = false;
          this.clearInput();
          this.onLevelUp([]);
          console.log("Je hebt de game gewonnen!");
          break;
      }
    }
  }

  private checkEnemyContactDamage() {
    if (this.playerDamageTimer > 0) return;

    for (const enemy of this.enemyManager.getEnemies()) {
      if (enemy.isDead) continue;

      const distance = Math.hypot(
        enemy.x - this.player.x,
        enemy.y - this.player.y
      );

      if (
        distance <
        enemy.radius + this.player.radius
      ) {
        this.player.takeDamage(this.contactDamage);
        this.playerDamageTimer = this.playerDamageCooldown;

        if (this.player.health <= 0) {
          this.endGame();
        }

        // Only one contact hit per cooldown.
        break;
      }
    }
  }

  private endGame() {
    this.gameOver = true;
    this.paused = false;
    this.pendingLevelUps = 0;

    this.stageManager.playerDied();
    this.clearInput();

    // Hide any open level-up menu.
    this.onLevelUp([]);
  }

  private showNextLevelUp() {
    if (this.pendingLevelUps <= 0 || this.gameOver) {
      this.paused = false;
      return;
    }

    const upgrades = this.upgradeSystem.getRandomUpgrades(
      3,
      this.orbWeapon.isUnlocked(),
      this.rocketWeapon.isUnlocked()
    );

    this.onLevelUp(upgrades);
  }

  chooseUpgrade(upgradeId: string) {
    if (
      this.gameOver ||
      this.victory ||
      !this.paused
    ) {
      return;
    }

    switch (upgradeId) {
      case "damage":
        this.weaponSystem.upgradeDamage();
        break;

      case "attack-speed":
        this.weaponSystem.upgradeAttackSpeed();
        break;

      case "move-speed":
        this.player.increaseSpeed(20);
        break;

      case "orb-unlock":
      case "orb-power":
        this.orbWeapon.upgrade();
        break;

      case "rocket-unlock":
        this.rocketWeapon.unlock();
        break;

      case "rocket-damage":
        this.rocketWeapon.upgradeDamage();
        break;

      case "rocket-speed":
        this.rocketWeapon.upgradeFireRate();
        break;

      case "rocket-area":
        this.rocketWeapon.upgradeArea();
        break;
    }

    this.pendingLevelUps = Math.max(
      0,
      this.pendingLevelUps - 1
    );

    if (this.pendingLevelUps > 0) {
      this.showNextLevelUp();
      return;
    }

    this.paused = false;
    this.lastTime = performance.now();
  }

  // Start a completely new run.
  restart() {
    this.player = new Player(
      this.canvas.clientWidth / 2,
      this.canvas.clientHeight / 2
    );

    this.mouseX = this.player.x;
    this.mouseY = this.player.y;

     this.audio.stopMusic();
    this.audio.playMusic();

    this.damageNumbers = new DamageNumberSystem();
    this.enemyManager = new EnemyManager(this.damageNumbers);

    this.weaponSystem = new WeaponSystem();
    this.orbWeapon = new OrbWeaponSystem();
    this.rocketWeapon = new RocketWeaponSystem();
    this.movementWeapon = new MovementWeaponSystem();

    this.upgradeSystem = new UpgradeSystem();
    this.stageManager.restart();

    this.pendingLevelUps = 0;
    this.playerDamageTimer = 0;
    this.pickupSpawnTimer = 0;

    this.gameOver = false;
    this.victory = false;
    this.paused = false;
    this.aimingDash = false;
this.player.body_color = this.playerColor;
    this.clearInput();

    this.pickupManager.reset();

    // Reset displayed XP and level.
    this.lastXPStats = "";
    this.onLevelUp([]);
    this.publishXP();

    this.lastTime = performance.now();
  }

  private render() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.ctx.clearRect(0, 0, width, height);

    // Draw the crypt floor.
    this.floor.draw(this.ctx, 0, 0, width, height);

    this.player.draw(this.ctx);
    this.enemyManager.draw(this.ctx);

    this.weaponSystem.draw(this.ctx);

    this.orbWeapon.draw(
      this.ctx,
      this.player.x,
      this.player.y
    );

    this.rocketWeapon.draw(this.ctx);
    this.damageNumbers.draw(this.ctx);

    // Draw the dash aiming indicator.
    this.movementWeapon.draw(
      this.ctx,
      this.player.x,
      this.player.y,
      this.mouseX,
      this.mouseY,
      this.aimingDash
    );

    this.pickupManager.draw(this.ctx);

    this.drawStageHUD();

    if (this.gameOver) {
      this.drawGameOver(width, height);
    } else if (this.victory) {
      this.drawVictory(width, height);
    }
  }

 
private drawStageHUD() {
  const ctx = this.ctx;
  const width = this.canvas.clientWidth;
  const isMobile = width <= 600;

  const padding = isMobile ? 10 : 14;
  const x = isMobile ? 12 : 20;
  const y = isMobile ? 12 : 20;
  const panelWidth = isMobile ? 164 : 220;
  const panelHeight = isMobile ? 66 : 82;

  const wave = this.stageManager.getWave();
  const isBoss = this.stageManager.getState() === "boss";

  ctx.save();

  // Donker, transparant paneel
  ctx.fillStyle = "rgba(11, 5, 13, 0.82)";
  ctx.fillRect(x, y, panelWidth, panelHeight);

  // Gouden buitenrand
  ctx.strokeStyle = "rgba(201, 162, 75, 0.75)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, panelWidth - 1, panelHeight - 1);

  // Subtiele rode accentlijn bovenaan
  ctx.fillStyle = "#b81d2d";
  ctx.fillRect(x, y, panelWidth, 3);

  // Wave-label
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = isMobile
    ? '700 15px "Cinzel", Georgia, serif'
    : '700 18px "Cinzel", Georgia, serif';
  ctx.fillStyle = "#efe4cf";
  ctx.fillText(
    `WAVE ${wave} / 10`,
    x + padding,
    y + (isMobile ? 10 : 13)
  );

  // Timer of boss-status
  if (isBoss) {
    ctx.font = isMobile
      ? '700 11px "Cinzel", Georgia, serif'
      : '700 14px "Cinzel", Georgia, serif';
    ctx.fillStyle = "#ff5c69";
    ctx.fillText(
      "BOSS FIGHT",
      x + padding,
      y + (isMobile ? 38 : 47)
    );

    // Rode statusindicator
    ctx.fillStyle = "#ff344a";
    ctx.beginPath();
    ctx.arc(
      x + panelWidth - padding - 4,
      y + (isMobile ? 44 : 55),
      isMobile ? 3 : 4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  } else {
    const remaining = Math.max(
      0,
      Math.ceil(this.stageManager.getTimeRemaining())
    );
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const formattedTime =
      `${minutes}:${String(seconds).padStart(2, "0")}`;

    ctx.font = isMobile
      ? '12px "Cormorant Garamond", Georgia, serif'
      : '14px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = "#c9a24b";
    ctx.fillText(
      `NEXT WAVE  ${formattedTime}`,
      x + padding,
      y + (isMobile ? 39 : 49)
    );
  }

  ctx.restore();
}


  private drawGameOver(width: number, height: number) {
    const ctx = this.ctx;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.save();

    ctx.fillStyle = "rgba(8, 2, 10, 0.8)";
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(
      centerX,
      centerY - 30,
      0,
      centerX,
      centerY - 30,
      Math.max(width, height) * 0.5
    );

    glow.addColorStop(0, "rgba(140, 14, 30, 0.35)");
    glow.addColorStop(1, "rgba(140, 14, 30, 0)");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const titleFont =
      '72px "Pirata One", "UnifrakturCook", Georgia, serif';

    ctx.font = titleFont;
    ctx.fillStyle = "#2a0309";
    ctx.fillText("Game Over", centerX, centerY - 40 + 6);

    ctx.fillStyle = "#6d0b17";
    ctx.fillText("Game Over", centerX, centerY - 40 + 3);

    ctx.fillStyle = "#efe4cf";
    ctx.fillText("Game Over", centerX, centerY - 40);

    ctx.fillStyle = "#a79a8a";
    ctx.font =
      'italic 600 22px "Cormorant Garamond", Georgia, serif';

    ctx.fillText(
      `You reached level ${this.enemyManager.getXPSystem().getLevel()}`,
      centerX,
      centerY + 10
    );

    this.drawRestartButton(centerX, centerY);

    ctx.fillStyle = "#a79a8a";
    ctx.font =
      'italic 500 16px "Cormorant Garamond", Georgia, serif';

    ctx.fillText(
      "or press R",
      centerX,
      centerY + 45 + 50 + 26
    );

    ctx.restore();
  }

  private drawVictory(width: number, height: number) {
    const ctx = this.ctx;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.save();

    ctx.fillStyle = "rgba(8, 2, 10, 0.86)";
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(
      centerX,
      centerY - 30,
      0,
      centerX,
      centerY - 30,
      Math.max(width, height) * 0.5
    );

    glow.addColorStop(0, "rgba(201, 162, 75, 0.24)");
    glow.addColorStop(1, "rgba(201, 162, 75, 0)");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font =
      '72px "Pirata One", "UnifrakturCook", Georgia, serif';

    ctx.fillStyle = "#2a0309";
    ctx.fillText("VICTORY", centerX, centerY - 40 + 6);

    ctx.fillStyle = "#c9a24b";
    ctx.fillText("VICTORY", centerX, centerY - 40);

    ctx.fillStyle = "#efe4cf";
    ctx.font =
      'italic 600 22px "Cormorant Garamond", Georgia, serif';

    ctx.fillText(
      "You survived all 10 waves",
      centerX,
      centerY + 10
    );

    this.drawRestartButton(centerX, centerY);

    ctx.fillStyle = "#a79a8a";
    ctx.font =
      'italic 500 16px "Cormorant Garamond", Georgia, serif';

    ctx.fillText(
      "or press R",
      centerX,
      centerY + 45 + 50 + 26
    );

    ctx.restore();
  }

  private drawRestartButton(centerX: number, centerY: number) {
    const ctx = this.ctx;

    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = centerX - buttonWidth / 2;
    const buttonY = centerY + 45;
    const buttonMidY = buttonY + buttonHeight / 2;

    const fill = ctx.createLinearGradient(
      0,
      buttonY,
      0,
      buttonY + buttonHeight
    );

    fill.addColorStop(0, "#a3152a");
    fill.addColorStop(1, "#6d0b17");

    ctx.fillStyle = fill;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#c9a24b";

    ctx.strokeRect(
      buttonX + 1,
      buttonY + 1,
      buttonWidth - 2,
      buttonHeight - 2
    );

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#12040a";

    ctx.strokeRect(
      buttonX + 4,
      buttonY + 4,
      buttonWidth - 8,
      buttonHeight - 8
    );

    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(201, 162, 75, 0.5)";

    ctx.strokeRect(
      buttonX + 5.5,
      buttonY + 5.5,
      buttonWidth - 11,
      buttonHeight - 11
    );

    ctx.fillStyle = "#c9a24b";

    for (const dx of [buttonX, buttonX + buttonWidth]) {
      ctx.beginPath();
      ctx.moveTo(dx, buttonMidY - 7);
      ctx.lineTo(dx + 7, buttonMidY);
      ctx.lineTo(dx, buttonMidY + 7);
      ctx.lineTo(dx - 7, buttonMidY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "#efe4cf";
    ctx.font = '700 17px "Cinzel", Georgia, serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PLAY AGAIN", centerX, buttonMidY + 1);
  }

  destroy() {
    this.running = false;

    cancelAnimationFrame(this.animationId);
    this.resizeObserver.disconnect();

    window.removeEventListener(
      "keydown",
      this.handleKeyDown
    );

    window.removeEventListener(
      "keyup",
      this.handleKeyUp
    );

    this.canvas.removeEventListener(
      "mousemove",
      this.handleMouseMove
    );

    this.canvas.removeEventListener(
      "click",
      this.handleCanvasClick
    );
  }
  
  setMobileInput(x: number, y: number) {
  this.mobileDirectionX = x;
  this.mobileDirectionY = y;

  const deadZone = 0.2;

  this.mobileInput = {
    up: y < -deadZone,
    down: y > deadZone,
    left: x < -deadZone,
    right: x > deadZone,
  };
}

mobileDash() {
  if (
    this.paused ||
    this.gameOver ||
    this.victory ||
    this.aimingDash ||
    this.movementWeapon.isDashing
  ) {
    return;
  }

  let dx = this.mobileDirectionX;
  let dy = this.mobileDirectionY;

  // Gebruik de joystickrichting als die actief is.
  if (Math.hypot(dx, dy) < 0.2) {
    // Anders dash richting de dichtstbijzijnde levende vijand.
    const enemies = this.enemyManager
      .getEnemies()
      .filter((enemy) => !enemy.isDead);

    let nearestEnemy = enemies[0];
    let nearestDistance = Infinity;

    for (const enemy of enemies) {
      const distance = Math.hypot(
        enemy.x - this.player.x,
        enemy.y - this.player.y
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    }

    if (nearestEnemy) {
      dx = nearestEnemy.x - this.player.x;
      dy = nearestEnemy.y - this.player.y;
    } else {
      const lastDirection = this.player.getLastMovementDirection();
      dx = lastDirection.x;
      dy = lastDirection.y;
    }
  }

  this.movementWeapon.startDash(dx, dy);
}
}
