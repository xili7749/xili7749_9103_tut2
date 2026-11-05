// AI (ChatGPT/Codex) assisted with writing and modifying parts of this code.

// This object stores the sheep and updates their movement.
window.Flock = {
  sheep: [],
  bounds: { left: 297, right: 1163, top: 465, bottom: 744 },
  // Give each sheep its own size, eye colour, wool pattern and movement values.
  create(x, y, size, growing = false) {
    const r = () => NoiseMechanic.rand();
    return {
      id: NoiseMechanic.nextId++, x, y, homeX: x, homeY: y, size,
      woolVariant: floor(r()*8), wolf: r() < .28, seed: r() * 1000, facing: r() < .5 ? -1 : 1,
      eyeHue: r() * 360, jumpHeight: 8 + r() * 19, jumpSpeed: 1.5 + r() * 1.5,
      chaseRadius: 65 + r() * 45, chaseSpeed: .55 + r() * .35,
      shadowAngle: Math.atan2(y - 500, x - 720),
      wolfReveal: 0, trail: [], wolfX: x, wolfY: y,
      growth: growing ? 0 : 1, lookUntil: 0, puff: 0,
      tufts: Array.from({ length: 26 }, () => ({ x: (r() - .5) * 32, y: (r() - .5) * 22, r: 4 + r() * 7 }))
    };
  },
  // Try nearby or random positions until there is enough room for a sheep.
  findSpace(size = 1, desired = null) {
    const b = this.bounds;
    for (let i = 0; i < 180; i++) {
      const x = desired && i < 50 ? constrain(desired.x + (NoiseMechanic.rand() - .5) * i * 3, b.left, b.right) : NoiseMechanic.range(b.left, b.right);
      const y = desired && i < 50 ? constrain(desired.y + (NoiseMechanic.rand() - .5) * i * 2, b.top, b.bottom) : NoiseMechanic.range(b.top, b.bottom);
      if (abs(x - 720) < 26 || SceneGeometry.isBlocked(x, y, 18 * size)) continue;
      if (this.sheep.every(s => dist(s.x, s.y, x, y) > (s.size + size) * 25)) return { x, y };
    }
    return null;
  },
  // Add a sheep only when the clicked position is valid and has enough space.
  addAt(x, y) {
    const b = this.bounds;
    if (this.sheep.length >= ProjectConfig.noise.maxSheep || x < b.left || x > b.right || y < b.top || y > b.bottom || abs(x - 720) < 26 || SceneGeometry.isBlocked(x, y, 18)) return false;
    const size = NoiseMechanic.range(.75, 1.2);
    if (this.sheep.some(s => dist(s.x, s.y, x, y) < (s.size + size) * 24)) return false;
    this.sheep.push(this.create(x, y, size)); return true;
  },
  // Update sheep positions, shadows and wool inflation using elapsed seconds.
  update(dt) {
    const b = this.bounds, chase = MusicBox.playing && Story.night < .5;
    for (const s of this.sheep) {
      if (s.growth === 0 && !s.rainBorn) s.growth = 1;
      const targetAngle = atan2(s.y - Input.point.y, s.x - Input.point.x);
      const difference = atan2(sin(targetAngle - s.shadowAngle), cos(targetAngle - s.shadowAngle));
      // Smooth and limit shadow rotation when the pointer moves across a sheep.
      if (abs(difference) > .035) s.shadowAngle += constrain(difference * (1 - exp(-dt * 1.25)), -dt * .65, dt * .65);
      const active = chase && s.wolf;
      s.wolfReveal = lerp(s.wolfReveal, active ? 1 : 0, 1 - exp(-dt * 3));
      const angle = Story.elapsed * s.chaseSpeed + s.seed;
      const tx = s.homeX + (active ? cos(angle) * s.chaseRadius : 0);
      const ty = s.homeY + (active ? sin(angle) * s.chaseRadius * .68 : 0);
      s.x = lerp(s.x, constrain(tx, b.left, b.right), min(1, dt * 2));
      s.y = lerp(s.y, constrain(ty, b.top, b.bottom), min(1, dt * 2));
      // Move nearby sheep apart to reduce overlap during a chase.
      for (const other of this.sheep) {
        if (s.id >= other.id) continue;
        let dx = s.x - other.x, dy = s.y - other.y;
        const d = Math.hypot(dx, dy), gap = (s.size + other.size) * 21;
        if (d < gap) {
          const f = (gap - d) * .5 / max(d, .01);
          if (d < .01) dx = .1;
          s.x += dx * f; s.y += dy * f; other.x -= dx * f; other.y -= dy * f;
        }
      }
      s.x = constrain(s.x, b.left, b.right); s.y = constrain(s.y, b.top, b.bottom);
      const ground=SceneGeometry.constrainGround(s.x,s.y,20*s.size,b);
      s.x=ground.x;s.y=ground.y;
      s.trail.push({x:s.x,y:s.y,time:Story.elapsed});
      while(s.trail.length > 2 && s.trail[1].time < Story.elapsed - .75) s.trail.shift();
      s.wolfX = lerp(s.wolfX, s.trail[0].x - s.facing * 35, 1-exp(-dt*3));
      s.wolfY = lerp(s.wolfY, s.trail[0].y + 12, 1-exp(-dt*3));
      const held = Input.held?.sheep === s;
      s.puff = lerp(s.puff, held ? min(1, Input.held.duration / 1.0) : 0, min(1, dt * 7));
    }
  },
};

// This object manages random choices, drifting clouds and fading particles.
// noise() reference: https://p5js.org/reference/p5/noise/
// Seeded randomness concept: https://p5js.org/reference/p5/randomSeed/
window.NoiseMechanic = {
  seed: 1927, nextId: 1, clouds: [], particles: [],
  // Use a separate 32-bit linear congruential generator for behaviour choices.
  // Drawing textures will not change this sequence.
  rand() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return this.seed / 4294967296; },
  range(a, b) { return a + this.rand() * (b - a); },
  // Clear the previous page and generate a new flock with random sizes.
  newFlock() {
    this.clouds = []; this.particles = []; Flock.sheep = [];
    const count = floor(this.range(18, 27));
    for (let i = 0; i < count; i++) {
      const size = this.range(.72, 1.28), p = Flock.findSpace(size);
      if (p) Flock.sheep.push(Flock.create(p.x, p.y, size));
    }
    // Give at least one sheep a wolf shadow if none were randomly selected.
    if (!Flock.sheep.some(s => s.wolf)) Flock.sheep[0].wolf = true;
    this.ambientCloud(443, 322); this.ambientCloud(1004, 337);
  },
  ambientCloud(x, y) { this.addCloud(x, y + 75, .85, true); },
  // Store the cloud position, lifetime and chance of producing rain.
  addCloud(x, y, size = 1, ambient = false, source = null) {
    if (this.clouds.length >= ProjectConfig.noise.maxClouds) return;
    this.clouds.push({
      x, y, groundY: constrain(y + this.range(-15, 30), 408, 700),
      startY: y, sourceVariant: source?.woolVariant ?? floor(this.range(0,8)), sourcePuff: source?.puff ?? 0, fromSheep: !!source, targetY: this.range(265,345),
      size, age: 0, life: this.range(16, 25), rain: this.rand() < .38,
      seed: this.range(0, 900), newborn: null, burst: false, ambient,
      tufts: Array.from({ length: 11 }, () => ({ x: this.range(-30, 30), y: this.range(-10, 10), r: this.range(15, 27) }))
    });
  },
  update(dt) {
    for (const c of this.clouds) {
      c.age += dt;
      if (Input.dragCloud !== c) {
        // Use separate noise samples for horizontal and vertical cloud movement.
        c.x += (noise(c.seed, Story.elapsed * .065) - .48) * dt * 32;
        if (c.age < ProjectConfig.noise.cloudRiseSeconds) {
          const t=min(1,c.age/ProjectConfig.noise.cloudRiseSeconds); c.y = lerp(c.startY, c.targetY, t*t*(3-2*t));
        } else c.y += (noise(c.seed + 160, Story.elapsed * .075) - .5) * dt * 9;
      }
      c.x = constrain(c.x, 290, 1161); c.y = constrain(c.y, 235, c.fromSheep ? max(678,c.startY) : 678);
      // Start fading the cloud during the last four seconds of its life.
      const progress = constrain((c.age - (c.life - 4)) / 4, 0, 1);
      if (progress > 0 && c.rain && !c.newborn) {
        const size = this.range(.75, 1.12);
        const p = Flock.sheep.length < ProjectConfig.noise.maxSheep ? Flock.findSpace(size, { x: c.x, y: c.groundY }) : null;
        if (p) {
          c.newborn = Flock.create(p.x, p.y, size, true); c.newborn.rainBorn = true;
          Flock.sheep.push(c.newborn);
        } else c.rain = false;
      }
      // Use the same progress value for sheep growth and cloud fading.
      if (c.newborn) c.newborn.growth = progress;
      // Create a single burst of small particles when fading begins.
      if (progress > 0 && !c.burst) {
        c.burst = true;
        for (let i = 0; i < 37; i++) this.particles.push({
          x: c.x + this.range(-35, 35), y: c.y + this.range(-15, 15),
          vx: this.range(-12, 12), vy: this.range(-18, 2), age: 0,
          life: this.range(2, 4), size: this.range(1, 3), seed: this.range(0, 300)
        });
      }
    }
    for (const p of this.particles) {
      p.age += dt; p.x += (p.vx + (noise(p.seed, Story.elapsed * .2) - .5) * 9) * dt; p.y += p.vy * dt;
    }
    // Remove expired clouds and particles to keep the arrays small.
    this.clouds = this.clouds.filter(c => c.age < c.life);
    this.particles = this.particles.filter(p => p.age < p.life);
    if (Input.dragCloud && !this.clouds.includes(Input.dragCloud)) Input.dragCloud = null;
  },
  // Replace a held sheep with a cloud when the hold time reaches the threshold.
  releaseSheep(sheep, heldSeconds) {
    if (heldSeconds < ProjectConfig.input.holdToCloudSeconds || this.clouds.length >= ProjectConfig.noise.maxClouds || !Flock.sheep.includes(sheep)) return false;
    Flock.sheep = Flock.sheep.filter(s => s !== sheep);
    this.addCloud(sheep.x, sheep.y - 12, sheep.size, false, sheep);
    return true;
  }
};
