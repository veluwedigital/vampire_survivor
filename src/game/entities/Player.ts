import { AudioSystem } from "../systems/AudioSystem";

export class Player {
  x: number;
  y: number;

  radius = 16;
  speed = 220;

  maxHealth = 100;
  health = 100;
  body_color = "#e87500"

  private lastDirectionX = 0;
  private lastDirectionY = 1;

  private audio = new AudioSystem();

  increaseSpeed(amount: number) {
    this.speed += amount;
  }

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.audio.playHit();
  }

  getLastMovementDirection() {
    return {
      x: this.lastDirectionX,
      y: this.lastDirectionY,
    };
  }

  update(
    deltaTime: number,
    input: {
      up: boolean;
      down: boolean;
      left: boolean;
      right: boolean;
    },
    width: number,
    height: number
  ) {
    let dx = 0;
    let dy = 0;

    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;

    const length = Math.hypot(dx, dy);

    if (length > 0) {
      dx /= length;
      dy /= length;

      this.lastDirectionX = dx;
      this.lastDirectionY = dy;
    }

    this.x += dx * this.speed * deltaTime;
    this.y += dy * this.speed * deltaTime;

    this.x = Math.max(
      this.radius,
      Math.min(width - this.radius, this.x)
    );

    this.y = Math.max(
      this.radius,
      Math.min(height - this.radius, this.y)
    );
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    ctx.fillStyle = this.body_color;
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    const barWidth = 44;
    const barHeight = 5;
    const healthPercentage = this.health / this.maxHealth;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.radius - 12;

    ctx.fillStyle = "#333333";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle =
      healthPercentage > 0.3 ? "#22c55e" : "#ef4444";

    ctx.fillRect(
      barX,
      barY,
      barWidth * healthPercentage,
      barHeight
    );
  }
}
