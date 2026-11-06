// AI (ChatGPT/Codex) assisted with writing and modifying parts of this code.

// These settings control animation durations, object limits and hold time.
window.ProjectConfig = Object.freeze({
  time: Object.freeze({openSeconds: 2, revealSeconds: 2.2, turnSeconds: 1.6, seasonBlendSeconds: 1.4, dayNightSeconds: 120, manualLightSeconds: 45}),
  noise: Object.freeze({maxSheep: 45, maxClouds: 14, cloudRiseSeconds: 1.8, cloudLifetimeMin: 10, cloudLifetimeMax: 16, cloudFadeSeconds: 1.7}),
  input: Object.freeze({holdToCloudSeconds: .6})
});

// This object stores the scene state shared by the other modules.
window.Story = {
  notice: '', open: false, opening: 0, reveal: 0, turn: 0, turnKind: '', turnSwapped: false,
  season: 0, previousSeason: 0, seasonBlend: 1, page: 0,
  elapsed: 0, night: 0, targetNight: 0, sun: .75,
  manualLightUntil: 0, cycleTime: 0
};

// These helpers keep placement and movement aligned with the landscape.
window.SceneGeometry = {
  trees: [{x:325,y:465,r:44},{x:1005,y:458,r:48},{x:1150,y:560,r:43}],
  horizon(u) { return 170 + 34*Math.exp(-Math.pow((u-640)/120,2)) - 14*Math.sin(u*.006); },
  groundY(x) { return 185 + this.horizon((x-235)/998*1000)*635/500; },
  musicHit(x,y) { return x>281 && x<380 && y>657 && y<750; },
  // Check whether a position overlaps the sky, a tree or the gramophone.
  isBlocked(x,y,margin=0) {
    return y<this.groundY(x)+margin ||
      this.trees.some(t=>Math.hypot(x-t.x,(y-(t.y-34))*1.1)<t.r+margin) ||
      (x>275-margin && x<390+margin && y>630-margin && y<758+margin);
  },
  // Keep moving sheep on the grass and outside obstacles.
  constrainGround(x,y,margin,bounds) {
    y=Math.max(y,this.groundY(x)+margin+2);
    for(let pass=0;pass<2;pass++) for(const t of this.trees){
      const dx=x-t.x,dy=y-(t.y-34),d=Math.hypot(dx,dy),radius=t.r+margin+2;
      if(d<radius){x=t.x+(d?dx/d:1)*radius;y=t.y-34+(d?dy/d:0)*radius;}
    }
    if(x>275-margin && x<390+margin && y>630-margin)x=392+margin;
    return {x:Math.max(bounds.left,Math.min(bounds.right,x)),y:Math.max(bounds.top,Math.min(bounds.bottom,y))};
  }
};

// These helpers convert cassette coordinates and check its button areas.
window.CassetteGeometry={
  x:129,y:64,scale:.74,angle:-.12,
  controls:{play:{x:-31,y:-31,w:42,h:27},next:{x:35,y:-31,w:37,h:27}},
  toScreen(x,y){const a=this.angle,k=this.scale;return{x:this.x+k*(x*Math.cos(a)-y*Math.sin(a)),y:this.y+k*(x*Math.sin(a)+y*Math.cos(a))};},
  action(x,y){
    const dx=(x-this.x)/this.scale,dy=(y-this.y)/this.scale,a=this.angle;
    const u=dx*Math.cos(a)+dy*Math.sin(a),v=-dx*Math.sin(a)+dy*Math.cos(a);
    for(const[name,b]of Object.entries(this.controls))if(Math.abs(u-b.x)<=b.w/2 && Math.abs(v-b.y)<=b.h/2)return name;
    return null;
  }
};
