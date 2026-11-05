// Perlin noise and randomness mechanic: flock, cloud paths, rain births and music responses.
// ChatGPT/Codex assisted with generating, modifying and refining this code.
// Perlin noise reference: https://p5js.org/reference/p5/noise/
// Reproducible random generator reference: https://www.jstatsoft.org/article/view/v008i14
class NoiseRandomMechanic {
  constructor(noiseFunction, seed = Date.now()) {
    this.noise = noiseFunction;
    this.seed = seed >>> 0 || 1;
    this.sheep = [];
    this.clouds = [];
    this.ripples = [];
    this.elapsed = 0;
    this.nextId = 1;
    this.pageTurn = null;
    this.pointer = { x: 600, y: 380 };
    this.generateFlock();
  }
  random(a = 0, b = 1) {
    // Keep random choices stable after creation; never regenerate appearances in draw().
    // A xorshift32 seed makes flock choices reproducible during testing.
    let value = this.seed;
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    this.seed = value >>> 0;
    return a + this.seed / 4294967296 * (b - a);
  }
  choose(list) { return list[Math.floor(this.random(0, list.length))]; }
  inGround(x, y) {
    const g = STORY_SETTINGS.ground;
    return x >= g.left && x <= g.right && y >= g.top && y <= g.bottom;
  }
  canPlace(x, y, radius, ignoreId = null) {
    const g = STORY_SETTINGS.ground;
    if (x < g.left + radius || x > g.right - radius || y < g.top + radius || y > g.bottom - radius) return false;
    if (Math.abs(x - 600) < radius + 15) return false;
    if (x < 265 + radius && y > 530 - radius) return false;
    for (const tree of STORY_SETTINGS.trees) if (Math.hypot(x - tree.x, y - tree.y) < radius + tree.r * 0.65) return false;
    return this.sheep.every(s => s.id === ignoreId || Math.hypot(s.x - x, s.y - y) >= s.radius + radius + 10);
  }
  findPosition(radius, preferred = null) {
    if (preferred && this.canPlace(preferred.x, preferred.y, radius)) return preferred;
    for (let attempt = 0; attempt < 240; attempt++) {
      const g = STORY_SETTINGS.ground;
      let x = this.random(g.left + radius, g.right - radius);
      let y = this.random(g.top + radius, g.bottom - radius);
      if (preferred && attempt < 80) {
        x = preferred.x + this.random(-85, 85);
        y = preferred.y + this.random(-65, 65);
      }
      if (this.canPlace(x, y, radius)) return { x, y };
    }
    return null;
  }
  makeSheep(x, y, size, wolf = false, growth = 1) {
    const sheep = {
      id: this.nextId++, x, y, baseX: x, baseY: y, size, radius: 27 * size,
      wolf, growth, jump: 0, jumping: false, jumpTime: 0,
      nextJump: this.elapsed + this.random(0.3, 1.8), jumpHeight: 0,
      orbit: this.random(11, 27), phase: this.random(0, Math.PI * 2),
      speed: this.random(0.65, 1.25), turn: this.random() < 0.5 ? -1 : 1,
      alert: 0, puff: 0, held: false, faceAngle: 0,
      eyeColour: this.choose(STORY_SETTINGS.eyeColours), nextEye: this.elapsed + this.random(2, 5),
      woolVariation: this.random(-0.08, 0.08), facing: this.random() < 0.5 ? -1 : 1
    };
    this.sheep.push(sheep);
    return sheep;
  }
  addSheepAt(x, y, options = {}) {
    if (this.sheep.length >= STORY_SETTINGS.sheepLimit) return null;
    const size = options.size || this.random(0.74, 1.14);
    if (!this.canPlace(x, y, size * 27)) return null;
    return this.makeSheep(x, y, size, this.random() < STORY_SETTINGS.wolfFraction, options.growth ?? 1);
  }
  generateFlock() {
    this.sheep = []; this.clouds = []; this.ripples = [];
    const count = Math.floor(this.random(STORY_SETTINGS.minSheep, STORY_SETTINGS.maxSheep + 1));
    for (let i = 0; i < count; i++) {
      const size = this.random(0.72, 1.17), position = this.findPosition(size * 27);
      if (position) this.makeSheep(position.x, position.y, size);
    }
    // Select an exact random quarter of the initial flock, independent of their sizes.
    const shuffled = [...this.sheep];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.random(0, i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    for (let i = 0; i < Math.round(shuffled.length * STORY_SETTINGS.wolfFraction); i++) shuffled[i].wolf = true;
    for (let i = 0; i < 3; i++) this.makeCloud(this.random(230, 980), this.random(155, 230), false);
  }
  requestPageTurn() { if (!this.pageTurn) this.pageTurn = { age: 0, refreshed: false }; }
  makeCloud(x, y, rising = true, size = 1) {
    if (this.clouds.length >= STORY_SETTINGS.cloudLimit) return null;
    const cloud = {
      id: this.nextId++, x, y, startX: x, startY: y, size,
      targetY: this.random(145, 235), age: 0, rise: rising ? 0 : 1,
      state: rising ? 'rising' : 'floating', dragging: false,
      offset: this.random(0, 1000), lifetime: this.random(8, 14),
      willRain: this.random() < STORY_SETTINGS.rainCloudChance,
      finish: 0, child: null, rainTarget: null,
      fragments: Array.from({ length: 20 }, () => ({
        x: this.random(-36, 36), y: this.random(-12, 14), vx: this.random(-32, 32), vy: this.random(-28, 20), size: this.random(1.5, 3.5)
      }))
    };
    this.clouds.push(cloud);
    return cloud;
  }
  releaseSheep(sheep, heldSeconds) {
    if (!this.sheep.includes(sheep)) return;
    sheep.held = false;
    if (heldSeconds >= STORY_SETTINGS.holdToCloud && this.clouds.length < STORY_SETTINGS.cloudLimit) {
      this.makeCloud(sheep.x, sheep.y - 15, true, sheep.size);
      this.sheep = this.sheep.filter(s => s !== sheep);
    } else {
      sheep.alert = 2.3;
      sheep.puff = 0;
    }
  }
  cancelHold(sheep) { if (sheep) { sheep.held = false; sheep.puff = 0; } }
  startCloudFinish(cloud) {
    cloud.state = 'dissolving'; cloud.finish = 0;
    if (!cloud.willRain || this.sheep.length >= STORY_SETTINGS.sheepLimit) return;
    const size = this.random(0.72, 1.05);
    const target = this.findPosition(size * 27, { x: cloud.x, y: this.random(390, 610) });
    if (!target) return;
    cloud.child = this.makeSheep(target.x, target.y, size, this.random() < STORY_SETTINGS.wolfFraction, 0);
    cloud.rainTarget = target;
    cloud.state = 'raining';
  }
  update(dt, environment, musicPlaying) {
    this.elapsed += dt;
    if (this.pageTurn) {
      this.pageTurn.age += dt;
      if (this.pageTurn.age >= 0.3 && !this.pageTurn.refreshed) {
        this.generateFlock(); this.pageTurn.refreshed = true;
      }
      if (this.pageTurn.age >= 0.75) this.pageTurn = null;
    }
    for (const sheep of this.sheep) this.updateSheep(sheep, dt, environment, musicPlaying);
    for (const cloud of this.clouds) this.updateCloud(cloud, dt);
    this.clouds = this.clouds.filter(c => c.state !== 'gone');
    this.ripples.forEach(r => { r.age += dt; });
    this.ripples = this.ripples.filter(r => r.age < 0.8);
  }
  updateSheep(s, dt, environment, music) {
    s.alert = Math.max(0, s.alert - dt);
    if (!s.held) s.puff = Math.max(0, s.puff - dt * 3);
    const targetAngle = s.alert > 0 ? Math.atan2(this.pointer.y - s.y, this.pointer.x - s.x) : 0;
    s.faceAngle += Math.atan2(Math.sin(targetAngle - s.faceAngle), Math.cos(targetAngle - s.faceAngle)) * Math.min(1, dt * 5);
    if (environment.isNight && this.elapsed > s.nextEye) {
      s.eyeColour = this.choose(STORY_SETTINGS.eyeColours); s.nextEye = this.elapsed + this.random(2, 5);
    }
    // Music is an on/off gate. No amplitude or beat analysis is used.
    if (music && environment.isNight && !s.held && s.growth >= 1) {
      if (!s.jumping && this.elapsed > s.nextJump) {
        s.jumping = true; s.jumpTime = 0; s.jumpDuration = this.random(0.65, 1.2); s.jumpHeight = this.random(7, 28);
      }
      if (s.jumping) {
        s.jumpTime += dt;
        s.jump = Math.sin(Math.min(1, s.jumpTime / s.jumpDuration) * Math.PI) * s.jumpHeight;
        if (s.jumpTime >= s.jumpDuration) { s.jumping = false; s.jump = 0; s.nextJump = this.elapsed + this.random(0.2, 1.5); }
      }
    } else { s.jump = 0; s.jumping = false; s.nextJump = Math.max(s.nextJump, this.elapsed + 0.15); }
    if (music && !environment.isNight && s.wolf && !s.held && s.growth >= 1) {
      const angle = this.elapsed * s.speed * s.turn + s.phase;
      const x = s.baseX + Math.cos(angle) * s.orbit, y = s.baseY + Math.sin(angle) * s.orbit * 0.55;
      const nx = StoryMath.mix(s.x, x, Math.min(1, dt * 2));
      const ny = StoryMath.mix(s.y, y, Math.min(1, dt * 2));
      // Reject blocked movement so running sheep never overlap another sheep's ground position.
      if (this.canPlace(nx, ny, s.radius, s.id)) { s.x = nx; s.y = ny; }
      else { s.turn *= -1; s.baseX = s.x; s.baseY = s.y; }
    }
  }
  updateCloud(c, dt) {
    if (c.dragging) return;
    if (c.state === 'rising') {
      c.rise = Math.min(1, c.rise + dt / 1.8);
      c.y = StoryMath.mix(c.startY, c.targetY, StoryMath.smooth(c.rise));
      if (c.rise >= 1) c.state = 'floating';
      return;
    }
    if (c.state === 'floating') {
      c.age += dt;
      // Sample Perlin noise continuously for gentle independent cloud velocities.
      c.x += (this.noise(c.offset, this.elapsed * 0.065) - 0.5) * 22 * dt;
      c.y += (this.noise(c.offset + 80, this.elapsed * 0.055) - 0.5) * 8 * dt;
      c.x = StoryMath.clamp(c.x, 145, 1055); c.y = StoryMath.clamp(c.y, 132, 255);
      if (c.age >= c.lifetime) this.startCloudFinish(c);
      return;
    }
    if (c.state === 'raining' || c.state === 'dissolving') {
      c.finish = Math.min(1, c.finish + dt / 3);
      if (c.child) c.child.growth = StoryMath.smooth(c.finish);
      if (c.finish >= 1) c.state = 'gone';
    }
  }
  hitSheep(x, y) {
    return [...this.sheep].reverse().find(s => Math.hypot((x - s.x) / 1.25, y - (s.y - s.jump - 9)) < 27 * s.size && s.growth > 0.5);
  }
  hitCloud(x, y) {
    return [...this.clouds].reverse().find(c => ['floating','rising'].includes(c.state) && Math.hypot((x - c.x) / 1.8, y - c.y) < 24 * c.size);
  }
}
