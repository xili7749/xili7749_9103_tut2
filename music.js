// AI (ChatGPT/Codex) assisted with writing and modifying parts of this code.

// Play the supplied recording and use playback as a switch for sheep movement.
// Audio source: the supplied file "bb im a sheep(2).m4a"; see README.md.
// Media API reference: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
window.MusicBox = {
  audio: null, playing: false, requested: false, requestId: 0,

  // Create one reusable audio element after the first playback action.
  init() {
    if (this.audio) return;
    this.audio = new Audio('sheep-music.m4a');
    this.audio.loop = true;
    this.audio.preload = 'metadata';
    this.audio.volume = .65;

    // Start the animation only when the recording actually begins playing.
    this.audio.addEventListener('playing', () => {
      if (!this.requested) { this.audio.pause(); return; }
      this.playing = true;
      this.label();
    });
    // Pause animation while the recording is paused or waiting for data.
    for (const event of ['pause', 'waiting', 'ended']) {
      this.audio.addEventListener(event, () => {
        // Ignore a queued pause event if playback has already resumed.
        if (event === 'pause' && !this.audio.paused) return;
        if (event === 'ended' && !this.audio.ended) return;
        this.playing = false;
        if (event !== 'waiting') this.requested = false;
        this.label();
      });
    }
    this.audio.addEventListener('error', () => this.fail());
  },

  // A second click can cancel playback even while the file is still loading.
  async toggle() {
    this.init();
    if (this.requested) { this.stop(); return; }
    this.requested = true;
    const request = ++this.requestId;
    this.label();
    try {
      await this.audio.play();
      if (request !== this.requestId || !this.requested) return;
      Input.announce('Now playing: BB Im a Sheep');
    } catch (error) {
      if (request === this.requestId) this.fail();
    }
  },

  // Pause at the current position so the next play action resumes the song.
  stop() {
    this.requestId++;
    this.requested = false;
    this.playing = false;
    if (this.audio) this.audio.pause();
    this.label();
  },

  // There is one recording, so the former next-track control restarts it.
  next() {
    this.init();
    const resume = this.requested;
    this.stop();
    this.audio.currentTime = 0;
    if (resume) this.toggle();
    Input.announce('Recording reset to the beginning.');
  },

  // Keep the controls available if playback fails or the file cannot load.
  fail() {
    this.stop();
    Input.announce('Audio could not start. Check sheep-music.m4a and press play again.');
  },

  // Show pause while playback is requested, including brief loading periods.
  label() {
    const button = document.getElementById('music-button');
    button.textContent = this.requested ? 'Ⅱ' : '▷';
    button.setAttribute('aria-label', this.requested ? 'Pause music' : 'Play music');
  }
};
