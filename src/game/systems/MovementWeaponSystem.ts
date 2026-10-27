
import type { DamageNumberSystem } from "./DamageNumberSystem";
import { EnemyManager } from "./EnemyManager";

export class MovementWeaponSystem {
  private dashSpeed = 1200;
  private dashDuration = 0.18;
  private dashCooldown = 1.2;
  private dashDamage = 5;

  private dashTimer = 0;
  private cooldownTimer = 0;

  private directionX = 0;
  private directionY = 0;

  private maxAimRadius = 200;

  private hitEnemies = new Set<object>();

  get isDashing() {
    return this.dashTimer > 0;
  }

  get canDash() {
    return this.dashTimer <= 0 && this.cooldownTimer <= 0;
  }

  startDash(directionX: number, directionY: number): boolean {
    if (!this.canDash) return false;

    const length = Math.hypot(directionX, directionY);
    if (length === 0) return false;

    this.directionX = directionX / length;
    this.directionY = directionY / length;

    this.dashTimer = this.dashDuration;
    this.cooldownTimer = this.dashCooldown;
    this.hitEnemies.clear();

    return true;
  }

  update(
    deltaTime: number,
    playerX: number,
    playerY: number,
    enemyManager: EnemyManager,
    _damageNumbers: DamageNumberSystem
  ) {
    this.cooldownTimer = Math.max(
      0,
      this.cooldownTimer - deltaTime
    );

    if (!this.isDashing) {
      return { x: playerX, y: playerY };
    }

    const previousX = playerX;
    const previousY = playerY;

    const activeTime = Math.min(deltaTime, this.dashTimer);

    const nextX =
      playerX + this.directionX * this.dashSpeed * activeTime;

    const nextY =
      playerY + this.directionY * this.dashSpeed * activeTime;

    this.dashTimer = Math.max(
      0,
      this.dashTimer - deltaTime
    );

    // Check collisions along the entire dash path.
    const segmentX = nextX - previousX;
    const segmentY = nextY - previousY;

    const lengthSquared =
      segmentX * segmentX + segmentY * segmentY;

    for (const enemy of enemyManager.getEnemies()) {
      if (enemy.isDead || this.hitEnemies.has(enemy)) continue;

      const t = lengthSquared > 0
        ? Math.max(0, Math.min(1,
            ((enemy.x - previousX) * segmentX +
             (enemy.y - previousY) * segmentY) /
            lengthSquared
          ))
        : 0;

      const closestX = previousX + segmentX * t;
      const closestY = previousY + segmentY * t;

      const distance = Math.hypot(
        enemy.x - closestX,
        enemy.y - closestY
      );

     if (distance < enemy.radius + 24) {
  this.hitEnemies.add(enemy);

  // Damage to the enemy
  enemyManager.damageEnemy(enemy, this.dashDamage);

  // Knock the enemy backwards
  enemy.applyKnockback(this.directionX, this.directionY, 380);

  // Show damage number
  _damageNumbers.spawn(
    enemy.x,
    enemy.y - enemy.radius,
    this.dashDamage
  );
}
    }

    return { x: nextX, y: nextY };
  }

 draw(
  ctx: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  mouseX: number,
  mouseY: number,
  isAiming: boolean
) {
  if (!isAiming) return;

  const dx = mouseX - playerX;
  const dy = mouseY - playerY;
  const distance = Math.hypot(dx, dy);

  // Beperk de richtafstand tot de maximale radius.
  const aimDistance = Math.min(distance, this.maxAimRadius);

  const targetX =
    playerX + (distance > 0 ? (dx / distance) * aimDistance : 0);

  const targetY =
    playerY + (distance > 0 ? (dy / distance) * aimDistance : 0);

  ctx.save();

  // Rode richtlijn
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.85;
  ctx.setLineDash([8, 6]);

  ctx.beginPath();
  ctx.moveTo(playerX, playerY);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // Richtpunt
  ctx.strokeStyle = "#ff3333";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(targetX, targetY, 9, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(targetX - 14, targetY);
  ctx.lineTo(targetX + 14, targetY);
  ctx.moveTo(targetX, targetY - 14);
  ctx.lineTo(targetX, targetY + 14);
  ctx.stroke();

  ctx.restore();
}
}
