export class AudioEngine {
  private context: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private startTime = 0;

  // Doit être appelé dans un user gesture (click/touchstart)
  // Safari iOS refuse de créer un AudioContext actif en dehors d'un event handler
  unlock(): void {
    if (!this.context) {
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
  }

  // Pré-charge les octets audio sans AudioContext (réseau pur, pas de user gesture requis)
  async prefetch(url: string): Promise<ArrayBuffer | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.arrayBuffer();
    } catch {
      return null;
    }
  }

  // Décode un ArrayBuffer pré-chargé en AudioBuffer (requiert AudioContext déverrouillé)
  async decodeAudioData(bytes: ArrayBuffer): Promise<AudioBuffer> {
    if (!this.context) throw new Error('AudioEngine: call unlock() first');
    return this.context.decodeAudioData(bytes.slice(0));
  }

  play(buffer: AudioBuffer, delaySeconds = 0): void {
    if (!this.context) throw new Error('AudioEngine: call unlock() first');
    this.sourceNode?.stop();
    this.sourceNode = this.context.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.connect(this.context.destination);
    this.startTime = this.context.currentTime + delaySeconds;
    this.sourceNode.start(this.startTime);
  }

  // Génère un bip court via OscillatorNode — fallback quand pas de fichier audio
  playTone(frequency = 440, duration = 0.15): void {
    if (!this.context) throw new Error('AudioEngine: call unlock() first');
    const osc  = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.3, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    osc.start(this.context.currentTime);
    osc.stop(this.context.currentTime + duration);
  }

  // Fallback : démarre le timer sans son (quand pas de fichier audio disponible)
  markStart(): void {
    if (!this.context) throw new Error('AudioEngine: call unlock() first');
    this.startTime = this.context.currentTime;
  }

  // Temps écoulé depuis le début du morceau — source de vérité pour le timing
  get currentTime(): number {
    if (!this.context) return 0;
    return Math.max(0, this.context.currentTime - this.startTime);
  }

  get isUnlocked(): boolean {
    return this.context !== null && this.context.state !== 'suspended';
  }

  destroy(): void {
    this.sourceNode?.stop();
    void this.context?.close();
    this.context = null;
    this.sourceNode = null;
  }
}
