
import { Enemy } from "../entities/Enemy";
import { EnemyManager } from "./EnemyManager";

type Rocket = {
  x: number;
  y: number;
  target: Enemy;
  targetX: number;
  targetY: number;
};

type Explosion = {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
};

export class RocketWeaponSystem {
  private unlocked = false;

  private rockets: Rocket[] = [];
  private explosions: Explosion[] = [];

  private fireTimer = 0;
  private fireInterval = 3;
  private rocketSpeed = 350;
  private damage = 8;
  private explosionRadius = 90;

  unlock() {
    this.unlocked = true;
  }

  isUnlocked() {
    return this.unlocked;
  }

  upgradeDamage() {
    this.damage += 3;
  }

  upgradeFireRate() {
    this.fireInterval = Math.max(0.5, this.fireInterval * 0.8);
  }

  upgradeArea() {
    this.explosionRadius += 20;
  }

  update(
    deltaTime: number,
    playerX: number,
    playerY: number,
    enemyManager: EnemyManager
  ) {
    if (this.unlocked) {
      this.fireTimer += deltaTime;

      if (this.fireTimer >= this.fireInterval) {
        const target = enemyManager.getClosestEnemy(
          playerX,
          playerY
        );

        if (target) {
          this.rockets.push({
            x: playerX,
            y: playerY,
            target,
            targetX: target.x,
            targetY: target.y,
          });

          this.fireTimer = 0;
        }
      }
    }

    // Move rockets toward their targets.
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const rocket = this.rockets[i];

      if (!rocket.target.isDead) {
        rocket.targetX = rocket.target.x;
        rocket.targetY = rocket.target.y;
      }

      const dx = rocket.targetX - rocket.x;
      const dy = rocket.targetY - rocket.y;
      const distance = Math.hypot(dx, dy);
      const movement = this.rocketSpeed * deltaTime;

      if (distance <= movement || distance < 1) {
        rocket.x = rocket.targetX;
        rocket.y = rocket.targetY;

        this.explode(rocket.x, rocket.y, enemyManager);
        this.rockets.splice(i, 1);
        continue;
      }

      rocket.x += (dx / distance) * movement;
      rocket.y += (dy / distance) * movement;
    }

    // Animate explosions.
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      explosion.life -= deltaTime;

      if (explosion.life <= 0) {
        this.explosions.splice(i, 1);
      }
    }
  }

  private explode(
    x: number,
    y: number,
    enemyManager: EnemyManager
  ) {
    for (const enemy of enemyManager.getEnemies()) {
      if (enemy.isDead) continue;

      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distance = Math.hypot(dx, dy);

      if (distance <= this.explosionRadius + enemy.radius) {
        // Push enemies away from the explosion center.
        const falloff = Math.max(
          0.35,
          1 - distance / (this.explosionRadius + enemy.radius)
        );

        enemy.applyKnockback(dx, dy, 380 * falloff);
        enemyManager.damageEnemy(enemy, this.damage);
      }
    }

    this.explosions.push({
      x,
      y,
      radius: this.explosionRadius,
      life: 0.3,
      maxLife: 0.3,
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.unlocked) return;

    // Draw rockets.
    for (const rocket of this.rockets) {
      const angle = Math.atan2(
        rocket.targetY - rocket.y,
        rocket.targetX - rocket.x
      );

      ctx.save();
      ctx.translate(rocket.x, rocket.y);
      ctx.rotate(angle);

      // Rocket body.
      ctx.fillStyle = "#f97316";
      ctx.fillRect(-10, -4, 20, 8);

      // Rocket nose.
      ctx.fillStyle = "#fef3c7";
      ctx.beginPath();
      ctx.moveTo(10, -4);
      ctx.lineTo(16, 0);
      ctx.lineTo(10, 4);
      ctx.closePath();
      ctx.fill();

      // Rocket flame.
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(-10, -3);
      ctx.lineTo(-17, 0);
      ctx.lineTo(-10, 3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Draw expanding explosion effects.
    for (const explosion of this.explosions) {
      const progress = 1 - explosion.life / explosion.maxLife;
      const radius = explosion.radius * progress;
      const alpha = 1 - progress;

      ctx.save();

      // Orange explosion fill.
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(
        explosion.x,
        explosion.y,
        radius,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Bright expanding shockwave.
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#fef3c7";
      ctx.lineWidth = 5 * (1 - progress) + 1;
      ctx.beginPath();
      ctx.arc(
        explosion.x,
        explosion.y,
        radius,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      ctx.restore();
    }
  }
}
