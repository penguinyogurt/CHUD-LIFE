import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import { Forest, ForestLights } from './Forest';
import { Player } from './Player';
import { Boss } from './Boss';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { HealthBar, BossHealthBar, ControlsHint } from './Combat';
import { useGameStore } from '../stores/gameStore';

function LoadingScreen() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#e94560" />
    </mesh>
  );
}

function GameScene() {
  const characterModelUrl = useGameStore((state) => state.characterModelUrl);

  const handleBossDefeated = () => {
    console.log('Boss defeated!');
  };

  return (
    <Physics gravity={[0, -20, 0]} debug={false}>
      <Forest />
      <ForestLights />

      {characterModelUrl && (
        <Suspense fallback={<LoadingScreen />}>
          <Player modelUrl={characterModelUrl} position={[0, 5, 0]} />
        </Suspense>
      )}

      {/* Boss fight */}
      <Boss position={[0, 2, -8]} onDefeated={handleBossDefeated} />
    </Physics>
  );
}

export function Game() {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas shadows>
        <color attach="background" args={['#87ceeb']} />
        <fog attach="fog" args={['#a8d5ba', 40, 120]} />

        <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={60} />
        <ThirdPersonCamera
          minDistance={1.5}
          maxDistance={15}
          offset={[0, 0.6, 0]}
        />

        <Suspense fallback={<LoadingScreen />}>
          <GameScene />
          <Environment preset="forest" />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <BossHealthBar />
      <HealthBar />
      <ControlsHint />

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          color: '#2d5a27',
          fontSize: '24px',
          fontWeight: 'bold',
          fontFamily: 'system-ui',
          textShadow: '0 0 10px rgba(45, 90, 39, 0.5), 2px 2px 0 #fff'
        }}
      >
        CHUDLIFE
      </div>
    </div>
  );
}
