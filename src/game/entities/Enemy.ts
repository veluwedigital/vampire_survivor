
export class Enemy {
  x: number;
  y: number;

  radius = 16;
  speed = 100;
  hp = 3;
  isDead = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  takeDamage(amount: number) {
    if (this.isDead) return;

    this.hp -= amount;

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }

  update(
    deltaTime: number,
    playerX: number,
    playerY: number,
    width: number,
    height: number
  ) {
    if (this.isDead) return;

    let dx = playerX - this.x;
    let dy = playerY - this.y;

    const distance = Math.hypot(dx, dy);

    // Stop bij de speler, in plaats van erdoorheen te lopen.
    const minDistance = this.radius + 16;

    if (distance > minDistance) {
      dx /= distance;
      dy /= distance;

      this.x += dx * this.speed * deltaTime;
      this.y += dy * this.speed * deltaTime;
    }

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
    if (this.isDead) return;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    ctx.fillStyle = "#e80000";
    ctx.fill();

    ctx.strokeStyle = "#080707";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
