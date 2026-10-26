
import { useEffect, useRef } from "react";
import { GameScene, type XPStats } from "../game/scenes/GameScene";
import type { Upgrade } from "../game/systems/UpgradeSystem";

type GameCanvasProps = {
  onXPChange: (stats: XPStats) => void;
  onLevelUp: (upgrades: Upgrade[]) => void;
  onSceneReady: (scene: GameScene) => void;
};

export default function GameCanvas({
  onXPChange,
  onLevelUp,
  onSceneReady,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GameScene | null>(null);

  const callbacksRef = useRef({
    onXPChange,
    onLevelUp,
  });

  useEffect(() => {
    callbacksRef.current = { onXPChange, onLevelUp };
  }, [onXPChange, onLevelUp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = new GameScene(
      canvas,
      (stats) => callbacksRef.current.onXPChange(stats),
      (upgrades) => callbacksRef.current.onLevelUp(upgrades)
    );

    sceneRef.current = game;
    onSceneReady(game);
    game.start();

    return () => {
      game.destroy();
      sceneRef.current = null;
    };
  }, [onSceneReady]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
