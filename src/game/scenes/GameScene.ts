
import { Player } from "../entities/Player";
import { DamageNumberSystem } from "../systems/DamageNumberSystem";
import { EnemyManager } from "../systems/EnemyManager";
import { OrbWeaponSystem } from "../systems/OrbWeaponSystem";
import { WeaponSystem } from "../systems/WeaponSystem";
import {
  UpgradeSystem,
  type Upgrade,
} from "../systems/UpgradeSystem";

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

  private player: Player;
  private enemyManager: EnemyManager;
  private weaponSystem: WeaponSystem;
  private orbWeapon = new OrbWeaponSystem();
  private damageNumbers = new DamageNumberSystem();

  private upgradeSystem = new UpgradeSystem();
  private paused = false;

  private onXPChange: (stats: XPStats) => void;
  private onLevelUp: (upgrades: Upgrade[]) => void;
  private lastXPStats = "";

  private input: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  private animationId = 0;
  private lastTime = 0;
  private running = false;

  private resizeObserver: ResizeObserver;

  constructor(
    canvas: HTMLCanvasElement,
    onXPChange: (stats: XPStats) => void,
    onLevelUp: (upgrades: Upgrade[]) => void
  ) {
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

    this.enemyManager = new EnemyManager(this.damageNumbers);
    this.weaponSystem = new WeaponSystem();

    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
    });

    this.resizeObserver.observe(this.canvas);

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);

    this.publishXP();
  }

  private resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    if (
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

    if (this.paused) return;

    if (key === "w" || key === "arrowup") this.input.up = true;
    if (key === "s" || key === "arrowdown") this.input.down = true;
    if (key === "a" || key === "arrowleft") this.input.left = true;
    if (key === "d" || key === "arrowright") this.input.right = true;

    if (key === "2") this.orbWeapon.unlock();
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    if (key === "w" || key === "arrowup") this.input.up = false;
    if (key === "s" || key === "arrowdown") this.input.down = false;
    if (key === "a" || key === "arrowleft") this.input.left = false;
    if (key === "d" || key === "arrowright") this.input.right = false;
  };

  private publishXP() {
    const xpSystem = this.enemyManager.getXPSystem();

    const stats: XPStats = {
      xp: xpSystem.getXP(),
      level: xpSystem.getLevel(),
      xpToNextLevel: xpSystem.getXPToNextLevel(),
    };

    const statsKey = `${stats.xp}-${stats.level}-${stats.xpToNextLevel}`;

    if (statsKey === this.lastXPStats) return;

    this.lastXPStats = statsKey;
    this.onXPChange(stats);
  }

  start() {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.loop);
  }

  private loop = (time: number) => {
    if (!this.running) return;

    const deltaTime = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    if (!this.paused) {
      this.update(deltaTime);
    }

    this.render();

    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number) {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.player.update(deltaTime, this.input, width, height);

    const previousLevel = this.enemyManager.getXPSystem().getLevel();

    this.enemyManager.update(
      deltaTime,
      this.player.x,
      this.player.y,
      width,
      height
    );

    const currentLevel = this.enemyManager.getXPSystem().getLevel();

    if (currentLevel > previousLevel) {
      this.paused = true;
      this.input = {
        up: false,
        down: false,
        left: false,
        right: false,
      };

      this.onLevelUp(this.upgradeSystem.getRandomUpgrades());
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
      this.enemyManager,
      this.damageNumbers
    );

    this.damageNumbers.update(deltaTime);

    this.publishXP();
  }

  chooseUpgrade(upgradeId: string) {
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
    }

    this.paused = false;
  }

  private render() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.ctx.clearRect(0, 0, width, height);

    this.ctx.fillStyle = "#222321";
    this.ctx.fillRect(0, 0, width, height);

    this.player.draw(this.ctx);
    this.enemyManager.draw(this.ctx);

    this.weaponSystem.draw(this.ctx);

    this.orbWeapon.draw(
      this.ctx,
      this.player.x,
      this.player.y
    );

    this.damageNumbers.draw(this.ctx);
  }

  destroy() {
    this.running = false;

    cancelAnimationFrame(this.animationId);
    this.resizeObserver.disconnect();

    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }
}
