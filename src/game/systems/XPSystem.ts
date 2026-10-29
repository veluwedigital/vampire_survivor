import { AudioSystem } from "./AudioSystem";

export class XPSystem {
  private xp = 0;
  private level = 1;
  private xpToNextLevel = 5;

  private audio = new AudioSystem();
  

  getXP() {
    return this.xp;
  }

  getLevel() {
    return this.level;
  }

  getXPToNextLevel() {
    return this.xpToNextLevel;
  }

  addXP(amount: number) {
    this.xp += amount;

    let leveledUp = false;

    // Process every level earned from this XP reward.
    while (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.level++;
      leveledUp = true;
      this.audio.playLevelUp(); 

      // Increase the XP required for the next level.
      this.xpToNextLevel = Math.floor(
        this.xpToNextLevel * 1.5
      );
    }

    return leveledUp;
  }
}
