
export class Player {
  x: number;
  y: number;

  radius = 16;
  speed = 220;

  increaseSpeed(amount: number) {
  this.speed += amount;
}

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(
    deltaTime: number,
    input: { up: boolean; down: boolean; left: boolean; right: boolean },
    width: number,
    height: number
  ) {
    let dx = 0;
    let dy = 0;

    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;

    // Equalize horizontal and vertical movement
    const length = Math.hypot(dx, dy);

    if (length > 0) {
      dx /= length;
      dy /= length;
    }

    this.x += dx * this.speed * deltaTime;
    this.y += dy * this.speed * deltaTime;

    // Collison horizontal
    this.x = Math.max(
      this.radius,
      Math.min(width - this.radius, this.x)
    );

    // Collision vertical
    this.y = Math.max(
      this.radius,
      Math.min(height - this.radius, this.y)
    );
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    ctx.fillStyle = "#e87500";
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
