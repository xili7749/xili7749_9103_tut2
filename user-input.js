// User-input mechanic: page turns, sheep gestures, cloud dragging and lighting gestures.
// ChatGPT/Codex assisted with generating, modifying and refining this code.
// Pointer capture reference: https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture
class UserInputMechanic {
  constructor(world, environment, music) {
    this.world = world; this.environment = environment; this.music = music;
    this.active = null; this.pointerId = null; this.hoverSheep = null; this.hoverCloud = null;
  }
  bind(canvas, toWorld) {
    // Capture the pointer so releasing outside the canvas cannot leave a sheep held.
    const element = canvas.elt;
    element.style.touchAction = 'none';
    element.addEventListener('pointerdown', event => {
      if (this.pointerId !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
      this.pointerId = event.pointerId;
      element.setPointerCapture(event.pointerId);
      this.down(toWorld(event.clientX, event.clientY));
      event.preventDefault();
    });
    element.addEventListener('pointermove', event => {
      if (this.pointerId !== null && event.pointerId !== this.pointerId) return;
      this.move(toWorld(event.clientX, event.clientY));
      if (this.active) event.preventDefault();
    });
    element.addEventListener('pointerup', event => {
      if (event.pointerId !== this.pointerId) return;
      this.up(toWorld(event.clientX, event.clientY)); this.pointerId = null;
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    });
    element.addEventListener('pointercancel', () => this.cancel());
    element.addEventListener('lostpointercapture', () => { if (this.active) this.cancel(); });
    window.addEventListener('blur', () => this.cancel());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.cancel(); });
  }
  inBook(p) { return p.x >= 65 && p.x <= 1135 && p.y >= 65 && p.y <= 695; }
  musicAction(p) {
    if (Math.hypot(p.x - 184, p.y - 616) < 36) return 'toggle';
    if (p.x >= 134 && p.x <= 174 && p.y >= 655 && p.y <= 692) return 'previous';
    if (p.x >= 201 && p.x <= 241 && p.y >= 655 && p.y <= 692) return 'next';
    return null;
  }
  down(p) {
    this.world.pointer = p;
    const action = this.musicAction(p);
    if (action) {
      if (action === 'toggle') this.music.toggle(); else this.music.change(action === 'next' ? 1 : -1);
      return;
    }
    if (!this.inBook(p) || this.world.pageTurn) return;
    if (p.x <= 108) { this.world.requestPageTurn(); return; }
    const cloud = this.world.hitCloud(p.x, p.y);
    const sheep = this.world.hitSheep(p.x, p.y);
    if (cloud) {
      cloud.dragging = true;
      this.active = { type: 'cloud', object: cloud, x: p.x, y: p.y, dx: cloud.x - p.x, dy: cloud.y - p.y, moved: false };
    } else if (sheep) {
      sheep.held = true;
      this.active = { type: 'sheep', object: sheep, age: 0, x: p.x, y: p.y };
    } else {
      this.active = { type: 'background', x: p.x, y: p.y, startNight: this.environment.nightTarget, moved: false, lighting: false };
    }
  }
  move(p) {
    this.world.pointer = p;
    if (this.inBook(p)) this.environment.setLight(p.x);
    this.hoverSheep = this.world.hitSheep(p.x, p.y) || null;
    this.hoverCloud = this.world.hitCloud(p.x, p.y) || null;
    const gesture = this.active;
    if (!gesture) return;
    const dx = p.x - gesture.x, dy = p.y - gesture.y;
    if (gesture.type === 'cloud') {
      if (Math.hypot(dx, dy) > 5) gesture.moved = true;
      if (gesture.moved) {
        gesture.object.x = StoryMath.clamp(p.x + gesture.dx, 145, 1055);
        gesture.object.y = StoryMath.clamp(p.y + gesture.dy, 132, 255);
        gesture.object.state = 'floating'; gesture.object.rise = 1;
      }
    } else if (gesture.type === 'background') {
      if (Math.hypot(dx, dy) > 12) gesture.moved = true;
      if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx) * 1.1) gesture.lighting = true;
      if (gesture.lighting) this.environment.setNight(gesture.startNight + dy / 185);
    }
  }
  update(dt) {
    if (this.active?.type === 'sheep') {
      this.active.age += dt;
      this.active.object.puff = StoryMath.clamp(this.active.age / STORY_SETTINGS.holdToCloud, 0, 1);
    }
  }
  up(p) {
    const gesture = this.active;
    if (!gesture) return;
    this.move(p);
    if (gesture.type === 'sheep') this.world.releaseSheep(gesture.object, gesture.age);
    else if (gesture.type === 'cloud') {
      gesture.object.dragging = false;
      if (gesture.moved) gesture.object.age = Math.min(gesture.object.age, gesture.object.lifetime - 3);
    } else if (!gesture.moved && this.world.inGround(p.x, p.y)) {
      const added = this.world.addSheepAt(p.x, p.y);
      this.world.ripples.push({ x: p.x, y: p.y, age: 0, success: !!added });
    }
    this.active = null;
  }
  cancel() {
    if (this.active?.type === 'sheep') this.world.cancelHold(this.active.object);
    if (this.active?.type === 'cloud') this.active.object.dragging = false;
    this.active = null; this.pointerId = null;
  }
}
