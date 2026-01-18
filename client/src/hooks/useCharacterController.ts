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
  jump: boolean;
}

const MOVE_SPEED = 5; // Movement speed (units per second)
const ROTATION_SPEED = 10;
const JUMP_VELOCITY = 8;
const GRAVITY = 20;

export function useCharacterController(rigidBodyRef: React.RefObject<RapierRigidBody | null>) {
  const { camera } = useThree();
  const [keys, setKeys] = useState<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    attack: false,
    special: false,
    emote: false,
    jump: false
  });

  const { setAnimationState, setPlayerPosition } = useGameStore();
  const currentAnimation = useRef<AnimationState>('idle');
  const attackCooldown = useRef(false);
  const specialCooldown = useRef(false);
  const verticalVelocity = useRef(0);
  const targetRotation = useRef(0);

  // Reusable vectors for camera-relative movement
  const cameraForward = useRef(new Vector3());
  const cameraRight = useRef(new Vector3());
  const moveDirection = useRef(new Vector3());

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
      case 'KeyR':
        setKeys(k => ({ ...k, attack: true }));
        break;
      case 'Space':
        setKeys(k => ({ ...k, jump: true }));
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
      case 'KeyR':
        setKeys(k => ({ ...k, attack: false }));
        break;
      case 'Space':
        setKeys(k => ({ ...k, jump: false }));
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
    const currentPos = rigidBody.translation();
    let isMoving = false;

    // Get camera forward direction
    camera.getWorldDirection(cameraForward.current);
    cameraForward.current.y = 0;
    cameraForward.current.normalize();

    // Right vector is perpendicular to forward on XZ plane
    cameraRight.current.set(-cameraForward.current.z, 0, cameraForward.current.x);

    // Build movement direction relative to camera
    moveDirection.current.set(0, 0, 0);
    if (keys.forward) {
      moveDirection.current.add(cameraForward.current);
      isMoving = true;
    }
    if (keys.backward) {
      moveDirection.current.sub(cameraForward.current);
      isMoving = true;
    }
    if (keys.left) {
      moveDirection.current.sub(cameraRight.current);
      isMoving = true;
    }
    if (keys.right) {
      moveDirection.current.add(cameraRight.current);
      isMoving = true;
    }

    if (isMoving) {
      moveDirection.current.normalize();
      targetRotation.current = Math.atan2(moveDirection.current.x, moveDirection.current.z);
    }

    // Check if grounded (close to ground level or below)
    const isGrounded = currentPos.y <= 0.5;

    // Apply gravity or jump
    if (isGrounded && verticalVelocity.current <= 0) {
      verticalVelocity.current = 0;
      if (keys.jump) {
        verticalVelocity.current = JUMP_VELOCITY;
      }
    } else {
      verticalVelocity.current -= GRAVITY * delta;
    }

    // Calculate new position
    const newX = currentPos.x + moveDirection.current.x * MOVE_SPEED * delta;
    const newY = Math.max(0.4, currentPos.y + verticalVelocity.current * delta);
    const newZ = currentPos.z + moveDirection.current.z * MOVE_SPEED * delta;

    // Set kinematic position
    rigidBody.setNextKinematicTranslation({ x: newX, y: newY, z: newZ });

    // Handle rotation
    const currentRotation = rigidBody.rotation();
    const currentEuler = Math.atan2(
      2 * (currentRotation.w * currentRotation.y),
      1 - 2 * currentRotation.y * currentRotation.y
    );
    const newRotation = currentEuler + (targetRotation.current - currentEuler) * ROTATION_SPEED * delta;
    rigidBody.setNextKinematicRotation({
      x: 0,
      y: Math.sin(newRotation / 2),
      z: 0,
      w: Math.cos(newRotation / 2)
    });

    setPlayerPosition([newX, newY, newZ]);

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
