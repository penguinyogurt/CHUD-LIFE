import { CharacterUpload } from './components/CharacterUpload';
import { Game } from './components/Game';
import { useGameStore } from './stores/gameStore';

function App() {
  const phase = useGameStore((state) => state.phase);

  return (
    <>
      {phase === 'upload' && <CharacterUpload />}
      {phase === 'playing' && <Game />}
    </>
  );
}

export default App;
