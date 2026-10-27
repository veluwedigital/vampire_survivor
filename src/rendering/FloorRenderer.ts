/**
 * FloorRenderer
 * Naadloze, procedurele crypte-vloer: verweerde flagstones in verspringend
 * metselverband, scheuren, bloedvlekken en een vignette.
 *
 * De tegel (512x512) wordt één keer getekend en daarna als pattern herhaald,
 * dus het kost per frame vrijwel niets.
 *
 * Gebruik in je render-loop, vóór je spelers/vijanden tekent:
 *   floor.draw(ctx, camera.x, camera.y, viewWidth, viewHeight);
 *
 * camX / camY = wereldpositie van de linkerbovenhoek van het scherm.
 * Heb je geen camera? Geef dan 0, 0 mee voor een vaste vloer.
 */

const TILE = 512;
const STONE = 128;
const GAP = 3;

export type FloorOptions = {
  /** Andere seed = ander (maar altijd naadloos) patroon */
  seed?: number;
  /** Meestal window.devicePixelRatio, voor scherpe stenen op retina */
  scale?: number;
  /** Donkere rand om de vloer heen, houdt de focus in het midden */
  vignette?: boolean;
};

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundedRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

type StoneData = {
  color: string;
  speckles: { x: number; y: number; s: number; dark: boolean }[];
  crack: { x: number; y: number }[] | null;
};

function buildTile(seed: number, scale: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = TILE * scale;
  const g = canvas.getContext("2d")!;
  g.scale(scale, scale);

  const rnd = mulberry32(seed);
  const w = STONE - GAP;
  const h = STONE - GAP;

  // Voeg-specie: bijna zwart, met een paarse zweem
  g.fillStyle = "#06030a";
  g.fillRect(0, 0, TILE, TILE);

  const drawStone = (x0: number, y0: number, s: StoneData) => {
    const x = x0 + GAP / 2;
    const y = y0 + GAP / 2;

    roundedRect(g, x, y, w, h, 4);
    g.fillStyle = s.color;
    g.fill();

    // Licht van linksboven, schaduw rechtsonder
    const shade = g.createLinearGradient(x, y, x + w, y + h);
    shade.addColorStop(0, "rgba(255,235,255,0.05)");
    shade.addColorStop(1, "rgba(0,0,0,0.25)");
    g.fillStyle = shade;
    g.fill();

    g.lineWidth = 1;
    g.strokeStyle = "rgba(255,240,255,0.07)";
    g.beginPath();
    g.moveTo(x + 5, y + 0.5);
    g.lineTo(x + w - 5, y + 0.5);
    g.moveTo(x + 0.5, y + 5);
    g.lineTo(x + 0.5, y + h - 5);
    g.stroke();

    g.strokeStyle = "rgba(0,0,0,0.45)";
    g.beginPath();
    g.moveTo(x + 5, y + h - 0.5);
    g.lineTo(x + w - 5, y + h - 0.5);
    g.moveTo(x + w - 0.5, y + 5);
    g.lineTo(x + w - 0.5, y + h - 5);
    g.stroke();

    for (const sp of s.speckles) {
      g.fillStyle = sp.dark ? "rgba(0,0,0,0.3)" : "rgba(255,235,255,0.05)";
      g.fillRect(x + sp.x, y + sp.y, sp.s, sp.s);
    }

    if (s.crack) {
      g.beginPath();
      g.moveTo(x + s.crack[0].x, y + s.crack[0].y);
      for (let i = 1; i < s.crack.length; i++) {
        g.lineTo(x + s.crack[i].x, y + s.crack[i].y);
      }
      g.strokeStyle = "rgba(0,0,0,0.55)";
      g.lineWidth = 1.3;
      g.stroke();

      g.translate(1, 1);
      g.strokeStyle = "rgba(255,235,255,0.05)";
      g.lineWidth = 1;
      g.stroke();
      g.translate(-1, -1);
    }
  };

  // Stenen in verspringend metselverband. Elke tweede rij schuift een halve
  // steen op, en alles wordt ook 1 tegel links/rechts getekend zodat de
  // rand naadloos aansluit.
  const rows = TILE / STONE;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (STONE / 2);
    for (let i = 0; i < rows; i++) {
      const hue = 268 + rnd() * 34;
      const sat = 16 + rnd() * 16;
      const light = 8 + rnd() * 5;

      const speckles = Array.from({ length: 14 }, () => ({
        x: rnd() * w,
        y: rnd() * h,
        s: rnd() < 0.2 ? 2 : 1,
        dark: rnd() < 0.65,
      }));

      let crack: StoneData["crack"] = null;
      if (rnd() < 0.28) {
        let cx = 14 + rnd() * (w - 28);
        let cy = 14 + rnd() * (h - 28);
        let angle = rnd() * Math.PI * 2;
        crack = [{ x: cx, y: cy }];
        const segments = 3 + Math.floor(rnd() * 3);
        for (let k = 0; k < segments; k++) {
          angle += (rnd() - 0.5) * 1.2;
          const len = 10 + rnd() * 16;
          cx = Math.max(4, Math.min(w - 4, cx + Math.cos(angle) * len));
          cy = Math.max(4, Math.min(h - 4, cy + Math.sin(angle) * len));
          crack.push({ x: cx, y: cy });
        }
      }

      const stone: StoneData = {
        color: `hsl(${hue} ${sat}% ${light}%)`,
        speckles,
        crack,
      };

      const x0 = offset + i * STONE;
      const y0 = r * STONE;
      drawStone(x0 - TILE, y0, stone);
      drawStone(x0, y0, stone);
      drawStone(x0 + TILE, y0, stone);
    }
  }

  // Bloedvlekken en vochtige plekken, ook in beide richtingen gewrapt
  const stains = 8;
  for (let k = 0; k < stains; k++) {
    const bx = rnd() * TILE;
    const by = rnd() * TILE;
    const br = 30 + rnd() * 55;
    const blood = rnd() < 0.6;

    for (const dx of [-TILE, 0, TILE]) {
      for (const dy of [-TILE, 0, TILE]) {
        const cx = bx + dx;
        const cy = by + dy;
        if (cx + br < 0 || cx - br > TILE || cy + br < 0 || cy - br > TILE) {
          continue;
        }
        const grad = g.createRadialGradient(cx, cy, 0, cx, cy, br);
        grad.addColorStop(0, blood ? "rgba(120,10,26,0.26)" : "rgba(0,0,0,0.3)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grad;
        g.beginPath();
        g.arc(cx, cy, br, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  return canvas;
}

export class FloorRenderer {
  private readonly tile: HTMLCanvasElement;
  private readonly scale: number;
  private readonly useVignette: boolean;

  private pattern: CanvasPattern | null = null;
  private patternCtx: CanvasRenderingContext2D | null = null;

  private vignette: HTMLCanvasElement | null = null;

  constructor({ seed = 1337, scale = 1, vignette = true }: FloorOptions = {}) {
    this.scale = Math.max(1, scale);
    this.useVignette = vignette;
    this.tile = buildTile(seed, this.scale);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    width: number,
    height: number
  ) {
    if (!this.pattern || this.patternCtx !== ctx) {
      this.pattern = ctx.createPattern(this.tile, "repeat");
      this.patternCtx = ctx;
      // De tegel is `scale` keer groter in pixels; breng hem terug naar TILE
      this.pattern?.setTransform?.(new DOMMatrix().scale(1 / this.scale));
    }
    if (!this.pattern) return;

    const mod = (n: number) => ((n % TILE) + TILE) % TILE;
    const snap = (n: number) => Math.round(n * this.scale) / this.scale;

    ctx.save();
    ctx.translate(snap(-mod(camX)), snap(-mod(camY)));
    ctx.fillStyle = this.pattern;
    ctx.fillRect(0, 0, width + TILE, height + TILE);
    ctx.restore();

    if (this.useVignette) this.drawVignette(ctx, width, height);
  }

  private drawVignette(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {
    const w = Math.ceil(width);
    const h = Math.ceil(height);

    if (!this.vignette || this.vignette.width !== w || this.vignette.height !== h) {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const g = c.getContext("2d")!;
      const cx = w / 2;
      const cy = h / 2;

      // Zeer subtiele rode gloed rond het midden (waar de speler staat)
      const glow = g.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.5);
      glow.addColorStop(0, "rgba(184,29,45,0.07)");
      glow.addColorStop(1, "rgba(184,29,45,0)");
      g.fillStyle = glow;
      g.fillRect(0, 0, w, h);

      const dark = g.createRadialGradient(
        cx,
        cy,
        Math.min(w, h) * 0.28,
        cx,
        cy,
        Math.hypot(w, h) / 2
      );
      dark.addColorStop(0, "rgba(5,2,8,0)");
      dark.addColorStop(0.55, "rgba(5,2,8,0.35)");
      dark.addColorStop(1, "rgba(5,2,8,0.85)");
      g.fillStyle = dark;
      g.fillRect(0, 0, w, h);

      this.vignette = c;
    }

    ctx.drawImage(this.vignette, 0, 0, width, height);
  }
}