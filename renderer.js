// Draw the storybook, knitted landscape, sheep, wolf shadows and gramophone.
// ChatGPT/Codex assisted with generating, modifying and refining this code.
// Offscreen texture reference: https://p5js.org/reference/p5/createGraphics/
// Canvas clipping and dashed stitches: https://p5js.org/reference/p5/drawingContext/
class StoryRenderer {
  constructor() {
    this.texture = createGraphics(1200, 760);
    this.texture.pixelDensity(1);
    this.makeTexture();
    this.coil = [];
    for (let i = 0; i <= 19; i++) {
      const angle = i * 0.48, radius = 0.8 + i * 0.19;
      this.coil.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
    }
    this.loops = [[-16,-8],[-6,-13],[5,-12],[16,-7],[-19,3],[-7,1],[5,1],[19,3],[-12,12],[1,12],[13,12]];
  }
  makeTexture() {
    const g = this.texture;
    g.noFill();
    for (let y = 318; y < 690; y += 12) {
      for (let x = 90; x < 1110; x += 15) {
        g.stroke(35,51,31,19); g.strokeWeight(2);
        g.bezier(x-4,y-4,x-6,y+1,x-2,y+5,x,y+7);
        g.bezier(x+4,y-4,x+6,y+1,x+2,y+5,x,y+7);
        g.stroke(255,249,224,30); g.strokeWeight(0.8);
        g.bezier(x-4,y-5,x-5,y,x-1,y+3,x,y+5);
        g.bezier(x+4,y-5,x+5,y,x+1,y+3,x,y+5);
      }
    }
    for (let i=0; i<1800; i++) {
      const x=90+((i*0.61803)%1)*1020, y=90+((i*0.75487)%1)*590;
      g.stroke(248,238,210,22); g.strokeWeight(0.6);
      g.line(x,y,x+Math.sin(i)*5,y+Math.cos(i)*3);
    }
  }
  draw(world, environment, input, music) {
    this.world=world; this.environment=environment; this.input=input; this.music=music;
    push(); colorMode(RGB,255); rectMode(CORNER); ellipseMode(CENTER); angleMode(RADIANS); strokeCap(ROUND);
    this.drawBook();
    push();
    // Keep sky, weather and movement inside the two paper pages.
    drawingContext.beginPath(); drawingContext.rect(88,88,1024,588); drawingContext.clip();
    this.drawLandscape();
    this.drawCloudRain();
    for (const sheep of world.sheep) this.drawShadow(sheep);
    const objects=[...world.sheep.map(s=>({y:s.y,kind:'sheep',object:s})),...STORY_SETTINGS.trees.map(t=>({y:t.y+20,kind:'tree',object:t}))];
    objects.sort((a,b)=>a.y-b.y);
    for (const item of objects) if(item.kind==='tree')this.drawTree(item.object);else this.drawSheep(item.object);
    for (const cloud of world.clouds) this.drawCloud(cloud);
    this.drawWinterSnow();
    this.drawRipples();
    pop();
    this.drawBinding();
    this.drawGramophone();
    this.drawPageTurn();
    pop();
  }
  drawBook() {
    noStroke();
    fill(54,40,34,35); rect(62,63,1084,650,25);
    fill('#71574b'); rect(54,47,1092,657,20);
    fill('#a68a70'); rect(61,52,1078,644,15);
    for(let i=0;i<5;i++) {fill(225-i*5,210-i*5,180-i*4);rect(68+i,59+i*3,1064-i*2,631,9);}
    fill('#f0e5cd');rect(75,65,525,622,7);rect(600,65,525,622,7);
    noFill();stroke('#d3c2a2');strokeWeight(1);rect(84,77,509,601,3);rect(607,77,509,601,3);
    // The folded left edge is the page-turn hit region; it carries no text label.
    noStroke();fill('#d4c2a3');triangle(75,294,104,320,75,346);
    stroke('#92785f');strokeWeight(1.8);noFill();line(92,312,84,320);line(84,320,92,328);
  }
  drawLandscape() {
    const e=this.environment;
    noStroke();fill(...e.sky);rect(88,88,1024,588);
    this.drawSkyLights();
    fill(...StoryMath.colour(e.grass,[210,216,184],0.15));
    ellipse(370,493,1100,452);ellipse(1035,477,860,420);
    fill(...e.grass);rect(88,327,1024,349);
    fill(...StoryMath.colour(e.grass,[235,221,184],0.07));ellipse(295,602,1040,480);
    push();drawingContext.globalAlpha=0.35+e.brightness*0.6;image(this.texture,0,0);pop();
    noFill();stroke(247,235,203,70*e.brightness);strokeWeight(1.2);drawingContext.setLineDash([4,7]);
    bezier(88,385,365,315,400,590,540,682);
    bezier(650,683,750,493,977,430,1115,458);
    drawingContext.setLineDash([]);
    const spring=e.weight(0),autumn=e.weight(2);
    for(let i=0;i<45;i++) {
      const x=125+((i*0.618)%1)*950,y=345+((i*0.437)%1)*300;
      if(spring>0){stroke(246,213,190,160*spring*e.brightness);strokeWeight(2);line(x-2,y-2,x+2,y+2);line(x+2,y-2,x-2,y+2);}
      if(autumn>0){noStroke();fill(164,98,62,95*autumn*e.brightness);push();translate(x,y);rotate(i);ellipse(0,0,7,3);pop();}
    }
  }
  drawSkyLights() {
    const e=this.environment;
    noStroke();
    fill(250,231,170,220*(1-e.night));ellipse(955-e.sunDirection*70,144,43,43);
    fill(246,239,206,235*e.night);ellipse(252,142,33,33);
    fill(...e.sky);ellipse(260,136,30,30);
    for(let i=0;i<40;i++) {
      const x=130+((i*0.61803)%1)*940,y=108+((i*0.75487)%1)*140;
      fill(250,244,214,(100+60*Math.sin(this.world.elapsed*0.8+i))*e.night);ellipse(x,y,1.7+(i%3)*0.6,1.7+(i%3)*0.6);
    }
  }
  drawTree(tree) {
    const e=this.environment,winter=e.weight(3);
    push();translate(tree.x,tree.y);scale(tree.r/60);noStroke();
    fill(30,44,35,24*(1-e.night));ellipse(e.sunDirection*25,23,100,28);
    fill(...StoryMath.colour([123,92,66],[49,61,62],e.night));rect(-8,-10,16,47,7);
    stroke(212,186,144,90*e.brightness);strokeWeight(1.4);line(-2,5,-2,30);
    for(let i=0;i<6;i++) {
      const a=i*Math.PI*2/6,x=Math.cos(a)*25,y=-36+Math.sin(a)*20;
      noStroke();fill(...StoryMath.colour(e.tree,[238,234,210],i%2*0.04));ellipse(x,y,59,54);
      noFill();stroke(234,226,195,75*e.brightness);strokeWeight(1);drawingContext.setLineDash([3,5]);ellipse(x,y,49,44);drawingContext.setLineDash([]);
      if(winter>0){noStroke();fill(239,244,232,210*winter*e.brightness);ellipse(x-4,y-18,42,15);}
    }
    pop();
  }
  drawShadow(s) {
    if(s.growth<=0)return;
    const e=this.environment, musicChase=this.music.playing&&!e.isNight&&s.wolf;
    const chase=musicChase?Math.sin(this.world.elapsed*s.speed+s.phase)*7:0;
    const alpha=(72-48*e.night)*s.growth;
    push();translate(s.x+e.sunDirection*22*s.size+chase,s.y+(s.wolf?25:13)*s.size);
    scale(s.size*s.growth, s.size*s.growth*(0.62+Math.abs(e.sunDirection)*0.18));
    noStroke();fill(39,44,40,alpha);
    if(!s.wolf) {
      ellipse(0,0,46,25);ellipse(s.facing*22,2,17,15);
      ellipse(-15,12,7,12);ellipse(13,12,7,12);
    } else {
      // The entire wolf is a single translucent shadow, never a separate animal.
      const awake=s.alert>0||musicChase;
      const action=awake?(0.5+0.5*Math.sin(this.world.elapsed*4+s.id)):0.08+0.03*Math.sin(this.world.elapsed*1.5+s.id);
      scale(s.facing,1);
      ellipse(-5,0,51,24);ellipse(18,-6,19,24);
      triangle(13,-15,10,-29,21,-17);triangle(21,-16,27,-27,29,-12);
      ellipse(29,-5,22,9);
      // A separate lower jaw leaves a visible gap as it opens.
      push();translate(22,-1);rotate(s.id%2? action*0.6:0.04);rect(0,0,18,5,2);pop();
      stroke(39,44,40,alpha);strokeWeight(7);
      line(-22,6,-26,23);line(-3,8,-1,24);
      const paw=s.id%2?0:action*15;
      line(14,6,20+action*3,23-paw);line(20+action*3,23-paw,29,22-paw);
      noFill();strokeWeight(9);bezier(-25,-1,-41,-4,-38,-17,-48,-17);
    }
    pop();
  }
  rgb(hex) {return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
  drawSheep(s) {
    if(s.growth<=0)return;
    const e=this.environment,puff=1+s.puff*0.5;
    const wool=StoryMath.colour([244,233,207],[137,151,151],e.night);
    const thread=StoryMath.colour([184,160,125],[81,104,108],e.night);
    const face=StoryMath.colour([92,72,59],[41,57,65],e.night);
    push();translate(s.x,s.y-s.jump);scale(s.size*s.growth);
    noStroke();fill(...face);rect(-16,9,6,14,3);rect(11,9,6,14,3);
    push();translate(0,-7);scale(puff);rotate(s.woolVariation);
    noStroke();fill(...wool);ellipse(0,0,45,33);
    for(const [x,y] of this.loops) {
      noStroke();fill(...wool);ellipse(x,y,16,15);
      noFill();stroke(...thread,140);strokeWeight(0.85);beginShape();for(const [dx,dy] of this.coil)vertex(x+dx,y+dy);endShape();
    }
    if(this.input.hoverSheep===s||s.held) {
      noFill();stroke(255,245,204,100);strokeWeight(1);drawingContext.setLineDash([2,4]);ellipse(0,1,59,43);drawingContext.setLineDash([]);
    }
    pop();
    const look=s.alert>0?s.faceAngle:(s.facing===1?0:Math.PI);
    const hx=Math.cos(look)*23,hy=-4+Math.sin(look)*9-(s.alert>0?3:0);
    noStroke();fill(...face);ellipse(hx,hy,19,23);ellipse(hx-9,hy-6,11,5);ellipse(hx+9,hy-6,11,5);
    const eye=this.rgb(s.eyeColour);
    if(e.night>0){fill(...eye,35*e.night);ellipse(hx-4,hy,9,9);ellipse(hx+4,hy,9,9);}
    fill(...StoryMath.colour([238,220,177],eye,e.night));ellipse(hx-4,hy,2.7,2.7);ellipse(hx+4,hy,2.7,2.7);
    stroke(31,29,27,150);strokeWeight(1);line(hx-2,hy+6,hx,hy+7);line(hx,hy+7,hx+2,hy+6);
    pop();
  }
  drawCloud(c) {
    const ending=c.state==='raining'||c.state==='dissolving';
    const fade=ending?1-StoryMath.smooth(c.finish):1;
    const colour=StoryMath.colour([247,238,215],[165,180,190],this.environment.night);
    push();translate(c.x,c.y);scale(c.size);
    noStroke();fill(...colour,240*fade);
    ellipse(0,2,84,26);ellipse(-23,-5,35,29);ellipse(2,-12,42,38);ellipse(28,-4,35,27);
    noFill();stroke(150,155,141,70*fade);strokeWeight(0.8);
    for(let i=0;i<6;i++){const x=-29+i*12;bezier(x,-2,x-8,-13,x+10,-12,x+4,2);}
    if(c.dragging||this.input.hoverCloud===c){stroke(255,245,206,120);strokeWeight(1);drawingContext.setLineDash([3,4]);ellipse(0,-3,100,50);drawingContext.setLineDash([]);}
    if(ending) {
      const opacity=Math.sin(c.finish*Math.PI);
      for(const f of c.fragments) {
        const x=f.x+f.vx*c.finish,y=f.y+f.vy*c.finish;
        stroke(250,238,194,210*opacity);strokeWeight(1.2);line(x-f.size,y,x+f.size,y);line(x,y-f.size,x,y+f.size);
      }
    }
    pop();
  }
  drawCloudRain() {
    for(const c of this.world.clouds) {
      if(c.state!=='raining'||!c.rainTarget)continue;
      const intensity=Math.sin(c.finish*Math.PI),winter=this.environment.season===3;
      const target=c.rainTarget;
      for(let i=0;i<27;i++) {
        const t=((this.world.elapsed*(winter?0.4:1.1)+i*0.618)%1);
        const x=StoryMath.mix(c.x,target.x,t)+Math.sin(i*7)*15;
        const y=StoryMath.mix(c.y+13,target.y-4,t);
        if(winter){noStroke();fill(246,242,225,170*intensity);ellipse(x,y,3,3);}
        else {stroke(214,231,225,180*intensity);strokeWeight(1.4);line(x,y,x+(target.x-c.x)*0.018,y+9);}
      }
      noFill();stroke(244,227,179,110*intensity);strokeWeight(1.2);ellipse(target.x,target.y+12,43,13);
    }
  }
  drawWinterSnow() {
    const amount=this.environment.weight(3);
    if(amount<=0)return;
    noStroke();fill(250,247,231,160*amount);
    for(let i=0;i<65;i++) {
      const x=100+((i*0.618)%1)*1000+Math.sin(this.world.elapsed*0.6+i)*9;
      const y=90+((i*37+this.world.elapsed*(15+i%7*3))%580);
      ellipse(x,y,2+i%3,2+i%3);
    }
  }
  drawRipples() {
    for(const ripple of this.world.ripples) {
      noFill();stroke(ripple.success?241:183,ripple.success?224:154,176,120*(1-ripple.age/0.8));strokeWeight(1.3);
      ellipse(ripple.x,ripple.y,12+ripple.age*50,5+ripple.age*20);
    }
  }
  drawBinding() {
    noStroke();
    for(let i=0;i<13;i++){fill(84,65,47,2+(13-i)*0.4);rect(600-i,78,2*i,600);}
    stroke(164,140,110,150);strokeWeight(1);line(600,80,600,678);
    noFill();stroke(224,210,180,130);drawingContext.setLineDash([3,8]);rect(96,96,1008,570,4);drawingContext.setLineDash([]);
  }
  drawGramophone() {
    push();translate(184,616);noStroke();
    fill(53,39,31,35);ellipse(5,21,114,36);
    fill('#a77c50');rect(-49,-13,98,47,7);fill('#c19b66');rect(-48,-20,96,30,7);
    fill('#44433c');ellipse(0,0,59,27);noFill();stroke('#696557');strokeWeight(1);
    for(let i=0;i<4;i++)ellipse(0,0,49-i*9,22-i*4);
    push();scale(1,0.46);rotate(this.music.rotation);stroke('#a99e7d');line(5,0,26,0);pop();
    noStroke();fill(['#b9c59a','#aabccc','#c9ae88'][this.music.track]);ellipse(0,0,16,8);
    noFill();stroke('#856039');strokeWeight(7);bezier(31,-2,45,-12,30,-40,18,-44);
    noStroke();fill('#c6a16c');triangle(20,-35,-9,-76,42,-80);fill('#dfc18b');ellipse(16,-77,57,24);fill('#8c724b');ellipse(16,-78,43,14);
    stroke('#dbc28e');strokeWeight(2);line(28,0,18,9);
    // Music controls remain visual objects: record to play, small arrows to change tracks.
    noStroke();fill('#705c46');
    triangle(-39,57,-27,49,-27,65);triangle(48,57,36,49,36,65);
    for(let i=0;i<3;i++){fill(i===this.music.track?'#6f805e':'#c1b193');ellipse(-10+i*10,57,4,4);}
    if(!this.music.playing){fill('#f1e2bd');triangle(-4,-5,6,0,-4,5);}
    else {fill('#ead9b2');rect(-4,-5,2,10);rect(2,-5,2,10);}
    pop();
  }
  drawPageTurn() {
    const turn=this.world.pageTurn;
    if(!turn)return;
    const phase=turn.age/0.75,fold=Math.sin(Math.PI*phase)*510;
    noStroke();fill(60,45,32,25);triangle(85,78,85+fold+20,375,85,680);
    fill('#eee2c8');triangle(85,78,85+fold,375,85,680);
    stroke('#d0bfa0');strokeWeight(1);line(85,78,85+fold,375);line(85+fold,375,85,680);
  }
}
