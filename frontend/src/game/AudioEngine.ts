export class AudioEngine {
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private startTime = 0;
  private pausedContextTime = 0; // context.currentTime au moment du pause
  private _volume = 0.8;

  // ── Initialisation ──────────────────────────────────────────────────────────

  // Doit être appelé dans un user gesture — Safari iOS exige ça
  unlock(): void {
    if (!this.context) {
      this.context = new AudioContext();
      this.gainNode = this.context.createGain();
      this.gainNode.gain.value = this._volume;
      this.gainNode.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
  }

  // ── Volume ───────────────────────────────────────────────────────────────────

  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.gainNode) this.gainNode.gain.value = this._volume;
  }

  get volume(): number { return this._volume; }

  // ── Chargement réseau (sans AudioContext) ────────────────────────────────────

  async prefetch(url: string): Promise<ArrayBuffer | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.arrayBuffer();
    } catch {
      return null;
    }
  }

  async decodeAudioData(bytes: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.context) throw new Error('AudioEngine: call unlock() first');
    return this.context.decodeAudioData(bytes.slice(0));
  }

  // ── Lecture ──────────────────────────────────────────────────────────────────

  play(buffer: AudioBuffer, delaySeconds = 0): void {
    if (!this.context) throw new Error('AudioEngine: call unlock() first');
    this.sourceNode?.stop();
    this.sourceNode = this.context.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.connect(this.gainNode ?? this.context.destination);
    this.startTime = this.context.currentTime + delaySeconds;
    this.sourceNode.start(this.startTime);
  }

  playTone(frequency = 440, duration = 0.15): void {
    if (!this.context) throw new Error('AudioEngine: call unlock() first');
    const osc  = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.connect(gain);
    gain.connect(this.gainNode ?? this.context.destination);
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.3 * this._volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + duration);
  }

  markStart(): void {
    if (!this.context) throw new Error('AudioEngine: call unlock() first');
    this.startTime = this.context.currentTime;
  }

  // ── Pause / Reprise ─────────────────────────────────────────────────────────

  pauseAudio(): void {
    if (!this.context || this.pausedContextTime > 0) return;
    this.pausedContextTime = this.context.currentTime;
    void this.context.suspend();
  }

  resumeAudio(): void {
    if (!this.context) return;
    void this.context.resume().then(() => {
      if (this.pausedContextTime > 0) {
        // Compense le temps écoulé pendant la suspension (au cas où currentTime avance quand même)
        const elapsed = this.context!.currentTime - this.pausedContextTime;
        if (elapsed > 0.001) this.startTime += elapsed;
        this.pausedContextTime = 0;
      }
    });
  }

  // ── Getters ──────────────────────────────────────────────────────────────────

  get currentTime(): number {
    if (!this.context) return 0;
    return Math.max(0, this.context.currentTime - this.startTime);
  }

  get isUnlocked(): boolean {
    return this.context !== null && this.context.state !== 'suspended';
  }

  // ── Nettoyage ────────────────────────────────────────────────────────────────

  destroy(): void {
    this.sourceNode?.stop();
    void this.context?.close();
    this.context  = null;
    this.gainNode = null;
    this.sourceNode = null;
    this.pausedContextTime = 0;
  }
}
