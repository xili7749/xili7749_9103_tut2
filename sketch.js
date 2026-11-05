// AI (ChatGPT/Codex) assisted with writing and modifying parts of this code.

// This variable stores the scale used to fit the scene inside the window.
// p5.js reference: https://p5js.org/
let sceneScale = 1;
// Fit the canvas to the window while keeping the original proportions.
function fitScene() {
  sceneScale = min(windowWidth / Book.W, windowHeight / Book.H);
  return [max(1, floor(Book.W * sceneScale)), max(1, floor(Book.H * sceneScale))];
}
// Create the canvas, prepare cached artwork and connect the controls.
function setup() {
  pixelDensity(min(window.devicePixelRatio || 1, 2));
  const dimensions = fitScene();
  const canvas = createCanvas(...dimensions); canvas.parent('stage');
  canvas.attribute('aria-label', 'The Sheep：桌面上的互动童话书。可使用页面按钮或键盘操作。');
  textFont('Georgia, serif'); frameRate(40);
  Book.init(); WoolPainter.init();
  // Use a URL seed for repeatable flocks, or the current time for a new flock.
  const seed = new URLSearchParams(location.search).get('seed');
  NoiseMechanic.seed = seed !== null && /^\d+$/.test(seed) ? Number(seed) >>> 0 : Date.now() >>> 0;
  NoiseMechanic.newFlock(); Input.bind();
  document.getElementById('loading').hidden = true;
}
// Update the modules, then draw the desk and the current book state.
function draw() {
  // Limit the time step to avoid sudden movement after a paused tab resumes.
  const dt = min(deltaTime / 1000, .08);
  TimeMechanic.update(dt); Input.update(dt); MusicBox.update();
  if (Story.open) { NoiseMechanic.update(dt); Flock.update(dt); }
  background('#241a13'); push(); scale(sceneScale);
  Book.backdrop();
  push(); translate(720,500); scale(Book.viewScale); translate(-720,-500);
  if (Story.open) {
    if (Story.opening < 1) {
      Book.openingFrame();
    } else { Book.openBook(); Book.pageTurn(); }
  } else Book.cover();
  pop(); Book.finish(); pop();
}
// Resize the canvas and realign controls when the window size changes.
function windowResized() { const dimensions = fitScene(); resizeCanvas(...dimensions); Input.cancel(); Input.layoutCassetteControls(); }
