
import { Player } from "../entities/Player";
import { DamageNumberSystem } from "../systems/DamageNumberSystem";
import { EnemyManager } from "../systems/EnemyManager";
import { OrbWeaponSystem } from "../systems/OrbWeaponSystem";
import { WeaponSystem } from "../systems/WeaponSystem";

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

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas 2D wordt niet ondersteund.");
    }

    this.canvas = canvas;
    this.ctx = ctx;

    this.resizeCanvas();

    // Initialize game entities and systems
    this.player = new Player(
      this.canvas.clientWidth / 2,
      this.canvas.clientHeight / 2
    );

    this.enemyManager = new EnemyManager();
    this.weaponSystem = new WeaponSystem();

    // Handle canvas resizing
    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
    });

    this.resizeObserver.observe(this.canvas);

    // Keyboard input
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  private resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);

    // Keep game coordinates in CSS pixels
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Handle keyboard input
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
    // For testing
    if (key === "2") this.orbWeapon.unlock();
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

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

  start() {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();

    this.animationId = requestAnimationFrame(this.loop);
  }

  private loop = (time: number) => {
    if (!this.running) return;

    const deltaTime = Math.min(
      (time - this.lastTime) / 1000,
      0.05
    );

    this.lastTime = time;

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number) {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    // Update player movement
    this.player.update(
      deltaTime,
      this.input,
      width,
      height
    );

    // Spawn and update all enemies
    this.enemyManager.update(
      deltaTime,
      this.player.x,
      this.player.y,
      width,
      height
    );

    // Weapon systems
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
  }

  private render() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    // Clear previous frame
    this.ctx.clearRect(0, 0, width, height);

    // Background
    this.ctx.fillStyle = "#222321";
    this.ctx.fillRect(0, 0, width, height);

    // Draw game entities
    this.damageNumbers.draw(this.ctx);
    this.player.draw(this.ctx);
    this.enemyManager.draw(this.ctx);
    this.weaponSystem.draw(this.ctx);
    this.orbWeapon.draw(
  this.ctx,
  this.player.x,
  this.player.y
);
  }

  destroy() {
    this.running = false;

    cancelAnimationFrame(this.animationId);

    this.resizeObserver.disconnect();

    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }
}
