// AI (ChatGPT/Codex) assisted with writing and modifying parts of this code.

// This object draws the book and its seasonal landscape.
// Drawing reference: https://p5js.org/reference/
window.Book = {
  W: 1440, H: 1000, viewScale: 1.17,
  toPage(x,y){return {x:720+(x-720)/this.viewScale,y:500+(y-500)/this.viewScale};},
  toScreen(x,y){return {x:720+(x-720)*this.viewScale,y:500+(y-500)*this.viewScale};}, seasonNames: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'],
  // Store the grass, leaf and flower colours for each season.
  palettes: [
    { ground: '#99ab70', dark: '#405c3b', leaf: '#68834b', flower: '#e1c9b4' },
    { ground: '#9ca35b', dark: '#3f5436', leaf: '#607943', flower: '#efdf9f' },
    { ground: '#b7a173', dark: '#63553b', leaf: '#9b673d', flower: '#d2a35c' },
    { ground: '#c6c9b7', dark: '#52605b', leaf: '#7d8b7f', flower: '#f4f0da' }
  ],
  setPalette(index){
    // Use the green meadow palette for all four seasonal paintings.
    index=1;
    this.artPalette=index;
    const grounds=['#99ab70','#9ca35b','#a6a16b','#c6c9b7'];
    this.palettes=this.palettes.map((p,i)=>({...p,ground:grounds[i],dark:'#405c3b'}));
    if(!this.paintingCache)this.paintingCache={};
    if(!this.paintingCache[index])this.paintingCache[index]=this.palettes.map((p,i)=>this.paintMeadow(p,i));
    this.landscapes=this.paintingCache[index];
  },
  // Prepare the desk, paper, brush and leather textures once at startup.
  init() {
    this.desk = this.makeDesk();
    this.paper = createGraphics(this.W, this.H);
    this.paper.pixelDensity(1);
    this.paper.loadPixels();
    let seed = 41;
    for (let i = 0; i < this.paper.pixels.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const v = seed >>> 24;
      this.paper.pixels[i] = this.paper.pixels[i + 1] = this.paper.pixels[i + 2] = v > 127 ? 255 : 43;
      this.paper.pixels[i + 3] = v > 127 ? 5 : 4;
    }
    this.paper.updatePixels();
    // Create the brush texture once so it stays consistent between frames.
    this.brush = createGraphics(256,256); this.brush.pixelDensity(1); this.brush.loadPixels();
    for (let y=0;y<256;y++) for(let x=0;x<256;x++) {
      const i=(y*256+x)*4, n=noise(x*.06,y*.09);
      const ridge=sin(x*.8+y*.34+noise(x*.02,y*.02)*18);
      const v=constrain(128+(n-.5)*210+ridge*20,0,255);
      this.brush.pixels[i]=v; this.brush.pixels[i+1]=v*.95; this.brush.pixels[i+2]=v*.82; this.brush.pixels[i+3]=90;
    } this.brush.updatePixels();
    this.setPalette(0);
    this.leather = createGraphics(540, 635); this.leather.pixelDensity(1);
    this.leather.noStroke(); randomSeed(79);
    // Layer soft patches and small dots to create the leather texture.
    for (let y = 8; y < 627; y += 7) for (let x = 44; x < 533; x += 7) {
      const n = noise(x * .017, y * .017);
      this.leather.fill(n > .5 ? '#d5ad6520' : '#21150e25');
      this.leather.ellipse(x, y, 22 + n * 24, 18 + n * 20);
    }
    for (let i = 0; i < 12000; i++) {
      this.leather.fill(i % 2 ? '#cfac6620' : '#1f140e24');
      this.leather.ellipse(random(44, 533), random(7, 627), random(.4, 4), random(.4, 3));
    }
  },
  // Create one landscape image for each season.
  paintMeadow(p, season) {
    const g = createGraphics(1000, 500); g.pixelDensity(1);
    randomSeed(521 + season); noiseSeed(93);
    const sky=['#bcd5d5','#a7ccd5','#d2c8c1','#c7d6df'][season];
    g.background(sky);g.noStroke();
    // Draw repeated V-shaped stitches across the grass.
    g.fill(p.ground);g.beginShape();g.vertex(0,500);
    for(let x=0;x<=1000;x+=5)g.vertex(x,SceneGeometry.horizon(x));
    g.vertex(1000,500);g.endShape(CLOSE);
    g.noFill();g.stroke(68,98,57,42);g.strokeWeight(.85);
    for(let y=172;y<500;y+=9)for(let x=5+(y%18?5:0);x<1000;x+=11){
      if(y<SceneGeometry.horizon(x)+5)continue;
      g.bezier(x-4,y-4,x-5,y,x-2,y+4,x,y+5);
      g.bezier(x+4,y-4,x+5,y,x+2,y+4,x,y+5);
    }
    g.noStroke();
    if (season === 0) for (let i = 0; i < 46; i++) {
      const x = random(30, 970), y = random(175, 470);
      if (y < SceneGeometry.horizon(x)+12) continue;
      g.stroke('#5b7748'); g.strokeWeight(1); g.line(x, y, x, y - 8); g.noStroke();
      g.fill(i % 2 ? '#e8c9ae' : '#eee0bb');
      for (let j = 0; j < 5; j++) g.ellipse(x + cos(j * TWO_PI / 5) * 3, y - 9 + sin(j * TWO_PI / 5) * 3, 4, 5);
      g.fill('#d6ae53'); g.circle(x, y - 9, 3);
    }
    for(const tree of SceneGeometry.trees)this.paintTree(g,tree,p,season);
    this.paintPageMusic(g);
    return g;
  },
  // Change the tree colours with the season and add snow in winter.
  paintTree(g,tree,p,season){
    const x=(tree.x-235)/998*1000,y=(tree.y-185)/635*500,r=tree.r*.85;
    g.noStroke();g.fill('#51644a22');g.ellipse(x+18,y+5,r*1.8,r*.45);
    g.fill('#926f50');g.rect(x-5,y-42,10,48,4);g.stroke('#d0ac7a66');g.strokeWeight(.8);g.line(x-2,y-23,x-2,y+2);g.noStroke();
    const leaf=['#72956c','#63865e','#ad885b','#a4b5a1'][season];
    const lobes=[];
    for(let i=0;i<7;i++){const a=i*TWO_PI/7;lobes.push([x+cos(a)*r*.45,y-43+sin(a)*r*.34]);}
    g.fill(leaf);g.ellipse(x,y-43,r*1.7,r*1.5);
    for(const [xx,yy]of lobes)g.ellipse(xx,yy,r,r*.85);
    g.noFill();g.stroke('#d4d7ae66');g.strokeWeight(.65);g.drawingContext.setLineDash([2,4]);
    for(const [xx,yy]of lobes)g.ellipse(xx,yy,r*.78,r*.66);
    g.drawingContext.setLineDash([]);g.noStroke();
    if(season===3){g.fill('#e6ead9b8');g.ellipse(x-6,y-63,r*1.1,r*.25);}
  },
  paintPageMusic(g){
    // Draw the gramophone near the lower-left corner of the page.
    const x=(330-235)/998*1000,y=(718-185)/635*500;
    g.push();g.translate(x,y);g.noStroke();g.fill('#3c3a2933');g.ellipse(4,16,86,24);
    g.fill('#87613f');g.rect(-33,-8,67,30,4);g.fill('#b38a55');g.rect(-33,-11,67,19,4);
    g.fill('#343c35');g.ellipse(0,-3,39,15);g.fill('#bdac73');g.ellipse(0,-3,11,4);
    g.noFill();g.stroke('#846339');g.strokeWeight(5);g.bezier(20,-5,39,-24,10,-37,9,-48);
    g.noStroke();g.fill('#b38d50');g.triangle(11,-36,-14,-61,30,-61);g.fill('#d4bc7c');g.ellipse(8,-61,45,15);g.fill('#7d7046');g.ellipse(8,-61,32,8);g.pop();
  },
  // Trace the page outline for drawing and clipping the landscape.
  pagePath(ctx) {
    ctx.beginPath();
    ctx.moveTo(239, 202); ctx.bezierCurveTo(420, 173, 623, 181, 720, 208);
    ctx.bezierCurveTo(850, 181, 1075, 182, 1230, 210);
    ctx.lineTo(1224, 797); ctx.bezierCurveTo(1040, 816, 845, 790, 720, 820);
    ctx.bezierCurveTo(585, 794, 390, 818, 237, 790); ctx.closePath();
  },
  openBook() {
    const ctx = drawingContext;
    push(); noStroke();
    ctx.shadowColor = '#100c09bb'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 18;
    fill('#302219'); rect(213, 181, 1036, 649, 12);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    fill('#60472e'); rect(215,178,1033,642,9);
    this.patina(215,178,1033,642,.65);
    stroke('#9b7545'); strokeWeight(1.5); noFill(); rect(223, 185, 1016, 628, 6);
    // Draw offset paper edges to show the thickness of the book.
    for (let i = 8; i > 0; i--) {
      ctx.save(); ctx.translate(0, i * 1.8); this.pagePath(ctx);
      ctx.fillStyle = i % 2 ? '#b8aa7e' : '#d0c295'; ctx.fill(); ctx.restore();
    }
    this.pagePath(ctx);
    const grad = ctx.createLinearGradient(230, 0, 1230, 0);
    [[0, '#dacb96'], [.06, '#e9dcaa'], [.43, '#e6d8a7'], [.49, '#b6a375'], [.5, '#897650'], [.515, '#c7b586'], [.57, '#ecdfb2'], [.92, '#e7d9a6'], [1, '#c7b886']].forEach(([v, c]) => grad.addColorStop(v, c));
    ctx.fillStyle = grad; ctx.fill();
    ctx.save(); this.pagePath(ctx); ctx.clip();
    ctx.save(); this.pagePath(ctx); ctx.clip(); ctx.globalAlpha = Story.reveal;
    const season = Story.season;
    image(this.landscapes[season], 235, 185, 998, 635);
    if (Story.previousSeason !== season && Story.seasonBlend < 1) {
      tint(255, (1 - Story.seasonBlend) * 255); image(this.landscapes[Story.previousSeason], 235, 185, 998, 635); noTint();
    }
    noStroke();
    const night = Story.night;
    fill(16, 37, 59, night * 160); rect(235, 185, 998, 635);
    this.nightDetails(night);
    // Use elapsed time for falling snow and noise for sideways movement.
    if (season === 3) {
      for (let i = 0; i < 65; i++) {
        const x = 263 + ((i * 71 + noise(i, Story.elapsed * .1) * 40) % 930);
        const y = 278 + ((i * 67 + Story.elapsed * (8 + i % 9)) % 457);
        fill(255, 249, 227, 120); circle(x, y, 1 + i % 3);
      }
    }
    NoiseMechanic.drawClouds(false);
    Flock.draw();
    NoiseMechanic.drawClouds(true);
    ctx.restore();
    ctx.restore();
    // Draw a transparent crease over the centre of the open book.
    ctx.save(); this.pagePath(ctx); ctx.clip();
    const crease = ctx.createLinearGradient(680, 0, 758, 0);
    [[0, '#40351f00'], [.42, '#40351f22'], [.51, '#40351f77'], [.56, '#f6e9b02b'], [1, '#40351f00']].forEach(([v, c]) => crease.addColorStop(v, c));
    ctx.fillStyle = crease; ctx.fillRect(678, 195, 82, 630);
    const volume=ctx.createLinearGradient(237,0,1224,0);
    [[0,'#493f3140'],[.025,'#f5e5b32a'],[.18,'#fff0c30c'],[.44,'#342d2414'],[.488,'#322e2650'],[.50,'#302b2480'],[.525,'#e4d4a326'],[.72,'#fff4ca05'],[.975,'#7d735527'],[1,'#3b382e44']].forEach(([p,c])=>volume.addColorStop(p,c));
    ctx.fillStyle=volume;ctx.fillRect(237,185,998,635);
    image(this.paper, 0, 0);
    ctx.restore();
    
    pop();
  },
  nightDetails(n) {
    push();noStroke();
    fill(249,222,143,(1-n)*230);circle(1055,276,39);
    fill(255,239,183,(1-n)*55);circle(1052,273,30);pop();
    if (n < .03) return;
    noStroke(); fill(242, 233, 180, n * 205); circle(1119, 316, 25);
    fill(45, 66, 72, n * 220); circle(1128, 311, 22);
    for (let i = 0; i < 31; i++) {
      fill(241, 230, 177, n * (70 + 70 * sin(i + Story.elapsed)));
      circle(285 + (i * 173) % 890, 282 + (i * 37) % 100, i % 4 === 0 ? 2.5 : 1.2);
    }
  },
  cover(amount = 0) {
    push(); translate(720, 185);
    const eased = amount * amount * (3 - 2 * amount);
    drawingContext.transform(cos(eased * PI), -sin(eased * PI) * .09, 0, 1, 0, 0);
    scale(lerp(510, 495, eased) / 540, 1);
    if (amount > .5) {
      // Keep the leather border and inner lining visible while the cover opens.
      
      const ctx=drawingContext;
      ctx.shadowColor='#17140d66';ctx.shadowBlur=12;ctx.shadowOffsetY=8;
      noStroke();fill('#33271e');rect(-9,-6,553,663,10);
      ctx.shadowBlur=0;ctx.shadowOffsetY=0;
      fill('#62482f');rect(-5,-5,545,646,8);image(this.leather,0,0);
      noFill();stroke('#a38655');strokeWeight(1);rect(3,3,530,628,5);
      noStroke();fill('#c5b58a');rect(11,20,518,608,4);
      fill('#e0d1a1');rect(14,22,511,601,3);
      ctx.save();ctx.beginPath();ctx.rect(14,22,511,601);ctx.clip();
      image(this.paper,0,0,540,635);ctx.restore();
      stroke('#9a895e66');strokeWeight(1);line(523,24,523,620);
      pop();return;
    }
    const ctx = drawingContext;
    ctx.shadowColor = '#110c09ba'; ctx.shadowBlur = 32; ctx.shadowOffsetY = 20;
    noStroke(); fill('#3c291d'); rect(-9, -6, 553, 663, 12);
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    for (let i = 0; i < 7; i++) { fill(i % 2 ? '#ad9c70' : '#d2c298'); rect(11, 25 + i * 2, 524, 625, 4); }
    fill('#62482f'); rect(0, 0, 540, 635, 7);
    image(this.leather, 0, 0);
    fill('#392c20'); rect(0, 0, 28, 635, 4);
    stroke('#967547'); strokeWeight(1); noFill(); rect(38, 20, 481, 593, 3);
    textFont('URW Chancery L, cursive'); textStyle(ITALIC); textSize(87);
    textAlign(CENTER, CENTER); noStroke(); fill('#c0a679'); text('sheep', 285, 307); textStyle(NORMAL);
    // Draw the clasp used to open the book.
    fill('#302218'); rect(504, 291, 54, 65, 6); fill('#997d44'); rect(510, 297, 47, 51, 5);
    fill('#c2a25b'); rect(516, 304, 35, 36, 4); fill('#58452b'); circle(533, 321, 9);
    
    pop();
  },
  openingFrame() {
    // Rotate the front cover around the spine while the pages stay in place.
    const ctx = drawingContext;
    ctx.save(); ctx.beginPath(); ctx.rect(720, 150, 600, 730); ctx.clip(); this.openBook(); ctx.restore();
    this.cover(Story.opening);
    if (abs(Story.opening-.5)<.04) {
      push();stroke('#51402c');strokeWeight(4);line(720,180,720,829);pop();
    }
    if (Story.opening > .94) {
      ctx.save(); ctx.beginPath(); ctx.rect(180, 150, 540, 730); ctx.clip();
      ctx.globalAlpha = (Story.opening - .94) / .06; this.openBook(); ctx.restore();
    }
  },
  pageTurn() {
    if (Story.turn <= 0) return;
    const t = Story.turn * Story.turn * (3 - 2 * Story.turn);
    const direction = Story.turnKind === 'season' ? 1 : -1;
    const angle = t * PI, ctx = drawingContext;
    // Draw the turning page as narrow strips connected to the spine.
    const point = (u, bottom) => ({
      x: 720 + direction * (cos(angle) * 492 * u + sin(angle) * 70 * sin(PI * u)),
      y: (bottom ? 820 - 23 * u : 208 - 10 * u) - sin(angle) * 62 * sin(u * HALF_PI)
    });
    ctx.save(); ctx.shadowColor = '#382b1935'; ctx.shadowBlur = 14;
    for (let i = 0; i < 40; i++) {
      const u = i / 40, v = (i + 1) / 40;
      const a = point(u, false), b = point(v, false), c = point(v, true), d = point(u, true);
      const shade = 1 - sin(angle) * .14 * sin(u * PI);
      ctx.fillStyle = `rgb(${230 * shade},${216 * shade},${170 * shade})`;
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.lineTo(c.x,c.y); ctx.lineTo(d.x,d.y); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  },
  patina(x,y,w,h,strength=.5,oval=false) {
    const ctx=drawingContext; ctx.save(); ctx.beginPath();
    if(oval) ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,TWO_PI); else ctx.rect(x,y,w,h);
    ctx.clip(); ctx.globalAlpha *= strength; ctx.globalCompositeOperation='multiply';
    image(this.brush,x,y,w,h); ctx.restore();
  },
  finish() {
    const ctx = drawingContext;
    const vignette = ctx.createRadialGradient(710, 450, 200, 720, 490, 880);
    vignette.addColorStop(0, '#1a130c00'); vignette.addColorStop(.6, '#1a130c12'); vignette.addColorStop(1, '#120e0acc');
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, this.W, this.H);
    noStroke();fill('#b6a17c');textFont('Georgia, serif');
    textAlign(RIGHT, CENTER); textSize(10); text(Story.open ? 'a little patience, a little wonder' : 'a story is waiting to unfold', 1225, 890);
  }
};

// Draw the desk on a graphics buffer that can be reused each frame.
// Canvas 2D reference: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
window.PaintedDesk = {
  create() {
    const g=createGraphics(1440,1000);g.pixelDensity(1);const c=g.drawingContext;
    let seed=27831; const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const gradient=(x,y,x2,y2,stops)=>{const a=c.createLinearGradient(x,y,x2,y2);stops.forEach(([p,v])=>a.addColorStop(p,v));return a;};
    const box=(x,y,w,h,r,ink)=>{c.fillStyle=ink;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();};
    const ellipse=(x,y,rx,ry,ink)=>{c.fillStyle=ink;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
    const line=(x,y,xx,yy,ink,width=1)=>{c.strokeStyle=ink;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
    const shade=(blur=15,x=5,y=10)=>{c.shadowColor='#100f0cbb';c.shadowBlur=blur;c.shadowOffsetX=x;c.shadowOffsetY=y;};
    const clear=()=>{c.shadowBlur=0;c.shadowOffsetX=c.shadowOffsetY=0;};
    const scumble=(x,y,w,h,n,ink)=>{c.fillStyle=ink;for(let i=0;i<n;i++){const xx=x+rand()*w,yy=y+rand()*h;c.fillRect(xx,yy,.3+rand()*7,.25+rand()*1.5);}};
    // Draw wooden planks with curved grain and small colour variations.
    box(0,0,1440,1000,0,'#59412c');
    const edges=[0,127,347,582,808,1000];
    for(let board=0;board<5;board++){
      const top=edges[board],h=edges[board+1]-top;
      c.fillStyle=gradient(0,top,1350,top+h,[[0,'#967549'],[.3,'#8c6940'],[.65,'#5b442e'],[1,'#42382b']]);c.fillRect(0,top,1440,h);
      for(let j=0;j<h;j+=1.2){const y=top+j;c.beginPath();
        for(let x=0;x<=1460;x+=12){const yy=y+Math.sin(x*.004+j*.09)*3+Math.sin(x*.019+j*.021)*1.8; x?c.lineTo(x,yy):c.moveTo(x,yy);}
        c.strokeStyle=j%5<2?'#201d1730':'#d2a46b26';c.lineWidth=.3+rand()*1.4;c.stroke();}
      scumble(0,top,1440,h,1000,'#dec18a18');scumble(0,top,1440,h,1100,'#211f191b');
      line(0,top+2,1440,top+2,'#29261d',3);line(0,top+5,1440,top+5,'#bea07066');
    }
    for(const [x,y] of [[74,510],[1330,660],[1090,946]]){
      c.save();c.translate(x,y);for(let i=1;i<24;i++){c.beginPath();c.ellipse(0,0,i*4,i*1.25,0,0,Math.PI*2);c.strokeStyle='#2f2c2044';c.lineWidth=.7;c.stroke();}c.restore();
    }
    // Draw the loose papers and their folded edges.
    const paper=(x,y,w,h,a)=>{c.save();c.translate(x,y);c.rotate(a);shade(14,4,8);
      box(-w/2,-h/2,w,h,1,gradient(-w/2,-h/2,w/2,h/2,[[0,'#e8dbb3'],[.55,'#cebc8d'],[1,'#97876b']]));clear();
      scumble(-w/2,-h/2,w,h,2200,'#776b4c12');line(-w/2+2,-h/2+2,w/2-2,-h/2+2,'#fff0c6b0');
      c.strokeStyle='#6b705336';c.lineWidth=.7;for(let i=0;i<10;i++)line(-w/2+20,-h/2+35+i*16,w/2-30,-h/2+35+i*16,'#74725330');
      c.restore();};
    paper(372,100,350,260,-.15);paper(705,980,410,220,.15);paper(688,1005,390,210,-.08);
    c.save();c.translate(366,116);c.rotate(-.15);c.strokeStyle='#77755255';c.lineWidth=.7;c.beginPath();c.arc(0,0,62,0,Math.PI*2);c.stroke();line(-90,0,100,0,'#77755255');line(0,-90,0,90,'#77755255');c.restore();
    // Draw the cassette case, label, reels and screws.
    c.save();c.translate(CassetteGeometry.x,CassetteGeometry.y);c.rotate(CassetteGeometry.angle);c.scale(CassetteGeometry.scale,CassetteGeometry.scale);shade(16,7,11);
    box(-84,-65,182,128,8,'#171e1b');clear();
    box(-84,-69,178,122,7,gradient(-84,-69,94,53,[[0,'#5d6559'],[.18,'#303a32'],[.8,'#171f1a'],[1,'#54564a']]));
    box(-76,-60,161,99,3,gradient(0,-60,0,39,[[0,'#e1d5ae'],[.65,'#c6bc97'],[1,'#a79f7d']]));
    box(-71,-21,151,45,1,'#ad8553');box(-60,-14,129,35,4,'#101b18');
    for(const x of [-32,43]){ellipse(x,3,16,16,'#c0b78e');ellipse(x,3,12,12,'#242d26');
      for(let a=0;a<6;a++){c.save();c.translate(x,3);c.rotate(a*Math.PI/3);box(7,-2,5,4,0,'#d8cda5');c.restore();}}
    box(-52,-44,42,27,4,'#ddd3ae');box(16,-44,37,27,4,'#ddd3ae');
    line(-14,4,25,4,'#626c55',.7);c.fillStyle='#545842';c.font='italic 12px Georgia,serif';c.fillText('sheep · side A',-61,-48);
    for(const [x,y] of [[-73,-56],[83,-56],[-73,42],[83,42]]){ellipse(x,y,3,3,'#a2a38e');line(x-1,y-2,x+1,y+2,'#242e26');}
    for(let i=0;i<14;i++)line(-74,-66+i*.7,82,-66+i*.7,'#d1c8a61c');
    scumble(-82,-64,174,116,1200,'#b9bba022');scumble(-70,-57,145,32,300,'#5a604225');
    c.strokeStyle='#25281e';c.lineWidth=2;c.beginPath();c.moveTo(23,55);c.bezierCurveTo(114,110,-50,120,32,162);c.stroke();c.restore();
    // Use highlights and shadows to draw the brass compass.
    c.save();c.translate(180,830);c.rotate(-.22);shade(20,9,13);ellipse(0,4,88,87,'#342e20');clear();
    ellipse(0,0,85,85,gradient(-65,-75,65,80,[[0,'#f1d296'],[.2,'#c4a363'],[.45,'#695a35'],[.65,'#b69955'],[1,'#413b27']]));
    ellipse(0,0,76,76,'#6d633f');ellipse(0,0,70,70,gradient(-45,-55,60,65,[[0,'#dbcd9d'],[.55,'#b6aa7b'],[1,'#807956']]));
    for(let i=0;i<120;i++){const a=i*Math.PI/60,r=i%10?65:59;line(Math.sin(a)*68,Math.cos(a)*68,Math.sin(a)*r,Math.cos(a)*r,'#696548',i%10?.5:1);}
    c.fillStyle='#565640';c.font='12px Georgia,serif';c.textAlign='center';['N','E','S','W'].forEach((v,i)=>c.fillText(v,Math.sin(i*Math.PI/2)*45,-Math.cos(i*Math.PI/2)*45+4));
    c.save();c.rotate(.7);c.fillStyle='#364238';c.beginPath();c.moveTo(0,-54);c.lineTo(-8,7);c.lineTo(8,7);c.fill();c.fillStyle='#d6d0af';c.beginPath();c.moveTo(0,54);c.lineTo(-8,-7);c.lineTo(8,-7);c.fill();ellipse(0,0,5,5,'#8e804d');c.restore();
    c.save();c.beginPath();c.arc(0,0,70,0,Math.PI*2);c.clip();c.fillStyle=gradient(-70,-70,70,70,[[0,'#fff6d54a'],[.35,'#ffffdc08'],[.6,'#23352b08'],[1,'#18291c55']]);c.fillRect(-70,-70,140,140);
    line(-55,-21,27,-56,'#ffffe42b',8);scumble(-70,-70,140,140,600,'#4d513817');c.restore();
    for(let i=0;i<80;i++){const a=rand()*Math.PI*2,r=78+rand()*5;line(Math.cos(a)*r,Math.sin(a)*r,Math.cos(a+.025)*r,Math.sin(a+.025)*r,'#ebd59c66',.7);}c.restore();
    // Draw the candle and its brass holder.
    c.save();c.translate(1320,159);shade(16,8,10);ellipse(0,0,45,21,'#50472c');clear();
    ellipse(0,-5,43,19,gradient(-35,-20,35,12,[[0,'#d8ba72'],[.5,'#8a783f'],[1,'#4e482c']]));
    box(-20,-75,40,69,5,gradient(-20,0,20,0,[[0,'#8f8251'],[.22,'#ddcb8d'],[.5,'#e3d39a'],[1,'#96885c']]));
    scumble(-19,-71,38,63,650,'#88774620');ellipse(0,-74,20,8,'#e5d49b');ellipse(1,-74,10,4,'#96814e');
    for(const [x,y] of [[-13,-42],[-4,-58],[10,-53]]){line(x,-71,x,y,'#ecda9d',4);ellipse(x,y,2.5,4,'#e0cc8f');}
    line(0,-75,1,-83,'#383627',2);c.restore();
    // Draw the pens with separate colours for wood and painted surfaces.
    c.save();c.translate(938,925);c.rotate(-.55);shade(5,2,5);
    box(-128,0,250,12,5,gradient(0,0,0,12,[[0,'#9da98a'],[.25,'#4d6852'],[.55,'#304b39'],[1,'#172d23']]));clear();
    box(80,0,6,12,0,'#bfa367');c.fillStyle='#c0aa73';c.beginPath();c.moveTo(120,0);c.lineTo(142,6);c.lineTo(120,12);c.fill();line(122,6,139,6,'#615b37');line(-120,2,76,2,'#d2d6b04a');
    box(-99,25,235,7,1,gradient(0,25,0,32,[[0,'#be8050'],[.4,'#945336'],[1,'#582f24']]));c.fillStyle='#c7a46e';c.beginPath();c.moveTo(136,25);c.lineTo(157,28);c.lineTo(136,32);c.fill();line(152,28,157,28,'#37372d',2);c.restore();
    // Apply a soft light and shadow layer across the desk.
    const glow=c.createRadialGradient(250,65,30,470,270,1100);glow.addColorStop(0,'#fbe2a62b');glow.addColorStop(.5,'#e8c68908');glow.addColorStop(1,'#14232235');c.fillStyle=glow;c.fillRect(0,0,1440,1000);
    return g;
  },
  movingDetails(){
    push();translate(1320,159);noStroke();fill('#eeb66d');ellipse(0,-91,11+sin(Story.elapsed*3)*.6,27);fill('#fff0b4');ellipse(0,-88,5,16);pop();
    push();translate(CassetteGeometry.x,CassetteGeometry.y);rotate(CassetteGeometry.angle);scale(CassetteGeometry.scale);
    if(MusicBox.playing) for(const x of [-32,43]){push();translate(x,3);rotate(Story.elapsed*.8);stroke('#e2d8ac');strokeWeight(1.5);line(-7,0,7,0);pop();}pop();
  }
};
Book.makeDesk=function(){return PaintedDesk.create();};
Book.backdrop=function(){image(this.desk,0,0);PaintedDesk.movingDetails();};

// Cache wool images for the sheep and their transition into clouds.
window.WoolPainter={
  sprites:[],
  init(){
    for(let night=0;night<2;night++)for(let variant=0;variant<8;variant++){
      const g=createGraphics(160,140);g.pixelDensity(2);const c=g.drawingContext;
      const wool=night?'#b7c5bd':'#f3e7bf',thread=night?'#80988e':'#c5b58c';
      const lobes=[];
      for(let i=0;i<12;i++){
        const a=i*Math.PI*2/12,r=16+(i+variant)%4;
        lobes.push({x:80+Math.cos(a)*38,y:66+Math.sin(a)*24,r});
      }
      c.fillStyle=wool;c.beginPath();c.ellipse(80,66,47,32,0,0,Math.PI*2);c.fill();
      for(const p of lobes){c.beginPath();c.ellipse(p.x,p.y,p.r,p.r*.9,0,0,Math.PI*2);c.fill();}
      const curls=[[-29,-15],[-10,-22],[12,-21],[31,-12],[-39,2],[-20,0],[0,-2],[20,1],[39,5],[-25,18],[-4,18],[18,20]];
      c.strokeStyle=thread;c.lineWidth=1.5;c.lineCap='round';
      for(let k=0;k<curls.length;k++){
        const [x,y]=curls[k];c.beginPath();
        for(let i=0;i<44;i++){
          const a=i*.19+variant*.13,r=.4+i*.12;
          const xx=80+x+Math.cos(a)*r,yy=66+y+Math.sin(a)*r;
          i?c.lineTo(xx,yy):c.moveTo(xx,yy);
        }c.stroke();
      }
      this.sprites.push(g);
    }
  },
  draw(variant,x,y,w,h,night=0){
    const id=Math.floor(variant)%8;image(this.sprites[id],x-w/2,y-h/2,w,h);
    if(night>.01){push();tint(255,night*255);image(this.sprites[id+8],x-w/2,y-h/2,w,h);pop();}
  }
};

// These methods draw sheep, shadows and wolves from their current state.
Object.assign(Flock, {
  draw() {
    // Sort sheep by vertical position so nearer animals appear in front.
    const sorted = [...this.sheep].sort((a, b) => a.y - b.y);
    for (const s of sorted) this.shadow(s);
    const figures = sorted.map(s=>({y:s.y,s,wolf:false}));
    for(const s of sorted) if(s.wolf && s.wolfReveal > .02) figures.push({y:s.wolfY,s,wolf:true});
    figures.sort((a,b)=>a.y-b.y).forEach(v=>v.wolf?this.drawWolf(v.s):this.body(v.s));
  },
  // Scale each shadow with its sheep and rotate it towards the light direction.
  shadow(s) {
    if (s.growth <= .01) return;
    push(); translate(s.x, s.y + 6); scale(s.size * s.growth);
    rotate(s.shadowAngle); scale(.75 + abs(Story.sun) * .6, 1);
    noStroke(); fill(25,40,30,lerp(100,62,Story.night));
    if (!s.wolf || s.wolfReveal > .01) {
      drawingContext.save(); if(s.wolf) drawingContext.globalAlpha *= s.wolfReveal;
      ellipse(27,0,79,13);ellipse(63,-1,17,10);drawingContext.restore();
    }
    if(s.wolf && s.wolfReveal < .99) {
      drawingContext.save();drawingContext.globalAlpha *= (1-s.wolfReveal)*.43;
      translate(24,-2);scale(.78,.38);this.wolfShape(0,false);drawingContext.restore();
    }
    pop();
  },
  wolfShape(gait, painted) {
    // Draw the wolf outline with four legs, pointed ears and a long tail.
    // Reuse this outline for both the wolf shadow and the visible wolf.
    const coat = painted ? '#59635d' : '#24372c';
    noStroke();fill(coat);
    beginShape();vertex(-28,-16);bezierVertex(-47,-19,-48,-3,-70,-2);vertex(-60,7);vertex(-52,5);vertex(-47,9);bezierVertex(-32,4,-22,-6,-22,-12);endShape(CLOSE);
    for(let i=0;i<4;i++){
      const fore=i>1, x=fore?23:-24, phase=gait+(i%2)*PI+(fore?PI*.6:0);
      const knee=x+sin(phase)*9, paw=x+sin(phase)*17, lift=max(0,cos(phase))*7;
      fill(painted?(i%2?'#424e48':'#69756b'):coat);
      beginShape();vertex(x-5,-2);vertex(x+4,-1);vertex(knee+3,14-lift*.4);vertex(paw+5,28-lift);vertex(paw+11,29-lift);vertex(paw+10,32-lift);vertex(paw-2,32-lift);vertex(knee-3,16-lift*.4);endShape(CLOSE);
    }
    fill(coat);beginShape();vertex(-33,-14);bezierVertex(-18,-24,5,-23,24,-22);vertex(35,-34);vertex(40,-48);vertex(46,-36);vertex(53,-45);vertex(55,-30);vertex(62,-22);vertex(78,-16);vertex(80,-11);vertex(65,-8);vertex(60,-3);vertex(50,-6);vertex(40,0);bezierVertex(24,8,-15,10,-32,2);vertex(-38,-5);endShape(CLOSE);
    if(!painted)return;
    fill('#919787');beginShape();vertex(-27,-17);bezierVertex(-9,-24,12,-19,27,-21);vertex(37,-31);vertex(42,-34);vertex(39,-20);vertex(26,-12);bezierVertex(7,-13,-13,-12,-27,-17);endShape(CLOSE);
    fill('#b4b5a0');beginShape();vertex(35,-19);vertex(44,-26);vertex(53,-22);vertex(62,-16);vertex(75,-14);vertex(58,-11);vertex(51,-5);vertex(41,-1);vertex(31,-4);endShape(CLOSE);
    fill('#333e38');triangle(40,-44,43,-34,38,-34);triangle(52,-40,53,-30,48,-33);
    fill('#232c29');ellipse(77,-14,8,5);triangle(57,-12,73,-10,63,-5);
    fill('#e7dbb8');triangle(60,-11,64,-10,62,-6);triangle(68,-10,71,-10,69,-7);
    fill('#d1b777');ellipse(54,-24,3,2);fill('#252f27');circle(55,-24,1.2);
    stroke('#aeb19b66');strokeWeight(.7);
    for(let i=0;i<22;i++){const x=-27+(i*17)%63,y=-17+(i*7)%19;line(x,y,x+5,y-2);}noStroke();
    if(MusicBox.playing){fill('#b98579');ellipse(68,-5+sin(gait*.4),7,3);}
  },
  drawWolf(s) {
    push();const emerged=s.wolfReveal;
    translate(lerp(s.x,s.wolfX,emerged),lerp(s.y,s.wolfY,emerged));
    drawingContext.globalAlpha *= emerged;
    const facing=s.x>s.wolfX?1:-1;
    noStroke();fill(24,36,27,55);ellipse(0,12,64*s.size,13*s.size);
    scale(s.size*.65*facing,s.size*.65*(.4+.6*emerged));
    translate(0,-abs(sin(Story.elapsed*7+s.seed))*3);
    this.wolfShape(Story.elapsed*7+s.seed,true);pop();
  },
  body(s) {
    if (s.growth <= .01) return;
    let jump = 0;
    if (MusicBox.playing && Story.night > .5) {
      const wave = sin(Story.elapsed * s.jumpSpeed + s.seed);
      jump = max(0, wave) ** 1.5 * s.jumpHeight;
    }
    if (MusicBox.playing && Story.night < .5 && s.wolf) jump = abs(sin(Story.elapsed * 5 + s.seed)) * 7;
    const look = false;
    const facing = look ? (Input.point.x > s.x ? 1 : -1) : s.facing;
    push(); translate(s.x, s.y - jump); scale(s.size * s.growth);
    noStroke(); fill('#4c4938'); rect(-11, 1, 4, 11, 2); rect(6, 1, 4, 10, 2);
    push(); scale(1+s.puff*.85);
    WoolPainter.draw(s.woolVariant,0,-12,66,58,Story.night);pop();
    push(); scale(facing, 1);
    const headY = look ? -17 : -9;
    fill('#705945');ellipse(20,headY,18,20);ellipse(11,headY-6,10,5);ellipse(29,headY-6,10,5);
    fill('#f3e7bf');circle(16.5,headY-1,2.7);circle(23.5,headY-1,2.7);
    noFill();stroke('#382f29');strokeWeight(.8);arc(20,headY+4,6,4,0,PI);noStroke();
    if(Story.night>.25){
      colorMode(HSB,360,100,100,1);
      for(const x of [16.5,23.5]){fill(s.eyeHue,45,100,Story.night*.15);circle(x,headY-1,8);fill(s.eyeHue,35,100,Story.night);circle(x,headY-1,2.7);}
      colorMode(RGB,255);
    }
    pop();
    // Draw a small ring to show the progress of a long press.
    if (Input.held?.sheep === s) {
      noFill(); stroke('#ead8a3'); strokeWeight(1.3);
      arc(0, -10, 59, 47, -HALF_PI, -HALF_PI + min(1, Input.held.duration / 1.5) * TWO_PI);
    }
    pop();
  }
});

// These methods draw clouds, rain and fading particles.
Object.assign(NoiseMechanic, {
  drawClouds(front) {
    noStroke();
    for (const c of this.clouds) {
      const progress = constrain((c.age - (c.life - 4)) / 4, 0, 1);
      if (!front && c.rain && c.newborn && progress > 0) {
        // Draw rain between the cloud and its growing sheep.
        stroke(185, 212, 207, 140 * (1 - progress)); strokeWeight(1);
        for (let i = 0; i < 23; i++) {
          const f = (i / 23 + Story.elapsed * .9) % 1;
          const x = lerp(c.x, c.newborn.x, f) + sin(i * 9) * 17;
          const y = lerp(c.y + 6, c.newborn.y, f);
          line(x, y, x - 1, y + 6);
        }
        noStroke();
      }
      if (!front) continue;
      push(); translate(c.x, c.y); scale(c.size);
      const opacity=(1-progress)*(c.fromSheep?1:min(1,c.age*1.4))*(c.ambient?.8:1);
      const morph=constrain(c.age/1.8,0,1), startScale=1+c.sourcePuff*.85;
      const w=lerp(66*startScale,108,morph), h=lerp(58*startScale,64,morph);
      push();drawingContext.globalAlpha *= opacity;WoolPainter.draw(c.sourceVariant,0,0,w,h,Story.night);pop();
      if(c.fromSheep && c.age<.45){
        push();drawingContext.globalAlpha *= (1-c.age/.45)*opacity;
        fill('#414f54');ellipse(w*.27,1,12,16);rect(-12,15,4,10);rect(12,15,4,10);pop();
      }
      pop();
    }
    if (!front) return;
    for (const p of this.particles) {
      const alpha = (1 - p.age / p.life) * 210;
      fill(245, 231, 175, alpha); circle(p.x, p.y, p.size);
      if (p.size > 2.5) { stroke(249, 237, 195, alpha * .8); strokeWeight(.7); line(p.x - 3, p.y, p.x + 3, p.y); line(p.x, p.y - 3, p.x, p.y + 3); noStroke(); }
    }
  }
});
