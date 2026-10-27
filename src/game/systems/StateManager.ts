
export type GameState =
  | "playing"
  | "boss"
  | "paused"
  | "game-over"
  | "victory";

export type StageEvent =
  | { type: "wave-start"; wave: number }
  | { type: "wave-complete"; wave: number }
  | { type: "boss-spawn"; wave: number }
  | { type: "victory" };

export class StageManager {
  private currentWave = 1;
  private maxWaves = 10;

  private waveDuration = 10;
  private waveTimer = 0;

  private bossEvery = 5;
  private bossTriggered = false;

  private state: GameState = "playing";
  private previousState: GameState = "playing";

  update(deltaTime: number): StageEvent[] {
    if (this.state !== "playing") {
      return [];
    }

    const events: StageEvent[] = [];

    // Boss waves start with a boss encounter.
    if (
      this.currentWave % this.bossEvery === 0 &&
      !this.bossTriggered
    ) {
      this.bossTriggered = true;
      this.state = "boss";

      events.push({
        type: "boss-spawn",
        wave: this.currentWave,
      });

      return events;
    }

    this.waveTimer += deltaTime;

    if (this.waveTimer >= this.waveDuration) {
      events.push({
        type: "wave-complete",
        wave: this.currentWave,
      });

      if (this.currentWave >= this.maxWaves) {
        this.state = "victory";
        events.push({ type: "victory" });
        return events;
      }

      this.currentWave++;
      this.waveTimer = 0;
      this.bossTriggered = false;

      events.push({
        type: "wave-start",
        wave: this.currentWave,
      });
    }

    return events;
  }

  bossDefeated(): StageEvent[] {
    if (this.state !== "boss") {
      return [];
    }

    const events: StageEvent[] = [
      {
        type: "wave-complete",
        wave: this.currentWave,
      },
    ];

    if (this.currentWave >= this.maxWaves) {
      this.state = "victory";
      events.push({ type: "victory" });
      return events;
    }

    this.currentWave++;
    this.waveTimer = 0;
    this.bossTriggered = false;
    this.state = "playing";

    events.push({
      type: "wave-start",
      wave: this.currentWave,
    });

    return events;
  }

  pause() {
    if (
      this.state !== "playing" &&
      this.state !== "boss"
    ) {
      return;
    }

    this.previousState = this.state;
    this.state = "paused";
  }

  resume() {
    if (this.state === "paused") {
      this.state = this.previousState;
    }
  }

  playerDied() {
    this.state = "game-over";
  }

  restart() {
    this.currentWave = 1;
    this.waveTimer = 0;
    this.bossTriggered = false;
    this.state = "playing";
    this.previousState = "playing";
  }

  getState(): GameState {
    return this.state;
  }

  getWave(): number {
    return this.currentWave;
  }

  getTimeRemaining(): number {
    if (this.state === "boss") {
      return 0;
    }

    return Math.max(0, this.waveDuration - this.waveTimer);
  }

  getDifficultyMultiplier(): number {
    return 1 + (this.currentWave - 1) * 0.5;
  }

  isBossWave(): boolean {
    return this.currentWave % this.bossEvery === 0;
  }
}
