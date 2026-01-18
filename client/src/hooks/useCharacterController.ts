import { useEffect, useRef, useState, useCallback } from 'react';
import { Vector3 } from 'three';
import { RapierRigidBody } from '@react-three/rapier';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore, AnimationState } from '../stores/gameStore';

interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  attack: boolean;
  special: boolean;
  emote: boolean;
}

const MOVE_SPEED = 1.5; // Adjusted for smaller character scale
const ROTATION_SPEED = 10;

export function useCharacterController(rigidBodyRef: React.RefObject<RapierRigidBody | null>) {
  const { camera } = useThree();
  const [keys, setKeys] = useState<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    attack: false,
    special: false,
    emote: false
  });

  const { setAnimationState, setPlayerPosition } = useGameStore();
  const currentAnimation = useRef<AnimationState>('idle');
  const attackCooldown = useRef(false);
  const specialCooldown = useRef(false);
  const targetRotation = useRef(0);

  // Reusable vectors for camera-relative movement
  const cameraForward = useRef(new Vector3());
  const cameraRight = useRef(new Vector3());

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        setKeys(k => ({ ...k, forward: true }));
        break;
      case 'KeyS':
      case 'ArrowDown':
        setKeys(k => ({ ...k, backward: true }));
        break;
      case 'KeyA':
      case 'ArrowLeft':
        setKeys(k => ({ ...k, left: true }));
        break;
      case 'KeyD':
      case 'ArrowRight':
        setKeys(k => ({ ...k, right: true }));
        break;
      case 'Space':
        setKeys(k => ({ ...k, attack: true }));
        break;
      case 'KeyE':
        setKeys(k => ({ ...k, special: true }));
        break;
      case 'KeyQ':
        setKeys(k => ({ ...k, emote: true }));
        break;
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        setKeys(k => ({ ...k, forward: false }));
        break;
      case 'KeyS':
      case 'ArrowDown':
        setKeys(k => ({ ...k, backward: false }));
        break;
      case 'KeyA':
      case 'ArrowLeft':
        setKeys(k => ({ ...k, left: false }));
        break;
      case 'KeyD':
      case 'ArrowRight':
        setKeys(k => ({ ...k, right: false }));
        break;
      case 'Space':
        setKeys(k => ({ ...k, attack: false }));
        break;
      case 'KeyE':
        setKeys(k => ({ ...k, special: false }));
        break;
      case 'KeyQ':
        setKeys(k => ({ ...k, emote: false }));
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useFrame((_, delta) => {
    if (!rigidBodyRef.current) return;

    const rigidBody = rigidBodyRef.current;
    const velocity = new Vector3(0, 0, 0);
    let isMoving = false;

    // Get camera forward direction (points toward what camera looks at)
    // We negate it because "forward" for the player means away from camera
    camera.getWorldDirection(cameraForward.current);
    cameraForward.current.y = 0;
    cameraForward.current.normalize();

    // Right vector is perpendicular to forward on XZ plane (cross product with Y-up)
    cameraRight.current.set(-cameraForward.current.z, 0, cameraForward.current.x);

    // Build movement direction relative to camera
    if (keys.forward) {
      velocity.add(cameraForward.current);
      isMoving = true;
    }
    if (keys.backward) {
      velocity.sub(cameraForward.current);
      isMoving = true;
    }
    if (keys.left) {
      velocity.sub(cameraRight.current);
      isMoving = true;
    }
    if (keys.right) {
      velocity.add(cameraRight.current);
      isMoving = true;
    }

    if (isMoving) {
      velocity.normalize().multiplyScalar(MOVE_SPEED);
      // Character faces movement direction
      targetRotation.current = Math.atan2(velocity.x, velocity.z);
    }

    const currentVel = rigidBody.linvel();
    rigidBody.setLinvel({ x: velocity.x, y: currentVel.y, z: velocity.z }, true);

    const currentRotation = rigidBody.rotation();
    const currentEuler = Math.atan2(
      2 * (currentRotation.w * currentRotation.y),
      1 - 2 * currentRotation.y * currentRotation.y
    );
    const newRotation = currentEuler + (targetRotation.current - currentEuler) * ROTATION_SPEED * delta;
    rigidBody.setRotation({
      x: 0,
      y: Math.sin(newRotation / 2),
      z: 0,
      w: Math.cos(newRotation / 2)
    }, true);

    const pos = rigidBody.translation();
    setPlayerPosition([pos.x, pos.y, pos.z]);

    let newAnimation: AnimationState = 'idle';

    if (keys.attack && !attackCooldown.current) {
      newAnimation = 'attack';
      attackCooldown.current = true;
      setTimeout(() => {
        attackCooldown.current = false;
      }, 500);
    } else if (keys.special && !specialCooldown.current) {
      newAnimation = 'special';
      specialCooldown.current = true;
      setTimeout(() => {
        specialCooldown.current = false;
      }, 1000);
    } else if (keys.emote) {
      newAnimation = 'emote';
    } else if (isMoving) {
      newAnimation = 'walking';
    }

    if (newAnimation !== currentAnimation.current) {
      currentAnimation.current = newAnimation;
      setAnimationState(newAnimation);
    }
  });

  return { keys };
}
