
import { Spawnable } from "../entities/Spawnable";
import { Heart } from "../entities/spawnables/Heart";
import { Player } from "../entities/Player";

export class PickupManager {
  private pickups: Spawnable[] = [];

  // Add item
  spawn(x: number, y: number) {
    this.pickups.push(new Spawnable(x, y));
  }

  // Spawn a health pickup
  spawnHealth(x: number, y: number) {
    this.pickups.push(new Heart(x, y));
  }
spawnRandomHealth(playerX: number, playerY: number) {
  const minDistance = 150;
  const maxDistance = 400;

  // Kies een willekeurige richting
  const angle = Math.random() * Math.PI * 2;

  // Kies een willekeurige afstand
  const distance =
    minDistance + Math.random() * (maxDistance - minDistance);

  const x = playerX + Math.cos(angle) * distance;
  const y = playerY + Math.sin(angle) * distance;

  this.spawnHealth(x, y);
}

spawnRandom(playerX: number, playerY: number) {
  const minDistance = 150;
  const maxDistance = 400;

  const angle = Math.random() * Math.PI * 2;
  const distance =
    minDistance + Math.random() * (maxDistance - minDistance);

  const x = playerX + Math.cos(angle) * distance;
  const y = playerY + Math.sin(angle) * distance;

  this.spawn(x, y);
}


  update(player: Player) {
    for (const pickup of this.pickups) {
      if (pickup.collected) continue;


      const distance = Math.hypot(
        player.x - pickup.x,
        player.y - pickup.y
      );

      // Controleer of de speler het item aanraakt
      if (distance < player.radius + pickup.radius) {
        this.collect(pickup, player);
      }
    }

    // Verwijder opgepakte items
    this.pickups = this.pickups.filter(
      (pickup) => !pickup.collected
    );
  }

private collect(pickup: Spawnable, player: Player) {
  if (pickup instanceof Heart) {
    const oldHealth = player.health;

    player.health = Math.min(
      player.maxHealth,
      player.health + pickup.healAmount
    );

    console.log("Heart opgepakt!");
    console.log(`Health: ${oldHealth} -> ${player.health}`);
  }

  pickup.collected = true;
}

  draw(ctx: CanvasRenderingContext2D) {
    for (const pickup of this.pickups) {
      pickup.draw(ctx);
    }
  }

  reset() {
    this.pickups = [];
  }
}
