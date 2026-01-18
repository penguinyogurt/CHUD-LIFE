import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useEffect } from 'react';
import { Mesh, Object3D } from 'three';

export function Forest() {
  const { scene } = useGLTF('/low_poly_forest_1.glb');

  useEffect(() => {
    scene.traverse((child: Object3D) => {
      if ((child as Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive object={scene} scale={1} position={[0, 0, 0]} />
    </RigidBody>
  );
}

export function ForestLights() {
  return (
    <>
      <ambientLight intensity={0.4} color="#b4e7ce" />
      <directionalLight
        position={[50, 80, 30]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={150}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        color="#fff5e6"
      />
      <hemisphereLight args={['#87ceeb', '#228b22', 0.6]} />
    </>
  );
}

// Preload the model
useGLTF.preload('/low_poly_forest_1.glb');
