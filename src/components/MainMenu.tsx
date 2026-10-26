
type MainMenuProps = {
  onPlay: () => void;
};

export default function MainMenu({ onPlay }: MainMenuProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#222321",
        color: "#f5f5f5",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "24px",
        }}
      >
        <p
          style={{
            color: "#e87500",
            textTransform: "uppercase",
            letterSpacing: "5px",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          Survival Game
        </p>

        <h1
          style={{
            fontSize: "clamp(42px, 8vw, 76px)",
            fontWeight: 900,
            letterSpacing: "-3px",
            margin: "12px 0",
          }}
        >
          SURVIVOR
        </h1>

        <p
          style={{
            color: "#a5a59f",
            marginBottom: "36px",
          }}
        >
          Survive the endless horde.
        </p>

        <button
          onClick={onPlay}
          style={{
            background: "#e87500",
            color: "#ffffff",
            border: "none",
            padding: "16px 48px",
            fontSize: "16px",
            fontWeight: 700,
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          PLAY GAME
        </button>

        <p
          style={{
            color: "#777872",
            fontSize: "12px",
            marginTop: "24px",
          }}
        >
          WASD / ARROW KEYS TO MOVE
        </p>
      </div>
    </div>
  );
}
