// This helper detects the two hidden corner regions without drawing any interface.
// The project owner specified the upper-right weather and lower-right day/night actions.

class CornerInput {
  constructor() {
    // Cache the regions until the canvas size changes.
    this.interactionRegions = null;
  }

  getRegions(w, h) {
    // Reuse the same regions until the canvas dimensions change.
    if (this.interactionRegions && this.layoutWidth === w && this.layoutHeight === h) {
      return this.interactionRegions;
    }

    // Place two invisible regions directly against the right corners of the canvas.
    const regionWidth = Math.min(180, w * 0.22);
    const regionHeight = Math.min(150, h * 0.25);
    this.layoutWidth = w;
    this.layoutHeight = h;
    this.interactionRegions = {
      weather: { x: w - regionWidth, y: 0, w: regionWidth, h: regionHeight },
      night: { x: w - regionWidth, y: h - regionHeight, w: regionWidth, h: regionHeight }
    };
    return this.interactionRegions;
  }

  handleClick(x, y, w, h, timer) {
    // Ignore positions outside the canvas before checking the two corner regions.
    if (x < 0 || x >= w || y < 0 || y >= h) return false;
    const regions = this.getRegions(w, h);
    const inside = region => x >= region.x && x < region.x + region.w
      && y >= region.y && y < region.y + region.h;

    // The upper-right corner switches rain or snow on and off.
    if (inside(regions.weather)) {
      timer.toggleWeather();
      return true;
    }

    // The lower-right corner switches between daytime and night-time.
    if (inside(regions.night)) {
      timer.toggleNight();
      return true;
    }

    // Return false so the group's input module can handle clicks elsewhere.
    return false;
  }

}

// Export the helper for input checks outside the browser.
if (typeof module !== 'undefined') module.exports = { CornerInput };
