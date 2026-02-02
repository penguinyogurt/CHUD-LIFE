import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier';
import { Mesh, MeshStandardMaterial } from 'three';
import { useGameStore } from '../stores/gameStore';

interface DummyEnemyProps {
  position: [number, number, number];
  onHit: () => void;
}

export function DummyEnemy({ position, onHit }: DummyEnemyProps) {
  const meshRef = useRef<Mesh>(null);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const hitFlashRef = useRef(0);

  useFrame(() => {
    if (meshRef.current && hitFlashRef.current > 0) {
      hitFlashRef.current -= 0.05;
      const material = meshRef.current.material as MeshStandardMaterial;
      material.emissiveIntensity = hitFlashRef.current;
    }
  });

  const handleCollision = () => {
    hitFlashRef.current = 1;
    onHit();
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      type="fixed"
      onCollisionEnter={handleCollision}
    >
      <CuboidCollider args={[0.5, 1, 0.5]} position={[0, 1, 0]} sensor />
      <mesh ref={meshRef} castShadow position={[0, 1, 0]}>
        <capsuleGeometry args={[0.5, 1, 4, 8]} />
        <meshStandardMaterial color="#ff6b6b" emissive="#ffffff" emissiveIntensity={0} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
    </RigidBody>
  );
}

// Terminal green theme
const terminalGreen = '#22c55e';
const terminalFont = "'JetBrains Mono', 'Fira Code', monospace";

// Corner brackets component
function CornerBrackets({ size = 12, color = terminalGreen }: { size?: number; color?: string }) {
  const style = { position: 'absolute' as const, width: size, height: size };
  const borderStyle = `2px solid ${color}`;

  return (
    <>
      <div style={{ ...style, top: 0, left: 0, borderTop: borderStyle, borderLeft: borderStyle }} />
      <div style={{ ...style, top: 0, right: 0, borderTop: borderStyle, borderRight: borderStyle }} />
      <div style={{ ...style, bottom: 0, left: 0, borderBottom: borderStyle, borderLeft: borderStyle }} />
      <div style={{ ...style, bottom: 0, right: 0, borderBottom: borderStyle, borderRight: borderStyle }} />
    </>
  );
}

export function HealthBar() {
  // Health bar is now integrated into ControlsHint
  return null;
}

export function BossHealthBar() {
  const { health, maxHealth, isDead } = useGameStore((state) => state.boss);
  const [dismissed, setDismissed] = useState(false);
  const percentage = (health / maxHealth) * 100;

  if (isDead && !dismissed) {
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          padding: '40px 60px',
          background: 'rgba(0, 0, 0, 0.9)',
          cursor: 'pointer',
        }}
        onClick={() => setDismissed(true)}
      >
        <CornerBrackets size={20} />
        <div
          style={{
            fontFamily: terminalFont,
            fontSize: '48px',
            fontWeight: 500,
            color: terminalGreen,
            letterSpacing: '0.2em',
            textShadow: `0 0 30px ${terminalGreen}`,
            marginBottom: '8px',
          }}
        >
          VICTORY
        </div>
        <div
          style={{
            fontFamily: terminalFont,
            fontSize: '12px',
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: '0.3em',
            marginBottom: '16px',
          }}
        >
          TARGET ELIMINATED
        </div>
        <div
          style={{
            fontFamily: terminalFont,
            fontSize: '10px',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.1em',
          }}
        >
          [ CLICK TO DISMISS ]
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {/* Boss name */}
      <div
        style={{
          fontFamily: terminalFont,
          fontSize: '12px',
          color: '#ef4444',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
        }}
      >
        ◆ CHUD_KING ◆
      </div>

      {/* Health bar container */}
      <div
        style={{
          position: 'relative',
          width: '320px',
          height: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '3px',
        }}
      >
        <CornerBrackets size={10} color="#ef4444" />

        {/* Health fill */}
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, #dc2626, #ef4444)',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
            transition: 'width 0.3s ease-out',
          }}
        />

        {/* Health text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: terminalFont,
            fontSize: '10px',
            color: '#fff',
            letterSpacing: '0.1em',
          }}
        >
          {health}/{maxHealth}
        </div>
      </div>
    </div>
  );
}

// Single key component
interface KeyProps {
  label: string;
  isPressed: boolean;
  width?: number;
}

function Key({ label, isPressed, width = 32 }: KeyProps) {
  return (
    <div
      style={{
        width,
        height: 32,
        background: isPressed
          ? terminalGreen
          : 'rgba(0, 0, 0, 0.9)',
        border: isPressed
          ? `1px solid ${terminalGreen}`
          : '1px solid rgba(34, 197, 94, 0.3)',
        boxShadow: isPressed
          ? `0 0 15px ${terminalGreen}, inset 0 0 10px rgba(255,255,255,0.2)`
          : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: terminalFont,
        fontSize: label.length > 1 ? '8px' : '11px',
        fontWeight: 500,
        color: isPressed ? '#000' : 'rgba(34, 197, 94, 0.8)',
        letterSpacing: '0.05em',
        transition: 'all 0.05s ease-out',
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  );
}

export function ControlsHint() {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const { health, maxHealth } = useGameStore((state) => state.player);
  const percentage = (health / maxHealth) * 100;
  const isCritical = percentage <= 25;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    setPressedKeys(prev => new Set(prev).add(key));
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    setPressedKeys(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const isPressed = (key: string) => pressedKeys.has(key);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.85)',
        padding: '16px',
      }}
    >
      <CornerBrackets size={10} />

      {/* Health bar at top */}
      <div style={{ marginBottom: '14px' }}>
        <div
          style={{
            fontFamily: terminalFont,
            fontSize: '9px',
            color: terminalGreen,
            letterSpacing: '0.2em',
            marginBottom: '6px',
          }}
        >
          ▸ HP
        </div>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '14px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: `1px solid ${isCritical ? '#ef4444' : 'rgba(34, 197, 94, 0.3)'}`,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${percentage}%`,
              background: isCritical ? '#ef4444' : terminalGreen,
              boxShadow: isCritical
                ? '0 0 8px rgba(239, 68, 68, 0.5)'
                : `0 0 8px rgba(34, 197, 94, 0.4)`,
              transition: 'width 0.2s ease-out',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: terminalFont,
              fontSize: '9px',
              color: '#fff',
              letterSpacing: '0.1em',
            }}
          >
            {health}/{maxHealth}
          </div>
        </div>
      </div>

      {/* Keyboard layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* QWER row */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
          <Key label="Q" isPressed={isPressed('q')} />
          <Key label="W" isPressed={isPressed('w')} />
          <Key label="E" isPressed={isPressed('e')} />
          <Key label="R" isPressed={isPressed('r')} />
        </div>

        {/* ASD row - offset like real keyboard */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
          <Key label="A" isPressed={isPressed('a')} />
          <Key label="S" isPressed={isPressed('s')} />
          <Key label="D" isPressed={isPressed('d')} />
        </div>

        {/* Spacebar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
          <Key label="SPACE" isPressed={isPressed(' ')} width={108} />
        </div>
      </div>

      {/* Mini legend */}
      <div
        style={{
          marginTop: '12px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(34, 197, 94, 0.2)',
          fontFamily: terminalFont,
          fontSize: '8px',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.1em',
          lineHeight: 1.8,
        }}
      >
        <div>WASD ─ MOVE</div>
        <div>SPACE ─ JUMP</div>
        <div>Q ─ EMOTE &nbsp; R ─ ATTACK &nbsp; E ─ SPECIAL</div>
      </div>
    </div>
  );
}
