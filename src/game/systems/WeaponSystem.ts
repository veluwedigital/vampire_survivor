import { Projectile } from "../entities/Projectile";
import type { DamageNumberSystem } from "./DamageNumberSystem";
import { EnemyManager } from "./EnemyManager";

export class WeaponSystem {
  private projectiles: Projectile[] = [];

  private shootTimer = 0;
  private shootInterval = 1;

  update(
    deltaTime: number,
    playerX: number,
    playerY: number,
    enemyManager: EnemyManager,
    damageNumbers: DamageNumberSystem
  ) {
    this.shootTimer += deltaTime;

    // Find an enemy and shoot at it
    if (this.shootTimer >= this.shootInterval) {
      const target = enemyManager.getClosestEnemy(playerX, playerY);

      if (target) {
        this.projectiles.push(
          new Projectile(playerX, playerY, target)
        );

        this.shootTimer = 0;
      }
    }

    // Move projectiles and check for hits
    for (const projectile of this.projectiles) {
      projectile.update(deltaTime);

      for (const enemy of enemyManager.getEnemies()) {
        if (enemy.isDead) continue;

        const distance = Math.hypot(
          projectile.x - enemy.x,
          projectile.y - enemy.y
        );

        // Damage the enemy when hit
        if (distance < projectile.radius + enemy.radius) {
          enemyManager.damageEnemy(enemy, projectile.damage);
          // Show the damage number above the enemy
            damageNumbers.spawn(
            enemy.x,
            enemy.y - enemy.radius,
            projectile.damage
            );
          projectile.isDead = true;
          break;
        }
      }
    }

    // Remove projectiles that have hit something
    this.projectiles = this.projectiles.filter(
      (projectile) => !projectile.isDead
    );
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Draw all active projectiles
    for (const projectile of this.projectiles) {
      projectile.draw(ctx);
    }
  }
}