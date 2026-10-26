
import type { DamageNumberSystem } from "./DamageNumberSystem";
import { EnemyManager } from "./EnemyManager";

export class OrbWeaponSystem {
  private unlocked = false;
  private angle = 0;

  private orbitRadius = 65;
  private orbRadius = 10;
  private rotationSpeed = 2.5;
  private damage = 3;


  private hitCooldowns = new Map<object, number>();

  // Unlock the weapon
  unlock() {
    this.unlocked = true;
  }

  update(
    deltaTime: number,
    playerX: number,
    playerY: number,
    enemyManager: EnemyManager,
    damageNumbers: DamageNumberSystem

  ) {
    if (!this.unlocked) return;

    // Rotate the orbs around the player
    this.angle += this.rotationSpeed * deltaTime;

    // Reduce the time until each enemy can be hit again
    for (const [enemy, timer] of this.hitCooldowns) {
      const nextTimer = timer - deltaTime;

      if (nextTimer <= 0) {
        this.hitCooldowns.delete(enemy);
      } else {
        this.hitCooldowns.set(enemy, nextTimer);
      }
    }

    // Check if either orb touches an enemy
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
          enemyManager.damageEnemy(enemy, this.damage);

            // Show damage number above the enemy
  damageNumbers.spawn(
    enemy.x,
    enemy.y - enemy.radius,
    this.damage
  );

          // Prevent damage on every frame while touching
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

    // Draw both orbs
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
