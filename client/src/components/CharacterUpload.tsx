import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import { useGameStore } from '../stores/gameStore';
import * as THREE from 'three';

// Cursor glow effect component
function CursorGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: '400px',
        height: '400px',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
    />
  );
}

// Rotating Mannequin Component
function RotatingMannequin() {
  const { scene } = useGLTF('/mannequin.glb');
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.emissive = new THREE.Color(0x222233);
          mat.emissiveIntensity = 0.1;
        }
      }
    });
  }, [scene]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.3, 0]} scale={2.8}>
      <primitive object={scene} />
    </group>
  );
}

// Floating particles effect
function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 50;

  const positions = useRef(new Float32Array(count * 3));

  useEffect(() => {
    for (let i = 0; i < count; i++) {
      positions.current[i * 3] = (Math.random() - 0.5) * 6;
      positions.current[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions.current[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
  }, []);

  useFrame((_, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.05;
      const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        posArray[i * 3 + 1] += Math.sin(Date.now() * 0.001 + i) * 0.002;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ffffff"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// CLI Terminal component for SSE streaming
function CLITerminal({ messages }: { messages: string[] }) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={styles.terminal}>
      <div style={styles.terminalHeader}>
        <div style={styles.terminalDots}>
          <span style={{ ...styles.dot, background: '#ff5f56' }} />
          <span style={{ ...styles.dot, background: '#ffbd2e' }} />
          <span style={{ ...styles.dot, background: '#27c93f' }} />
        </div>
        <span style={styles.terminalTitle}>chudlife-generator</span>
      </div>
      <div ref={terminalRef} style={styles.terminalBody}>
        {messages.map((msg, i) => (
          <div key={i} style={styles.terminalLine}>
            <span style={styles.terminalPrompt}>{'>'}</span>
            <span style={styles.terminalText}>{msg}</span>
          </div>
        ))}
        <div style={styles.terminalCursor}>_</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#000000',
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    padding: '20px 40px',
    flexShrink: 0,
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#ffffff',
    margin: 0,
    letterSpacing: '0.1em',
  },
  main: {
    flex: 1,
    display: 'flex',
    padding: '0 40px 30px',
    gap: '30px',
    minHeight: 0,
  },
  leftPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  uploadBox: {
    width: '100%',
    maxWidth: '320px',
    height: 'min(60vh, 420px)',
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBoxHover: {
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 0 40px rgba(255, 255, 255, 0.1)',
  },
  uploadContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  uploadIcon: {
    fontSize: '40px',
    opacity: 0.6,
  },
  uploadText: {
    fontSize: '13px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.15em',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  canvasContainer: {
    width: '100%',
    maxWidth: '400px',
    height: 'min(55vh, 380px)',
    position: 'relative',
  },
  mannequinGlow: {
    position: 'absolute',
    top: '-20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '180px',
    height: '180px',
    background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  loadButton: {
    marginTop: '20px',
    padding: '14px 40px',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: "'Inter', -apple-system, sans-serif",
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#000000',
    background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 4px 20px rgba(255, 255, 255, 0.2)',
  },
  loadButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTop: '6px solid transparent',
    borderBottom: '6px solid transparent',
    borderLeft: '10px solid #000000',
  },
  terminal: {
    width: '100%',
    maxWidth: '320px',
    height: 'min(60vh, 420px)',
    borderRadius: '12px',
    overflow: 'hidden',
    background: '#1a1a1a',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  terminalHeader: {
    padding: '10px 14px',
    background: '#2a2a2a',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  terminalDots: {
    display: 'flex',
    gap: '5px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  terminalTitle: {
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  terminalBody: {
    flex: 1,
    padding: '14px',
    overflowY: 'auto' as const,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: '12px',
    lineHeight: 1.5,
  },
  terminalLine: {
    display: 'flex',
    gap: '8px',
    marginBottom: '3px',
  },
  terminalPrompt: {
    color: '#27c93f',
  },
  terminalText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  terminalCursor: {
    color: '#27c93f',
    animation: 'blink 1s step-end infinite',
  },
  error: {
    color: '#ff5f56',
    marginTop: '12px',
    fontSize: '13px',
    textAlign: 'center' as const,
  },
};

export function CharacterUpload() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cliMessages, setCliMessages] = useState<string[]>([]);

  const {
    error,
    setLoading,
    setError,
    setCharacterModelUrl,
    setAnimations,
    setPhase
  } = useGameStore();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }
    setImage(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, [setError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleLoad = async () => {
    if (!image) {
      setError('Please select an image first');
      return;
    }

    setIsGenerating(true);
    setCliMessages(['Initializing character generation pipeline...']);
    setLoading(true, 'Starting character generation...');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch('/api/character/create-stream', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        if (response.status === 404) {
          setCliMessages(prev => [...prev, 'Using standard generation endpoint...']);

          const fallbackResponse = await fetch('/api/character/create', {
            method: 'POST',
            body: formData
          });

          const data = await fallbackResponse.json();

          if (!fallbackResponse.ok || data.status === 'failed') {
            throw new Error(data.error || 'Failed to generate character');
          }

          setCliMessages(prev => [...prev, 'Character generation complete!']);
          setCharacterModelUrl(data.riggedModelUrl);
          if (data.animations) {
            setAnimations(data.animations);
          }
          setLoading(false);
          setPhase('playing');
          return;
        }
        throw new Error('Failed to start generation');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.message) {
                setCliMessages(prev => [...prev, data.message]);
              }

              if (data.status === 'complete') {
                setCharacterModelUrl(data.riggedModelUrl);
                if (data.animations) {
                  setAnimations(data.animations);
                }
                setCliMessages(prev => [...prev, 'Generation complete! Loading game...']);
                setLoading(false);
                setTimeout(() => setPhase('playing'), 1000);
                return;
              }

              if (data.status === 'error') {
                throw new Error(data.error || 'Generation failed');
              }
            } catch {
              // Ignore parse errors for incomplete JSON
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setCliMessages(prev => [...prev, `ERROR: ${errorMessage}`]);
      setError(errorMessage);
      setLoading(false);
      setIsGenerating(false);
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      <CursorGlow />

      <header style={styles.header}>
        <h1 style={styles.title}>Chud Life</h1>
      </header>

      <main style={styles.main}>
        {/* Left Panel - Upload or CLI */}
        <div style={styles.leftPanel}>
          {!isGenerating ? (
            <div
              style={{
                ...styles.uploadBox,
                ...(isHovering ? styles.uploadBoxHover : {}),
              }}
              onClick={() => document.getElementById('fileInput')?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsHovering(true);
              }}
              onDragLeave={() => setIsHovering(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  document.getElementById('fileInput')?.click();
                }
              }}
              role="button"
              tabIndex={0}
            >
              {preview ? (
                <img src={preview} alt="Preview" style={styles.previewImage} />
              ) : (
                <div style={styles.uploadContent}>
                  <div style={styles.uploadIcon}>+</div>
                  <div style={styles.uploadText}>Upload Photo</div>
                </div>
              )}
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <CLITerminal messages={cliMessages} />
          )}
          {error && <div style={styles.error}>{error}</div>}
        </div>

        {/* Right Panel - Mannequin */}
        <div style={styles.rightPanel}>
          <div style={styles.mannequinGlow} />
          <div style={styles.canvasContainer}>
            <Canvas
              camera={{ position: [0, 0, 4.5], fov: 50 }}
              style={{ background: 'transparent' }}
            >
              <ambientLight intensity={0.4} />
              <directionalLight position={[5, 5, 5]} intensity={0.8} />
              <directionalLight position={[-5, 3, -5]} intensity={0.3} />
              <spotLight
                position={[0, 5, 0]}
                intensity={0.5}
                angle={0.5}
                penumbra={1}
                color="#ffffff"
              />
              <Suspense fallback={null}>
                <RotatingMannequin />
                <FloatingParticles />
                <Environment preset="night" />
              </Suspense>
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate={false}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 1.8}
              />
            </Canvas>
          </div>

          <button
            style={{
              ...styles.loadButton,
              ...(!image || isGenerating ? styles.loadButtonDisabled : {}),
            }}
            onClick={handleLoad}
            disabled={!image || isGenerating}
            onMouseEnter={(e) => {
              if (image && !isGenerating) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 30px rgba(255, 255, 255, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 255, 255, 0.2)';
            }}
          >
            <span style={styles.playIcon} />
            Load
          </button>
        </div>
      </main>
    </div>
  );
}
