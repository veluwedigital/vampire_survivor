import type { XPStats } from "../game/scenes/GameScene";

type GameHUDProps = {
  stats: XPStats;
};

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&display=swap");

.hud-root {
  --blood: #b81d2d;
  --blood-deep: #6d0b17;
  --bone: #efe4cf;
  --gold: #c9a24b;

  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: min(520px, calc(100% - 56px));
  display: flex;
  align-items: center;
  pointer-events: none;
  user-select: none;
  font-family: "Cinzel", Georgia, serif;
  color: var(--bone);
}

/* ---------- Level-ruit ---------- */
.hud-badge {
  position: relative;
  z-index: 2;
  flex: none;
  width: 38px;
  height: 38px;
  margin: 0 -12px 0 8px;
  display: grid;
  place-items: center;
  transform: rotate(45deg);
  border: 2px solid var(--gold);
  border-radius: 2px;
  background: linear-gradient(135deg, #a3152a, var(--blood-deep));
  box-shadow:
    inset 0 0 0 2px #12040a,
    inset 0 0 0 3px rgba(201, 162, 75, .45),
    0 4px 12px rgba(0, 0, 0, .65);
  animation: hud-level-up .7s cubic-bezier(.2, .9, .3, 1.3);
}
.hud-badge span {
  transform: rotate(-45deg);
  font-weight: 700;
  font-size: 17px;
  line-height: 1;
  text-shadow: 0 2px 0 rgba(0, 0, 0, .65);
}
@keyframes hud-level-up {
  0%   { transform: rotate(45deg) scale(1.55); filter: brightness(1.8); }
  100% { transform: rotate(45deg) scale(1);    filter: brightness(1); }
}

/* ---------- XP-balk ---------- */
.hud-bar {
  position: relative;
  flex: 1;
  height: 22px;
  padding: 3px;
  border: 2px solid var(--gold);
  border-radius: 2px;
  background: #12040a;
  box-shadow:
    inset 0 0 0 1px rgba(201, 162, 75, .3),
    0 4px 14px rgba(0, 0, 0, .6);
}
.hud-track {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 1px;
  background: #260a16;
}
.hud-fill {
  position: relative;
  height: 100%;
  background: linear-gradient(#d4283c, #8f1124);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .3);
  transition: width 150ms ease;
}
/* heldere voorkant van de balk */
.hud-fill::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 3px;
  background: var(--bone);
  box-shadow: 0 0 10px 2px rgba(239, 228, 207, .55);
  opacity: .85;
}
.hud-fill[data-empty="true"]::after { opacity: 0; }

.hud-xp {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: .12em;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 1px 2px #000, 0 0 6px rgba(0, 0, 0, .9);
}

@media (prefers-reduced-motion: reduce) {
  .hud-badge { animation: none; }
  .hud-fill { transition: none; }
}
`;

export default function GameHUD({ stats }: GameHUDProps) {
  const progress =
    stats.xpToNextLevel > 0
      ? Math.min((stats.xp / stats.xpToNextLevel) * 100, 100)
      : 0;

  return (
    <div className="hud-root">
      <style>{CSS}</style>

      {/* key = level, zodat de puls opnieuw afspeelt bij elke level-up */}
      <div className="hud-badge" key={stats.level} aria-label={`Level ${stats.level}`}>
        <span>{stats.level}</span>
      </div>

      <div
        className="hud-bar"
        role="progressbar"
        aria-label="Experience"
        aria-valuemin={0}
        aria-valuemax={stats.xpToNextLevel}
        aria-valuenow={stats.xp}
      >
        <div className="hud-track">
          <div
            className="hud-fill"
            data-empty={progress === 0}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="hud-xp">
          {stats.xp} / {stats.xpToNextLevel} XP
        </div>
      </div>
    </div>
  );
}