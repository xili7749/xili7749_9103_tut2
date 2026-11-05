# The Sky Is Made of Sheep — Interactive Storybook

A p5.js prototype combining the group's **Time-based**, **User Input**, and **Perlin Noise / Randomness** mechanics. The scene is a knitted meadow inside an open book. Its visual objects, shadows and instruments are drawn in code; no image assets are required.

## Run

Keep the folder intact and open `index.html` in a browser with an internet connection. The page loads p5.js 1.11.11 from jsDelivr. Audio starts only after clicking the gramophone. A wide browser window is recommended; on a phone, landscape orientation gives the book more space.

This is a new integrated project. It does not replace the earlier time-based-only folder.

## Interactions

| Action | Result |
| --- | --- |
| Click the narrow left edge of the book | A page-turn animation refreshes the whole flock and the clouds. Seasons and music continue. |
| Hover over a sheep | A subtle stitched outline indicates the target. |
| Press a sheep for less than 0.75 seconds, then release | It raises/turns its head towards the pointer. A wolf shadow opens its jaw or lifts a paw. |
| Hold a sheep for at least 0.75 seconds, then release | Its wool expands while held. On release it becomes a cloud and rises into the sky. |
| Drag a floating or rising cloud | Move it within the sky. On release it resumes slow independent drifting. |
| Click clear ground | Add a randomly sized sheep at that point, if there is enough space. |
| Press empty space and drag vertically | Up moves towards daytime, down towards night. Move about 185 logical book units for a full change. |
| Move the pointer horizontally across the book | Change daylight shadow direction and extent. |
| Click the gramophone record | Play or pause music. The record rotates while playing. |
| Click the small left/right arrows below the gramophone | Choose the previous/next fixed track. |

The book contains no written UI labels. Sheep, clouds, the page edge and gramophone take precedence over empty-space gestures. A lighting drag never also creates a sheep. A short press and a long hold are intentionally different actions. Pointer capture prevents a drag from getting stuck if released outside the canvas.

## Behaviour

### Random flock and wolf shadows

A new page starts with 16–23 sheep. Sizes, positions, facing, small wool variations and behaviour parameters are assigned once when each sheep is created. Size-aware placement avoids other sheep, trees, the gutter and gramophone. A shuffled quarter of each initial flock receives wolf shadows (rounded to the nearest sheep). Later births and manually created sheep have a 25% wolf-shadow chance.

Ordinary sheep have ordinary silhouettes. Wolf silhouettes remain translucent shadows, with ears, a muzzle, tail and paws. They move subtly when idle and become more active after the sheep is short-pressed. Shadow dimensions scale with the sheep. The wolf and night reference images mentioned in the request were not attached to the latest message, so these designs are interpretations rather than reference matches.

### Clouds, rain and new sheep

Clouds rise from transformed sheep, or begin in the sky when a page is generated. The main sketch passes the real p5 `noise()` function into the randomness module. Each cloud has an independent noise offset. Nearby noise samples create gentle changing velocities rather than random jumps.

After 8–14 seconds of floating, a cloud begins a 3-second ending. About 38% of clouds attempt to rain; others break into small cross-shaped fragments and disappear. A rain cloud chooses a free landing position and grows one new sheep there. The newborn's growth and the cloud's opacity use the same smooth progress, so the sheep becomes fully visible as the cloud disappears. In winter, the cloud emits snow instead of rain while keeping the same birth behaviour. Dissolving/raining clouds are no longer draggable.

The project caps the flock at 36 and the cloud count at 14. If there is no safe birth position or capacity, the cloud dissolves without spawning. If the cloud limit is reached, releasing a long-held sheep makes it look up instead of deleting it. A dragged cloud pauses its lifetime and receives at least 3 seconds of further floating after release.

### Time and environment

Seasons automatically cycle every 6 seconds, with a 1.5-second colour transition. The full cycle takes 24 seconds. Trees change colour; spring has embroidered flowers, autumn has scattered leaves, and winter has pale tree tops and drifting snow. Night is blue-grey rather than black. Its stars, moon and randomly coloured glowing eyes remain visible. Eye colours change independently of music.

Day/night is controlled by the vertical gesture, with smooth lighting transitions. It is not automatically switched by a new season. Time is supplied from `deltaTime`; long frame gaps are capped and hidden-tab animation is paused to avoid sudden jumps.

### Music-controlled behaviour

The three built-in tracks are fixed original note sequences synthesised with Web Audio. They are not commercial recordings and do not need audio downloads. Music is a **behaviour switch**, not an input for beat or amplitude analysis.

- **Day + music:** only wolf-shadow sheep move around small random ellipses, with their shadows moving along in pursuit. Proposed movement is rejected if it would overlap another sheep or enter an obstacle.
- **Night + music:** sheep independently choose jump delays, durations and heights. Heights stay between 7 and 28 logical units. No jumps are synchronised to the musical beat.
- **Music paused:** running and jumping stop; ordinary environment changes and night eye glow continue.

To use your own recordings, put the files in an `assets/` folder and edit `src` in `music.js`, for example `src: 'assets/track-1.mp3'`. Keep each track's `src: null` to use its synthesised melody. The track names and built-in note arrays are also in that file. Referencing a local recording requires including that recording in the submitted folder.

## Structure and ownership

| File | Responsibility |
| --- | --- |
| `time-based.js` | `TimeEnvironment`: repeating seasons, colour blending, day/night brightness and smoothed sunlight direction. Time-based role: Zixiang Zhu, according to the supplied concept. |
| `user-input.js` | `UserInputMechanic`: hit testing priority, short/long press distinction, pointer capture, cloud dragging, page input, lighting gestures and music controls. User Input role: Xinyu Li, according to the concept. |
| `noise-random.js` | `NoiseRandomMechanic`: seeded flock variation, random wolf selection, Perlin cloud movement, cloud endings, rain births, eye colours, jumps and collision-safe chase movement. Noise/Randomness role: Wenjia Zhao (Isabella), according to the concept. |
| `music.js` | Shared fixed-track playback and rotating-record state. |
| `renderer.js` | Shared book, yarn scenery, silhouettes, animations and instrument drawing. |
| `settings.js` | Shared settings and small mathematical helpers. |
| `sketch.js` | Creates the modules, updates them once per frame, maps canvas coordinates and draws the book. |

These ownership labels reflect the planned team responsibilities, not claims that the supplied implementation was independently written by those people. The modules share objects through explicit constructor arguments. Time receives seconds; the renderer reads state and does not randomise appearances while drawing.

### Important settings

Edit `settings.js` to change season speed, the 0.75-second hold threshold, flock counts, wolf fraction, limits and cloud rain probability. Cloud lifetime and ending duration are in `noise-random.js`. Jump height bounds are in `updateSheep()`. All positions use a 1200 × 760 logical coordinate system, uniformly scaled and centred on resize, so hit testing and graphics stay aligned.

## Inspiration

The supplied concept *The Sky Is Made of Sheep* inspires the meadow and sheep-to-cloud transformation. The later project request introduced the book, wolf silhouettes, tactile knitted style, cloud-to-sheep cycle and gramophone. The team's final repository should include its actual visual reference links and credits. The missing wolf/night reference images have not been reproduced or attributed here.

## AI acknowledgement

ChatGPT/Codex assisted with generating, modifying and refining this integrated prototype, including the three mechanics, shared rendering, music synthesis, comments, documentation and development checks. The project owner specified the interactions, seasonal rules and requested revisions. Source files include English acknowledgement comments and explanations of their purpose.

The implementation accumulates time for seasons and transitions, uses random choices for stable variation and independent responses, samples Perlin noise for cloud velocities, and routes pointer gestures to the appropriate object or action. The team should review the code and record later work actually completed by each member. This package does not create or invent GitHub commits.

## External references

- [p5.js deltaTime](https://p5js.org/reference/p5/deltaTime/) — frame duration passed into time-dependent updates.
- [p5.js noise](https://p5js.org/reference/p5/noise/) — smoothly varying cloud velocities.
- [p5.js createGraphics](https://p5js.org/reference/p5/createGraphics/) — cached knitted texture.
- [MDN pointer capture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture) — reliable mouse/touch release handling beyond the canvas.
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — oscillators and gain envelopes for the original demo tracks.
- [Marsaglia, Xorshift RNGs](https://www.jstatsoft.org/article/view/v008i14) — the small xorshift32 generator used for reproducible random flock tests. It is not used for security.

## Validation and limits

Development checks covered 60 seeded flocks, wolf counts, initial spacing, page resets, short and long sheep presses, cloud release and drifting, empty-ground creation, vertical lighting gestures, synchronised rain births, dry cloud dissolution, daytime chase spacing and bounded night jumps. Offline drawing checks exercised every module, registered pointer callbacks, resizing and the texture cache. A mock Web Audio context checked playback scheduling, pause cleanup, track selection and asynchronous cancellation.

These checks do not replace actual p5.js browser, audible playback or real pointer-device testing. The provided previews are offline Canvas renderings. Browser interactions and audio still need to be checked on the presentation computer. The current wolf silhouette and night palette can be revised when the intended reference images are supplied.
