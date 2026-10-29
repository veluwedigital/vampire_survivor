# Vampire Survivor

A browser-based survival game inspired by the *Vampire Survivors* genre. Fight waves of enemies, survive increasingly difficult encounters, and build your character through combat and upgrades.

## Overview

Vampire Survivor is a 2D browser game built with TypeScript and HTML Canvas. The project uses a modular architecture to keep gameplay logic, rendering, weapons, enemies, pickups, and stage progression separated into individual systems.

The goal is to create a responsive and extensible game that can grow with new mechanics, weapons, enemies, and upgrades.

## Features

- **Real-time combat** — Fight enemies using different weapon systems.
- **Weapon systems** — Includes projectile-based weapons, orbiting weapons, and rockets.
- **Enemy management** — Handle enemy spawning, combat, and damage.
- **Damage numbers** — Display damage dealt during combat.
- **Pickups and healing** — Collect items such as health pickups to restore health.
- **Wave progression** — Progress through stages with increasingly challenging encounters.
- **Boss encounters** — Face boss enemies during stage progression.
- **Upgrade system** — A foundation for improving the player's abilities.
- **Modular architecture** — Keep gameplay systems separated for easier development and maintenance.

## Tech Stack

- **TypeScript** — Typed game logic and maintainable code.
- **Vite** — Development server and production build tooling.
- **HTML Canvas** — 2D game rendering.
- **JavaScript Web APIs** — Browser-based game execution and animation.

## Getting Started

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm, which is included with Node.js
- Git, if you want to clone the repository

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/veluwedigital/vampire_survivor.git
   ```

2. Navigate to the project directory:

   ```bash
   cd vampire_survivor
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL displayed in your terminal, usually `http://localhost:5173`.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local development server. |
| `npm run build` | Run TypeScript checks and create a production build with Vite. |
| `npm run preview` | Preview the production build locally. |

## Project Structure

The game uses a system-based architecture to separate different responsibilities.

```text
src/
├── game/
│   ├── entities/
│   │   ├── Player.ts
│   │   └── spawnables/
│   ├── systems/
│   │   ├── DamageNumberSystem.ts
│   │   ├── EnemyManager.ts
│   │   ├── MovementWeaponSystem.ts
│   │   ├── OrbWeaponSystem.ts
│   │   ├── RocketWeaponSystem.ts
│   │   ├── PickupManager.ts
│   │   └── UpgradeSystem.ts
│   ├── rendering/
│   └── scenes/
└── ...
```

*Note: The directory tree is illustrative. Update it to match the current repository structure.*

### Architecture

The main game scene coordinates the different systems:

- **Entities** — Represent game objects such as the player and pickups.
- **Systems** — Handle gameplay mechanics, including weapons, enemies, upgrades, and damage numbers.
- **Rendering** — Draws the game world to the canvas.
- **Stage management** — Controls wave progression, boss encounters, and game states.
- **Pickup management** — Spawns and handles collectible items.

Keeping these responsibilities separate makes it easier to extend individual mechanics without putting the entire game into one large class.

## Development

To contribute to the project or experiment with new mechanics:

1. Create a feature branch.
2. Implement the feature in the relevant system.
3. Test the game using the Vite development server.
4. Run the production build to check for TypeScript errors.

```bash
npm run build
```

## Roadmap

Potential areas for future development:

- Additional weapons and enemy types
- More upgrades and character progression
- New stages and boss encounters
- Improved visual effects and animations
- Sound effects and background music
- Gameplay balancing and performance improvements

## License

No license has been specified yet. All rights are reserved unless a license is added to this repository.

---

**Status:** In development.
