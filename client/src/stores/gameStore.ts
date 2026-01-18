import { create } from 'zustand';

export type GamePhase = 'upload' | 'loading' | 'playing';
export type AnimationState = 'idle' | 'walking' | 'attack' | 'special' | 'emote';

interface PlayerState {
  health: number;
  maxHealth: number;
  position: [number, number, number];
  animationState: AnimationState;
}

interface BossState {
  health: number;
  maxHealth: number;
  isDead: boolean;
}

interface GameState {
  phase: GamePhase;
  characterModelUrl: string | null;
  animations: Record<AnimationState, string | undefined> | null;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  player: PlayerState;
  boss: BossState;

  setPhase: (phase: GamePhase) => void;
  setCharacterModelUrl: (url: string) => void;
  setAnimations: (animations: Record<string, string>) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  setPlayerHealth: (health: number) => void;
  setPlayerPosition: (position: [number, number, number]) => void;
  setAnimationState: (state: AnimationState) => void;
  takeDamage: (amount: number) => void;
  setBossHealth: (health: number) => void;
  setBossDead: (isDead: boolean) => void;
  reset: () => void;
}

const initialPlayerState: PlayerState = {
  health: 100,
  maxHealth: 100,
  position: [0, 0, 0],
  animationState: 'idle'
};

const initialBossState: BossState = {
  health: 100,
  maxHealth: 100,
  isDead: false
};

export const useGameStore = create<GameState>((set) => ({
  phase: 'upload',
  characterModelUrl: null,
  animations: null,
  isLoading: false,
  loadingMessage: '',
  error: null,
  player: initialPlayerState,
  boss: initialBossState,

  setPhase: (phase) => set({ phase }),
  setCharacterModelUrl: (url) => set({ characterModelUrl: url }),
  setAnimations: (animations) => set({ animations: animations as any }),
  setLoading: (isLoading, message = '') => set({ isLoading, loadingMessage: message }),
  setError: (error) => set({ error }),
  setPlayerHealth: (health) => set((state) => ({
    player: { ...state.player, health: Math.max(0, Math.min(health, state.player.maxHealth)) }
  })),
  setPlayerPosition: (position) => set((state) => ({
    player: { ...state.player, position }
  })),
  setAnimationState: (animationState) => set((state) => ({
    player: { ...state.player, animationState }
  })),
  takeDamage: (amount) => set((state) => ({
    player: { ...state.player, health: Math.max(0, state.player.health - amount) }
  })),
  setBossHealth: (health) => set((state) => ({
    boss: { ...state.boss, health: Math.max(0, Math.min(health, state.boss.maxHealth)) }
  })),
  setBossDead: (isDead) => set((state) => ({
    boss: { ...state.boss, isDead }
  })),
  reset: () => set({
    phase: 'upload',
    characterModelUrl: null,
    animations: null,
    isLoading: false,
    loadingMessage: '',
    error: null,
    player: initialPlayerState,
    boss: initialBossState
  })
}));