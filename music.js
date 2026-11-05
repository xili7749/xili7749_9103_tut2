// AI (ChatGPT/Codex) assisted with writing and modifying parts of this code.

// This object plays three fixed melodies using Web Audio oscillators.
// Playback also enables sheep movement; it does not analyse the music.
// Web Audio reference: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
window.MusicBox = {
  playing: false, track: 0, ctx: null, master: null, nodes: new Set(), nextAt: 0, step: 0,
  // Each melody stores a note sequence, bass notes and the time between notes.
  songs: [
    { name: 'Meadow Waltz', beat: .39, notes: [72, 76, 79, 76, 74, 71, 69, 72, 76, 72, 67, 69, 71, 74, 77, 74, 72, 67, 64, 67, 72, 76, 74, 71], bass: [48, 45, 53, 43] },
    { name: 'Paper Moon', beat: .51, notes: [69, 72, 76, 79, 76, 72, 71, 74, 77, 81, 77, 74, 67, 71, 74, 79, 74, 71, 69, 72, 76, 72, 71, 69], bass: [45, 50, 43, 45] },
    { name: 'The Wool & The Wind', beat: .32, notes: [74, 78, 81, 78, 76, 74, 71, 74, 78, 76, 74, 69, 67, 71, 74, 78, 76, 74, 73, 76, 79, 76, 74, 73], bass: [50, 47, 43, 45] }
  ],
  // Start audio after a user action, or stop it if it is already playing.
  async toggle() {
    if (this.playing) { this.stop(); return; }
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) throw new Error('Web Audio unavailable');
        this.ctx = new AudioCtx(); this.master = this.ctx.createGain(); this.master.gain.value = .32; this.master.connect(this.ctx.destination);
      }
      await this.ctx.resume();
      if (this.ctx.state !== 'running') throw new Error('AudioContext did not start');
      this.playing = true; this.nextAt = this.ctx.currentTime + .04; this.step = 0; this.label();
      Input.announce('正在播放：' + this.songs[this.track].name);
    } catch (e) { this.playing = false; this.label(); Input.announce('浏览器未能播放音乐，请再次点击播放。'); console.warn('Gramophone:', e.message); }
  },
  // Stop and release any sound nodes that are still active.
  stop() {
    this.playing = false;
    for (const node of this.nodes) { try { node.stop(); } catch (_) { /* The sound has already stopped. */ } }
    this.nodes.clear(); this.label();
  },
  // Select the next melody and keep the previous playback state.
  next() {
    const wasPlaying = this.playing; this.stop(); this.track = (this.track + 1) % this.songs.length;
    if (wasPlaying) this.toggle();
    Input.announce('曲目：' + this.songs[this.track].name);
    document.getElementById('track-button').title = this.songs[this.track].name;
  },
  label() { const el=document.getElementById('music-button');el.textContent=this.playing?'Ⅱ':'▷';el.setAttribute('aria-label',this.playing?'暂停音乐':'播放音乐'); },
  // Convert the MIDI note to frequency and fade its volume to avoid clicks.
  note(midi, at, duration, volume, type = 'sine') {
    const osc = this.ctx.createOscillator(), envelope = this.ctx.createGain();
    osc.type = type; osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    envelope.gain.setValueAtTime(0, at); envelope.gain.linearRampToValueAtTime(volume, at + .018);
    envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    osc.connect(envelope); envelope.connect(this.master); osc.start(at); osc.stop(at + duration + .02);
    this.nodes.add(osc); osc.onended = () => { osc.disconnect(); envelope.disconnect(); this.nodes.delete(osc); };
  },
  // Schedule notes slightly ahead of time to keep playback steady.
  update() {
    if (!this.playing || this.ctx.state !== 'running') return;
    const song = this.songs[this.track], now = this.ctx.currentTime;
    if (this.nextAt < now) this.nextAt = now + .02;
    while (this.nextAt < now + .12) {
      const note = song.notes[this.step % song.notes.length];
      this.note(note, this.nextAt, song.beat * 2.8, .17, 'triangle');
      this.note(note + 12, this.nextAt, song.beat * 1.8, .025);
      if (this.step % 3 === 0) this.note(song.bass[floor(this.step / 6) % song.bass.length], this.nextAt, song.beat * 3.8, .17);
      this.step++; this.nextAt += song.beat;
    }
  }
};
