
import { useEffect, useRef, useState } from "react";
import { GameScene, type XPStats } from "../game/scenes/GameScene";
import type { Upgrade } from "../game/systems/UpgradeSystem";

type GameCanvasProps = {
  playerColor: string;
  onXPChange: (stats: XPStats) => void;
  onLevelUp: (upgrades: Upgrade[]) => void;
  onSceneReady: (scene: GameScene) => void;
};

const JOYSTICK_RADIUS = 42;

export default function GameCanvas({
  playerColor,
  onXPChange,
  onLevelUp,
  onSceneReady,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GameScene | null>(null);
  const [stick, setStick] = useState({ x: 0, y: 0 });

  const callbacksRef = useRef({ onXPChange, onLevelUp });

  useEffect(() => {
    callbacksRef.current = { onXPChange, onLevelUp };
  }, [onXPChange, onLevelUp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = new GameScene(
      canvas,
      (stats) => callbacksRef.current.onXPChange(stats),
      (upgrades) => callbacksRef.current.onLevelUp(upgrades),
      playerColor
    );

    sceneRef.current = game;
    onSceneReady(game);
    game.start();

    return () => {
      game.destroy();
      sceneRef.current = null;
    };
  }, [onSceneReady, playerColor]);

  function updateJoystick(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = event.clientX - centerX;
    let dy = event.clientY - centerY;

    const distance = Math.hypot(dx, dy);
    if (distance > JOYSTICK_RADIUS) {
      dx = (dx / distance) * JOYSTICK_RADIUS;
      dy = (dy / distance) * JOYSTICK_RADIUS;
    }

    const x = dx / JOYSTICK_RADIUS;
    const y = dy / JOYSTICK_RADIUS;

    setStick({ x: dx, y: dy });
    sceneRef.current?.setMobileInput(x, y);
  }

  function releaseJoystick() {
    setStick({ x: 0, y: 0 });
    sceneRef.current?.setMobileInput(0, 0);
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        touchAction: "none",
        background: "#08050a",
      }}
    >
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          touchAction: "none",
        }}
      />

      {/* Virtuele joystick */}
      <div
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          updateJoystick(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons === 1 || event.pointerType === "touch") {
            updateJoystick(event);
          }
        }}
        onPointerUp={releaseJoystick}
        onPointerCancel={releaseJoystick}
        style={{
          position: "absolute",
          left: "24px",
          bottom: "28px",
          width: "116px",
          height: "116px",
          borderRadius: "50%",
          border: "2px solid rgba(201, 162, 75, 0.55)",
          background: "rgba(20, 12, 20, 0.55)",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          touchAction: "none",
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "2px solid #c9a24b",
            background: "rgba(163, 21, 42, 0.85)",
            boxShadow: "0 0 12px rgba(163, 21, 42, 0.4)",
            transform: `translate(${stick.x}px, ${stick.y}px)`,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Dash-knop */}
      <button
        type="button"
        aria-label="Dash"
        onPointerDown={(event) => {
          event.preventDefault();
          sceneRef.current?.mobileDash();
        }}
        style={{
          position: "absolute",
          right: "28px",
          bottom: "42px",
          width: "82px",
          height: "82px",
          borderRadius: "50%",
          border: "3px solid #c9a24b",
          background: "linear-gradient(145deg, #a3152a, #450711)",
          color: "#efe4cf",
          fontSize: "15px",
          fontWeight: 800,
          letterSpacing: "1px",
          boxShadow: "0 0 20px rgba(163, 21, 42, 0.4)",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          zIndex: 10,
        }}
      >
        DASH
      </button>
    </div>
  );
}
