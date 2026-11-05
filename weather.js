// This renderer draws rain and snow from the environment snapshot.
// The project owner requested rain in spring, summer and autumn, and snow in winter.

class WeatherRenderer {
  constructor() {
    // Create the particle settings once and reuse them for rain and snow.
    // Fractional offsets spread the particles without generating new positions each frame.
    this.particles = Array.from({ length: 240 }, (_, i) => ({
      x: (i * 0.61803398875) % 1,
      phase: (i * 0.75487766625) % 1,
      rainSpeed: 380 + (i % 7) * 29,
      rainLength: 12 + (i % 5) * 2,
      snowSpeed: 35 + (i % 7) * 6,
      snowSize: 3 + (i % 5) * 0.7,
      sway: 8 + (i % 5) * 4
    }));
  }

  draw(state, w, h) {
    // Skip the particle drawing work when the weather is fully off.
    if (state.weatherAmount <= 0) return;

    // Use fewer particles on smaller screens and keep a fixed upper limit.
    const count = Math.min(this.particles.length, Math.max(60, Math.round(w * h / 4500)));
    push();
    colorMode(RGB, 255);
    ellipseMode(CENTER);
    strokeCap(ROUND);

    if (state.weatherType === 'snow') {
      // Draw soft snowflakes that fall slowly and drift from side to side.
      noStroke();
      fill(250, 246, 229, 220 * state.snowAmount);
      const seconds = state.elapsed / 1000;
      for (let i = 0; i < count; i++) {
        const flake = this.particles[i];
        const y = ((flake.phase * (h + 40) + seconds * flake.snowSpeed) % (h + 40)) - 20;
        const drift = Math.sin(seconds * 0.8 + flake.phase * Math.PI * 2) * flake.sway;
        const x = flake.x * w + drift;
        ellipse(x, y, flake.snowSize, flake.snowSize);
      }
    } else {
      // Draw rain as short slanted lines moving faster than snowflakes.
      stroke(216, 226, 216, (180 - 35 * state.nightMix) * state.rainAmount);
      strokeWeight(1.8);
      for (let i = 0; i < count; i++) {
        const drop = this.particles[i];
        const y = ((drop.phase * (h + 40) + state.elapsed * drop.rainSpeed / 1000) % (h + 40)) - 20;
        const x = ((drop.x * (w + 40) + y * 0.14) % (w + 40)) - 20;
        line(x, y, x + drop.rainLength * 0.14, y + drop.rainLength);
      }
    }
    pop();
  }
}
