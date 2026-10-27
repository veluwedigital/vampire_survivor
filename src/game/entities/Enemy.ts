/**
 * Enemy
 *
 * Elke vijand rolt bij het spawnen:
 *  - een TYPE   (ghoul, bat, wraith, brute, slime, spider, imp, wisp, of knight als boss)
 *  - kleine willekeurige variatie in grootte, snelheid en hp
 *  - soms (12%) een AFFIX die hem tot elite maakt:
 *      armored, swift, frenzied, giant of toxic
 *
 * De publieke API is hetzelfde gebleven (x, y, radius, hp, isDead, isBoss,
 * color, update, draw, takeDamage, applyKnockback), dus EnemyManager en de
 * wapens blijven werken. Nieuwe optionele velden die je kunt gebruiken:
 * type, affix, maxHp, contactDamage, xpValue, name.
 */

export type EnemyType =
  | "ghoul"
  | "bat"
  | "wraith"
  | "brute"
  | "slime"
  | "spider"
  | "imp"
  | "wisp"
  | "knight";
export type EnemyAffix = "armored" | "swift" | "frenzied" | "giant" | "toxic";

type LungeConfig = {
  /** Seconden tussen lunges (random binnen dit bereik) */
  interval: [number, number];
  /** Seconden dat hij zich schrap zet voor hij uitvalt */
  telegraph: number;
  /** Seconden dat de uitval duurt */
  duration: number;
  speedMul: number;
};

type EnemyBlueprint = {
  radius: number;
  speed: number;
  hp: number;
  contactDamage: number;
  xpValue: number;
  color: string;
  dark: string;
  /** 0 = volledige knockback, 0.9 = bijna niet te verplaatsen */
  knockbackResist: number;
  /** Kans om te spawnen, relatief aan de andere types */
  weight: number;
  lunge?: LungeConfig;
};

const TAU = Math.PI * 2;
const SPAWN_TIME = 0.3;
const ELITE_CHANCE = 0.12;

const BLUEPRINTS: Record<EnemyType, EnemyBlueprint> = {
  // Doodgewone rottende lijken: de meerderheid van de horde.
  ghoul: {
    radius: 16,
    speed: 100,
    hp: 3,
    contactDamage: 10,
    xpValue: 1,
    color: "#6f8f5a",
    dark: "#2e4326",
    knockbackResist: 0,
    weight: 50,
  },
  // Snel, breekbaar, vliegt in zigzag.
  bat: {
    radius: 11,
    speed: 150,
    hp: 1,
    contactDamage: 6,
    xpValue: 1,
    color: "#5a3a85",
    dark: "#2a1747",
    knockbackResist: 0,
    weight: 24,
  },
  // Spookachtig: zet zich schrap en valt dan plots uit. Een klap onderbreekt dat.
  wraith: {
    radius: 15,
    speed: 80,
    hp: 4,
    contactDamage: 12,
    xpValue: 2,
    color: "#9db4e8",
    dark: "#4a5f9a",
    knockbackResist: 0.5,
    weight: 14,
    lunge: { interval: [2.6, 4.2], telegraph: 0.4, duration: 0.55, speedMul: 3.2 },
  },
  // Langzame tank met bottenpieken.
  brute: {
    radius: 24,
    speed: 55,
    hp: 10,
    contactDamage: 18,
    xpValue: 3,
    color: "#8c3b3b",
    dark: "#4a1616",
    knockbackResist: 0.75,
    weight: 12,
  },
  // Springerige blob: staat bijna stil en schiet dan in korte sprongen vooruit.
  slime: {
    radius: 14,
    speed: 70,
    hp: 3,
    contactDamage: 8,
    xpValue: 1,
    color: "#3fb8a8",
    dark: "#1b5a52",
    knockbackResist: 0.1,
    weight: 20,
  },
  // Rent in snelle uitbarstingen en staat daartussen even stil.
  spider: {
    radius: 12,
    speed: 105,
    hp: 2,
    contactDamage: 9,
    xpValue: 1,
    color: "#b0652a",
    dark: "#4a2410",
    knockbackResist: 0,
    weight: 18,
  },
  // Cirkelt om de speler heen en duikt er dan snel op af. Een klap onderbreekt dat.
  imp: {
    radius: 13,
    speed: 90,
    hp: 3,
    contactDamage: 11,
    xpValue: 2,
    color: "#e0662e",
    dark: "#6b2108",
    knockbackResist: 0.1,
    weight: 10,
    lunge: { interval: [1.8, 3], telegraph: 0.3, duration: 0.4, speedMul: 3.5 },
  },
  // Klein dwaallichtje dat in grote, zwevende bogen naar je toe komt.
  wisp: {
    radius: 10,
    speed: 120,
    hp: 1,
    contactDamage: 7,
    xpValue: 1,
    color: "#7fe7ff",
    dark: "#2a8aa8",
    knockbackResist: 0,
    weight: 12,
  },
  // Alleen als boss. Wordt woedend onder de helft van zijn hp en gaat uitvallen.
  knight: {
    radius: 32,
    speed: 65,
    hp: 100,
    contactDamage: 25,
    xpValue: 25,
    color: "#a3152a",
    dark: "#4a0810",
    knockbackResist: 0.9,
    weight: 0,
    lunge: { interval: [3, 5], telegraph: 0.6, duration: 0.7, speedMul: 3 },
  },
};

const BOSS_NAMES = [
  "Lord Vael",
  "The Pale Duke",
  "Countess Morwen",
  "Sir Hollow",
  "Baron Crowe",
  "The Gravewarden",
  "Mother Ashmire",
  "Count Dusk",
];

const AFFIXES: EnemyAffix[] = ["armored", "swift", "frenzied", "giant", "toxic"];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickType(): EnemyType {
  const types = (Object.keys(BLUEPRINTS) as EnemyType[]).filter(
    (t) => BLUEPRINTS[t].weight > 0
  );
  const total = types.reduce((sum, t) => sum + BLUEPRINTS[t].weight, 0);

  let roll = Math.random() * total;

  for (const t of types) {
    roll -= BLUEPRINTS[t].weight;
    if (roll <= 0) return t;
  }

  return "ghoul";
}

export class Enemy {
  x: number;
  y: number;

  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  isDead = false;
  isBoss: boolean;
  color: string;

  type: EnemyType;
  affix: EnemyAffix | null;
  name = "";

  /** Optioneel: gebruik dit in plaats van een vaste contactschade. */
  contactDamage: number;
  /** Optioneel: gebruik dit voor XP-gems of XP per kill. */
  xpValue: number;

  private readonly blueprint: EnemyBlueprint;
  private readonly knockbackResist: number;
  private readonly damageTaken: number;

  private knockbackX = 0;
  private knockbackY = 0;
  private hitFlashTimer = 0;

  private age = 0;
  private spawnTimer = SPAWN_TIME;
  private readonly phase = Math.random() * TAU;
  private readonly orbitDir = Math.random() < 0.5 ? -1 : 1;
  private facing = 0;

  private lungePhase: "idle" | "telegraph" | "lunge" = "idle";
  private lungeTimer = 0;
  private lungeAngle = 0;

  private trail: { x: number; y: number }[] = [];
  private trailTimer = 0;

  constructor(x: number, y: number, isBoss = false, type?: EnemyType) {
    this.x = x;
    this.y = y;
    this.isBoss = isBoss;

    this.type = isBoss
      ? "knight"
      : type && type !== "knight"
        ? type
        : pickType();

    const bp = BLUEPRINTS[this.type];
    this.blueprint = bp;
    this.color = bp.color;

    this.affix =
      !isBoss && Math.random() < ELITE_CHANCE
        ? AFFIXES[Math.floor(Math.random() * AFFIXES.length)]
        : null;

    // Kleine variatie zodat de horde er niet uit klonen bestaat.
    const sizeJitter = isBoss ? 1 : rand(0.92, 1.1);
    const speedJitter = isBoss ? 1 : rand(0.9, 1.1);
    const hpJitter = isBoss ? 1 : rand(0.85, 1.25);

    let radius = bp.radius * sizeJitter;
    let speed = bp.speed * speedJitter;
    let hp = Math.max(1, Math.round(bp.hp * hpJitter));
    let resist = bp.knockbackResist;
    let damageTaken = 1;
    let contactDamage = bp.contactDamage;
    let xp = bp.xpValue;

    if (this.affix === "armored") {
      hp = Math.round(hp * 1.6);
      radius *= 1.1;
      resist = Math.min(0.95, resist + 0.25);
      damageTaken = 0.7;
      xp *= 2;
    } else if (this.affix === "swift") {
      speed *= 1.4;
      xp *= 2;
    } else if (this.affix === "frenzied") {
      hp = Math.round(hp * 1.2);
      xp *= 2;
    } else if (this.affix === "giant") {
      // Enorm, log en pijnlijk: een mini-boss in de horde.
      hp = Math.round(hp * 2.2);
      radius *= 1.6;
      speed *= 0.85;
      resist = Math.min(0.95, resist + 0.3);
      contactDamage = Math.round(contactDamage * 1.3);
      xp *= 3;
    } else if (this.affix === "toxic") {
      // Giftig: raak hem liever niet aan.
      hp = Math.round(hp * 1.1);
      contactDamage = Math.round(contactDamage * 1.4);
      xp *= 2;
    }

    this.radius = radius;
    this.speed = speed;
    this.hp = hp;
    this.maxHp = hp;
    this.knockbackResist = resist;
    this.damageTaken = damageTaken;
    this.contactDamage = contactDamage;
    this.xpValue = xp;

    if (isBoss) {
      this.name = BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)];
    }

    if (bp.lunge) {
      this.lungeTimer = rand(bp.lunge.interval[0], bp.lunge.interval[1]);
    }
  }

  /** Boss onder de helft van zijn hp: sneller en valt uit. */
  get enraged(): boolean {
    return this.isBoss && !this.isDead && this.hp <= this.maxHp * 0.5;
  }

  applyKnockback(
    directionX: number,
    directionY: number,
    force = 220
  ) {
    const length = Math.hypot(directionX, directionY);

    if (length === 0) return;

    const effective = force * (1 - this.knockbackResist);

    this.knockbackX = (directionX / length) * effective;
    this.knockbackY = (directionY / length) * effective;

    // Briefly highlight the enemy when hit.
    this.hitFlashTimer = 0.09;
  }

  takeDamage(amount: number) {
    this.hp -= amount * this.damageTaken;

    // Een klap onderbreekt een wraith/imp die zich schrap zet.
    if (this.lungePhase === "telegraph" && !this.isBoss) {
      this.lungePhase = "idle";
      this.lungeTimer = 1;
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }
  }

  update(
    deltaTime: number,
    playerX: number,
    playerY: number,
    width: number,
    height: number
  ) {
    if (this.isDead) return;

    this.age += deltaTime;
    this.spawnTimer = Math.max(0, this.spawnTimer - deltaTime);

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 0) {
      this.facing = Math.atan2(dy, dx);
    }

    let moveAngle = this.facing;
    let speed = this.speed;

    // Frenzied: hoe gewonder, hoe sneller.
    if (this.affix === "frenzied") {
      speed *= 1 + 0.6 * (1 - this.hp / this.maxHp);
    }

    if (this.enraged) {
      speed *= 1.3;
    }

    if (this.type === "ghoul") {
      // Schuifelend: wisselt tussen sloffen en doorstappen.
      speed *= 1 + 0.18 * Math.sin(this.age * 3 + this.phase);
    } else if (this.type === "bat") {
      // Zigzag, maar wordt rechter naarmate hij dichterbij komt.
      const weave = Math.min(
        1,
        Math.max(0, (distance - this.radius * 2) / 140)
      );
      moveAngle += Math.sin(this.age * 6 + this.phase) * 0.9 * weave;
    } else if (this.type === "slime") {
      // Sprongen: even bijna stil, dan een duw vooruit.
      const hop = Math.max(0, Math.sin(this.age * 5 + this.phase));
      speed *= 0.05 + 2.8 * hop;
    } else if (this.type === "spider") {
      // Stop-and-go: korte spurts met pauzes ertussen, een beetje trillerig.
      const burst = Math.sin(this.age * 4.5 + this.phase) > -0.15 ? 1.9 : 0.12;
      speed *= burst;
      moveAngle += Math.sin(this.age * 25 + this.phase) * 0.15;
    } else if (this.type === "imp") {
      // Cirkelt op middellange afstand om de speler heen, tot hij uitvalt.
      if (this.lungePhase === "idle" && distance < 280 && distance > 110) {
        moveAngle += this.orbitDir * 1.15;
      }
    } else if (this.type === "wisp") {
      // Grote zwevende bogen, rechter naarmate hij dichterbij komt.
      const weave = Math.min(
        1,
        Math.max(0, (distance - this.radius * 2) / 200)
      );
      moveAngle += Math.sin(this.age * 3.2 + this.phase) * 1.25 * weave;
      speed *= 1 + 0.25 * Math.sin(this.age * 6 + this.phase);
    }

    speed *= this.updateLunge(deltaTime, distance);

    if (this.lungePhase === "lunge") {
      moveAngle = this.lungeAngle;
    }

    // Chase the player.
    if (distance > 0) {
      this.x += Math.cos(moveAngle) * speed * deltaTime;
      this.y += Math.sin(moveAngle) * speed * deltaTime;
    }

    // Apply knockback after normal movement.
    this.x += this.knockbackX * deltaTime;
    this.y += this.knockbackY * deltaTime;

    // Gradually reduce knockback velocity.
    const friction = Math.exp(-10 * deltaTime);
    this.knockbackX *= friction;
    this.knockbackY *= friction;

    this.hitFlashTimer = Math.max(
      0,
      this.hitFlashTimer - deltaTime
    );

    if (this.affix === "swift") {
      this.trailTimer -= deltaTime;

      if (this.trailTimer <= 0) {
        this.trailTimer = 0.05;
        this.trail.push({ x: this.x, y: this.y });

        if (this.trail.length > 6) this.trail.shift();
      }
    }

    // Keep the enemy inside the game boundaries.
    this.x = Math.max(
      this.radius,
      Math.min(width - this.radius, this.x)
    );

    this.y = Math.max(
      this.radius,
      Math.min(height - this.radius, this.y)
    );
  }

  /** Geeft een snelheidsmultiplier terug en beheert de lunge-fases. */
  private updateLunge(deltaTime: number, distance: number): number {
    const cfg = this.blueprint.lunge;

    if (!cfg || (this.isBoss && !this.enraged)) return 1;

    this.lungeTimer -= deltaTime;

    if (this.lungePhase === "idle") {
      if (this.lungeTimer <= 0 && distance < 420) {
        this.lungePhase = "telegraph";
        this.lungeTimer = cfg.telegraph;
      }

      return 1;
    }

    if (this.lungePhase === "telegraph") {
      if (this.lungeTimer <= 0) {
        this.lungePhase = "lunge";
        this.lungeTimer = cfg.duration;
        this.lungeAngle = this.facing;
      }

      // Bijna stilstaan terwijl hij zich schrap zet.
      return 0.15;
    }

    if (this.lungeTimer <= 0) {
      this.lungePhase = "idle";
      this.lungeTimer = rand(cfg.interval[0], cfg.interval[1]);
    }

    return cfg.speedMul;
  }

  // ---------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    const r = this.radius;
    const flash = this.hitFlashTimer > 0;
    const emerge = 1 - this.spawnTimer / SPAWN_TIME;
    const telegraphing = this.lungePhase === "telegraph";

    this.drawTrail(ctx);

    ctx.save();

    // Trillen als hij zich schrap zet of een woedende boss is.
    let shakeX = 0;
    let shakeY = 0;

    if (telegraphing || this.enraged) {
      shakeX = (Math.random() - 0.5) * 3;
      shakeY = (Math.random() - 0.5) * 3;
    }

    ctx.translate(this.x + shakeX, this.y + shakeY);
    ctx.globalAlpha = emerge;

    // Rijst op uit de grond: groeit en wordt zichtbaar.
    const grow = 0.6 + 0.4 * emerge;
    ctx.scale(grow, grow);

    this.drawShadow(ctx, r);

    // Zwevende types bobben op en neer.
    if (this.type === "bat") {
      ctx.translate(0, Math.sin(this.age * 10 + this.phase) * 1.5);
    } else if (this.type === "wraith") {
      ctx.translate(0, Math.sin(this.age * 3 + this.phase) * 2.5);
    } else if (this.type === "wisp") {
      ctx.translate(0, Math.sin(this.age * 5 + this.phase) * 3);
    }

    this.drawAura(ctx, r, telegraphing);

    switch (this.type) {
      case "ghoul":
        this.drawGhoul(ctx, r, flash);
        break;
      case "bat":
        this.drawBat(ctx, r, flash);
        break;
      case "wraith":
        this.drawWraith(ctx, r, flash, telegraphing);
        break;
      case "brute":
        this.drawBrute(ctx, r, flash);
        break;
      case "slime":
        this.drawSlime(ctx, r, flash);
        break;
      case "spider":
        this.drawSpider(ctx, r, flash);
        break;
      case "imp":
        this.drawImp(ctx, r, flash, telegraphing);
        break;
      case "wisp":
        this.drawWisp(ctx, r, flash);
        break;
      case "knight":
        this.drawKnight(ctx, r, flash);
        break;
    }

    if (this.affix === "armored") {
      ctx.strokeStyle = "#c3c8d4";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, r + 2, 0, TAU);
      ctx.stroke();

      ctx.strokeStyle = "rgba(20, 20, 30, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, r + 4, 0, TAU);
      ctx.stroke();
    } else if (this.affix === "giant") {
      // Zware, donkere rand zodat je meteen ziet dat het een bonk is.
      ctx.strokeStyle = "rgba(10, 6, 2, 0.55)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, r + 1, 0, TAU);
      ctx.stroke();

      ctx.strokeStyle = "rgba(201, 162, 75, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r + 4, 0, TAU);
      ctx.stroke();
    }

    ctx.restore();

    if (this.isBoss) {
      this.drawBossBar(ctx);
    }
  }

  private drawTrail(ctx: CanvasRenderingContext2D) {
    if (this.affix !== "swift" || this.trail.length === 0) return;

    ctx.save();
    ctx.fillStyle = "#e8c35a";

    for (let i = 0; i < this.trail.length; i++) {
      const t = (i + 1) / this.trail.length;

      ctx.globalAlpha = 0.18 * t;
      ctx.beginPath();
      ctx.arc(
        this.trail[i].x,
        this.trail[i].y,
        this.radius * (0.5 + 0.5 * t),
        0,
        TAU
      );
      ctx.fill();
    }

    ctx.restore();
  }

  private drawShadow(ctx: CanvasRenderingContext2D, r: number) {
    const flying =
      this.type === "bat" || this.type === "wraith" || this.type === "wisp";

    ctx.fillStyle = flying
      ? "rgba(0, 0, 0, 0.22)"
      : "rgba(0, 0, 0, 0.38)";

    ctx.beginPath();
    ctx.ellipse(
      0,
      r * (flying ? 1.15 : 0.75),
      r * (flying ? 0.7 : 0.95),
      r * (flying ? 0.28 : 0.4),
      0,
      0,
      TAU
    );
    ctx.fill();
  }

  private drawAura(
    ctx: CanvasRenderingContext2D,
    r: number,
    telegraphing: boolean
  ) {
    if (this.affix === "frenzied") {
      const rage = 1 - this.hp / this.maxHp;
      const alpha = 0.12 + rage * 0.2 + 0.05 * Math.sin(this.age * 10);

      ctx.fillStyle = `rgba(255, 40, 60, ${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.55, 0, TAU);
      ctx.fill();
    }

    if (this.affix === "toxic") {
      const alpha = 0.14 + 0.04 * Math.sin(this.age * 6);

      ctx.fillStyle = `rgba(120, 220, 60, ${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.5, 0, TAU);
      ctx.fill();

      // Opborrelende gifbelletjes.
      const baseAlpha = ctx.globalAlpha;
      ctx.fillStyle = "#a6f04a";

      for (let i = 0; i < 3; i++) {
        const t = (this.age * 0.8 + i / 3 + this.phase) % 1;
        const bx = Math.sin(i * 2.1 + this.phase) * r * 0.7;
        const by = r * 0.3 - t * r * 1.7;

        ctx.globalAlpha = baseAlpha * (1 - t) * 0.75;
        ctx.beginPath();
        ctx.arc(bx, by, Math.max(1.5, r * 0.13), 0, TAU);
        ctx.fill();
      }

      ctx.globalAlpha = baseAlpha;
    }

    if (this.isBoss) {
      const pulse = Math.sin(this.age * 3);
      const alpha = (this.enraged ? 0.22 : 0.12) + 0.05 * pulse;

      ctx.fillStyle = `rgba(212, 40, 60, ${alpha})`;
      ctx.beginPath();
      ctx.arc(0, 0, r * (1.45 + 0.08 * pulse), 0, TAU);
      ctx.fill();
    }

    if (telegraphing) {
      ctx.strokeStyle = "rgba(255, 77, 77, 0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * (1.25 + 0.15 * Math.sin(this.age * 30)), 0, TAU);
      ctx.stroke();
    }
  }

  /** Twee gloeiende ogen, getekend in het (naar de speler gedraaide) frame. */
  private drawEyes(
    ctx: CanvasRenderingContext2D,
    x: number,
    spread: number,
    size: number,
    color: string
  ) {
    const alpha = ctx.globalAlpha;

    for (const side of [-1, 1]) {
      ctx.fillStyle = color;

      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.arc(x, side * spread, size * 1.9, 0, TAU);
      ctx.fill();

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, side * spread, size, 0, TAU);
      ctx.fill();
    }
  }

  private drawGhoul(
    ctx: CanvasRenderingContext2D,
    r: number,
    flash: boolean
  ) {
    const bp = this.blueprint;
    const sway = Math.sin(this.age * 5 + this.phase);

    ctx.fillStyle = flash ? "#ffffff" : bp.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();

    if (!flash) {
      // Gescheurde plekken en een zachte highlight.
      ctx.fillStyle = "rgba(20, 30, 15, 0.35)";
      ctx.beginPath();
      ctx.arc(-r * 0.35, r * 0.3, r * 0.25, 0, TAU);
      ctx.arc(r * 0.1, -r * 0.45, r * 0.15, 0, TAU);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.35, r * 0.4, r * 0.22, -0.6, 0, TAU);
      ctx.fill();
    }

    ctx.strokeStyle = flash ? "#ffffff" : bp.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();

    ctx.save();
    ctx.rotate(this.facing);

    // Armen die naar de speler grijpen.
    for (const side of [-1, 1]) {
      ctx.fillStyle = flash ? "#ffffff" : bp.color;
      ctx.strokeStyle = flash ? "#ffffff" : bp.dark;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(
        r * (0.95 + 0.1 * sway * side),
        side * r * 0.72,
        r * 0.3,
        0,
        TAU
      );
      ctx.fill();
      ctx.stroke();
    }

    this.drawEyes(ctx, r * 0.4, r * 0.3, r * 0.17, "#ff4040");

    ctx.restore();
  }

  private drawBat(
    ctx: CanvasRenderingContext2D,
    r: number,
    flash: boolean
  ) {
    const bp = this.blueprint;
    const flap = 0.55 + 0.45 * Math.sin(this.age * 18 + this.phase);

    ctx.save();
    ctx.rotate(this.facing);

    // Vleugels.
    ctx.fillStyle = flash ? "#ffffff" : bp.dark;

    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(r * 0.15, side * r * 0.2);
      ctx.lineTo(r * 0.05, side * r * 1.9 * flap);
      ctx.lineTo(-r * 0.45, side * r * 1.25 * flap);
      ctx.lineTo(-r * 0.75, side * r * 1.6 * flap);
      ctx.lineTo(-r * 0.9, side * r * 0.8 * flap);
      ctx.lineTo(-r * 0.5, side * r * 0.2);
      ctx.closePath();
      ctx.fill();
    }

    // Oren.
    ctx.fillStyle = flash ? "#ffffff" : bp.color;

    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(r * 0.45, side * r * 0.3);
      ctx.lineTo(r * 0.95, side * r * 0.7);
      ctx.lineTo(r * 0.7, side * r * 0.05);
      ctx.closePath();
      ctx.fill();
    }

    // Lijf.
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.8, r * 0.58, 0, 0, TAU);
    ctx.fill();

    this.drawEyes(ctx, r * 0.5, r * 0.2, r * 0.13, "#ff3b3b");

    ctx.restore();
  }

  private drawWraith(
    ctx: CanvasRenderingContext2D,
    r: number,
    flash: boolean,
    telegraphing: boolean
  ) {
    const bp = this.blueprint;
    const baseAlpha = ctx.globalAlpha;

    // Half doorzichtig en zacht pulserend.
    if (!flash) {
      ctx.globalAlpha = baseAlpha * (0.72 + 0.12 * Math.sin(this.age * 4 + this.phase));
    }

    ctx.save();
    ctx.rotate(this.facing);

    const len = r * 2.4;
    const segments = 6;

    // Hoofd en slierten in één pad, zodat de transparantie niet dubbel telt.
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU, true);

    ctx.moveTo(0, -r);

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const half = r * (1 - t * 0.9);
      const wave = Math.sin(this.age * 8 + t * 6) * r * 0.3 * t;

      ctx.lineTo(-t * len, -half + wave);
    }

    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      const half = r * (1 - t * 0.9);
      const wave = Math.sin(this.age * 8 + t * 6) * r * 0.3 * t;

      ctx.lineTo(-t * len, half + wave);
    }

    ctx.closePath();
    ctx.fillStyle = flash ? "#ffffff" : bp.color;
    ctx.fill();

    // Smalle spookogen.
    const eyeColor = telegraphing ? "#ff4d4d" : "#e8f2ff";
    ctx.globalAlpha = baseAlpha;

    for (const side of [-1, 1]) {
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.ellipse(r * 0.4, side * r * 0.3, r * 0.22, r * 0.1, side * 0.3, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawBrute(
    ctx: CanvasRenderingContext2D,
    r: number,
    flash: boolean
  ) {
    const bp = this.blueprint;

    ctx.save();
    ctx.rotate(this.facing);

    // Bottenpieken rondom.
    ctx.fillStyle = flash ? "#ffffff" : "#d9ccb0";
    const spikes = 8;

    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * TAU;
      const w = 0.2;

      ctx.beginPath();
      ctx.moveTo(Math.cos(a - w) * r * 0.9, Math.sin(a - w) * r * 0.9);
      ctx.lineTo(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3);
      ctx.lineTo(Math.cos(a + w) * r * 0.9, Math.sin(a + w) * r * 0.9);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    ctx.fillStyle = flash ? "#ffffff" : bp.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();

    if (!flash) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.45, r * 0.25, -0.6, 0, TAU);
      ctx.fill();

      // Een gehecht litteken.
      ctx.strokeStyle = "rgba(15, 4, 4, 0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, -r * 0.25);
      ctx.lineTo(r * 0.15, r * 0.4);
      ctx.stroke();

      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const t = 0.2 + i * 0.3;
        const sx = -r * 0.55 + (r * 0.7) * t;
        const sy = -r * 0.25 + (r * 0.65) * t;

        ctx.beginPath();
        ctx.moveTo(sx - r * 0.1, sy + r * 0.1);
        ctx.lineTo(sx + r * 0.1, sy - r * 0.1);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = flash ? "#ffffff" : bp.dark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();

    // Boze, schuine ogen.
    ctx.save();
    ctx.rotate(this.facing);

    for (const side of [-1, 1]) {
      ctx.fillStyle = "#ff3b3b";
      ctx.beginPath();
      ctx.ellipse(r * 0.4, side * r * 0.3, r * 0.2, r * 0.09, side * 0.55, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }

  /** Doorschijnende blob die platdrukt en uitrekt bij elke sprong. */
  private drawSlime(
    ctx: CanvasRenderingContext2D,
    r: number,
    flash: boolean
  ) {
    const bp = this.blueprint;
    const hop = Math.max(0, Math.sin(this.age * 5 + this.phase));
    const sy = 0.86 + 0.26 * hop;
    const sx = 1 / sy;
    const baseAlpha = ctx.globalAlpha;

    ctx.save();

    // Houd de onderkant op de grond tijdens het squashen.
    ctx.translate(0, r * (1 - sy));
    ctx.scale(sx, sy);

    ctx.globalAlpha = flash ? baseAlpha : baseAlpha * 0.88;
    ctx.fillStyle = flash ? "#ffffff" : bp.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();

    ctx.globalAlpha = baseAlpha;

    if (!flash) {
      // Een donkere kern en een glanzende highlight.
      ctx.fillStyle = "rgba(10, 60, 50, 0.35)";
      ctx.beginPath();
      ctx.arc(r * 0.1, r * 0.25, r * 0.32, 0, TAU);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.3, r * 0.16, -0.6, 0, TAU);
      ctx.fill();
    }

    ctx.strokeStyle = flash ? "#ffffff" : bp.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();

    // Dopey ogen met pupillen richting de speler.
    ctx.save();
    ctx.rotate(this.facing);

    for (const side of [-1, 1]) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(r * 0.35, side * r * 0.32, r * 0.2, 0, TAU);
      ctx.fill();

      ctx.fillStyle = "#12302b";
      ctx.beginPath();
      ctx.arc(r * 0.44, side * r * 0.32, r * 0.1, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  }

  /** Kleine kruiper met acht trippelende pootjes. */
  private drawSpider(
    ctx: CanvasRenderingContext2D,
    r: number,
    flash: boolean
  ) {
    const bp = this.blueprint;
    const fill = flash ? "#ffffff" : bp.color;
    const line = flash ? "#ffffff" : bp.dark;

    ctx.save();
    ctx.rotate(this.facing);

    // Poten: vier per kant, elk met knie en voet.
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const anchorX = r * (0.35 - i * 0.28);
        const wiggle =
          Math.sin(this.age * 20 + i * 1.7 + (side > 0 ? 0 : Math.PI)) * 0.25;
        const ang = side * (Math.PI / 2 - 0.5 + i * 0.33) + wiggle;

        const kneeX = anchorX + Math.cos(ang) * r * 0.85;
        const kneeY = Math.sin(ang) * r * 0.85;
        const footAng = ang - side * 0.8;
        const footX = kneeX + Math.cos(footAng) * r * 0.8;
        const footY = kneeY + Math.sin(footAng) * r * 0.8;

        ctx.beginPath();
        ctx.moveTo(anchorX, 0);
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(footX, footY);
        ctx.stroke();
      }
    }

    // Achterlijf.
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(-r * 0.4, 0, r * 0.7, r * 0.58, 0, 0, TAU);
    ctx.fill();

    if (!flash) {
      ctx.fillStyle = "#e8c35a";
      ctx.beginPath();
      ctx.arc(-r * 0.5, 0, r * 0.14, 0, TAU);
      ctx.fill();
    }

    // Kop.
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(r * 0.45, 0, r * 0.42, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = line;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-r * 0.4, 0, r * 0.7, r * 0.58, 0, 0, TAU);
    ctx.stroke();

    // Vier kleine ogen.
    ctx.fillStyle = "#ff3b3b";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(r * 0.62, side * r * 0.14, r * 0.08, 0, TAU);
      ctx.arc(r * 0.5, side * r * 0.25, r * 0.07, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }

  /** Klein duiveltje met hoorntjes en een kronkelende staart. */
  private drawImp(
    ctx: CanvasRenderingContext2D,
    r: number,
    flash: boolean,
    telegraphing: boolean
  ) {
    const bp = this.blueprint;
    const fill = flash ? "#ffffff" : bp.color;
    const line = flash ? "#ffffff" : bp.dark;
    const swish = Math.sin(this.age * 9 + this.phase) * r * 0.4;

    ctx.save();
    ctx.rotate(this.facing);

    // Staart met puntje.
    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, 0);
    ctx.quadraticCurveTo(-r * 1.5, swish, -r * 1.9, -swish * 0.5);
    ctx.stroke();

    ctx.fillStyle = line;
    ctx.beginPath();
    ctx.moveTo(-r * 1.8, -swish * 0.5);
    ctx.lineTo(-r * 2.3, -swish * 0.5 - r * 0.25);
    ctx.lineTo(-r * 2.3, -swish * 0.5 + r * 0.25);
    ctx.closePath();
    ctx.fill();

    // Hoorntjes.
    ctx.fillStyle = flash ? "#ffffff" : "#e9dcc0";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(r * 0.35, side * r * 0.55);
      ctx.lineTo(r * 0.8, side * r * 1.2);
      ctx.lineTo(r * 0.0, side * r * 0.9);
      ctx.closePath();
      ctx.fill();
    }

    // Lijf.
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();

    if (!flash) {
      ctx.fillStyle = "rgba(255, 220, 140, 0.25)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.1, 0, r * 0.5, r * 0.6, 0, 0, TAU);
      ctx.fill();
    }

    ctx.strokeStyle = line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();

    // Gemene grijns.
    if (!flash) {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r * 0.05, 0, r * 0.55, -0.55, 0.55);
      ctx.stroke();
    }

    this.drawEyes(
      ctx,
      r * 0.4,
      r * 0.3,
      r * 0.15,
      telegraphing ? "#ffffff" : "#ffe14d"
    );

    ctx.restore();
  }

  /** Zwevend dwaallichtje met een flikkerende staart. */
  private drawWisp(
    ctx: CanvasRenderingContext2D,
    r: number,
    flash: boolean
  ) {
    const bp = this.blueprint;
    const baseAlpha = ctx.globalAlpha;
    const flicker = 0.8 + 0.2 * Math.sin(this.age * 14 + this.phase);

    ctx.save();
    ctx.rotate(this.facing);

    // Staartvlammetjes.
    ctx.fillStyle = flash ? "#ffffff" : bp.color;

    for (let i = 1; i <= 4; i++) {
      const t = i / 4;
      const wob = Math.sin(this.age * 10 - i * 1.3 + this.phase) * r * 0.25;

      ctx.globalAlpha = baseAlpha * 0.35 * (1 - t * 0.8) * flicker;
      ctx.beginPath();
      ctx.arc(-t * r * 1.9, wob, r * (0.85 - t * 0.5), 0, TAU);
      ctx.fill();
    }

    // Gloed.
    ctx.globalAlpha = baseAlpha * 0.28 * flicker;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.8, 0, TAU);
    ctx.fill();

    // Kern.
    ctx.globalAlpha = baseAlpha;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.95, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = baseAlpha * 0.8;
    ctx.beginPath();
    ctx.arc(-r * 0.1, 0, r * 0.55, 0, TAU);
    ctx.fill();

    ctx.globalAlpha = baseAlpha;
    this.drawEyes(ctx, r * 0.35, r * 0.28, r * 0.13, "#0b2a38");

    ctx.restore();
  }

  private drawKnight(
    ctx: CanvasRenderingContext2D,
    r: number,
    flash: boolean
  ) {
    const bp = this.blueprint;
    const enraged = this.enraged;

    ctx.fillStyle = flash ? "#ffffff" : enraged ? "#d4283c" : bp.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();

    if (!flash) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.35, r * 0.45, r * 0.25, -0.6, 0, TAU);
      ctx.fill();
    }

    // Gouden rand.
    ctx.strokeStyle = flash ? "#ffffff" : "#c9a24b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = bp.dark;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r - 4, 0, TAU);
    ctx.stroke();

    // Kroon.
    ctx.fillStyle = flash ? "#ffffff" : "#c9a24b";
    const heights = [0.35, 0.55, 0.75, 0.55, 0.35];

    for (let i = 0; i < 5; i++) {
      const cx = (i - 2) * r * 0.32;
      const baseY = -r * 0.9;

      ctx.beginPath();
      ctx.moveTo(cx - r * 0.13, baseY);
      ctx.lineTo(cx, baseY - r * heights[i]);
      ctx.lineTo(cx + r * 0.13, baseY);
      ctx.closePath();
      ctx.fill();
    }

    // Gloeiende spleetogen.
    ctx.save();
    ctx.rotate(this.facing);

    const eyeColor = enraged ? "#ffffff" : "#ff4d4d";

    for (const side of [-1, 1]) {
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.ellipse(r * 0.4, side * r * 0.3, r * 0.09, r * 0.22, 0, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawBossBar(ctx: CanvasRenderingContext2D) {
    const barWidth = 90;
    const barHeight = 9;
    const x = this.x - barWidth / 2;
    const y = this.y - this.radius * 1.9 - 12;
    const healthPercentage = Math.max(0, this.hp / this.maxHp);

    ctx.save();

    ctx.fillStyle = "#12040a";
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = this.enraged ? "#ff3b4e" : "#b81d2d";
    ctx.fillRect(x + 1, y + 1, (barWidth - 2) * healthPercentage, barHeight - 2);

    ctx.strokeStyle = "#c9a24b";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 0.75, y - 0.75, barWidth + 1.5, barHeight + 1.5);

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.lineJoin = "round";
    ctx.font = '18px "Pirata One", Georgia, serif';

    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(8, 2, 10, 0.9)";
    ctx.strokeText(this.name, this.x, y - 4);

    ctx.fillStyle = "#efe4cf";
    ctx.fillText(this.name, this.x, y - 4);

    ctx.restore();
  }
}