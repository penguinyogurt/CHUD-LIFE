import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useRef } from 'react';
import { Mesh } from 'three';

export function Arena() {
  const groundRef = useRef<Mesh>(null);

  return (
    <group>
      {/* Ground */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[25, 0.5, 25]} position={[0, -0.5, 0]} />
        <mesh ref={groundRef} receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#2a2a3e" />
        </mesh>
      </RigidBody>

      {/* Arena grid lines */}
      <gridHelper args={[50, 50, '#3a3a5e', '#3a3a5e']} position={[0, 0.01, 0]} />

      {/* Arena boundary walls */}
      <ArenaBoundary position={[0, 2, -25]} rotation={[0, 0, 0]} />
      <ArenaBoundary position={[0, 2, 25]} rotation={[0, Math.PI, 0]} />
      <ArenaBoundary position={[-25, 2, 0]} rotation={[0, Math.PI / 2, 0]} />
      <ArenaBoundary position={[25, 2, 0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Corner pillars */}
      <Pillar position={[-22, 0, -22]} />
      <Pillar position={[22, 0, -22]} />
      <Pillar position={[-22, 0, 22]} />
      <Pillar position={[22, 0, 22]} />

      {/* Ambient decoration */}
      <Platform position={[0, 0, 0]} size={[10, 0.2, 10]} />
    </group>
  );
}

function ArenaBoundary({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  return (
    <RigidBody type="fixed" position={position} rotation={rotation}>
      <CuboidCollider args={[25, 2, 0.5]} />
      <mesh castShadow receiveShadow>
        <boxGeometry args={[50, 4, 1]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.3} />
      </mesh>
    </RigidBody>
  );
}

function Pillar({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" position={position}>
      <CuboidCollider args={[1.5, 4, 1.5]} position={[0, 4, 0]} />
      <mesh castShadow receiveShadow position={[0, 4, 0]}>
        <boxGeometry args={[3, 8, 3]} />
        <meshStandardMaterial color="#e94560" emissive="#e94560" emissiveIntensity={0.2} />
      </mesh>
      {/* Pillar glow */}
      <pointLight position={[0, 8, 0]} intensity={10} color="#e94560" distance={15} />
    </RigidBody>
  );
}

function Platform({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#3a3a5e" />
      </mesh>
      {/* Center glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.22, 0]}>
        <ringGeometry args={[3, 4, 32]} />
        <meshStandardMaterial color="#e94560" emissive="#e94560" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

export function Lights() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <pointLight position={[0, 10, 0]} intensity={20} color="#ffffff" distance={50} />
      <hemisphereLight args={['#4a4a6e', '#1a1a2e', 0.5]} />
    </>
  );
}
