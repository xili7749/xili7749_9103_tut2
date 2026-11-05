// AI (ChatGPT/Codex) assisted with writing and modifying parts of this code.

// This object updates the book animations, seasonal transitions and daylight.
// deltaTime reference: https://p5js.org/reference/p5/deltaTime/
window.TimeMechanic = {
  // Start opening the cover only if the book is still closed.
  open() {
    if (Story.open) return;
    Story.open = true; Story.opening = .001;
    Story.notice = ('故事书打开了。长按小羊可以放出云朵。');
  },
  // Start one page turn after the opening animation has finished.
  turn(kind) {
    if (!Story.open || Story.turn > 0 || Story.opening < 1) return;
    Story.reveal = 0; Story.turn = .001; Story.turnKind = kind; Story.turnSwapped = false;
  },
  // Set the daylight target and temporarily pause automatic lighting changes.
  setNight(value) {
    Story.targetNight = constrain(value, 0, 1);
    Story.manualLightUntil = Story.elapsed + ProjectConfig.time.manualLightSeconds;
  },
  // Switch the daylight target between day and night.
  toggleNight() {
    Story.targetNight = Story.targetNight > .5 ? 0 : 1;
    Story.manualLightUntil = Story.elapsed + ProjectConfig.time.manualLightSeconds;
  },
  // Advance animation progress using the number of seconds since the last frame.
  update(dt) {
    Story.elapsed += dt;
    if (!Story.open) return;
    Story.opening = min(1, Story.opening + dt / ProjectConfig.time.openSeconds);
    if (Story.opening === 1 && Story.turn === 0) Story.reveal = min(1, Story.reveal + dt / ProjectConfig.time.revealSeconds);
    Story.cycleTime += dt;
    // Resume the automatic day and night cycle after the manual override ends.
    if (Story.elapsed > Story.manualLightUntil) Story.targetNight = (1 - cos(Story.cycleTime * TWO_PI / ProjectConfig.time.dayNightSeconds)) / 2;
    Story.night = lerp(Story.night, Story.targetNight, min(1, dt * 1.6));
    Story.seasonBlend = min(1, Story.seasonBlend + dt / ProjectConfig.time.seasonBlendSeconds);
    if (Story.turn > 0) {
      Story.turn += dt / ProjectConfig.time.turnSeconds;
      // Change the page content once, halfway through the turn.
      if (Story.turn >= .5 && !Story.turnSwapped) {
        Story.turnSwapped = true; Story.page++;
        if (Story.turnKind === 'season') {
          Story.previousSeason = Story.season; Story.season = (Story.season + 1) % 4; Story.seasonBlend = 0;
          Story.notice = ('季节：' + ['春', '夏', '秋', '冬'][Story.season]);
        } else { NoiseMechanic.newFlock(); Story.notice = ('新的一页，新的羊群。'); }
      }
      if (Story.turn >= 1) Story.turn = 0;
    }
  }
};
