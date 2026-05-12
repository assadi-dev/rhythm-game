export type KeyBinding = {
  lane0: string; // event.code, ex. 'ArrowLeft'
  lane1: string;
  lane2: string;
  lane3: string;
};

export type GameSettings = {
  volume: number;    // 0.0 – 1.0
  keys:   KeyBinding;
};

export const DEFAULTS: GameSettings = {
  volume: 0.8,
  keys: {
    lane0: 'ArrowLeft',
    lane1: 'ArrowDown',
    lane2: 'ArrowUp',
    lane3: 'ArrowRight',
  },
};

const STORAGE_KEY = 'neon-tempo-settings';

export function getSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const p = JSON.parse(raw) as Partial<GameSettings>;
    return {
      volume: p.volume ?? DEFAULTS.volume,
      keys:   { ...DEFAULTS.keys, ...p.keys },
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function saveSettings(s: GameSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// Conversion event.code → symbole lisible
const CODE_LABELS: Record<string, string> = {
  ArrowLeft: '←', ArrowDown: '↓', ArrowUp: '↑', ArrowRight: '→',
  Space: '⎵', Enter: '↵', Escape: 'ESC', Tab: '⇥',
  ShiftLeft: '⇧L', ShiftRight: '⇧R',
  ControlLeft: 'CTRL', AltLeft: 'ALT',
};

export function displayCode(code: string): string {
  if (CODE_LABELS[code]) return CODE_LABELS[code]!;
  if (code.startsWith('Key'))    return code.slice(3);
  if (code.startsWith('Digit'))  return code.slice(5);
  if (code.startsWith('Numpad')) return 'NP' + code.slice(6);
  return code;
}
