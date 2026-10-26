
import { Enemy } from "../entities/Enemy";

export class EnemyManager {
  private enemies: Enemy[] = [];

  private spawnTimer = 0;
  private spawnInterval = 1.5;
  private maxEnemies = 100;

  totalSpawned = 0;
  totalKilled = 0;

  get aliveCount() {
    return this.enemies.filter(
      (enemy) => !enemy.isDead
    ).length;
  }

  update(
    deltaTime: number,
    playerX: number,
    playerY: number,
    width: number,
    height: number
  ) {
    // Spawn-timer
    this.spawnTimer += deltaTime;

    if (
      this.spawnTimer >= this.spawnInterval &&
      this.aliveCount < this.maxEnemies
    ) {
      this.spawnEnemy(width, height);
      this.spawnTimer = 0;
    }

    // Update all enemies
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      enemy.update(
        deltaTime,
        playerX,
        playerY,
        width,
        height
      );
    }

    // Delete dead enemies and update killcount
    const killedNow = this.enemies.filter(
      (enemy) => enemy.isDead
    ).length;

    if (killedNow > 0) {
      this.totalKilled += killedNow;

      this.enemies = this.enemies.filter(
        (enemy) => !enemy.isDead
      );
    }
  }

  private spawnEnemy(width: number, height: number) {
    const side = Math.floor(Math.random() * 4);
    const padding = 20;

    let x = 0;
    let y = 0;

    switch (side) {
      case 0: // Up
        x = Math.random() * width;
        y = padding;
        break;

      case 1: // Right
        x = width - padding;
        y = Math.random() * height;
        break;

      case 2: // Bottom
        x = Math.random() * width;
        y = height - padding;
        break;

      case 3: // Left
        x = padding;
        y = Math.random() * height;
        break;
    }

    this.enemies.push(new Enemy(x, y));
    this.totalSpawned++;
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const enemy of this.enemies) {
      enemy.draw(ctx);
    }
  }

  damageEnemy(enemy: Enemy, damage: number) {
    if (enemy.isDead) return;

    enemy.takeDamage(damage);
  }

  
getEnemies(): Enemy[] {
  return this.enemies;
}

getClosestEnemy(x: number, y: number): Enemy | null {
  let closestEnemy: Enemy | null = null;
  let closestDistance = Infinity;

  for (const enemy of this.enemies) {
    if (enemy.isDead) continue;

    const distance = Math.hypot(
      enemy.x - x,
      enemy.y - y
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestEnemy = enemy;
    }
  }

  return closestEnemy;
}

}
