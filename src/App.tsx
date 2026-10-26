import './App.css'
import GameCanvas from './components/GameCanvas';

function App() {
  return (
    <main
      style={{
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
        background: "#222321",
      }}
    >
      <GameCanvas />
    </main>
  );
}

export default App;
