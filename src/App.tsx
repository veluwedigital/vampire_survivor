
import { useCallback, useRef, useState } from "react";
import "./App.css";

import GameCanvas from "./components/GameCanvas";
import GameHUD from "./components/GameHUD";
import MainMenu from "./components/MainMenu";
import LevelUpMenu from "./components/LevelUpMenu";

import type { XPStats } from "./game/scenes/GameScene";
import { GameScene } from "./game/scenes/GameScene";
import type { Upgrade } from "./game/systems/UpgradeSystem";

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState("#c62839");

  const [xpStats, setXPStats] = useState<XPStats>({
    xp: 0,
    level: 1,
    xpToNextLevel: 5,
  });

  const [availableUpgrades, setAvailableUpgrades] = useState<Upgrade[]>([]);

  const sceneRef = useRef<GameScene | null>(null);

  const handleSceneReady = useCallback((scene: GameScene) => {
    sceneRef.current = scene;
  }, []);

  const handleLevelUp = useCallback((upgrades: Upgrade[]) => {
    setAvailableUpgrades(upgrades);
  }, []);

  const handleUpgradeSelect = useCallback((upgradeId: string) => {
    setAvailableUpgrades([]);
    sceneRef.current?.chooseUpgrade(upgradeId);
  }, []);

  const handlePlay = useCallback((color: string) => {
    setPlayerColor(color);
    setGameStarted(true);
  }, []);

  if (!gameStarted) {
    return <MainMenu onPlay={handlePlay} />;
  }

  return (
    <main
      style={{
        position: "relative",
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
        background: "#222321",
      }}
    >
      <GameCanvas
        playerColor={playerColor}
        onXPChange={setXPStats}
        onLevelUp={handleLevelUp}
        onSceneReady={handleSceneReady}
      />

      <GameHUD stats={xpStats} />

      {availableUpgrades.length > 0 && (
        <LevelUpMenu
          upgrades={availableUpgrades}
          onSelect={handleUpgradeSelect}
        />
      )}
    </main>
  );
}

export default App;
