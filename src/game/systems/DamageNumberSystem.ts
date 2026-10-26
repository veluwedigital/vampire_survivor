
type DamageNumber = {
  x: number;
  y: number;
  damage: number;
  life: number;
};

export class DamageNumberSystem {
  private numbers: DamageNumber[] = [];

  // Show a damage number at the hit location
  spawn(x: number, y: number, damage: number) {
    this.numbers.push({
      x,
      y,
      damage,
      life: 0.8,
    });
  }

  update(deltaTime: number) {
    for (const number of this.numbers) {
      // Float upwards and disappear over time
      number.y -= 40 * deltaTime;
      number.life -= deltaTime;
    }

    this.numbers = this.numbers.filter(
      (number) => number.life > 0
    );
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const number of this.numbers) {
      ctx.save();

      ctx.globalAlpha = Math.min(number.life / 0.3, 1);
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#222321";
      ctx.fillStyle = "#ffffff";

      const text = `-${number.damage}`;

      // Add an outline so the number stays readable
      ctx.strokeText(text, number.x, number.y);
      ctx.fillText(text, number.x, number.y);

      ctx.restore();
    }
  }
}
