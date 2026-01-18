import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Spherical, MathUtils } from 'three';
import { useGameStore } from '../stores/gameStore';

interface ThirdPersonCameraProps {
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  rotationSpeed?: number;
  zoomSpeed?: number;
  smoothness?: number;
  offset?: [number, number, number];
}

export function ThirdPersonCamera({
  minDistance = 2,
  maxDistance = 20,
  minPolarAngle = 0.2,
  maxPolarAngle = Math.PI / 2.1,
  rotationSpeed = 0.005,
  zoomSpeed = 1,
  smoothness = 0.1,
  offset = [0, 1.5, 0]
}: ThirdPersonCameraProps) {
  const { camera, gl } = useThree();
  const playerPosition = useGameStore((state) => state.player.position);

  const spherical = useRef(new Spherical(8, Math.PI / 3, 0));
  const targetPosition = useRef(new Vector3());
  const currentLookAt = useRef(new Vector3());
  const isMouseDown = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = gl.domElement;

    const handleMouseDown = (e: MouseEvent) => {
      // Right mouse button or left mouse button
      if (e.button === 0 || e.button === 2) {
        isMouseDown.current = true;
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
      }
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
      canvas.style.cursor = 'default';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDown.current) return;

      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      // Update spherical coordinates (horizontal rotation)
      spherical.current.theta -= deltaX * rotationSpeed;

      // Update spherical coordinates (vertical rotation) - inverted for natural feel
      spherical.current.phi -= deltaY * rotationSpeed;
      spherical.current.phi = MathUtils.clamp(
        spherical.current.phi,
        minPolarAngle,
        maxPolarAngle
      );

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.current.radius += e.deltaY * 0.01 * zoomSpeed;
      spherical.current.radius = MathUtils.clamp(
        spherical.current.radius,
        minDistance,
        maxDistance
      );
    };

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl, minDistance, maxDistance, minPolarAngle, maxPolarAngle, rotationSpeed, zoomSpeed]);

  useFrame(() => {
    // Target position is player position + offset
    const target = new Vector3(
      playerPosition[0] + offset[0],
      playerPosition[1] + offset[1],
      playerPosition[2] + offset[2]
    );

    // Smoothly interpolate target position
    currentLookAt.current.lerp(target, smoothness);

    // Calculate camera position from spherical coordinates
    const cameraOffset = new Vector3();
    cameraOffset.setFromSpherical(spherical.current);
    targetPosition.current.copy(currentLookAt.current).add(cameraOffset);

    // Smoothly move camera
    camera.position.lerp(targetPosition.current, smoothness);

    // Look at player
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
