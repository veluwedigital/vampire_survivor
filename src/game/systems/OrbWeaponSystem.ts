
import { EnemyManager } from "./EnemyManager";

export class OrbWeaponSystem {
  private unlocked = false;
  private angle = 0;

  private orbitRadius = 65;
  private orbRadius = 10;
  private rotationSpeed = 2.5;
  private damage = 3;

  private hitCooldowns = new Map<object, number>();

  unlock() {
    this.unlocked = true;
  }

  isUnlocked() {
    return this.unlocked;
  }

  upgrade() {
    if (!this.unlocked) {
      this.unlock();
      return;
    }

    this.damage += 2;
  }

  update(
    deltaTime: number,
    playerX: number,
    playerY: number,
    enemyManager: EnemyManager
  ) {
    if (!this.unlocked) return;

    this.angle += this.rotationSpeed * deltaTime;

    for (const [enemy, timer] of this.hitCooldowns) {
      const nextTimer = timer - deltaTime;

      if (nextTimer <= 0 || enemy.isDead) {
        this.hitCooldowns.delete(enemy);
      } else {
        this.hitCooldowns.set(enemy, nextTimer);
      }
    }

    for (let i = 0; i < 2; i++) {
      const orbAngle = this.angle + i * Math.PI;

      const orbX =
        playerX + Math.cos(orbAngle) * this.orbitRadius;
      const orbY =
        playerY + Math.sin(orbAngle) * this.orbitRadius;

      for (const enemy of enemyManager.getEnemies()) {
        if (enemy.isDead) continue;
        if (this.hitCooldowns.has(enemy)) continue;

        const distance = Math.hypot(
          orbX - enemy.x,
          orbY - enemy.y
        );

        if (distance < this.orbRadius + enemy.radius) {
// Apply knockback away from the orb.
const knockbackX = enemy.x - orbX;
const knockbackY = enemy.y - orbY;

enemy.applyKnockback(knockbackX, knockbackY, 220);

enemyManager.damageEnemy(enemy, this.damage);
this.hitCooldowns.set(enemy, 0.5);
        }
      }
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    playerX: number,
    playerY: number
  ) {
    if (!this.unlocked) return;

    for (let i = 0; i < 2; i++) {
      const orbAngle = this.angle + i * Math.PI;

      const orbX =
        playerX + Math.cos(orbAngle) * this.orbitRadius;
      const orbY =
        playerY + Math.sin(orbAngle) * this.orbitRadius;

      ctx.beginPath();
      ctx.arc(orbX, orbY, this.orbRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#55d6ff";
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
