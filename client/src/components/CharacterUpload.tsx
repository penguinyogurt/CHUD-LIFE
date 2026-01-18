import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import { useGameStore } from '../stores/gameStore';
import * as THREE from 'three';

// Animated background grid
function BackgroundGrid() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      opacity: 0.15,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute',
        inset: '-50%',
        backgroundImage: `
          linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        transform: 'perspective(500px) rotateX(60deg)',
        animation: 'gridScroll 20s linear infinite',
      }} />
    </div>
  );
}

// Scan lines overlay
function ScanLines() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: `repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.15) 2px,
        rgba(0, 0, 0, 0.15) 4px
      )`,
      pointerEvents: 'none',
      zIndex: 100,
    }} />
  );
}

// Glitch text component
function GlitchTitle() {
  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
    }}>
      <h1 style={{
        fontSize: 'clamp(4rem, 12vw, 10rem)',
        fontFamily: "'Bebas Neue', 'Impact', sans-serif",
        fontWeight: 400,
        color: '#ffffff',
        margin: 0,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight: 0.9,
        textShadow: `
          0 0 20px rgba(34, 197, 94, 0.8),
          0 0 40px rgba(34, 197, 94, 0.4),
          0 0 80px rgba(34, 197, 94, 0.2)
        `,
        animation: 'textFlicker 4s infinite',
      }}>
        Chud
        <span style={{
          display: 'block',
          color: '#22c55e',
          textShadow: `
            0 0 20px rgba(34, 197, 94, 1),
            0 0 40px rgba(34, 197, 94, 0.8),
            0 0 80px rgba(34, 197, 94, 0.4),
            4px 4px 0 #000
          `,
        }}>Life</span>
      </h1>
      {/* Glitch layers */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        fontSize: 'clamp(4rem, 12vw, 10rem)',
        fontFamily: "'Bebas Neue', 'Impact', sans-serif",
        fontWeight: 400,
        color: '#00ffff',
        margin: 0,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight: 0.9,
        clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
        transform: 'translate(-3px, 0)',
        opacity: 0,
        animation: 'glitch1 3s infinite',
        pointerEvents: 'none',
      }}>
        Chud<span style={{ display: 'block' }}>Life</span>
      </div>
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        fontSize: 'clamp(4rem, 12vw, 10rem)',
        fontFamily: "'Bebas Neue', 'Impact', sans-serif",
        fontWeight: 400,
        color: '#00ff88',
        margin: 0,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight: 0.9,
        clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)',
        transform: 'translate(3px, 0)',
        opacity: 0,
        animation: 'glitch2 3s infinite',
        pointerEvents: 'none',
      }}>
        Chud<span style={{ display: 'block' }}>Life</span>
      </div>
    </div>
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
          mat.emissive = new THREE.Color(0x003322);
          mat.emissiveIntensity = 0.15;
        }
      }
    });
  }, [scene]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.2, 0]} scale={2.6}>
      <primitive object={scene} />
    </group>
  );
}

// Enhanced floating particles
function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 80;

  const positions = useRef(new Float32Array(count * 3));
  const velocities = useRef(new Float32Array(count));

  useEffect(() => {
    for (let i = 0; i < count; i++) {
      positions.current[i * 3] = (Math.random() - 0.5) * 8;
      positions.current[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions.current[i * 3 + 2] = (Math.random() - 0.5) * 8;
      velocities.current[i] = Math.random() * 0.5 + 0.5;
    }
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        posArray[i * 3 + 1] += Math.sin(state.clock.elapsedTime * velocities.current[i] + i) * 0.003;
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
        size={0.04}
        color="#22c55e"
        transparent
        opacity={0.6}
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
    <div style={{
      width: '100%',
      maxWidth: '480px',
      height: '400px',
      borderRadius: '4px',
      overflow: 'hidden',
      background: 'rgba(0, 0, 0, 0.9)',
      border: '1px solid rgba(34, 197, 94, 0.4)',
      boxShadow: '0 0 40px rgba(34, 197, 94, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.5)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '12px 16px',
        background: 'rgba(34, 197, 94, 0.1)',
        borderBottom: '1px solid rgba(34, 197, 94, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', opacity: 0.5 }} />
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#22c55e', opacity: 0.3 }} />
        </div>
        <span style={{
          fontSize: '11px',
          color: '#22c55e',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>CHUD_GENESIS.exe</span>
      </div>
      <div ref={terminalRef} style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: '13px',
        lineHeight: 1.7,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
            <span style={{ color: '#22c55e' }}>▸</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{msg}</span>
          </div>
        ))}
        <div style={{ color: '#22c55e', animation: 'blink 1s step-end infinite' }}>█</div>
      </div>
    </div>
  );
}

// Animated upload zone
function UploadZone({
  preview,
  isHovering,
  onHover,
  onClick
}: {
  preview: string | null;
  isHovering: boolean;
  onHover: (hovering: boolean) => void;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      role="button"
      tabIndex={0}
      style={{
        width: '100%',
        maxWidth: '320px',
        aspectRatio: '3/4',
        borderRadius: '4px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        background: 'rgba(0, 0, 0, 0.6)',
        border: isHovering
          ? '2px solid rgba(34, 197, 94, 0.8)'
          : '2px dashed rgba(34, 197, 94, 0.3)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isHovering
          ? '0 0 60px rgba(34, 197, 94, 0.3), inset 0 0 60px rgba(34, 197, 94, 0.1)'
          : 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Corner accents */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '30px',
        height: '30px',
        borderTop: '3px solid #22c55e',
        borderLeft: '3px solid #22c55e',
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '30px',
        height: '30px',
        borderTop: '3px solid #22c55e',
        borderRight: '3px solid #22c55e',
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '30px',
        height: '30px',
        borderBottom: '3px solid #22c55e',
        borderLeft: '3px solid #22c55e',
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: '30px',
        height: '30px',
        borderBottom: '3px solid #22c55e',
        borderRight: '3px solid #22c55e',
      }} />

      {preview ? (
        <>
          <img
            src={preview}
            alt="Preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '20px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
            textAlign: 'center',
          }}>
            <span style={{
              fontSize: '11px',
              color: '#22c55e',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}>TARGET ACQUIRED</span>
          </div>
        </>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          padding: '40px',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            border: '2px solid rgba(34, 197, 94, 0.5)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            transform: isHovering ? 'scale(1.1)' : 'scale(1)',
          }}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="1.5"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '12px',
              color: '#22c55e',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>Upload Target</div>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.4)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>Drop image or click</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CharacterUpload() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cliMessages, setCliMessages] = useState<string[]>([]);
  const [buttonHover, setButtonHover] = useState(false);

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      background: '#000000',
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: 'hidden',
      position: 'relative',
    }}
    onDrop={handleDrop}
    onDragOver={(e) => {
      e.preventDefault();
      setIsHovering(true);
    }}
    onDragLeave={() => setIsHovering(false)}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');

        @keyframes blink {
          50% { opacity: 0; }
        }

        @keyframes gridScroll {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(60px); }
        }

        @keyframes textFlicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.8; }
          94% { opacity: 1; }
          96% { opacity: 0.9; }
          97% { opacity: 1; }
        }

        @keyframes glitch1 {
          0%, 100% { opacity: 0; transform: translate(-3px, 0); }
          7% { opacity: 0.8; transform: translate(3px, 0); }
          10% { opacity: 0; transform: translate(-3px, 0); }
          27% { opacity: 0; }
          30% { opacity: 0.6; transform: translate(-5px, 0); }
          35% { opacity: 0; }
        }

        @keyframes glitch2 {
          0%, 100% { opacity: 0; transform: translate(3px, 0); }
          17% { opacity: 0.7; transform: translate(-3px, 0); }
          20% { opacity: 0; }
          47% { opacity: 0; }
          50% { opacity: 0.5; transform: translate(5px, 0); }
          55% { opacity: 0; }
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2); }
          50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.6), 0 0 60px rgba(34, 197, 94, 0.3); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <BackgroundGrid />
      <ScanLines />

      {/* Vignette overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.7) 100%)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Red glow accent */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '60%',
        height: '60%',
        background: 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.15) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        position: 'relative',
        zIndex: 10,
        padding: '40px',
      }}>
        {/* Left side - Title and info */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingRight: '40px',
          animation: 'slideUp 0.8s ease-out',
        }}>
          <GlitchTitle />

          <p style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.05em',
            lineHeight: 1.8,
            maxWidth: '400px',
            marginTop: '40px',
            marginBottom: '40px',
          }}>
            Upload your photo. Become the fighter.<br/>
            AI-generated combat avatars for the arena.
          </p>

          {/* Status indicators */}
          <div style={{
            display: 'flex',
            gap: '30px',
            marginTop: '20px',
          }}>
            {[
              { label: 'PIPELINE', status: 'READY' },
              { label: 'ARENA', status: 'ONLINE' },
              { label: 'SYSTEM', status: 'ACTIVE' },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}>
                <span style={{
                  fontSize: '10px',
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.15em',
                }}>{item.label}</span>
                <span style={{
                  fontSize: '11px',
                  color: '#22c55e',
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.1em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 10px #22c55e',
                    animation: 'blink 2s infinite',
                  }} />
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Center - 3D Preview */}
        <div style={{
          width: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          animation: 'slideUp 0.8s ease-out 0.2s both',
        }}>
          {/* Hexagonal frame effect */}
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '50%',
            animation: 'pulse 3s infinite',
          }} />

          <div style={{
            width: '100%',
            height: '450px',
            position: 'relative',
          }}>
            <Canvas
              camera={{ position: [0, 0, 4], fov: 50 }}
              style={{ background: 'transparent' }}
            >
              <ambientLight intensity={0.3} />
              <directionalLight position={[5, 5, 5]} intensity={0.6} color="#ffffff" />
              <directionalLight position={[-3, 3, -3]} intensity={0.3} color="#22c55e" />
              <spotLight
                position={[0, 6, 0]}
                intensity={0.8}
                angle={0.4}
                penumbra={1}
                color="#22c55e"
              />
              <pointLight position={[0, -2, 2]} intensity={0.3} color="#22c55e" />
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

          {/* Platform line */}
          <div style={{
            width: '200px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
            marginTop: '-40px',
          }} />
        </div>

        {/* Right side - Upload zone */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: '40px',
          animation: 'slideUp 0.8s ease-out 0.4s both',
        }}>
          {!isGenerating ? (
            <>
              <UploadZone
                preview={preview}
                isHovering={isHovering}
                onHover={setIsHovering}
                onClick={() => document.getElementById('fileInput')?.click()}
              />
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </>
          ) : (
            <CLITerminal messages={cliMessages} />
          )}

          {error && (
            <div style={{
              color: '#22c55e',
              marginTop: '20px',
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              textAlign: 'center',
              padding: '12px 20px',
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '4px',
            }}>{error}</div>
          )}

          {/* Generate button */}
          <button
            onClick={handleLoad}
            disabled={!image || isGenerating}
            onMouseEnter={() => setButtonHover(true)}
            onMouseLeave={() => setButtonHover(false)}
            style={{
              marginTop: '40px',
              padding: '18px 60px',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: (!image || isGenerating) ? 'rgba(255, 255, 255, 0.3)' : '#000000',
              background: (!image || isGenerating)
                ? 'transparent'
                : buttonHover
                  ? '#ffffff'
                  : '#22c55e',
              border: (!image || isGenerating)
                ? '1px solid rgba(255, 255, 255, 0.2)'
                : buttonHover
                  ? '1px solid #ffffff'
                  : '1px solid #22c55e',
              borderRadius: '0',
              cursor: (!image || isGenerating) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: (!image || isGenerating)
                ? 'none'
                : buttonHover
                  ? '0 0 40px rgba(255, 255, 255, 0.4)'
                  : '0 0 30px rgba(34, 197, 94, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            Initialize
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: '20px 40px',
        borderTop: '1px solid rgba(34, 197, 94, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
      }}>
        <span style={{
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.3)',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.1em',
        }}>
          CHUDLIFE v1.0 // COMBAT ARENA
        </span>
        <span style={{
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.3)',
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: '0.1em',
        }}>
          POWERED BY AI GENESIS
        </span>
      </div>
    </div>
  );
}
