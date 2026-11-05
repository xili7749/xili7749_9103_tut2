// Time-based mechanic: automatic seasons and smooth lighting transitions.
// ChatGPT/Codex assisted with generating, modifying and refining this code.
// Frame timing reference: https://p5js.org/reference/p5/deltaTime/
class TimeEnvironment {
  constructor() {
    this.elapsed = 0;
    this.night = 0;
    this.nightTarget = 0;
    this.sunDirection = -0.45;
    this.sunTarget = -0.45;
    this.palettes = [
      { grass: [167,181,139], tree: [116,147,106], sky: [204,222,217] },
      { grass: [139,166,119], tree: [75,119,87], sky: [177,210,218] },
      { grass: [192,158,117], tree: [166,111,72], sky: [229,210,187] },
      { grass: [216,225,217], tree: [151,174,160], sky: [207,220,230] }
    ];
    this.update(0);
  }
  update(dt) {
    this.elapsed += Math.max(0, dt);
    const milliseconds = this.elapsed * 1000;
    this.season = Math.floor(milliseconds / STORY_SETTINGS.seasonLength) % 4;
    this.progress = (milliseconds % STORY_SETTINGS.seasonLength) / STORY_SETTINGS.seasonLength;
    const remaining = STORY_SETTINGS.seasonLength * (1 - this.progress);
    this.blend = StoryMath.smooth(1 - remaining / STORY_SETTINGS.seasonBlend);
    this.night += StoryMath.clamp(this.nightTarget - this.night, -dt / 1.2, dt / 1.2);
    this.sunDirection += (this.sunTarget - this.sunDirection) * (1 - Math.exp(-dt * 5));
    this.isNight = this.night >= 0.5;
    this.brightness = 1 - this.night * 0.60;
    const a = this.palettes[this.season], b = this.palettes[(this.season + 1) % 4];
    this.grass = StoryMath.colour(StoryMath.colour(a.grass, b.grass, this.blend), [55,74,82], this.night);
    this.tree = StoryMath.colour(StoryMath.colour(a.tree, b.tree, this.blend), [36,62,66], this.night);
    this.sky = StoryMath.colour(StoryMath.colour(a.sky, b.sky, this.blend), [39,55,83], this.night);
  }
  weight(season) {
    if (this.season === season) return 1 - this.blend;
    return (this.season + 1) % 4 === season ? this.blend : 0;
  }
  setLight(pointerX) {
    this.sunTarget = StoryMath.clamp((pointerX - 600) / 480, -1, 1);
  }
  setNight(value) { this.nightTarget = StoryMath.clamp(value, 0, 1); }
}
