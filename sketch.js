// AI acknowledgement: ChatGPT/Codex assisted with generating, modifying and refining
// the module integration, input handling and resizing in this module.
// This file connects the environment, input and rendering modules.
// The project owner specified the interactions and requested a faster seasonal cycle.

// These settings control the pace of the automatic season changes.
const SETTINGS = {
  seasonLength: 6000,
  transitionLength: 1500
};

// Each object has one job: state, weather drawing, scene drawing or input detection.
let timer;
let weather;
let scene;
let cornerInput;

// Store the last touch time to avoid processing the same action as a mouse click.
let lastTouchTime = -Infinity;

function setup() {
  // Create the full-window canvas and attach it to the page if a container exists.
  const canvas = createCanvas(windowWidth, windowHeight);
  if (document.getElementById('canvas-host')) canvas.parent('canvas-host');
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2));

  // Create the modules once instead of rebuilding them in draw().
  timer = new Timer(SETTINGS);
  weather = new WeatherRenderer();
  scene = new MeadowScene();
  cornerInput = new CornerInput();

  // Describe the hidden interactions for screen readers without adding visible text.
  describe('A meadow cycles through four seasons. Click the upper-right corner to toggle rain or winter snow. Click the lower-right corner to switch day and night.');
}

function draw() {
  // Update time first so both renderers use the same state in this frame.
  timer.update(deltaTime);
  const environment = timer.getState();

  // Draw the meadow before placing the weather over it.
  scene.draw(environment);
  weather.draw(environment, width, height);
}

function mousePressed() {
  // Ignore a synthetic mouse event that arrives just after a touch.
  if (millis() - lastTouchTime < 500) return;
  if (cornerInput.handleClick(mouseX, mouseY, width, height, timer)) return;

  // Add the group's sheep interaction here for clicks outside the hidden corners.
}

function touchStarted() {
  // Handle the first finger and prevent the browser from scrolling the canvas.
  if (touches.length !== 1) return false;
  lastTouchTime = millis();
  const touch = touches[0];
  if (cornerInput.handleClick(touch.x, touch.y, width, height, timer)) return false;

  // Add the group's touch interaction here for positions outside the hidden corners.
  return false;
}

function windowResized() {
  // Update object scale and corner regions after resizing the canvas.
  resizeCanvas(windowWidth, windowHeight);
  scene.resize();
  cornerInput.getRegions(width, height);
}
