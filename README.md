# The Sky Is Made of Sheep — Knitted meadow

This folder contains the time-based member's p5.js module and a knitted-meadow demonstration. It is a component for the group project, not the complete team's final submission.

## Run and interact

Keep the entire folder together, including index.html, style.css and all five JavaScript files. Open `index.html` in a browser with an internet connection. The page loads p5.js 1.11.11 from jsDelivr. No image or audio assets are required. If the canvas does not appear, check the connection and browser console.

The artwork contains **no visible text, buttons or icons**. Interaction uses two invisible regions directly against the right edge:

- **Upper-right corner:** click to enable or disable weather. Spring, summer and autumn use rain; winter uses snow.
- **Lower-right corner:** click to switch between day and night.
- Touching the same regions performs the same actions on a touch device. No HTML buttons or keyboard controls are included in this version.

Each region is 22% of the canvas width (up to 180 pixels) and 25% of its height (up to 150 pixels). These regions resize with the canvas. Clicks elsewhere are available for the group's sheep interactions.

Seasons automatically progress from spring to summer, autumn and winter. Each season lasts 6 seconds (24 seconds for a full cycle); its last 1.5 seconds blend into the next colour palette. Weather fades on/off over approximately 1.2 seconds, and lighting changes over approximately 2 seconds. Both switches persist across season changes. At a winter boundary, the active particle type changes to snow; when spring starts, it changes back to rain. Rain and snow are not drawn together.

## Visual style

The meadow uses a muted yarn-and-felt style: a cached knitted field, running stitches, six curled-wool sheep and layered felt trees. Small fibre marks and slight variations in the stitches give the surface a handmade character. Soft local shadows replace the long shadows of the earlier demo. Rain resembles pale threads, and winter snow uses warm-white dots. Everything is drawn with code; there are no external bitmap assets.

The texture buffer is generated once during setup and rebuilt on resize, rather than regenerated every frame. It is drawn with reduced opacity at night. The timing, hidden input regions and rain/snow rules remain the same.

## Inspiration

The supplied group concept, *The Sky Is Made of Sheep*, imagines an interactive pasture where sheep can become clouds. Its landscape references informed the top-down meadow, small flock, directional shadows and seasonal palettes. Gradual changes in colour and brightness suggest the passage of time. The fixed sheep and trees here are placeholders for the other members' work.

The team's final README should include the original links and credits for its visual and transformation references; they are not invented here.

## Techniques and design decisions

- **Time:** `Timer.update(deltaTime)` accumulates milliseconds. Division and modulo determine the current season and progress. This keeps season duration independent of frame count.
- **Colours:** `Timer.mix()` uses `a + (b - a) * t` for each RGB channel. `Timer.smooth()` uses the curve `t²(3 − 2t)` to soften the start and end of seasonal transitions. Night palettes retain some seasonal colour.
- **Transitions:** `moveTowards()` moves a value towards a target without overshooting it. The weather and night targets are independent, and another click can reverse an unfinished transition.
- **Rain and snow:** A pool of 240 particle descriptors is created once. Between 60 and 240 particles are drawn according to the viewport area. Rain uses fast, slanted lines. Snow uses small, slower circles with sinusoidal horizontal drift. Rendering is skipped when weather is fully off. The weather type follows the current season, independently of the colour blend near its end.
- **Input:** `handleClick()` checks only the hidden corner regions and returns whether the click was consumed. This prevents a corner interaction from also creating a sheep. `touchStarted()` prevents the default browser action; a short timestamp guard ignores a duplicate mouse event after touch.
- **Efficiency:** Sheep positions, wool spiral points and particle descriptors are initialized once. Wool colours are calculated once per frame. The dense fabric texture is cached in a p5.Graphics buffer and rebuilt only on resize; the old buffer is removed first. Interaction regions are cached until the canvas dimensions change. There are no control elements to update in the DOM.
- **Resizing:** The canvas follows the window, object positions use normalized coordinates, and object scale follows the viewport. Pixel density is capped at 2.

## File structure and mechanic ownership

| File / mechanic | Responsibility |
| --- | --- |
| `time-based.js` | `Timer`: computes the environment state. No p5 drawing or mouse handling. Time-based responsibility is assigned to Zixiang Zhu in the concept presentation; this is a role assignment, not a claim of independent code authorship. |
| `weather.js` | `WeatherRenderer`: draws rain or snow from an environment snapshot. |
| `corner-input.js` | `CornerInput`: detects the two hidden regions and calls `toggleWeather()` or `toggleNight()`. This is a helper for this environment demo, not the other member's full User Input mechanic. |
| `scene.js` | `MeadowScene`: draws the placeholder meadow, trees and sheep. Replace it when integrating the real group scene. |
| `sketch.js` | Sets the timing values, creates the objects and connects the p5 lifecycle functions. |
| `index.html` | Loads p5.js, the environment module and the sketch. Contains no buttons. |
| User Input | Xinyu Li, according to the concept. Sheep creation/transformation and pointer-controlled shadows are to be integrated from that member's module. |
| Perlin Noise / Randomness | Wenjia Zhao (Isabella), according to the concept. Flock variation, cloud drift and music-enabled variation are to be integrated from that member's module. |

## Module flow and integration

`sketch.js` updates `Timer`, takes one environment snapshot, then sends that same snapshot to `MeadowScene` and `WeatherRenderer`. `CornerInput` only changes the controller's targets; it does not draw or calculate transitions. The scene also uses the small `Timer.mix()` colour helper.

The HTML loads the files in this order: `time-based.js`, `weather.js`, `corner-input.js`, `scene.js`, `sketch.js`. These are separate script files using p5 global mode, so no package manager or build step is needed.

To integrate with the group's scene, keep the first three helper modules and merge these calls into the existing lifecycle functions. Do not overwrite the group's main sketch or define duplicate lifecycle functions.

```js
// Declare these objects at sketch scope.
let timer;
let weather;
let cornerInput;

// Create the objects inside the existing setup() function.
timer = new Timer({ seasonLength: 6000, transitionLength: 1500 });
weather = new WeatherRenderer();
cornerInput = new CornerInput();

// At the start of the existing draw(), update time and read the shared state.
timer.update(deltaTime);
const environment = timer.getState();

// Draw the group's scene here, using the environment colours and brightness.

// At the end of draw(), place rain or snow over the scene.
weather.draw(environment, width, height);

// At the start of mousePressed(), let the hidden corners consume their own clicks.
if (cornerInput.handleClick(mouseX, mouseY, width, height, timer)) return;
// Continue with the group's sheep interaction for other positions.
```

This excerpt shows where each call belongs; it is not a complete standalone sketch. Copy the touch handling from `sketch.js` if needed, keeping the guard against duplicate mouse events. To change the demo pace, edit `SETTINGS` at the top of `sketch.js`; values are in milliseconds.

The state snapshot provides:

| Field | Meaning |
| --- | --- |
| `season` / `seasonName` | Season index (0 spring, 1 summer, 2 autumn, 3 winter) and English name. The name is not drawn. |
| `elapsed` / `springAmount` | Elapsed milliseconds for particle motion and the blended spring weight for flowers. |
| `seasonProgress` | Progress from 0 to 1 within the current season. |
| `isNight` / `nightMix` | Night flag, switching halfway through the transition, and its 0–1 transition value. |
| `brightness` / `shadowAlpha` | Scene brightness and shadow visibility. Input still controls shadow direction and length. |
| `grassColour` / `treeColour` / `skyColour` | RGB arrays for the scene renderer. Use `fill(...environment.grassColour)`, for example. |
| `weatherEnabled` / `weatherAmount` | Weather switch and fading intensity. |
| `weatherType` | `rain` outside winter, `snow` in winter, even when the weather switch is off. |
| `rainAmount` / `snowAmount` | Separate intensity values; only the active type can be nonzero. |

Use p5's default RGB 0–255 colour mode when applying the colour arrays. Call `getState()` again after every update to obtain a fresh snapshot. `getSeasonWeight(index)` can fade seasonal details with the same palette transition.

Compared with the earlier package, `Timer` no longer owns particles, input regions or drawing methods. Use `weather.draw(environment, width, height)` for weather and `cornerInput.handleClick(..., timer)` for input. Use `cornerInput.getRegions(width, height)` when refreshing the input layout.

## AI acknowledgement

The project owner specified the intended interaction: automatic seasons, hidden upper-right weather control, hidden lower-right day/night control, winter snow and a faster season cycle. These are the human design decisions documented in the conversation.

ChatGPT/Codex generated and revised the JavaScript implementation and HTML, including timing, interpolation, particle rendering, the placeholder scene, hit testing, input wiring and this modular refactor. It also assisted with comments, documentation and automated checks. The AI assistance is documented here and in AI_ACKNOWLEDGEMENT.md; source-code AI attribution comments have been removed at the project owner’s request. The generated implementation has not been relabelled as independently human-written code.

The controller accumulates milliseconds, computes the season, blends colours and moves lighting/weather values towards their targets. The renderers read its state, while the input helper toggles targets. This separation makes each part easier to understand and replace.

See `AI_ACKNOWLEDGEMENT.md` for a concise statement and file-by-file scope. This record applies only to this supplied component; the team should describe its other work separately. Any later independent contributions should be identified by the actual changes and development history, without assigning an unsupported human/AI percentage.

## External references

- [p5.js deltaTime](https://p5js.org/reference/p5/deltaTime/) — elapsed-frame timing API.
- [p5.js lerpColor](https://p5js.org/reference/p5/lerpColor/) — colour interpolation reference. This module uses an independent RGB-array helper rather than calling `lerpColor()`.
- [p5.js createGraphics](https://p5js.org/reference/p5/createGraphics/) — offscreen texture caching.
- [p5.js drawingContext](https://p5js.org/reference/p5/drawingContext/) — opacity and dashed seam lines through the Canvas 2D context.
- [p5.js](https://p5js.org/) — rendering library, loaded from the pinned CDN URL in the HTML.

The code also includes the timing and interpolation references. No third-party sheep or weather implementation was copied into this prototype.

## Submission and validation status

This folder preserves a separate mechanic file, English explanatory code comments and an AI acknowledgement. The final group repository still needs the other members' modules and references, and each member's own meaningful development commits. The supplied brief requires at least three per member, excluding initial setup; this package does not fabricate a commit history.

JavaScript syntax, the 6-second season cycle, rain/snow selection, persistent switches, transition reversal, hidden-region boundaries, frame-rate independence and drawing calls were checked. Desktop and narrow-screen output was inspected using an offline Canvas adapter. These checks are not real browser testing. Actual p5.js browser rendering, native touch/mouse behaviour and integration with the other members' modules still require verification in the final project.
