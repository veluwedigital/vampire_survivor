
export type Upgrade = {
  id: string;
  name: string;
  description: string;
};

const baseUpgrades: Upgrade[] = [
  {
    id: "damage",
    name: "Damage Up",
    description: "Projectiles do more damage.",
  },
  {
    id: "attack-speed",
    name: "Attack Speed",
    description: "Shoot 20% faster.",
  },
  {
    id: "move-speed",
    name: "Move Speed",
    description: "Move 20% faster.",
  },
];

export class UpgradeSystem {
  getRandomUpgrades(
    amount = 3,
    orbsUnlocked = false,
    rocketsUnlocked = false
  ): Upgrade[] {
    const upgrades: Upgrade[] = [...baseUpgrades];

    upgrades.push(
      orbsUnlocked
        ? {
            id: "orb-power",
            name: "Orb Power",
            description: "Increase orb damage by 2.",
          }
        : {
            id: "orb-unlock",
            name: "Orb Weapon",
            description: "Unlock two magical orbs.",
          }
    );

    if (rocketsUnlocked) {
      upgrades.push(
        {
          id: "rocket-damage",
          name: "Rocket Damage",
          description: "Increase explosion damage by 3.",
        },
        {
          id: "rocket-speed",
          name: "Rapid Fire",
          description: "Fire rockets 20% faster.",
        },
        {
          id: "rocket-area",
          name: "Bigger Explosions",
          description: "Increase explosion radius by 20.",
        }
      );
    } else {
      upgrades.push({
        id: "rocket-unlock",
        name: "Rocket Launcher",
        description: "Unlock an automatic explosive rocket weapon.",
      });
    }

    // Shuffle the available upgrades.
    for (let i = upgrades.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [upgrades[i], upgrades[j]] = [upgrades[j], upgrades[i]];
    }

    return upgrades.slice(0, amount);
  }
}
