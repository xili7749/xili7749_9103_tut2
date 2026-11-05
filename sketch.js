// Connect the three mechanics and render the book in a fixed logical coordinate system.
// ChatGPT/Codex assisted with generating, modifying and refining this code.
let environment, world, input, music, renderer, canvas;
let viewport = { scale: 1, x: 0, y: 0 };
function setup() {
  canvas=createCanvas(windowWidth,windowHeight);
  canvas.parent('canvas-host');
  pixelDensity(Math.min(window.devicePixelRatio||1,2));
  environment=new TimeEnvironment();
  world=new NoiseRandomMechanic((x,y)=>noise(x,y));
  music=new MusicPlayer();
  input=new UserInputMechanic(world,environment,music);
  renderer=new StoryRenderer();
  updateViewport();
  input.bind(canvas,(clientX,clientY)=>{
    const bounds=canvas.elt.getBoundingClientRect();
    return {x:(clientX-bounds.left-viewport.x)/viewport.scale,y:(clientY-bounds.top-viewport.y)/viewport.scale};
  });
  describe('An interactive knitted storybook. Click its left edge to turn the page. Short-press sheep to look, long-press and release to turn them into clouds. Drag clouds. Click clear grass to add sheep. Drag empty space up for day and down for night. Move sideways to change shadows. Click the gramophone record to play or pause and its arrows to change tracks.');
}
function draw() {
  // Ignore time spent in a hidden tab, and limit large jumps after a stalled frame.
  const dt=document.hidden?0:Math.min(Math.max(deltaTime/1000,0),0.08);
  input.update(dt);environment.update(dt);music.update(dt);world.update(dt,environment,music.playing);
  background('#b9a58c');
  push();translate(viewport.x,viewport.y);scale(viewport.scale);
  renderer.draw(world,environment,input,music);
  pop();
  const hovering=input.hoverSheep||input.hoverCloud||input.musicAction(world.pointer)||(input.inBook(world.pointer)&&world.pointer.x<=108);
  cursor(input.active?'grabbing':hovering?'pointer':'default');
}
function updateViewport() {
  viewport.scale=Math.min(width/STORY_SETTINGS.width,height/STORY_SETTINGS.height);
  viewport.x=(width-STORY_SETTINGS.width*viewport.scale)/2;
  viewport.y=(height-STORY_SETTINGS.height*viewport.scale)/2;
}
function windowResized(){input.cancel();resizeCanvas(windowWidth,windowHeight);updateViewport();}
