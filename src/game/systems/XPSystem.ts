
export class XPSystem {
  private xp = 0;
  private level = 1;
  private xpToNextLevel = 5;

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

    // Check if the player has enough XP to level up
    if (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.level++;

      // Make each next level require more XP
      this.xpToNextLevel = Math.floor(
        this.xpToNextLevel * 1.5
      );

      return true;
    }

    return false;
  }
}
