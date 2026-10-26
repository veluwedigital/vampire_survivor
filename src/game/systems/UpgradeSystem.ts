
export type Upgrade = {
  id: string;
  name: string;
  description: string;
};

const upgrades: Upgrade[] = [
  {
    id: "damage",
    name: "Damage Up",
    description: "Projectiles do 50% more damage.",
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
  getRandomUpgrades(amount = 3): Upgrade[] {
    return [...upgrades]
      .sort(() => Math.random() - 0.5)
      .slice(0, amount);
  }
}
