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

const terminalGreen = '#22c55e';
const terminalFont = "'JetBrains Mono', 'Fira Code', monospace";

function LoadingScreen() {
  return null;
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

      <Suspense fallback={null}>
        <Boss position={[0, 2, -8]} onDefeated={handleBossDefeated} />
      </Suspense>
    </Physics>
  );
}

// Corner bracket component for the frame
function FrameCorner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 40;
  const thickness = 2;

  const positionStyles: Record<string, React.CSSProperties> = {
    tl: { top: 12, left: 12 },
    tr: { top: 12, right: 12 },
    bl: { bottom: 12, left: 12 },
    br: { bottom: 12, right: 12 },
  };

  const borderStyles: Record<string, React.CSSProperties> = {
    tl: { borderTop: `${thickness}px solid ${terminalGreen}`, borderLeft: `${thickness}px solid ${terminalGreen}` },
    tr: { borderTop: `${thickness}px solid ${terminalGreen}`, borderRight: `${thickness}px solid ${terminalGreen}` },
    bl: { borderBottom: `${thickness}px solid ${terminalGreen}`, borderLeft: `${thickness}px solid ${terminalGreen}` },
    br: { borderBottom: `${thickness}px solid ${terminalGreen}`, borderRight: `${thickness}px solid ${terminalGreen}` },
  };

  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        ...positionStyles[position],
        ...borderStyles[position],
        boxShadow: `0 0 15px ${terminalGreen}40`,
      }}
    />
  );
}

// Tactical frame overlay
function TacticalFrame() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >

      {/* Corner brackets */}
      <FrameCorner position="tl" />
      <FrameCorner position="tr" />
      <FrameCorner position="bl" />
      <FrameCorner position="br" />

      {/* Top edge line */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 60,
          right: 60,
          height: 1,
          background: `linear-gradient(90deg, ${terminalGreen}60, ${terminalGreen}20 20%, transparent 50%, ${terminalGreen}20 80%, ${terminalGreen}60)`,
        }}
      />

      {/* Bottom edge line */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 60,
          right: 60,
          height: 1,
          background: `linear-gradient(90deg, ${terminalGreen}60, ${terminalGreen}20 20%, transparent 50%, ${terminalGreen}20 80%, ${terminalGreen}60)`,
        }}
      />

      {/* Left edge line */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 60,
          bottom: 60,
          width: 1,
          background: `linear-gradient(180deg, ${terminalGreen}60, ${terminalGreen}20 20%, transparent 50%, ${terminalGreen}20 80%, ${terminalGreen}60)`,
        }}
      />

      {/* Right edge line */}
      <div
        style={{
          position: 'absolute',
          right: 12,
          top: 60,
          bottom: 60,
          width: 1,
          background: `linear-gradient(180deg, ${terminalGreen}60, ${terminalGreen}20 20%, transparent 50%, ${terminalGreen}20 80%, ${terminalGreen}60)`,
        }}
      />

      {/* Top left tactical text */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 60,
          fontFamily: terminalFont,
          fontSize: '9px',
          color: `${terminalGreen}80`,
          letterSpacing: '0.15em',
        }}
      >
        COMBAT_ARENA_01
      </div>

      {/* Top right tactical text */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 60,
          fontFamily: terminalFont,
          fontSize: '9px',
          color: `${terminalGreen}80`,
          letterSpacing: '0.15em',
        }}
      >
        SYS:ACTIVE
      </div>

      {/* Bottom left coordinates */}
      <div
        style={{
          position: 'absolute',
          bottom: 18,
          left: 60,
          fontFamily: terminalFont,
          fontSize: '9px',
          color: `${terminalGreen}60`,
          letterSpacing: '0.1em',
        }}
      >
        GRID:X0.Y0.Z0
      </div>

      {/* Bottom right status */}
      <div
        style={{
          position: 'absolute',
          bottom: 18,
          right: 60,
          fontFamily: terminalFont,
          fontSize: '9px',
          color: `${terminalGreen}60`,
          letterSpacing: '0.1em',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: terminalGreen,
            boxShadow: `0 0 8px ${terminalGreen}`,
          }}
        />
        ONLINE
      </div>

      {/* Small crosshair markers on edges */}
      {/* Top center */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 8,
          height: 8,
          borderBottom: `1px solid ${terminalGreen}60`,
        }}
      />
      {/* Bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 8,
          height: 8,
          borderTop: `1px solid ${terminalGreen}60`,
        }}
      />
      {/* Left center */}
      <div
        style={{
          position: 'absolute',
          left: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 8,
          height: 8,
          borderRight: `1px solid ${terminalGreen}60`,
        }}
      />
      {/* Right center */}
      <div
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 8,
          height: 8,
          borderLeft: `1px solid ${terminalGreen}60`,
        }}
      />

      {/* Vignette effect */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
        }}
      />
    </div>
  );
}

export function Game() {
  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      {/* Game canvas with slight inset */}
      <div style={{ position: 'absolute', inset: 8, overflow: 'hidden' }}>
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
      </div>

      {/* Tactical frame overlay */}
      <TacticalFrame />

      {/* UI Overlay */}
      <BossHealthBar />
      <HealthBar />
      <ControlsHint />

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: '28px',
          right: '28px',
          fontFamily: terminalFont,
          fontSize: '14px',
          fontWeight: 500,
          letterSpacing: '0.2em',
          color: terminalGreen,
          textShadow: `0 0 20px ${terminalGreen}80`,
          background: 'rgba(0, 0, 0, 0.85)',
          padding: '10px 16px',
          zIndex: 101,
        }}
      >
        {/* Corner brackets */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 8, height: 8, borderTop: `2px solid ${terminalGreen}`, borderLeft: `2px solid ${terminalGreen}` }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderTop: `2px solid ${terminalGreen}`, borderRight: `2px solid ${terminalGreen}` }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 8, height: 8, borderBottom: `2px solid ${terminalGreen}`, borderLeft: `2px solid ${terminalGreen}` }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderBottom: `2px solid ${terminalGreen}`, borderRight: `2px solid ${terminalGreen}` }} />
        CHUDLIFE
      </div>
    </div>
  );
}
