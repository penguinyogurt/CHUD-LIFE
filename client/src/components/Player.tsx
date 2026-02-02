import { useRef, useEffect, Suspense } from 'react';
import { RigidBody, CapsuleCollider, RapierRigidBody } from '@react-three/rapier';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { AnimationMixer, AnimationAction, LoopOnce, LoopRepeat, Object3D } from 'three';
import { useCharacterController } from '../hooks/useCharacterController';
import { useGameStore, AnimationState } from '../stores/gameStore';

interface PlayerProps {
  modelUrl: string;
  position?: [number, number, number];
}

const LOOP_ONCE_ANIMATIONS: AnimationState[] = ['attack', 'special', 'emote'];

function PlayerModel({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  const mixerRef = useRef<AnimationMixer | null>(null);
  const actionsRef = useRef<Map<string, AnimationAction>>(new Map());
  const currentActionRef = useRef<string>('idle');
  const animationState = useGameStore((state) => state.player.animationState);
  const setAnimationState = useGameStore((state) => state.setAnimationState);
  const animations = useGameStore((state) => state.animations);

  useEffect(() => {
    // Apply scale immediately to prevent blob flash on first render
    scene.scale.set(0.4, 0.4, 0.4);

    scene.traverse((child: Object3D) => {
      if ('isMesh' in child && child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  useEffect(() => {
    const mixer = new AnimationMixer(scene);
    mixerRef.current = mixer;

    const loadAnimations = async () => {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const loader = new GLTFLoader();

      const getProxiedUrl = (url: string) => 
        url.startsWith('http') ? `/api/character/model-proxy?url=${encodeURIComponent(url)}` : url;

      if (!animations) return;

      // Load idle first so character isn't stuck in T-pose
      const loadOrder = ['idle', ...Object.keys(animations).filter(k => k !== 'idle')];

      for (const name of loadOrder) {
        const url = animations[name as keyof typeof animations];
        if (!url) continue;
        try {
          const gltf = await loader.loadAsync(getProxiedUrl(url));
          if (gltf.animations.length > 0) {
            const clip = gltf.animations[0];
            clip.name = name;

            // Remove root position and scale tracks - different animations have incompatible values
            clip.tracks = clip.tracks.filter(track =>
              track.name !== 'Hips.position' && !track.name.endsWith('.scale')
            );

            // Cleanup track names - remove prefixes and fix bone name mismatches
            clip.tracks.forEach(track => {
              track.name = track.name.replace(/^(mixamorig|Armature|Scene)[:|]?/, '');
              if (track.name.includes('.')) {
                const parts = track.name.split('.');
                const prop = parts.pop();
                let bone = parts.join('.');
                if (bone === 'Neck') bone = 'neck';
                if (bone === 'Spine1') bone = 'Spine01';
                if (bone === 'Spine2') bone = 'Spine02';
                track.name = `${bone}.${prop}`;
              }
            });

            const action = mixer.clipAction(clip);

            if (LOOP_ONCE_ANIMATIONS.includes(name as AnimationState)) {
              action.setLoop(LoopOnce, 1);
              action.clampWhenFinished = true;
            } else {
              action.setLoop(LoopRepeat, Infinity);
            }

            actionsRef.current.set(name, action);

            // Start idle immediately so player isn't in T-pose while other anims load
            if (name === 'idle') {
              action.play();
              currentActionRef.current = 'idle';
            }
          }

          // Dispose of the loaded scene to free memory (we only need the animation clip)
          gltf.scene.traverse((child: Object3D) => {
            if ('geometry' in child && child.geometry) {
              (child.geometry as any).dispose();
            }
            if ('material' in child && child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach((mat: any) => {
                if (mat.map) mat.map.dispose();
                if (mat.normalMap) mat.normalMap.dispose();
                if (mat.roughnessMap) mat.roughnessMap.dispose();
                if (mat.metalnessMap) mat.metalnessMap.dispose();
                mat.dispose();
              });
            }
          });
        } catch (err) {
          console.warn(`Failed to load animation ${name}:`, err);
        }
      }

    };

    loadAnimations();

    return () => {
      mixer.stopAllAction();
    };
  }, [scene, animations]);

  useEffect(() => {
    if (!mixerRef.current) return;

    const newAction = actionsRef.current.get(animationState);
    if (!newAction) return;

    const prevAction = actionsRef.current.get(currentActionRef.current);

    if (currentActionRef.current === animationState) return;

    const clip = newAction.getClip();

    newAction.reset();
    newAction.setEffectiveWeight(1);

    // Slow down very short animations so they're visible
    const MIN_DURATION = 0.8;
    if (LOOP_ONCE_ANIMATIONS.includes(animationState) && clip.duration < MIN_DURATION) {
      newAction.setEffectiveTimeScale(clip.duration / MIN_DURATION);
    } else {
      newAction.setEffectiveTimeScale(1);
    }

    newAction.play();

    if (prevAction) {
      prevAction.crossFadeTo(newAction, 0.15, true);
    }

    currentActionRef.current = animationState;

    if (LOOP_ONCE_ANIMATIONS.includes(animationState)) {
      const onFinished = () => {
        const idleAction = actionsRef.current.get('idle');
        if (idleAction && currentActionRef.current !== 'idle') {
          idleAction.reset();
          idleAction.play();
          idleAction.crossFadeFrom(newAction, 0.15, true);
          currentActionRef.current = 'idle';
          setAnimationState('idle');
        }
        mixerRef.current?.removeEventListener('finished', onFinished);
      };
      mixerRef.current.addEventListener('finished', onFinished);
    }
  }, [animationState, setAnimationState]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  return <primitive object={scene} />;
}

function FallbackPlayer() {
  return (
    <mesh castShadow>
      <capsuleGeometry args={[0.15, 0.4, 4, 8]} />
      <meshStandardMaterial color="#e94560" />
    </mesh>
  );
}

export function Player({ modelUrl, position = [0, 2, 0] }: PlayerProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  useCharacterController(rigidBodyRef);

  const proxiedUrl = modelUrl.startsWith('http') 
    ? `/api/character/model-proxy?url=${encodeURIComponent(modelUrl)}`
    : modelUrl;

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      type="kinematicPosition"
      enabledRotations={[false, true, false]}
    >
      <CapsuleCollider args={[0.2, 0.15]} position={[0, 0.35, 0]} />
      <group position={[0, 0, 0]}>
        <Suspense fallback={<FallbackPlayer />}>
          <PlayerModel modelUrl={proxiedUrl} />
        </Suspense>
      </group>
    </RigidBody>
  );
}