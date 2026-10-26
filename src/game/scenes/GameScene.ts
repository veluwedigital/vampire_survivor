
import { Player } from "../entities/Player";

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

    // Instantiate entities
    this.player = new Player(
      this.canvas.clientWidth / 2,
      this.canvas.clientHeight / 2
    );

    // Resizer
    this.resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas();
    });

    this.resizeObserver.observe(this.canvas);

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  private resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // CSS-pixels bepalen de gamewereld.
    // De interne resolutie zorgt voor scherpe graphics.
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Handle inputs
  private handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    if (
      ["w", "a", "s", "d", "arrowup", "arrowdown",
       "arrowleft", "arrowright"].includes(key)
    ) {
      event.preventDefault();
    }

    if (key === "w" || key === "arrowup") this.input.up = true;
    if (key === "s" || key === "arrowdown") this.input.down = true;
    if (key === "a" || key === "arrowleft") this.input.left = true;
    if (key === "d" || key === "arrowright") this.input.right = true;
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();

    if (key === "w" || key === "arrowup") this.input.up = false;
    if (key === "s" || key === "arrowdown") this.input.down = false;
    if (key === "a" || key === "arrowleft") this.input.left = false;
    if (key === "d" || key === "arrowright") this.input.right = false;
  };

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

    this.update(deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(deltaTime: number) {
    this.player.update(
      deltaTime,
      this.input,
      this.canvas.clientWidth,
      this.canvas.clientHeight
    );
  }

  private render() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.ctx.clearRect(0, 0, width, height);

    // Achtergrond
    this.ctx.fillStyle = "#222321";
    this.ctx.fillRect(0, 0, width, height);

    // Speler
    this.player.draw(this.ctx);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.animationId);

    this.resizeObserver.disconnect();

    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }
}
