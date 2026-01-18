import { useState, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflow: 'auto'
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: '10px',
    textShadow: '0 0 20px rgba(233, 69, 96, 0.5)'
  },
  subtitle: {
    fontSize: '1.2rem',
    color: '#a0a0a0',
    marginBottom: '40px'
  },
  form: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '500px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  dropzone: {
    border: '2px dashed #e94560',
    borderRadius: '15px',
    padding: '40px 20px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '20px',
    background: 'rgba(233, 69, 96, 0.05)'
  },
  dropzoneActive: {
    background: 'rgba(233, 69, 96, 0.15)',
    borderColor: '#ff6b6b'
  },
  preview: {
    maxWidth: '200px',
    maxHeight: '200px',
    borderRadius: '10px',
    marginBottom: '10px'
  },
  label: {
    display: 'block',
    color: '#ffffff',
    marginBottom: '10px',
    fontSize: '1rem'
  },
  input: {
    width: '100%',
    padding: '15px',
    borderRadius: '10px',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '1rem',
    marginBottom: '20px',
    outline: 'none'
  },
  button: {
    width: '100%',
    padding: '18px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(90deg, #e94560 0%, #ff6b6b 100%)',
    color: '#ffffff',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  error: {
    color: '#ff6b6b',
    marginTop: '15px',
    textAlign: 'center' as const
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
  },
  spinner: {
    width: '60px',
    height: '60px',
    border: '4px solid rgba(233, 69, 96, 0.2)',
    borderTopColor: '#e94560',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    color: '#ffffff',
    fontSize: '1.2rem'
  }
};

export function CharacterUpload() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const {
    isLoading,
    loadingMessage,
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
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError('Please select an image');
      return;
    }

    setLoading(true, 'Starting character generation...');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', image);




      const response = await fetch('/api/character/create', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || data.status === 'failed') {
        throw new Error(data.error || 'Failed to generate character');
      }

      setCharacterModelUrl(data.riggedModelUrl);
      if (data.animations) {
        setAnimations(data.animations);
      }

      setLoading(false);
      setPhase('playing');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={styles.spinner} />
          <div style={styles.loadingText}>{loadingMessage}</div>
          <div style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>
            This may take a few minutes...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>CHUDLIFE</h1>
      <p style={styles.subtitle}>Create your custom AI fighter</p>

      <form style={styles.form} onSubmit={handleSubmit}>
        <div
          style={{ ...styles.dropzone, ...(isDragging ? styles.dropzoneActive : {}) }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('fileInput')?.click()}
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
            <img src={preview} alt="Preview" style={styles.preview} />
          ) : (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📷</div>
              <div style={{ color: '#ffffff' }}>Drop your photo here or click to upload</div>
              <div style={{ color: '#a0a0a0', fontSize: '0.9rem', marginTop: '5px' }}>
                PNG, JPG up to 10MB
              </div>
            </>
          )}
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </div>



        <button
          type="submit"
          style={{ ...styles.button, ...(isLoading || !image ? styles.buttonDisabled : {}) }}
          disabled={isLoading || !image}
        >
          Generate Character
        </button>

        {error && <div style={styles.error}>{error}</div>}
      </form>
    </div>
  );
}
