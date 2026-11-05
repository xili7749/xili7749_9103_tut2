// Three fixed, original note sequences provide a self-contained music demo.
// ChatGPT/Codex assisted with generating, modifying and refining this code.
// Set a track's src to a local audio file to replace its synthesised melody.
// Audio reference: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
class MusicPlayer {
  constructor() {
    this.tracks = [
      { name: 'Wool and Willow', bpm: 94, src: null, notes: [60,64,67,72,67,64,62,67,64,60,55,60,64,67,62,60] },
      { name: 'Paper Moon', bpm: 76, src: null, notes: [69,72,76,72,67,71,74,71,65,69,72,69,64,67,71,67] },
      { name: 'Little Footsteps', bpm: 112, src: null, notes: [62,66,69,66,74,69,66,62,64,67,71,67,69,66,64,62] }
    ];
    this.track = 0; this.playing = false; this.starting = false;
    this.context = null; this.nodes = new Set(); this.audio = null;
    this.note = 0; this.nextNote = 0; this.generation = 0; this.rotation = 0;
  }
  async play() {
    if (this.playing || this.starting) return;
    this.starting = true;
    const generation = ++this.generation;
    try {
      const track = this.tracks[this.track];
      if (track.src) {
        const audio = new Audio(track.src);
        this.audio = audio; audio.loop = true; audio.volume = 0.35;
        audio.addEventListener('error', () => { if (this.audio === audio) this.pause(); });
        await audio.play();
      } else {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) throw new Error('Web Audio is not available in this browser.');
        if (!this.context) this.context = new AudioContextClass();
        await this.context.resume();
        if (this.context.state !== 'running') throw new Error('Audio must be started with a user interaction.');
        this.nextNote = this.context.currentTime; this.note = 0;
      }
      if (generation === this.generation) this.playing = true;
    } catch (error) {
      console.warn('Music could not start:', error.message);
      if (generation === this.generation) this.pause();
    } finally { if (generation === this.generation) this.starting = false; }
  }
  pause() {
    this.generation++; this.starting = false; this.playing = false;
    if (this.audio) { this.audio.pause(); this.audio = null; }
    for (const oscillator of this.nodes) {
      try { oscillator.stop(); } catch (_) { /* Already stopped notes need no action. */ }
    }
    this.nodes.clear();
  }
  toggle() { if (this.playing || this.starting) this.pause(); else this.play(); }
  change(direction) {
    const resume = this.playing || this.starting;
    this.pause(); this.track = (this.track + direction + this.tracks.length) % this.tracks.length;
    if (resume) this.play();
  }
  update(dt) {
    if (!this.playing) return;
    this.rotation += dt * 2.5;
    if (this.audio) return;
    if (this.context.state !== 'running') { this.pause(); return; }
    const now = this.context.currentTime, track = this.tracks[this.track];
    if (this.nextNote < now - 0.2) this.nextNote = now;
    while (this.nextNote < now + 0.15) {
      const midi = track.notes[this.note % track.notes.length];
      this.scheduleNote(midi, this.nextNote, 60 / track.bpm * 0.8);
      if (this.note % 4 === 0) this.scheduleNote(midi - 12, this.nextNote, 60 / track.bpm * 1.5, 0.025);
      this.note++; this.nextNote += 60 / track.bpm * 0.5;
    }
  }
  scheduleNote(midi, at, duration, volume = 0.045) {
    const oscillator = this.context.createOscillator(), gain = this.context.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain); gain.connect(this.context.destination);
    this.nodes.add(oscillator);
    oscillator.onended = () => { this.nodes.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(at); oscillator.stop(at + duration + 0.03);
  }
}
