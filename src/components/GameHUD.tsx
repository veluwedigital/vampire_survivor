
import type { XPStats } from "../game/scenes/GameScene";

type GameHUDProps = {
  stats: XPStats;
};

export default function GameHUD({ stats }: GameHUDProps) {
  const progress = Math.min(
    (stats.xp / stats.xpToNextLevel) * 100,
    100
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(500px, calc(100% - 40px))",
        color: "#ffffff",
        fontFamily: "system-ui, sans-serif",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        <span>LEVEL {stats.level}</span>
        <span>
          {stats.xp} / {stats.xpToNextLevel} XP
        </span>
      </div>

      <div
        style={{
          height: 12,
          background: "#454640",
          border: "1px solid #66675f",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#e87500",
            borderRadius: 20,
            transition: "width 150ms ease",
          }}
        />
      </div>
    </div>
  );
}
