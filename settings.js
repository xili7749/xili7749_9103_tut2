// Shared dimensions and adjustable timings for the interactive book.
// ChatGPT/Codex assisted with generating, modifying and refining this code.
const STORY_SETTINGS = {
  width: 1200, height: 760,
  seasonLength: 6000, seasonBlend: 1500,
  holdToCloud: 0.75, wolfFraction: 0.25,
  minSheep: 16, maxSheep: 23, sheepLimit: 36,
  cloudLimit: 14, rainCloudChance: 0.38,
  ground: { left: 125, right: 1070, top: 350, bottom: 650 },
  trees: [{ x: 175, y: 335, r: 58 }, { x: 890, y: 318, r: 61 }, { x: 1040, y: 430, r: 55 }],
  eyeColours: ['#8eeac4', '#e3a1ff', '#ffcc7b', '#83d8ff', '#ff9fc5']
};
const StoryMath = {
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  mix: (a, b, t) => a + (b - a) * t,
  smooth(t) { t = this.clamp(t, 0, 1); return t * t * (3 - 2 * t); },
  colour(a, b, t) { return a.map((v, i) => this.mix(v, b[i], t)); },
  distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
};
