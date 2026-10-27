import { useEffect, useRef, useState } from "react";
type MainMenuProps = {
  onPlay: (bodyColor: string) => void;
};

const PLAYER_COLORS = [
  { name: "Blood red", value: "#c62839" },
  { name: "Bone white", value: "#e8dcc5" },
  { name: "Violet", value: "#9254c8" },
  { name: "Ice blue", value: "#56c7e8" },
  { name: "Poison green", value: "#70c75b" },
  { name: "Gold", value: "#e5b94f" },
];

/* Kleine vleermuizen die langs de maan vliegen */
const BATS = [
  { top: "14%", size: 34, duration: 26, delay: -4, reverse: false },
  { top: "26%", size: 22, duration: 32, delay: -18, reverse: true },
  { top: "38%", size: 46, duration: 22, delay: -9, reverse: false },
  { top: "9%", size: 18, duration: 38, delay: -27, reverse: true },
  { top: "31%", size: 28, duration: 29, delay: -14, reverse: true },
];

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Pirata+One&family=Cinzel:wght@600;700&family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&display=swap");

.mm-root {
  --crypt: #0b050d;
  --night: #170717;
  --blood: #b81d2d;
  --blood-deep: #6d0b17;
  --bone: #efe4cf;
  --gold: #c9a24b;
  --ash: #a79a8a;

  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bone);
  font-family: "Cormorant Garamond", Georgia, serif;
  background:
    radial-gradient(1px 1px at 12% 18%, rgba(239,228,207,.7), transparent),
    radial-gradient(1px 1px at 82% 12%, rgba(239,228,207,.6), transparent),
    radial-gradient(1.5px 1.5px at 24% 42%, rgba(239,228,207,.5), transparent),
    radial-gradient(1px 1px at 91% 38%, rgba(239,228,207,.5), transparent),
    radial-gradient(1px 1px at 6% 62%, rgba(239,228,207,.4), transparent),
    radial-gradient(1.5px 1.5px at 70% 24%, rgba(239,228,207,.6), transparent),
    radial-gradient(1px 1px at 46% 8%, rgba(239,228,207,.5), transparent),
    radial-gradient(ellipse at 50% 42%, #2b0a19 0%, var(--night) 42%, var(--crypt) 100%);
}

/* ---------- Maan ---------- */
.mm-moon-anchor {
  position: absolute;
  left: 50%;
  top: 46%;
  width: clamp(280px, 64vmin, 640px);
  aspect-ratio: 1;
  transform: translate(-50%, -52%);
  pointer-events: none;
}
.mm-moon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 66% 28%, rgba(0,0,0,.18) 0 7%, transparent 7.5%),
    radial-gradient(circle at 30% 62%, rgba(0,0,0,.2) 0 11%, transparent 11.5%),
    radial-gradient(circle at 58% 74%, rgba(0,0,0,.14) 0 6%, transparent 6.5%),
    radial-gradient(circle at 36% 30%, #c9303f 0%, var(--blood) 38%, var(--blood-deep) 100%);
  box-shadow:
    0 0 90px 24px rgba(184, 29, 45, .38),
    0 0 260px 80px rgba(184, 29, 45, .16),
    inset -30px -20px 70px rgba(30, 0, 8, .55);
  animation: mm-moon-rise 2.6s cubic-bezier(.16,.8,.3,1) both;
}
@keyframes mm-moon-rise {
  from { transform: translateY(26%) scale(.92); opacity: 0; }
}

/* ---------- Vleermuizen ---------- */
.mm-bat {
  position: absolute;
  left: 0;
  color: #05020a;
  animation: mm-bat-cross var(--dur) linear var(--delay) infinite;
  will-change: transform;
}
.mm-bat svg {
  display: block;
  width: 100%;
  height: auto;
  animation: mm-bat-flap .5s ease-in-out infinite alternate;
  transform-origin: 50% 70%;
}
.mm-bat.mm-rev svg { scale: -1 1; }
.mm-bat.mm-rev { animation-direction: reverse; }
@keyframes mm-bat-cross {
  from { transform: translate(-14vw, 0); }
  25%  { transform: translate(18vw, -18px); }
  50%  { transform: translate(50vw, 8px); }
  75%  { transform: translate(82vw, -14px); }
  to   { transform: translate(114vw, 0); }
}
@keyframes mm-bat-flap {
  from { transform: scaleY(1); }
  to   { transform: scaleY(.55); }
}

/* ---------- Voorgrond ---------- */
.mm-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.7) 100%);
}
.mm-ground {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: clamp(110px, 24vh, 240px);
  pointer-events: none;
}

/* ---------- Inhoud ---------- */
.mm-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px;
  animation: mm-content-in 1.4s ease-out .9s both;
}
@keyframes mm-content-in {
  from { opacity: 0; transform: translateY(10px); }
}

.mm-title {
  margin: 0;
  font-family: "Pirata One", "UnifrakturCook", Georgia, serif;
  font-weight: 400;
  font-size: clamp(68px, 15vw, 160px);
  line-height: .9;
  letter-spacing: .01em;
  color: var(--bone);
  text-shadow:
    0 3px 0 #4a0a14,
    0 6px 0 #2a0309,
    0 0 48px rgba(0,0,0,.65);
}

.mm-ornament {
  width: clamp(150px, 24vw, 230px);
  height: 14px;
  margin: 18px 0 14px;
  color: var(--gold);
  filter: drop-shadow(0 1px 4px rgba(0,0,0,.8));
}

.mm-tagline {
  margin: 0 0 clamp(32px, 6vh, 52px);
  font-style: italic;
  font-weight: 600;
  font-size: clamp(20px, 2.6vw, 26px);
  color: var(--bone);
  text-shadow: 0 2px 12px rgba(0,0,0,.9);
}

/* ---------- Knop ---------- */
.mm-play {
  position: relative;
  min-width: 250px;
  padding: 18px 56px;
  border: 2px solid var(--gold);
  border-radius: 2px;
  cursor: pointer;
  font-family: "Cinzel", Georgia, serif;
  font-weight: 700;
  font-size: 19px;
  letter-spacing: .22em;
  text-indent: .22em;
  color: var(--bone);
  background: linear-gradient(#a3152a, var(--blood-deep));
  box-shadow:
    inset 0 0 0 3px #12040a,
    inset 0 0 0 4px rgba(201, 162, 75, .5),
    0 6px 0 #2a0309,
    0 16px 34px rgba(0,0,0,.55);
  text-shadow: 0 2px 0 rgba(0,0,0,.6);
  transition: transform .12s ease, box-shadow .12s ease, background .2s ease, filter .2s ease;
}
.mm-play::before,
.mm-play::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  background: var(--gold);
  transform: translateY(-50%) rotate(45deg);
  box-shadow: 0 0 0 2px #12040a;
}
.mm-play::before { left: -8px; }
.mm-play::after  { right: -8px; }

.mm-play:hover {
  background: linear-gradient(#c01c35, #860f20);
  filter: drop-shadow(0 0 18px rgba(212, 31, 53, .55));
  transform: translateY(-2px);
  box-shadow:
    inset 0 0 0 3px #12040a,
    inset 0 0 0 4px rgba(201, 162, 75, .7),
    0 8px 0 #2a0309,
    0 20px 38px rgba(0,0,0,.55);
}
.mm-play:active {
  transform: translateY(5px);
  box-shadow:
    inset 0 0 0 3px #12040a,
    inset 0 0 0 4px rgba(201, 162, 75, .5),
    0 1px 0 #2a0309,
    0 6px 14px rgba(0,0,0,.55);
}
.mm-play:focus-visible {
  outline: 3px solid var(--bone);
  outline-offset: 6px;
}

/* ---------- Besturing ---------- */
.mm-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px 12px;
  margin: 34px 0 0;
  font-size: 18px;
  font-style: italic;
  color: var(--ash);
  text-shadow: 0 2px 8px rgba(0,0,0,.9);
}
.mm-keys { display: inline-flex; gap: 4px; }
.mm-key {
  display: inline-grid;
  place-items: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  font-family: "Cinzel", Georgia, serif;
  font-style: normal;
  font-weight: 600;
  font-size: 13px;
  color: var(--bone);
  background: #1b0a1a;
  border: 1px solid rgba(201, 162, 75, .55);
  border-bottom-width: 3px;
  border-radius: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .mm-moon, .mm-content, .mm-bat, .mm-bat svg { animation: none; }
  .mm-bat { display: none; }
  .mm-play { transition: none; }
}

/* ---------- Personagekleur kiezen ---------- */
.mm-color-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 26px;
}

.mm-color-label {
  margin: 0;
  color: var(--ash);
  font-family: "Cinzel", Georgia, serif;
  font-size: 11px;
  letter-spacing: .2em;
  text-transform: uppercase;
}

.mm-colors {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.mm-color-option {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 2px solid rgba(201, 162, 75, .25);
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: transform .15s ease, border-color .15s ease;
}

.mm-color-option:hover {
  transform: scale(1.12);
  border-color: var(--gold);
}

.mm-color-option.selected {
  border-color: var(--gold);
  box-shadow: 0 0 12px rgba(201, 162, 75, .4);
  transform: scale(1.12);
}

.mm-color-swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, .5);
}

.mm-color-option:focus-visible {
  outline: 2px solid var(--bone);
  outline-offset: 4px;
}
`;

export default function MainMenu({ onPlay }: MainMenuProps) {
  const playRef = useRef<HTMLButtonElement>(null);
  const [selectedColor, setSelectedColor] = useState(
  PLAYER_COLORS[0].value
);

  // Knop direct focussen zodat Enter / Spatie meteen het spel start
  useEffect(() => {
    playRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="mm-root">
      <style>{CSS}</style>

      {/* Bloedmaan */}
      <div className="mm-moon-anchor" aria-hidden="true">
        <div className="mm-moon" />
      </div>

      {/* Vleermuizen */}
      <div aria-hidden="true">
        {BATS.map((bat, i) => (
          <div
            key={i}
            className={`mm-bat${bat.reverse ? " mm-rev" : ""}`}
            style={
              {
                top: bat.top,
                width: bat.size,
                "--dur": `${bat.duration}s`,
                "--delay": `${bat.delay}s`,
              } as React.CSSProperties
            }
          >
            <svg viewBox="0 0 40 20" fill="currentColor">
              <path d="M20 10C17 4 11 2 0 4c5 2 6 5 7 9 3-3 6-3 8 0 1-1 3 1 5 5 2-4 4-6 5-5 2-3 5-3 8 0 1-4 2-7 7-9C29 2 23 4 20 10Z" />
            </svg>
          </div>
        ))}
      </div>

      {/* Begraafplaats-silhouet */}
      <svg
        className="mm-ground"
        viewBox="0 0 1200 200"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <g fill="#05020a" stroke="none">
          <path d="M0 200V152Q150 134 300 148T600 144T900 148T1200 138V200Z" />
          {/* grafstenen */}
          <path d="M90 152V112a18 18 0 0 1 36 0V152Z" />
          <path d="M250 150V122a14 14 0 0 1 28 0V150Z" />
          <path d="M870 150V108a20 20 0 0 1 40 0V150Z" />
          <path d="M1040 148V120a15 15 0 0 1 30 0V148Z" />
          <path d="M1120 140V116a12 12 0 0 1 24 0V140Z" />
          {/* kruisen */}
          <path d="M168 150V96h8v14h14v8h-14v32Z" />
          <path d="M984 148V100h8v12h12v8h-12v28Z" />
        </g>
        {/* dode boom */}
        <path
          d="M40 150C42 122 36 102 44 80M44 102L18 80M42 94L68 70M44 80L34 56M44 80L56 60"
          fill="none"
          stroke="#05020a"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>

      <div className="mm-vignette" aria-hidden="true" />

      {/* Inhoud */}
      <main className="mm-content">
        <h1 className="mm-title">Survivor</h1>

        <svg className="mm-ornament" viewBox="0 0 230 14" aria-hidden="true">
          <path d="M0 7H96M134 7H230" stroke="currentColor" strokeWidth="1" />
          <path d="M115 0L122 7L115 14L108 7Z" fill="currentColor" />
          <path d="M100 7L104 3.5L108 7L104 10.5ZM122 7L126 3.5L130 7L126 10.5Z" fill="currentColor" />
        </svg>

        <p className="mm-tagline">Survive the endless horde.</p>

        <button
  ref={playRef}
  className="mm-play"
  onClick={() => onPlay(selectedColor)}
>
  PLAY GAME
</button>

<div className="mm-color-picker">
  <p className="mm-color-label">Choose your color</p>

  <div className="mm-colors" role="group" aria-label="Choose player color">
    {PLAYER_COLORS.map((color) => (
      <button
        key={color.value}
        type="button"
        className={`mm-color-option ${
          selectedColor === color.value ? "selected" : ""
        }`}
        onClick={() => setSelectedColor(color.value)}
        aria-label={color.name}
        aria-pressed={selectedColor === color.value}
        title={color.name}
      >
        <span
          className="mm-color-swatch"
          style={{ backgroundColor: color.value }}
        />
      </button>
    ))}
  </div>
</div>

        <p className="mm-controls" aria-label="Controls: WASD or arrow keys to move">
          <span className="mm-keys" aria-hidden="true">
            <kbd className="mm-key">W</kbd>
            <kbd className="mm-key">A</kbd>
            <kbd className="mm-key">S</kbd>
            <kbd className="mm-key">D</kbd>
          </span>
          <span aria-hidden="true">or</span>
          <span className="mm-keys" aria-hidden="true">
            <kbd className="mm-key">←</kbd>
            <kbd className="mm-key">↑</kbd>
            <kbd className="mm-key">↓</kbd>
            <kbd className="mm-key">→</kbd>
          </span>
          <span aria-hidden="true">to move</span>
        </p>
      </main>
    </div>
  );
}