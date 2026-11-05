// This renderer creates a knitted meadow with felt trees and curled wool sheep.
// All textures are drawn in code, so no external image files are needed.
// Texture buffer reference: https://p5js.org/reference/p5/createGraphics/
// Canvas opacity and dashed stitches: https://p5js.org/reference/p5/drawingContext/

class MeadowScene {
  constructor() {
    // Store positions and sizes as part of the composition rather than changing them each frame.
    this.sheep = [
      [0.23, 0.27, 0.92, -0.23], [0.52, 0.33, 1.12, 0.17],
      [0.78, 0.42, 0.86, -0.34], [0.18, 0.63, 1.04, 0.12],
      [0.43, 0.70, 0.82, -0.17], [0.72, 0.78, 1.08, 0.25]
    ];
    this.trees = [[0.12, 0.04, 1.08], [0.67, 0.05, 0.91], [0.91, 0.10, 1.18]];

    // Build a small spiral once, then repeat it to suggest loops of wool.
    this.coil = [];
    for (let i = 0; i <= 27; i++) {
      const angle = i * 0.39;
      const radius = 1 + i * 0.25;
      this.coil.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
    }
    this.woolLoops = [
      [-24, -13], [-10, -20], [6, -21], [22, -13],
      [-30, 3], [-15, -2], [1, -4], [17, 2], [30, 3],
      [-23, 17], [-7, 15], [9, 17], [23, 17]
    ];
    this.flowers = Array.from({ length: 22 }, (_, i) => [
      (i * 0.618 + 0.08) % 1, (i * 0.427 + 0.16) % 1
    ]);
    this.texture = null;
    this.resize();
  }

  resize() {
    // Keep the yarn large enough to read on a phone while fitting the whole composition.
    this.sceneScale = Math.max(0.53, Math.min(width / 1000, height / 720));
    if (this.texture) this.texture.remove();
    this.texture = createGraphics(width, height);
    this.texture.pixelDensity(1);
    this.makeKnittedTexture();
  }

  makeKnittedTexture() {
    // Cache the dense knitted pattern and fibre marks so they are not rebuilt each frame.
    const g = this.texture;
    const stitch = Math.max(10, 17 * this.sceneScale);
    g.clear();
    g.noFill();
    for (let y = -stitch; y < height + stitch; y += stitch * 0.80) {
      for (let x = -stitch; x < width + stitch; x += stitch) {
        const lean = Math.sin(x * 0.071 + y * 0.039) * 1.1;
        g.stroke(36, 43, 29, 24);
        g.strokeWeight(2.8);
        g.bezier(x - 5, y - 4, x - 6, y + 1, x - 2, y + 6, x + lean, y + 8);
        g.bezier(x + 5, y - 4, x + 6, y + 1, x + 2, y + 6, x + lean, y + 8);
        g.stroke(255, 250, 222, 42);
        g.strokeWeight(1.2);
        g.bezier(x - 5, y - 5, x - 5, y, x - 2, y + 4, x + lean, y + 6);
        g.bezier(x + 4, y - 5, x + 5, y, x + 2, y + 4, x + lean, y + 6);
      }
    }
    g.strokeWeight(0.6);
    for (let i = 0; i < 1900; i++) {
      const x = ((i * 0.6180339) % 1) * width;
      const y = ((i * 0.7548776) % 1) * height;
      g.stroke(i % 2 ? 255 : 38, i % 2 ? 249 : 47, i % 2 ? 224 : 32, 28);
      g.line(x, y, x + Math.sin(i) * 5, y + Math.cos(i * 2) * 4);
    }
  }

  draw(state) {
    this.environment = state;
    const night = Timer.smooth(state.nightMix);
    this.wool = Timer.mix([244, 231, 203], [79, 86, 84], night);
    this.woolShadow = Timer.mix([199, 180, 147], [47, 61, 63], night);
    this.thread = Timer.mix([169, 147, 116], [42, 55, 57], night);
    this.face = Timer.mix([94, 76, 65], [35, 44, 48], night);

    push();
    colorMode(RGB, 255);
    ellipseMode(CENTER);
    rectMode(CORNER);
    angleMode(RADIANS);
    strokeCap(ROUND);
    background(...state.grassColour);
    this.drawFabric();
    this.drawFlowers();
    for (const [x, y, size] of this.trees) this.drawTree(x * width, y * height, size);
    for (const [x, y, size, angle] of this.sheep) this.drawSheep(x * width, y * height, size, angle);
    this.drawHem();
    pop();
  }

  drawFabric() {
    // Use broad fabric patches to give the field a sewn, layered surface.
    const base = this.environment.grassColour;
    noStroke();
    fill(...Timer.mix(base, [233, 218, 179], 0.09));
    ellipse(width * 0.22, height * 0.67, width * 1.14, height * 1.02);
    fill(...Timer.mix(base, [31, 55, 45], 0.08));
    ellipse(width * 0.94, height * 0.91, width * 0.90, height * 0.88);

    // Canvas opacity fades the cached texture without recolouring it every frame.
    push();
    drawingContext.globalAlpha = 0.35 + this.environment.brightness * 0.65;
    image(this.texture, 0, 0);
    pop();

    // Short dashed curves resemble a running stitch along the fabric joins.
    noFill();
    stroke(248, 237, 204, 85 * this.environment.brightness);
    strokeWeight(1.5);
    drawingContext.setLineDash([4, 7]);
    bezier(-20, height * 0.24, width * 0.30, height * 0.03,
      width * 0.64, height * 0.62, width * 0.64, height + 20);
    bezier(width * 0.5, height + 20, width * 0.40, height * 0.68,
      width * 0.77, height * 0.45, width + 20, height * 0.49);
    drawingContext.setLineDash([]);
  }

  drawFlowers() {
    // Sew small cross stitches into the field as spring flowers.
    const amount = this.environment.springAmount;
    if (amount <= 0) return;
    strokeWeight(2 * this.sceneScale);
    for (let i = 0; i < this.flowers.length; i++) {
      const [u, v] = this.flowers[i];
      const x = u * width, y = v * height, r = 3 * this.sceneScale;
      stroke(245, i % 2 ? 208 : 230, i % 2 ? 191 : 180, 200 * amount * this.environment.brightness);
      line(x - r, y - r, x + r, y + r);
      line(x + r, y - r, x - r, y + r);
    }
  }

  drawTree(x, y, size) {
    push();
    translate(x, y);
    scale(size * this.sceneScale);
    noStroke();
    fill(25, 34, 25, this.environment.shadowAlpha * 0.45);
    ellipse(5, 30, 139, 119);
    fill(...Timer.mix([127, 99, 74], [39, 48, 48], this.environment.nightMix));
    rect(-9, 39, 18, 48, 8);
    stroke(229, 206, 160, 60 * this.environment.brightness);
    strokeWeight(1.4);
    line(-3, 47, -3, 79);

    // Overlap felt circles and stitch around their edges.
    const colour = this.environment.treeColour;
    for (let i = 0; i < 7; i++) {
      const angle = i * Math.PI * 2 / 7;
      const cx = Math.cos(angle) * 34, cy = Math.sin(angle) * 31;
      noStroke();
      fill(...Timer.mix(colour, [235, 226, 187], (i % 3) * 0.035));
      ellipse(cx, cy, 75, 70);
      noFill();
      stroke(237, 227, 192, 88 * this.environment.brightness);
      strokeWeight(1.2);
      drawingContext.setLineDash([3, 5]);
      ellipse(cx, cy, 64, 59);
      drawingContext.setLineDash([]);
      stroke(30, 49, 33, 22 * this.environment.brightness);
      for (let k = 0; k < 10; k++) {
        const yy = cy - 20 + k * 4;
        line(cx - 20, yy, cx + 18, yy + 3);
      }
    }
    pop();
  }

  drawSheep(x, y, size, angle) {
    push();
    translate(x, y);
    rotate(angle);
    scale(size * this.sceneScale);
    noStroke();

    // Place a shallow shadow below the wool instead of a long realistic shadow.
    fill(35, 31, 23, this.environment.shadowAlpha * 0.65);
    ellipse(4, 10, 91, 66);
    fill(...this.face);
    rect(-25, 19, 9, 18, 4);
    rect(16, 19, 9, 18, 4);

    // Build the rounded silhouette from a base and overlapping yarn tufts.
    fill(...this.woolShadow);
    ellipse(0, 0, 80, 58);
    for (const [cx, cy] of this.woolLoops) {
      fill(...this.wool);
      ellipse(cx, cy, 25, 24);
      noFill();
      stroke(...this.thread, 140);
      strokeWeight(1.25);
      beginShape();
      for (const [px, py] of this.coil) vertex(cx + px, cy + py);
      endShape();
      noStroke();
    }

    // Loose short fibres soften the outline while staying fixed between frames.
    stroke(...this.wool, 170);
    strokeWeight(0.7);
    for (let i = 0; i < 54; i++) {
      const a = i * Math.PI * 2 / 54;
      const xx = Math.cos(a) * 42, yy = Math.sin(a) * 30;
      line(xx, yy, xx + Math.cos(a + 0.2) * 4, yy + Math.sin(a + 0.2) * 4);
    }

    // Give the sheep a small felt face and embroidered features.
    noStroke();
    fill(...this.face);
    ellipse(34, 1, 31, 37);
    ellipse(20, -11, 18, 9);
    ellipse(46, -9, 17, 9);
    noFill();
    stroke(...this.thread, 160);
    strokeWeight(1);
    drawingContext.setLineDash([2, 3]);
    ellipse(34, 1, 24, 30);
    drawingContext.setLineDash([]);
    noStroke();
    fill(250, 237, 204, 170 + this.environment.nightMix * 85);
    ellipse(28, 1, 2.6, 2.6);
    ellipse(40, 1, 2.6, 2.6);
    stroke(30, 25, 23, 180);
    strokeWeight(1.4);
    line(32, 10, 35, 12);
    line(35, 12, 38, 10);
    pop();
  }

  drawHem() {
    // A quiet running stitch frames the textile without becoming an interface.
    noFill();
    stroke(246, 233, 204, 100 * this.environment.brightness);
    strokeWeight(1.6);
    drawingContext.setLineDash([5, 7]);
    rect(11, 11, width - 22, height - 22, 14);
    drawingContext.setLineDash([]);
  }
}
