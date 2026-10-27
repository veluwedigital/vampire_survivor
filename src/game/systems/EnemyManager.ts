
import { Enemy } from "../entities/Enemy";
import { DamageNumberSystem } from "./DamageNumberSystem";
import { XPSystem } from "./XPSystem";

export class EnemyManager {
  private enemies: Enemy[] = [];
  private xpSystem = new XPSystem();

  private spawnTimer = 0;
  private baseSpawnInterval = 1.5;
  private maxEnemies = 100;
  private difficultyMultiplier = 1;
  private bossAlive = false;

  totalSpawned = 0;
  totalKilled = 0;

  constructor(private damageNumbers: DamageNumberSystem) {}

  get aliveCount() {
    return this.enemies.filter((enemy) => !enemy.isDead).length;
  }

  getXPSystem() {
    return this.xpSystem;
  }

  setDifficultyMultiplier(multiplier: number) {
    this.difficultyMultiplier = Math.max(1, multiplier);
  }

  spawnBoss(width: number, height: number) {
    if (this.bossAlive) return;

    const padding = 40;

    const x =
      width > padding * 2
        ? padding + Math.random() * (width - padding * 2)
        : width / 2;

    const y = Math.min(40, height / 2);

    this.enemies.push(new Enemy(x, y, true));
    this.bossAlive = true;
    this.totalSpawned++;
  }

  update(
    deltaTime: number,
    playerX: number,
    playerY: number,
    width: number,
    height: number
  ): boolean {
    this.spawnTimer += deltaTime;

    const spawnInterval = Math.max(
      0.35,
      this.baseSpawnInterval / this.difficultyMultiplier
    );

    // Spawn normal enemies. The StageManager controls bosses.
    if (
      this.spawnTimer >= spawnInterval &&
      this.aliveCount < this.maxEnemies
    ) {
      this.spawnEnemy(width, height);
      this.spawnTimer = 0;
    }

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

    let bossDefeated = false;

    // Award XP and count each defeated enemy once.
    for (const enemy of this.enemies) {
      if (!enemy.isDead) continue;

      this.xpSystem.addXP(enemy.isBoss ? 10 : 20);
      this.totalKilled++;

      if (enemy.isBoss) {
        bossDefeated = true;
        this.bossAlive = false;
      }
    }

    this.enemies = this.enemies.filter(
      (enemy) => !enemy.isDead
    );

    return bossDefeated;
  }

  private spawnEnemy(width: number, height: number) {
    const side = Math.floor(Math.random() * 4);
    const padding = 20;

    let x = 0;
    let y = 0;

    switch (side) {
      case 0:
        x = Math.random() * width;
        y = padding;
        break;

      case 1:
        x = width - padding;
        y = Math.random() * height;
        break;

      case 2:
        x = Math.random() * width;
        y = height - padding;
        break;

      default:
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
    this.damageNumbers.spawn(enemy.x, enemy.y, damage);
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

  reset() {
    this.enemies = [];
    this.spawnTimer = 0;
    this.difficultyMultiplier = 1;
    this.bossAlive = false;
    this.totalSpawned = 0;
    this.totalKilled = 0;
  }
}
