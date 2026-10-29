import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { GameScene, type XPStats } from "../game/scenes/GameScene";
import type { Upgrade } from "../game/systems/UpgradeSystem";

type GameCanvasProps = {
  playerColor: string;
  onXPChange: (stats: XPStats) => void;
  onLevelUp: (upgrades: Upgrade[]) => void;
  onSceneReady: (scene: GameScene) => void;
};

const JOYSTICK_RADIUS = 52;
const BASE_SIZE = 128;
const KNOB_SIZE = 54;
const HUD_SAFE_TOP = 84;

type StickState = {
  active: boolean;
  originX: number;
  originY: number;
  x: number;
  y: number;
};

const IDLE_STICK: StickState = { active: false, originX: 0, originY: 0, x: 0, y: 0 };

export default function GameCanvas({
  playerColor,
  onXPChange,
  onLevelUp,
  onSceneReady,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GameScene | null>(null);

  const [stick, setStick] = useState<StickState>(IDLE_STICK);

  const pointerIdRef = useRef<number | null>(null);
  const originRef = useRef({ absX: 0, absY: 0 });

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

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), Math.max(min, max));
  }

  function handleStickDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== null) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;

    const rect = event.currentTarget.getBoundingClientRect();
    const margin = BASE_SIZE / 2 + 8;

    const originX = clamp(event.clientX - rect.left, margin, rect.width - margin);
    const originY = clamp(event.clientY - rect.top, margin, rect.height - margin);

    originRef.current = {
      absX: rect.left + originX,
      absY: rect.top + originY,
    };

    setStick({ active: true, originX, originY, x: 0, y: 0 });
    sceneRef.current?.setMobileInput(0, 0);
  }

  function handleStickMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerId !== pointerIdRef.current) return;

    let dx = event.clientX - originRef.current.absX;
    let dy = event.clientY - originRef.current.absY;

    const distance = Math.hypot(dx, dy);

    if (distance > JOYSTICK_RADIUS) {
      dx = (dx / distance) * JOYSTICK_RADIUS;
      dy = (dy / distance) * JOYSTICK_RADIUS;
    }

    setStick((prev) => ({ ...prev, x: dx, y: dy }));

    sceneRef.current?.setMobileInput(
      dx / JOYSTICK_RADIUS,
      dy / JOYSTICK_RADIUS
    );
  }

  function handleStickUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerId !== pointerIdRef.current) return;

    pointerIdRef.current = null;
    setStick(IDLE_STICK);
    sceneRef.current?.setMobileInput(0, 0);
  }

  return (
    <div
      className="game-container"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
        background: "#08050a",
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          margin: 0,
          padding: 0,
          border: 0,
          touchAction: "none",
        }}
      />

      {/* Floating joystick mobile only */}
      <div
        className="mobile-controls mobile-joystick-zone"
        onPointerDown={handleStickDown}
        onPointerMove={handleStickMove}
        onPointerUp={handleStickUp}
        onPointerCancel={handleStickUp}
        onLostPointerCapture={handleStickUp}
        style={{
          position: "absolute",
          left: 0,
          top: `${HUD_SAFE_TOP}px`,
          bottom: 0,
          width: "55%",
          touchAction: "none",
          zIndex: 5,
        }}
      >
      
        {!stick.active && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "max(24px, env(safe-area-inset-left))",
              bottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)",
              width: `${BASE_SIZE}px`,
              height: `${BASE_SIZE}px`,
              borderRadius: "50%",
              border: "2px solid rgba(201, 162, 75, 0.4)",
              background: "rgba(20, 12, 20, 0.4)",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: `${KNOB_SIZE}px`,
                height: `${KNOB_SIZE}px`,
                marginLeft: `${-KNOB_SIZE / 2}px`,
                marginTop: `${-KNOB_SIZE / 2}px`,
                borderRadius: "50%",
                border: "2px solid rgba(201, 162, 75, 0.7)",
                background: "rgba(163, 21, 42, 0.55)",
              }}
            />
          </div>
        )}

        {/* Joystick */}
        {stick.active && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: `${stick.originX - BASE_SIZE / 2}px`,
              top: `${stick.originY - BASE_SIZE / 2}px`,
              width: `${BASE_SIZE}px`,
              height: `${BASE_SIZE}px`,
              borderRadius: "50%",
              border: "2px solid rgba(201, 162, 75, 0.7)",
              background: "rgba(20, 12, 20, 0.55)",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: `${KNOB_SIZE}px`,
                height: `${KNOB_SIZE}px`,
                marginLeft: `${-KNOB_SIZE / 2}px`,
                marginTop: `${-KNOB_SIZE / 2}px`,
                borderRadius: "50%",
                border: "2px solid #c9a24b",
                background: "rgba(163, 21, 42, 0.9)",
                boxShadow: "0 0 14px rgba(163, 21, 42, 0.5)",
                transform: `translate(${stick.x}px, ${stick.y}px)`,
              }}
            />
          </div>
        )}
      </div>

      {/* Dash-Button */}
      <button
        className="mobile-controls mobile-dash"
        type="button"
        aria-label="Dash"
        onPointerDown={(event) => {
          event.preventDefault();
          sceneRef.current?.mobileDash();
        }}
        style={{
          position: "absolute",
          right: "max(24px, env(safe-area-inset-right))",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 40px)",
          width: "92px",
          height: "92px",
          padding: 0,
          borderRadius: "50%",
          border: "3px solid #c9a24b",
          background: "linear-gradient(145deg, #a3152a, #450711)",
          color: "#efe4cf",
          fontSize: "16px",
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "1px",
          boxShadow: "0 0 20px rgba(163, 21, 42, 0.4)",

          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTapHighlightColor: "transparent",
          zIndex: 6,
        }}
      >
        DASH
      </button>
    </div>
  );
}