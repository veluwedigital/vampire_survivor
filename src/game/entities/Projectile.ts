import { Enemy } from "./Enemy";

export class Projectile {
  x: number;
  y: number;

  radius = 6;
  speed = 500;
  damage = 1;

  private directionX: number;
  private directionY: number;

  isDead = false;

  constructor(x: number, y: number, target: Enemy) {
    this.x = x;
    this.y = y;

    // Calculate the direction towards the target
    const dx = target.x - x;
    const dy = target.y - y;
    const distance = Math.hypot(dx, dy) || 1;

    this.directionX = dx / distance;
    this.directionY = dy / distance;
  }

  update(deltaTime: number) {
    // Move the projectile forward
    this.x += this.directionX * this.speed * deltaTime;
    this.y += this.directionY * this.speed * deltaTime;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Draw the projectile as a small circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#d9cdb8";
    ctx.fill();
  }
}