// This controller calculates the environment without drawing or reading mouse input.
// The project owner specified the seasonal cycle, manual switches and winter snow.
// Timing reference: https://p5js.org/reference/p5/deltaTime/
// Colour blending reference: https://p5js.org/reference/p5/lerpColor/

class Timer {
  constructor({ seasonLength = 6000, transitionLength = 1500 } = {}) {
    // Check that both time settings are positive numbers in milliseconds.
    if (!Number.isFinite(seasonLength) || seasonLength <= 0) {
      throw new Error('seasonLength must be a positive number in milliseconds.');
    }
    if (!Number.isFinite(transitionLength) || transitionLength <= 0) {
      throw new Error('transitionLength must be a positive number in milliseconds.');
    }

    // These variables store the season duration and the colour transition duration.
    this.seasonLength = seasonLength;
    this.transitionLength = Math.min(transitionLength, seasonLength);
    this.elapsed = 0;

    // The season numbers represent spring, summer, autumn and winter in this order.
    this.season = 0;
    this.seasonNames = ['Spring', 'Summer', 'Autumn', 'Winter'];

    // The target stores the selected mode, while the mix stores its current transition.
    this.nightTarget = false;
    this.nightMix = 0;
    this.weatherEnabled = false;
    this.weatherAmount = 0;

    // Each palette holds the daytime grass, tree and sky colours for one season.
    this.palettes = [
      { grass: [160, 173, 137], tree: [113, 139, 103], sky: [210, 220, 202] },
      { grass: [126, 150, 115], tree: [79, 115, 87], sky: [183, 207, 206] },
      { grass: [186, 149, 111], tree: [155, 108, 76], sky: [225, 205, 178] },
      { grass: [215, 219, 207], tree: [151, 170, 156], sky: [208, 218, 220] }
    ];

    // Calculate the initial environment before the first frame is drawn.
    this.update(0);
  }

  update(dt) {
    // Use elapsed milliseconds so the animation speed does not depend on frame rate.
    dt = Number.isFinite(dt) ? Math.max(0, dt) : 0;
    this.elapsed += dt;

    // Update each part of the environment in a clear order.
    this.updateSeason();
    this.updateLighting(dt);
    this.updateColours();
    this.updateWeather(dt);
  }

  updateSeason() {
    // Divide time into four repeating seasons and find the progress of the current one.
    const cycle = Math.floor(this.elapsed / this.seasonLength);
    const timeInSeason = this.elapsed % this.seasonLength;
    this.season = cycle % 4;
    this.seasonProgress = timeInSeason / this.seasonLength;

    // Blend into the next palette near the end of each season.
    const remaining = this.seasonLength - timeInSeason;
    this.seasonBlend = Timer.smooth(1 - remaining / this.transitionLength);
  }

  updateLighting(dt) {
    // Move towards day or night over two seconds, allowing another click to reverse it.
    this.nightMix = Timer.moveTowards(this.nightMix, this.nightTarget ? 1 : 0, dt / 2000);
    this.isNight = this.nightMix >= 0.5;
    this.brightness = 1 - 0.76 * this.nightMix;
    this.shadowAlpha = 60 * (1 - this.nightMix);
  }

  updateColours() {
    const currentPalette = this.palettes[this.season];
    const nextPalette = this.palettes[(this.season + 1) % 4];

    // Keep some seasonal colour in the night palette instead of using one flat colour.
    const night = Timer.smooth(this.nightMix);
    const grass = Timer.mix(currentPalette.grass, nextPalette.grass, this.seasonBlend);
    const tree = Timer.mix(currentPalette.tree, nextPalette.tree, this.seasonBlend);
    const sky = Timer.mix(currentPalette.sky, nextPalette.sky, this.seasonBlend);
    const nightGrass = Timer.mix(grass.map(value => value * 0.23), [21, 40, 48], 0.35);
    const nightTree = Timer.mix(tree.map(value => value * 0.22), [16, 31, 39], 0.35);
    this.grassColour = Timer.mix(grass, nightGrass, night);
    this.treeColour = Timer.mix(tree, nightTree, night);
    this.skyColour = Timer.mix(sky, [20, 32, 53], night);
  }

  updateWeather(dt) {
    // Fade the weather in or out without resetting its switch when the season changes.
    const weatherTarget = this.weatherEnabled ? 1 : 0;
    this.weatherAmount = Timer.moveTowards(this.weatherAmount, weatherTarget, dt / 1200);

    // Winter uses snow. The other three seasons use rain.
    this.weatherType = this.season === 3 ? 'snow' : 'rain';
    this.rainAmount = this.weatherType === 'rain' ? this.weatherAmount : 0;
    this.snowAmount = this.weatherType === 'snow' ? this.weatherAmount : 0;
  }

  // Move a value towards its target without going past it.
  static moveTowards(value, target, step) {
    return value + Math.sign(target - value) * Math.min(Math.abs(target - value), step);
  }

  // Slow down the beginning and end of a colour transition with a cubic curve.
  static smooth(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  // Blend each RGB channel using the same proportion.
  static mix(a, b, t) {
    return a.map((value, index) => value + (b[index] - value) * t);
  }

  // Use the palette transition to fade seasonal details such as spring flowers.
  getSeasonWeight(index) {
    if (index === this.season) return 1 - this.seasonBlend;
    if (index === (this.season + 1) % 4) return this.seasonBlend;
    return 0;
  }

  // Return a snapshot for the other modules without sharing editable colour arrays.
  getState() {
    return {
      elapsed: this.elapsed,
      springAmount: this.getSeasonWeight(0),
      season: this.season,
      seasonName: this.seasonNames[this.season],
      seasonProgress: this.seasonProgress,
      isNight: this.isNight,
      nightMix: this.nightMix,
      brightness: this.brightness,
      shadowAlpha: this.shadowAlpha,
      grassColour: [...this.grassColour],
      treeColour: [...this.treeColour],
      skyColour: [...this.skyColour],
      weatherEnabled: this.weatherEnabled,
      weatherType: this.weatherType,
      weatherAmount: this.weatherAmount,
      rainAmount: this.rainAmount,
      snowAmount: this.snowAmount
    };
  }

  // Change the weather target without affecting the current season.
  toggleWeather() {
    this.weatherEnabled = !this.weatherEnabled;
  }

  // Change the lighting target without affecting the weather.
  toggleNight() {
    this.nightTarget = !this.nightTarget;
  }
}

// Export the controller so its timing can be checked without the p5.js renderer.
if (typeof module !== 'undefined') module.exports = { Timer };
