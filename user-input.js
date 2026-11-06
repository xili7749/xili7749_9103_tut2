// AI (ChatGPT/Codex) assisted with writing and modifying parts of this code.

// Find the frontmost sheep under the pointer.
Object.assign(Flock, {
  hit(x, y) {
    return [...this.sheep].sort((a, b) => b.y - a.y).find(s => s.growth > .5 && dist(x, y, s.x, s.y - 8) < 26 * s.size);
  }
});
// Find the most recently added cloud under the pointer.
Object.assign(NoiseMechanic, {
  hit(x, y) { return [...this.clouds].reverse().find(c => dist(x, y, c.x, c.y) < 42 * c.size); }
});

// This object handles clicks, long presses, dragging and page controls.
// Input reference: https://p5js.org/reference/p5/mousePressed/
window.Input = {
  desktopPoint: {x:720,y:500}, point: { x: 720, y: 500 }, held: null, dragCloud: null, lightDrag: null,
  hoverSheep: null, activePointer: false,
  announce(message) { document.getElementById('announcement').textContent = message; },
  // Clear the current gesture when it ends or the window loses focus.
  cancel() { this.held = null; this.dragCloud = null; this.lightDrag = null; this.activePointer = false; },
  // Convert the pointer position into book coordinates and update active drags.
  move(x, y) {
    this.desktopPoint={x,y};
    const page=Book.toPage(x,y); x=page.x; y=page.y;
    this.point = { x, y };
    if (this.dragCloud) {
      this.dragCloud.x = constrain(x, 290, 1161); this.dragCloud.y = constrain(y, 235, 678);
      // Skip the rising phase so the cloud drifts from its new position.
      this.dragCloud.age = max(4, this.dragCloud.age);
      this.dragCloud.groundY = constrain(y + 120, 408, 700);
    }
    if (this.lightDrag && dist(x, y, this.lightDrag.x, this.lightDrag.y) > 8) {
      this.lightDrag.moved = true;
      TimeMechanic.setNight(this.lightDrag.night + (y - this.lightDrag.y) / 220);
    }
  },
  // Check controls first, then choose a cloud, sheep or empty page area.
  press(x, y) {
    this.move(x, y);
    const cassette=CassetteGeometry.action(x,y);
    if(cassette){cassette==='play'?MusicBox.toggle():MusicBox.next();return;}
    x=this.point.x; y=this.point.y;
    if (!Story.open) {
      if (x > 720 && x < 1250 && y > 166 && y < 810) TimeMechanic.open();
      return;
    }
    if (Story.opening < 1 || Story.turn > 0) return;
    if (x > 240 && x < 338 && y > 753 && y < 815) { TimeMechanic.turn('flock'); return; }
    if (x > 1140 && x < 1230 && y > 753 && y < 815) { TimeMechanic.turn('season'); return; }
    if(SceneGeometry.musicHit(x,y)){MusicBox.toggle();return;}
    const cloud = NoiseMechanic.hit(x, y);
    this.activePointer = true;
    if (cloud) { this.dragCloud = cloud; return; }
    const sheep = Flock.hit(x, y);
    if (sheep) { this.held = { sheep, duration: 0 };  return; }
    if (x > 260 && x < 1200 && y > 280 && y < 744) this.lightDrag = { x, y, moved: false, night: Story.targetNight };
  },
  // Finish the current click or hold, then clear the gesture state.
  release() {
    if (this.lightDrag && !this.lightDrag.moved) {
      const added = Flock.addAt(this.lightDrag.x, this.lightDrag.y);
      this.announce(added ? 'A new sheep appeared in the meadow.' : 'Click an empty area of grass away from trees and sheep.');
    }
    if (this.held) {
      const { sheep, duration } = this.held;

      if (NoiseMechanic.releaseSheep(sheep, duration)) { this.announce('The wool has become a cloud. You can drag it.'); }
    }
    this.cancel();
  },
  update(dt) {
    // Update the page controls when the book opens or its state changes.
    if (this.shownOpen !== Story.open) {
      this.shownOpen = Story.open;
      document.getElementById('open-button').hidden = Story.open;
      for (const id of ['flock-button','season-button','night-button']) document.getElementById(id).hidden = !Story.open;
    }
    if (Story.notice && this.lastNotice !== Story.notice) {
      this.lastNotice = Story.notice; this.announce(Story.notice);
    }
    if (Story.turn > 0) this.cancel();
    if (this.held) this.held.duration += dt;
    this.hoverSheep = Story.open && Story.opening === 1 && Story.turn === 0 ? Flock.hit(this.point.x, this.point.y) : null;
    if (Story.open && !this.activePointer && Story.night < .8) {
      Story.sun = lerp(Story.sun, map(constrain(this.point.x, 270, 1200), 270, 1200, -.95, .95), min(1, dt * 2));
    }
    // Update shadow directions from the pointer and inflate the held sheep.
    for (const s of Flock.sheep) {
      const targetAngle = atan2(s.y - Input.point.y, s.x - Input.point.x);
      const difference = atan2(sin(targetAngle - s.shadowAngle), cos(targetAngle - s.shadowAngle));
      // Smooth and limit shadow rotation when the pointer moves across a sheep.
      if (abs(difference) > .035) s.shadowAngle += constrain(difference * (1 - exp(-dt * 1.25)), -dt * .65, dt * .65);
      const held = Input.held?.sheep === s;
      s.puff = lerp(s.puff, held ? min(1, Input.held.duration / 1.0) : 0, min(1, dt * 7));
    }
    const p = this.point;
    const onClasp = !Story.open && p.x > 720 && p.x < 1250 && p.y > 166 && p.y < 810;
    const corner = Story.open && p.y > 753 && p.y < 815 && ((p.x > 240 && p.x < 338) || (p.x > 1140 && p.x < 1230));
    const onRecord = CassetteGeometry.action(this.desktopPoint.x,this.desktopPoint.y);
    cursor(this.dragCloud ? 'grabbing' : (this.hoverSheep || onClasp || corner || onRecord || (Story.open && SceneGeometry.musicHit(p.x,p.y)) || NoiseMechanic.hit(p.x, p.y)) ? 'pointer' : 'default');
  },
  // Align the HTML music buttons with the cassette drawn on the canvas.
  layoutCassetteControls(){
    const bounds=document.querySelector('#stage canvas').getBoundingClientRect();
    const k=bounds.width/Book.W;
    for(const[name,box]of Object.entries(CassetteGeometry.controls)){
      const p=CassetteGeometry.toScreen(box.x,box.y),el=document.getElementById(name==='play'?'music-button':'track-button');
      el.style.left=(bounds.left+p.x*k)+'px';el.style.top=(bounds.top+p.y*k)+'px';
      el.style.width=(box.w*CassetteGeometry.scale*k)+'px';el.style.height=(box.h*CassetteGeometry.scale*k)+'px';el.style.fontSize=(22*CassetteGeometry.scale*k)+'px';
    }
  },
  // Connect page buttons and cancel gestures when the page loses focus.
  bind() {
    const on = (id, fn) => document.getElementById(id).addEventListener('click', fn);
    on('open-button', () => TimeMechanic.open());
    on('flock-button', () => TimeMechanic.turn('flock'));
    on('season-button', () => TimeMechanic.turn('season'));
    on('night-button', () => TimeMechanic.toggleNight());
    on('music-button', () => MusicBox.toggle());
    on('track-button', () => MusicBox.next());
    on('help-button', () => this.help());
    this.layoutCassetteControls();
    window.addEventListener('blur', () => this.cancel());
    window.addEventListener('pointercancel', () => this.cancel());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.cancel(); });
  },
  // Show or hide the interaction instructions.
  help() {
    const panel = document.getElementById('help'); panel.hidden = !panel.hidden;
    document.getElementById('help-button').setAttribute('aria-expanded', String(!panel.hidden));
  }
};

// Convert canvas coordinates before passing mouse events to Input.
function mouseMoved() { Input.move(mouseX / sceneScale, mouseY / sceneScale); }
function mouseDragged() { Input.move(mouseX / sceneScale, mouseY / sceneScale); return false; }
function mousePressed(event) {
  if (event?.target?.tagName !== 'CANVAS') return;
  Input.press(mouseX / sceneScale, mouseY / sceneScale); return false;
}
function mouseReleased() { Input.release(); }
// Pass touch events through the same interaction methods as the mouse.
function touchStarted(event) {
  if (event?.target?.tagName !== 'CANVAS') return;
  const t = touches[0]; if (t) Input.press(t.x / sceneScale, t.y / sceneScale); return false;
}
function touchMoved() { const t = touches[0]; if (t) Input.move(t.x / sceneScale, t.y / sceneScale); return false; }
function touchEnded() { Input.release(); return false; }
// Use keyboard shortcuts to open the book and change its settings.
function keyPressed(event) {
  if (event?.target?.tagName === 'BUTTON') return;
  if (keyCode === ENTER) TimeMechanic.open();
  else if (keyCode === LEFT_ARROW) TimeMechanic.turn('flock');
  else if (keyCode === RIGHT_ARROW) TimeMechanic.turn('season');
  else if (key.toLowerCase() === 'n') TimeMechanic.toggleNight();
  else if (key.toLowerCase() === 'm') MusicBox.toggle();
  else if (key.toLowerCase() === 't') MusicBox.next();
  else if (key.toLowerCase() === 'h') Input.help();
  else return;
  return false;
}
