export class AudioSystem {
  private shootSound = new Audio("/sounds/laser.wav");
  private levelUpSound = new Audio("/sounds/level-up.wav");
  private music = new Audio("/sounds/music.wav");
  private hit = new Audio("sounds/hit.wav");


  constructor() {
    this.shootSound.volume = 0.3;
    this.levelUpSound.volume = 0.3
    this.hit.volume = 0.3

    this.music.loop = true;
    this.music.volume = 0.15;
  }

  playShoot() {
    // Allow the sound to play again immediately
    this.shootSound.currentTime = 0;
    this.shootSound.play().catch(() => {});
  }

  playLevelUp(){
      this.levelUpSound.currentTime = 0;
    this.levelUpSound.play().catch(() => {});
  }

  playHit(){
       this.hit.currentTime = 0;
    this.hit.play().catch(() => {});
  }

  // Soundtrack
   playMusic() {
    if (this.music.paused) {
      this.music.play().catch(console.error);
    }
  }

  pauseMusic() {
    this.music.pause();
  }

  stopMusic() {
    this.music.pause();
    this.music.currentTime = 0;
  }
}