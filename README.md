# The Sheep

An interactive storybook made with p5.js for the Creative Coding final project.

An old book opens into a meadow of sheep, drifting clouds and changing light. Some sheep have wolf-shaped shadows. The viewer can turn pages, transform sheep into clouds and use music to change the animals' behaviour. The work combines three mechanics: time-based animation, user input, and Perlin noise and randomness.

## 1. Inspiration

The project brings together the softness of sheep and clouds with the uneasiness of a wolf hidden in a shadow. The book provides a familiar setting, while the unexpected transformations make its landscape feel alive.

The book, meadow and sheep setting came from the team's own concept. The leather cover, layered paper and wooden desk create the feeling of opening a small world. Rounded wool and soft colours make the sheep appear gentle, while the wolf-shaped shadows introduce uncertainty. The landscape and characters are drawn in code with p5.js and Canvas 2D rather than loaded as photographs or video assets.

The sheep-to-cloud-to-sheep sequence connects the interactions: holding a sheep changes its wool into a cloud, and some clouds later produce rain that creates another sheep. Seasonal scenery and gradual daylight changes extend this idea of a living landscape.

The concept and requested interactions originated with the team. AI assistance with their implementation is acknowledged in Section 6, and technical references are listed in Section 7.

## 2. Running the project

Download or clone the repository and keep all files in the same folder. Open `index.html` in a browser. Alternatively, serve the folder with VS Code Live Server, or run the following command from the project folder if Python 3 is installed:

```sh
python3 -m http.server 8000
```

Then open [the local project](http://localhost:8000).

The project includes its p5.js library and uses system fonts. No npm installation, build step, external font download or recorded music file is required. Start music through the playback control or keyboard shortcut.

## 3. Interaction instructions

Wait for the opening or page-turn animation to finish before interacting with the meadow.

| Input | Result |
| --- | --- |
| Click the front cover/clasp, or press **Enter** | Open the book and reveal the landscape. |
| Click the **lower-left page corner**, or press **Left Arrow** | Turn the page and generate a new flock with different positions, sizes and traits. |
| Click the **lower-right page corner**, or press **Right Arrow** | Advance through spring, summer, autumn and winter, then return to spring. |
| Click empty grass | Add a sheep if there is space away from trees, other sheep and the gramophone. |
| Hold a sheep for at least **0.6 seconds**, then release | Inflate its wool and replace the sheep with a rising cloud, provided the cloud limit has not been reached. |
| Drag a cloud, then release | Move it to a new position; its drifting movement then continues. |
| Drag upward or downward on an empty area of the page | Make the scene lighter or darker. A drag does not also add a sheep. |
| Press **N** | Switch the daylight target between day and night. |
| Move the pointer around the sheep | Change shadow direction smoothly; daylight also affects shadow length. |
| Click the cassette's play/pause control, or press **M** | Start or pause music. During the day, sheep with wolf shadows begin a chase; at night, sheep jump with individual heights and speeds. |
| Click the cassette's next-track control, or press **T** | Select the next of three melodies. |
| Press **H** | Show or hide the instructions. |

Mouse and touch input share the hold and drag logic. The canvas scales with the browser window, and the cassette controls are repositioned to match it.

Daylight changes automatically over a 120-second simulation cycle. Manual daylight input temporarily overrides the automatic target for 45 seconds. **Season changes are triggered by the page corner or keyboard in this version; they do not advance automatically.** Winter adds falling snow. Rain is produced by selected clouds rather than a separate weather button.

Clouds have random lifetimes of 10–16 seconds. During their final 1.7 seconds they fade and release particles. A rain cloud creates a sheep only if there is a valid space and the flock limit permits it. Cloud fading and sheep growth use the same progress value.

## 4. Mechanic ownership

| Team member | Mechanic | Main file | Responsibility |
| --- | --- | --- | --- |
| **Zixiang Zhu** | Time-based | `time-based.js` | Book opening, page-turn timing, content reveal, seasonal blending, automatic daylight and the temporary manual-light override. |
| **Xinyu Li** | User input | `user-input.js` | Pointer hit testing, clicks, holds, cloud dragging, daylight gestures, wool inflation, pointer-controlled shadows, keyboard/touch events and control positioning. |
| **Wenjia Zhao** | Perlin noise and randomness | `noise-random.js` | Flock generation, random individual traits, placement checks, chase parameters, cloud wind, random lifetimes and rain selection, sheep creation and particle cleanup. |

Shared supporting modules handle drawing, settings, music and integration. Each mechanic has its own script, while shared scene data allows the modules to work together.

For example, User input measures a hold and requests a transformation. Noise/randomness checks whether it is allowed and replaces the sheep with a cloud. The renderer displays the resulting state. During a page turn, Time-based updates the animation and changes the content once at its midpoint.

Individual contributions should be evidenced by each member's actual Git commits. The assessment requires at least three meaningful commits per member, excluding initial project setup.

## 5. Techniques and code organisation

### Time and transitions

`sketch.js` converts `deltaTime` from milliseconds to seconds and passes it to the update methods. The time step is capped at 0.08 seconds to avoid large jumps after a pause. Animation progress is updated using durations rather than a fixed number of frames. A cosine function supplies the automatic daylight target; interpolation softens lighting changes. Page content changes halfway through a turn, while seasonal images blend between states. Long pauses do not make the simulation catch up to wall-clock time.

### Perlin noise and randomness

An independent seeded linear congruential generator selects sheep traits and behaviour values. Keeping this sequence separate from the renderer's random texture generation prevents artwork generation from changing the flock's random sequence. An optional URL parameter such as `?seed=1927` repeats the initial flock layout.

Each sheep has its own size, wool variation, eye colour, jump parameters and chase parameters. Wolf shadows have a 28% selection probability, with a fallback to ensure at least one is present. Placement checks reject blocked areas and crowded positions; a separation pass reduces overlap during movement.

Clouds sample `noise()` over time for smooth wind changes, combined with a slow gust and a force towards the centre near page edges. Expired clouds and particles are removed. Entity limits of 45 sheep and 14 clouds keep repeated interaction bounded.

### Input and coordinates

Input is converted from scaled canvas coordinates into book coordinates before hit testing. Gesture state distinguishes a click, a sheep hold, a cloud drag and a daylight drag. Losing focus or starting a page turn cancels the current gesture. This prevents a single action from triggering several unrelated behaviours.

### Drawing and efficiency

The renderer uses p5.js shapes, transformations, colour blending and offscreen graphics. Canvas 2D provides gradients and clipping for the cover, paper and materials. Cached landscape, desk and wool images reduce repeated texture work. Sheep are drawn in depth order, and shadows scale with their sheep. Pixel density is capped for the main canvas, which is resized while keeping the scene's proportions.

### Sound

`music.js` uses Web Audio oscillators and gain envelopes to synthesise three fixed note sequences: *Meadow Waltz*, *Paper Moon*, and *The Wool & The Wind*. Notes are scheduled slightly ahead of playback. Music acts as a behaviour switch; the project does not analyse volume or frequency, and the sheep's movement is not beat-synchronised. Web Audio and the Canvas 2D material techniques are documented below as additional browser APIs.

### File guide

| File | Purpose |
| --- | --- |
| `index.html` | Page elements and script loading order. |
| `style.css` | Layout, help panel and cassette control styles. |
| `sketch.js` | p5.js setup, update/draw sequence and resizing. |
| `settings.js` | Shared settings, scene state and geometry. |
| `time-based.js` | Time-based mechanic. |
| `user-input.js` | User input mechanic. |
| `noise-random.js` | Perlin noise and randomness mechanic. |
| `renderer.js` | Book, desk, landscape, sheep, wolves, clouds and particles. |
| `music.js` | Synthesised melodies and playback controls. |
| `p5.min.js` | Bundled p5.js 1.11.3 library. |
| `p5-LICENSE.txt` | Licence accompanying the bundled library. |
| `README.md` | Project explanation, credits and instructions. |

## 6. AI acknowledgement

**OpenAI ChatGPT / Codex assisted with writing and modifying parts of this code.** Assistance included generating and refining parts of the three mechanics, organising modules, implementing procedural drawing and cloud transitions, producing the synthesised note sequences, and improving comments and documentation.

The assisted code works through shared state: input handlers request changes; elapsed-time updates advance transitions; random values define individual traits; Perlin noise changes cloud movement smoothly; and the renderer draws the resulting state. Audio uses oscillator frequencies and volume envelopes rather than imported recordings. Section 5 describes these implementation choices in more detail.

An earlier AI-assisted prototype was delivered as `p5js-storybook-integrated.zip`. Its included `AI_ACKNOWLEDGEMENT.md` identifies ChatGPT/Codex assistance with generating, modifying and refining the prototype. The staged sheep-to-cloud transition was subsequently adapted to the current entity structure. This is part of the project development history, rather than an independently authored external tutorial.

Each project JavaScript file includes an English AI assistance statement, with explanatory comments around the main operations and relevant technical references. The bundled p5.js library is third-party code and is not presented as team-authored or AI-generated code. The ownership table identifies the assigned mechanics; the Git history records individual work rather than implying that every line was written without assistance.

## 7. External references

### Technical references

| Source | Use in this project |
| --- | --- |
| [p5.js reference](https://p5js.org/reference/) | Drawing, transformations, canvas setup and global-mode functions. The bundled library's licence is included. |
| [p5.js deltaTime](https://p5js.org/reference/p5/deltaTime/) | Elapsed-frame timing used to advance animations in seconds. |
| [p5.js noise()](https://p5js.org/reference/p5/noise/) | Continuous noise sampling for cloud movement and procedural textures. |
| [p5.js randomSeed()](https://p5js.org/reference/p5/randomSeed/) | Seeded p5 randomness for artwork; a related reproducibility concept for the separate behaviour generator. |
| [p5.js mousePressed()](https://p5js.org/reference/p5/mousePressed/) | Mouse event handling connected to the shared input methods. |
| [MDN: CanvasRenderingContext2D](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) | Gradients, clipping, paths and material rendering accessed through the drawing context. |
| [MDN: Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) | Oscillators, gain envelopes and audio scheduling for the three melodies. |

These links document the APIs and techniques used; they do not imply that complete example implementations were copied. Relevant references are also included in source comments.

### Earlier project prototype

`p5js-storybook-integrated.zip` — an earlier prototype developed during this project's ChatGPT/Codex-assisted development process. Its included AI acknowledgement records assistance with the mechanics, drawing, cloud lifecycle, music and documentation. The staged `releaseSheep` / `updateCloud` logic informed the current wool-to-cloud transformation and was adapted to the current entity structure. No public publication URL has been established for this locally supplied prototype; its AI contribution is acknowledged in Section 6.

### Concept and visual assets

The old-book setting, meadow, sheep and wolf-shadow concept originated from the team's own ideas. No specific external artwork, photograph or video is claimed as the source of this concept. The running project draws its scenery and characters procedurally and does not include external image or video assets.

Original concept development is distinct from code authorship: ChatGPT/Codex assistance with procedural drawing and other implementation work is acknowledged in Section 6. The p5.js library remains a third-party dependency, with its licence included in the project.
