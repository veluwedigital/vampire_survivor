export class Enemy {
  x: number;
  y: number;

  radius = 16;
  speed = 100;
  hp = 3;
  isDead = false;

  color: string;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;

    // Choose a random enemy color
    const chance = Math.random();

    if (chance < 0.7) {
      this.color = "#e80000"; // 70% red
    } else if (chance < 0.9) {
      this.color = "#22c55e"; // 20% green
    } else {
      this.color = "#ec4899"; // 10% pink
    }
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

    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.strokeStyle = "#080707";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}