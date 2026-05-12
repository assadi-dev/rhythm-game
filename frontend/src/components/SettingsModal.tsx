import { useEffect, useState } from 'react';
import { getSettings, saveSettings, displayCode, type GameSettings } from '@/store/settings';

const LANE_NAMES = ['Lane 1 (gauche)', 'Lane 2', 'Lane 3', 'Lane 4 (droite)'];
type LaneKey = 'lane0' | 'lane1' | 'lane2' | 'lane3';
const LANE_KEYS: LaneKey[] = ['lane0', 'lane1', 'lane2', 'lane3'];
const RESERVED = new Set(['Escape']); // touches réservées (non remappables)

type Props = {
  onClose: () => void;
  onSave:  (s: GameSettings) => void;
};

export function SettingsModal({ onClose, onSave }: Props) {
  const [draft,      setDraft]      = useState<GameSettings>(getSettings);
  const [remapping,  setRemapping]  = useState<LaneKey | null>(null);
  const [conflict,   setConflict]   = useState('');

  // Capture les touches pour le remapping — phase capture pour passer avant tout
  useEffect(() => {
    if (!remapping) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      if (RESERVED.has(e.code)) { setRemapping(null); return; }

      // Vérif doublon sur les autres lanes
      const dup = LANE_KEYS.find(k => k !== remapping && draft.keys[k] === e.code);
      if (dup) {
        setConflict(`"${displayCode(e.code)}" déjà utilisé pour la lane ${LANE_KEYS.indexOf(dup) + 1}`);
        setRemapping(null);
        return;
      }
      setConflict('');
      setDraft(prev => ({ ...prev, keys: { ...prev.keys, [remapping]: e.code } }));
      setRemapping(null);
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [remapping, draft.keys]);

  function handleSave() {
    saveSettings(draft);
    onSave(draft);
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-40 bg-vapor-bg/92">
      <div className="w-full max-w-sm px-8 py-10 border border-vapor-purple/40 bg-vapor-bg-mid/60">
        <p className="font-jp text-vapor-purple/60 mb-2 text-center text-lg tracking-widest">設定</p>
        <h2 className="font-display text-vapor-cyan mb-8 text-center text-4xl tracking-widest">
          PARAMÈTRES
        </h2>

        {/* ── Volume ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="font-body text-vapor-white/60 text-xs tracking-widest">VOLUME</span>
            <span className="font-display text-vapor-yellow text-xl">
              {Math.round(draft.volume * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0" max="1" step="0.05"
            value={draft.volume}
            onChange={e => setDraft(prev => ({ ...prev, volume: Number(e.target.value) }))}
            className="w-full accent-[#ff71ce] cursor-pointer"
          />
        </div>

        {/* ── Touches ────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="font-body text-vapor-white/40 mb-3 text-xs tracking-widest">TOUCHES</p>
          <div className="flex flex-col gap-2">
            {LANE_KEYS.map((lk, i) => {
              const isRemapping = remapping === lk;
              return (
                <div key={lk} className="flex items-center justify-between gap-3">
                  <span className="font-body text-vapor-white/50 text-xs w-36">
                    {LANE_NAMES[i]}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setConflict(''); setRemapping(lk); }}
                    className={`
                      font-display border px-4 py-1 text-xl tracking-widest min-w-[3.5rem] text-center
                      transition-all duration-150
                      ${isRemapping
                        ? 'border-vapor-yellow text-vapor-yellow animate-pulse-slow'
                        : 'border-vapor-purple/60 text-vapor-purple hover:border-vapor-purple hover:text-vapor-white'}
                    `}
                  >
                    {isRemapping ? '...' : displayCode(draft.keys[lk])}
                  </button>
                </div>
              );
            })}
          </div>
          {remapping && (
            <p className="font-body text-vapor-yellow/70 mt-3 text-center text-xs tracking-widest">
              Appuie sur une touche… (ESC pour annuler)
            </p>
          )}
          {conflict && (
            <p className="font-body text-vapor-pink mt-2 text-center text-xs">{conflict}</p>
          )}
        </div>

        {/* ── Boutons ────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="
              flex-1 font-display border-vapor-white/20 text-vapor-white/40
              hover:border-vapor-white/50 hover:text-vapor-white/70
              border py-2 text-lg tracking-widest transition-all duration-150
            "
          >
            ANNULER
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="
              flex-1 font-display border-vapor-cyan text-vapor-cyan
              hover:bg-vapor-cyan hover:text-vapor-bg
              border-2 py-2 text-lg tracking-widest
              transition-all duration-150 hover:scale-105 active:scale-95
            "
          >
            SAUVEGARDER
          </button>
        </div>
      </div>
    </div>
  );
}
