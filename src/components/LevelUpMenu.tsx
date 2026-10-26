
import type { Upgrade } from "../game/systems/UpgradeSystem";

type LevelUpMenuProps = {
  upgrades: Upgrade[];
  onSelect: (upgradeId: string) => void;
};

export default function LevelUpMenu({
  upgrades,
  onSelect,
}: LevelUpMenuProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.75)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ width: "min(700px, 90%)", color: "white" }}>
        <h1 style={{ textAlign: "center", fontSize: 36 }}>
          LEVEL UP!
        </h1>

        <p style={{ textAlign: "center", color: "#aaa" }}>
          Choose an upgrade
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {upgrades.map((upgrade) => (
            <button
              key={upgrade.id}
              onClick={() => onSelect(upgrade.id)}
              style={{
                padding: "24px 12px",
                background: "#30312d",
                color: "white",
                border: "1px solid #55564f",
                borderRadius: 8,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <strong style={{ color: "#e87500" }}>
                {upgrade.name}
              </strong>

              <p style={{ fontSize: 13, lineHeight: 1.5 }}>
                {upgrade.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
