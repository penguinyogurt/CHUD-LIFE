import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { RigidBody, RapierRigidBody, CuboidCollider } from '@react-three/rapier';
import { Vector3, Object3D, Mesh, SkinnedMesh } from 'three';
import { useGameStore } from '../stores/gameStore';

interface BossProps {
  position: [number, number, number];
  onDefeated?: () => void;
}

const HIT_DAMAGE = 10;
const HIT_RANGE = 2;
const ATTACK_COOLDOWN = 1500;  // Match attack animation duration
const SPECIAL_COOLDOWN = 2200; // Match special animation duration

export function Boss({ position, onDefeated }: BossProps) {
  const { scene } = useGLTF('/boss.glb');
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const lastHitTime = useRef(0);
  const bossPosition = useRef(new Vector3(...position));

  const playerPosition = useGameStore((state) => state.player.position);
  const playerAnimationState = useGameStore((state) => state.player.animationState);
  const bossHealth = useGameStore((state) => state.boss.health);
  const isDead = useGameStore((state) => state.boss.isDead);
  const setBossHealth = useGameStore((state) => state.setBossHealth);
  const setBossDead = useGameStore((state) => state.setBossDead);

  // Enable shadows on boss model
  useEffect(() => {
    scene.traverse((child: Object3D) => {
      if ((child as Mesh).isMesh || (child as SkinnedMesh).isSkinnedMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  // Check for player attacks
  useFrame(() => {
    if (isDead) return;

    const isAttacking = playerAnimationState === 'attack' || playerAnimationState === 'special';
    const now = Date.now();
    const cooldown = playerAnimationState === 'special' ? SPECIAL_COOLDOWN : ATTACK_COOLDOWN;

    if (isAttacking && now - lastHitTime.current > cooldown) {
      const playerPos = new Vector3(...playerPosition);
      const distance = playerPos.distanceTo(bossPosition.current);

      if (distance < HIT_RANGE) {
        lastHitTime.current = now;
        const damage = playerAnimationState === 'special' ? HIT_DAMAGE * 2 : HIT_DAMAGE;
        const newHealth = Math.max(0, bossHealth - damage);

        setBossHealth(newHealth);

        if (newHealth <= 0) {
          setBossDead(true);
          onDefeated?.();
        }

        // Apply knockback force when hit
        if (rigidBodyRef.current) {
          const knockbackDir = bossPosition.current.clone().sub(playerPos).normalize();
          rigidBodyRef.current.applyImpulse(
            { x: knockbackDir.x * 5, y: 2, z: knockbackDir.z * 5 },
            true
          );
        }
      }
    }

    // Update boss position for distance checks
    if (rigidBodyRef.current) {
      const pos = rigidBodyRef.current.translation();
      bossPosition.current.set(pos.x, pos.y, pos.z);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      type="dynamic"
      colliders={false}
      linearDamping={isDead ? 0.5 : 2}
      angularDamping={isDead ? 0.5 : 10}
      enabledRotations={isDead ? [true, true, true] : [false, true, false]}
      mass={isDead ? 50 : 100}
    >
      <CuboidCollider args={[0.8, 1.5, 0.8]} position={[0, 1.5, 0]} />
      <primitive object={scene} scale={1} />
    </RigidBody>
  );
}

// Preload boss model
useGLTF.preload('/boss.glb');
