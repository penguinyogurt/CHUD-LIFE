import { useRef } from 'react';
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
      {/* Enemy indicator */}
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
    </RigidBody>
  );
}

export function HealthBar() {
  const { health, maxHealth } = useGameStore((state) => state.player);
  const percentage = (health / maxHealth) * 100;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100px',
        left: '20px',
        width: '200px',
        height: '20px',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '2px solid #4ade80'
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          background: percentage > 50 ? '#4ade80' : percentage > 25 ? '#fbbf24' : '#ef4444',
          transition: 'width 0.3s ease'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px black'
        }}
      >
        {health} / {maxHealth}
      </div>
    </div>
  );
}

export function BossHealthBar() {
  const { health, maxHealth, isDead } = useGameStore((state) => state.boss);
  const percentage = (health / maxHealth) * 100;

  if (isDead) {
    return (
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#ef4444',
          fontSize: '24px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px black'
        }}
      >
        CHUD KING DEFEATED!
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
        gap: '5px'
      }}
    >
      <div
        style={{
          color: '#ef4444',
          fontSize: '18px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px black'
        }}
      >
        CHUD KING
      </div>
      <div
        style={{
          width: '300px',
          height: '24px',
          background: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid #ef4444'
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            background: 'linear-gradient(to right, #dc2626, #ef4444)',
            transition: 'width 0.3s ease'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            textShadow: '1px 1px 2px black'
          }}
        >
          {health} / {maxHealth}
        </div>
      </div>
    </div>
  );
}

export function ControlsHint() {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        color: 'white',
        fontSize: '14px',
        background: 'rgba(0, 0, 0, 0.5)',
        padding: '15px',
        borderRadius: '10px',
        fontFamily: 'monospace'
      }}
    >
      <div style={{ marginBottom: '5px', fontWeight: 'bold', color: '#e94560' }}>Controls</div>
      <div>WASD / Arrows - Move</div>
      <div>Space - Attack</div>
      <div>E - Special Attack</div>
      <div>Q - Emote</div>
    </div>
  );
}
