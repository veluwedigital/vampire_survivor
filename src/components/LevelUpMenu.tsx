import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Upgrade } from "../game/systems/UpgradeSystem";

type LevelUpMenuProps = {
  upgrades: Upgrade[];
  onSelect: (upgradeId: string) => void;
};

/* Kleine lijn-iconen per upgrade, op basis van het id. */
function iconFor(id: string): ReactNode {
  if (id === "damage") {
    return (
      <>
        <path d="M38 10L22 26" strokeWidth="4" />
        <path d="M17 21L28 32" />
        <path d="M21 29L12 38" />
        <circle cx="11" cy="39" r="2.5" />
      </>
    );
  }

  if (id === "attack-speed") {
    return <path d="M27 6L12 28H23L21 42L36 18H26Z" />;
  }

  if (id === "move-speed") {
    return <path d="M11 13L23 24L11 35M26 13L38 24L26 35" />;
  }

  if (id.startsWith("orb")) {
    return (
      <>
        <circle cx="24" cy="24" r="6" />
        <ellipse cx="24" cy="24" rx="18" ry="8" transform="rotate(-30 24 24)" />
        <circle cx="39.6" cy="15" r="3" fill="currentColor" />
      </>
    );
  }

  if (id === "rocket-area") {
    return (
      <>
        <circle cx="24" cy="24" r="4" fill="currentColor" />
        <circle cx="24" cy="24" r="10" />
        <circle cx="24" cy="24" r="17" strokeDasharray="4 5" />
      </>
    );
  }

  if (id.startsWith("rocket")) {
    return (
      <>
        <path d="M24 5C32 12 33 24 30 34H18C15 24 16 12 24 5Z" />
        <circle cx="24" cy="19" r="3.5" />
        <path d="M18 30L11 38L18 36M30 30L37 38L30 36" />
        <path d="M21 39L24 45L27 39" />
      </>
    );
  }

  // Onbekende upgrade: een eenvoudige ruit.
  return <path d="M24 8L38 24L24 40L10 24Z" />;
}

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Pirata+One&family=Cinzel:wght@600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=swap");

.lu-root {
  --blood: #b81d2d;
  --blood-deep: #6d0b17;
  --bone: #efe4cf;
  --gold: #c9a24b;
  --ash: #a79a8a;

  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  color: var(--bone);
  font-family: "Cormorant Garamond", Georgia, serif;
  background:
    radial-gradient(ellipse at 50% 35%, rgba(90, 10, 30, .55) 0%, rgba(8, 2, 10, .92) 70%),
    rgba(8, 2, 10, .6);
  backdrop-filter: blur(3px);
  animation: lu-fade .35s ease-out both;
}
@keyframes lu-fade { from { opacity: 0; } }

.lu-panel {
  width: min(760px, 100%);
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lu-title {
  margin: 0;
  font-family: "Pirata One", "UnifrakturCook", Georgia, serif;
  font-weight: 400;
  font-size: clamp(56px, 10vw, 96px);
  line-height: .95;
  color: var(--bone);
  text-shadow: 0 3px 0 #4a0a14, 0 6px 0 #2a0309, 0 0 40px rgba(184, 29, 45, .4);
}

.lu-ornament {
  width: 190px;
  height: 14px;
  margin: 14px 0 10px;
  color: var(--gold);
}

.lu-sub {
  margin: 0 0 30px;
  font-style: italic;
  font-weight: 600;
  font-size: 22px;
  color: var(--ash);
}

.lu-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 18px;
}

/* ---------- Kaart ---------- */
.lu-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 270px;
  padding: 34px 20px 28px;
  border: 2px solid var(--gold);
  border-radius: 3px;
  background: linear-gradient(180deg, #230c20 0%, #12050f 100%);
  color: var(--bone);
  font-family: inherit;
  text-align: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  box-shadow:
    inset 0 0 0 3px #0b030a,
    inset 0 0 0 4px rgba(201, 162, 75, .4),
    0 14px 30px rgba(0, 0, 0, .6);
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
  animation: lu-rise .5s cubic-bezier(.2, .8, .3, 1) both;
  animation-delay: calc(var(--i) * 90ms + 120ms);
}
@keyframes lu-rise { from { opacity: 0; transform: translateY(24px); } }

/* Gouden ruitjes op boven- en onderrand */
.lu-card::before,
.lu-card::after {
  content: "";
  position: absolute;
  left: 50%;
  width: 11px;
  height: 11px;
  background: var(--gold);
  box-shadow: 0 0 0 2px #12040a;
  transform: translateX(-50%) rotate(45deg);
}
.lu-card::before { top: -8px; }
.lu-card::after { bottom: -8px; }

/* Hover alleen op apparaten met een echte muis */
@media (hover: hover) {
  .lu-card:hover {
    transform: translateY(-6px);
    border-color: #e6c26a;
    box-shadow:
      inset 0 0 0 3px #0b030a,
      inset 0 0 0 4px rgba(230, 194, 106, .65),
      0 0 34px rgba(212, 31, 53, .4),
      0 18px 34px rgba(0, 0, 0, .65);
  }
  .lu-card:hover .lu-medal { filter: brightness(1.35); }
}

/* Tikfeedback voor touch */
.lu-card:active { transform: scale(.98); border-color: #e6c26a; }
.lu-card:active .lu-medal { filter: brightness(1.35); }

.lu-card:focus-visible {
  outline: 3px solid var(--bone);
  outline-offset: 5px;
}

.lu-key {
  position: absolute;
  top: 12px;
  left: 12px;
  display: grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  font-family: "Cinzel", Georgia, serif;
  font-weight: 600;
  font-size: 12px;
  color: var(--bone);
  background: #1b0a1a;
  border: 1px solid rgba(201, 162, 75, .55);
  border-bottom-width: 3px;
  border-radius: 3px;
}

.lu-medal {
  flex: none;
  width: 58px;
  height: 58px;
  margin: 6px 0 30px;
  display: grid;
  place-items: center;
  transform: rotate(45deg);
  border: 2px solid var(--gold);
  border-radius: 2px;
  background: linear-gradient(135deg, #8f1124, #3a0712);
  box-shadow: inset 0 0 0 2px #12040a, 0 6px 14px rgba(0, 0, 0, .55);
  transition: filter .18s ease;
}

.lu-medal svg {
  width: 32px;
  height: 32px;
  transform: rotate(-45deg);
  color: var(--bone);
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.lu-name {
  font-family: "Cinzel", Georgia, serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 1.25;
  letter-spacing: .05em;
  color: var(--bone);
  text-shadow: 0 2px 0 rgba(0, 0, 0, .6);
}

.lu-rule {
  width: 44px;
  height: 1px;
  margin: 14px 0;
  background: var(--gold);
  opacity: .7;
}

.lu-desc {
  margin: 0;
  max-width: 24ch;
  font-weight: 500;
  font-size: 20px;
  line-height: 1.3;
  color: #d3c8b4;
}

/* Geen 1/2/3-labels op touchscreens */
@media (hover: none) and (pointer: coarse) {
  .lu-key { display: none; }
}

/* ---------- Mobiel: horizontale kaarten ---------- */
@media (max-width: 560px) {
  .lu-root {
    align-items: flex-start;
    padding:
      max(16px, env(safe-area-inset-top))
      max(14px, env(safe-area-inset-right))
      max(16px, env(safe-area-inset-bottom))
      max(14px, env(safe-area-inset-left));
  }

  .lu-title { font-size: 52px; }
  .lu-ornament { width: 150px; margin: 10px 0 6px; }
  .lu-sub { font-size: 18px; margin-bottom: 20px; }

  .lu-grid { grid-template-columns: 1fr; gap: 16px; }

  .lu-card {
    display: grid;
    grid-template-columns: 58px 1fr;
    column-gap: 32px;
    align-content: center;
    align-items: center;
    min-height: 0;
    padding: 18px 16px 18px 14px;
    text-align: left;
  }

  .lu-medal {
    grid-row: 1 / span 3;
    margin: 0 0 0 14px;
  }

  .lu-name,
  .lu-rule,
  .lu-desc { grid-column: 2; }

  .lu-name { font-size: 16px; }
  .lu-rule { width: 32px; margin: 8px 0; }
  .lu-desc { max-width: none; font-size: 18px; line-height: 1.25; }
}

@media (prefers-reduced-motion: reduce) {
  .lu-root, .lu-card { animation: none; }
  .lu-card, .lu-medal { transition: none; }
}
`;

export default function LevelUpMenu({
  upgrades,
  onSelect,
}: LevelUpMenuProps) {
  // Sneltoetsen: 1, 2 en 3 kiezen de bijbehorende kaart.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.repeat) return;

      const index = Number(event.key) - 1;

      if (Number.isInteger(index) && index >= 0 && index < upgrades.length) {
        event.preventDefault();
        onSelect(upgrades[index].id);
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [upgrades, onSelect]);

  if (upgrades.length === 0) return null;

  return (
    <div className="lu-root" role="dialog" aria-modal="true" aria-label="Level up">
      <style>{CSS}</style>

      <div className="lu-panel">
        <h1 className="lu-title">Level Up</h1>

        <svg className="lu-ornament" viewBox="0 0 230 14" aria-hidden="true">
          <path d="M0 7H96M134 7H230" stroke="currentColor" strokeWidth="1" />
          <path d="M115 0L122 7L115 14L108 7Z" fill="currentColor" />
          <path
            d="M100 7L104 3.5L108 7L104 10.5ZM122 7L126 3.5L130 7L126 10.5Z"
            fill="currentColor"
          />
        </svg>

        <p className="lu-sub">Choose an upgrade</p>

        <div className="lu-grid">
          {upgrades.map((upgrade, index) => (
            <button
              key={upgrade.id}
              className="lu-card"
              style={{ "--i": index } as CSSProperties}
              onClick={() => onSelect(upgrade.id)}
            >
              <span className="lu-key" aria-hidden="true">
                {index + 1}
              </span>

              <span className="lu-medal" aria-hidden="true">
                <svg viewBox="0 0 48 48">{iconFor(upgrade.id)}</svg>
              </span>

              <span className="lu-name">{upgrade.name}</span>

              <span className="lu-rule" aria-hidden="true" />

              <p className="lu-desc">{upgrade.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}