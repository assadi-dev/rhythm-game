type Props = {
  onResume:   () => void;
  onSettings: () => void;
  onQuit:     () => void;
};

export function PauseMenu({ onResume, onSettings, onQuit }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-vapor-bg/85">
      <p className="font-jp text-vapor-cyan/60 mb-4 text-xl tracking-widest">ポーズ</p>
      <h2 className="font-display text-vapor-pink mb-12 text-7xl tracking-widest">PAUSE</h2>

      <div className="flex flex-col gap-4 w-56">
        <button
          type="button"
          onClick={onResume}
          className="
            font-display border-vapor-pink text-vapor-pink
            hover:bg-vapor-pink hover:text-vapor-bg
            border-2 py-3 text-2xl tracking-widest
            transition-all duration-150 hover:scale-105 active:scale-95
          "
        >
          ▶ REPRENDRE
        </button>

        <button
          type="button"
          onClick={onSettings}
          className="
            font-display border-vapor-cyan text-vapor-cyan
            hover:bg-vapor-cyan hover:text-vapor-bg
            border-2 py-3 text-2xl tracking-widest
            transition-all duration-150 hover:scale-105 active:scale-95
          "
        >
          ⚙ PARAMÈTRES
        </button>

        <button
          type="button"
          onClick={onQuit}
          className="
            font-display border-vapor-white/30 text-vapor-white/50
            hover:border-vapor-white hover:text-vapor-white
            border py-3 text-xl tracking-widest
            transition-all duration-150
          "
        >
          ◀ QUITTER
        </button>
      </div>

      <p className="font-body text-vapor-white/20 mt-12 text-xs tracking-widest">
        ESC — reprendre
      </p>
    </div>
  );
}
