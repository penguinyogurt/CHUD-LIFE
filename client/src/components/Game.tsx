import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { OrbitControls, PerspectiveCamera, Environment, Stats } from '@react-three/drei';
import { Arena, Lights } from './Arena';
import { Player } from './Player';
import { DummyEnemy, HealthBar, ControlsHint } from './Combat';
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

  const handleEnemyHit = () => {
    // Collision with enemy - could trigger damage or other effects
  };

  return (
    <Physics gravity={[0, -20, 0]} debug={false}>
      <Arena />
      <Lights />

      {characterModelUrl && (
        <Suspense fallback={<LoadingScreen />}>
          <Player modelUrl={characterModelUrl} position={[0, 2, 5]} />
        </Suspense>
      )}

      {/* Practice dummy enemies */}
      <DummyEnemy position={[-5, 0, -5]} onHit={handleEnemyHit} />
      <DummyEnemy position={[5, 0, -5]} onHit={handleEnemyHit} />
      <DummyEnemy position={[0, 0, -10]} onHit={handleEnemyHit} />
    </Physics>
  );
}

export function Game() {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Canvas shadows>
        <color attach="background" args={['#0a0a1a']} />
        <fog attach="fog" args={['#0a0a1a', 30, 60]} />

        <PerspectiveCamera makeDefault position={[0, 10, 15]} fov={60} />
        <OrbitControls
          target={[0, 1, 0]}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={5}
          maxDistance={30}
          enablePan={false}
        />

        <Suspense fallback={<LoadingScreen />}>
          <GameScene />
          <Environment preset="night" />
        </Suspense>

        <Stats />
      </Canvas>

      {/* UI Overlay */}
      <HealthBar />
      <ControlsHint />

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          color: '#e94560',
          fontSize: '24px',
          fontWeight: 'bold',
          fontFamily: 'system-ui',
          textShadow: '0 0 10px rgba(233, 69, 96, 0.5)'
        }}
      >
        CHUDLIFE
      </div>
    </div>
  );
}
