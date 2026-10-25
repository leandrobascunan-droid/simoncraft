'use strict';
// =====================================================================
//  SIMONCRAFT · Motor del mundo (estilo Minecraft en 2D)
//  Mundo de bloques, física, Simón, Snoopy, el Sniffer y Pokémon salvajes.
// =====================================================================

const WW = 240, WH = 72;           // ancho y alto del mundo en bloques
const GRAV = 32, SPEED = 5.2, JUMP = 11.2, REACH = 5.5;
const DAY_LEN = 300;               // segundos que dura un día completo

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------------
//  Texturas pixel-art generadas por código (16x16)
// ---------------------------------------------------------------------
const TEX = {}, TEXBG = {}, CRACKS = [], TOOLTEX = {};

// Herramientas de diamante en pixel-art (16x16). El mango va de abajo-izquierda a arriba-derecha.
function paintTool(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d');
  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  const HEAD = '#4fe3e0', EDGE = '#1d8a88', LIGHT = '#bdfffd';
  for (let i = 0; i < 10; i++) { px(2 + i, 13 - i, '#8a5a2b'); px(3 + i, 13 - i, '#5e3b18'); }
  if (kind === 'pico') {
    [[4, 2], [5, 1], [6, 1], [7, 1], [8, 1], [9, 2], [10, 2], [11, 3], [12, 4], [13, 5], [13, 6], [14, 7], [14, 8], [14, 9], [14, 10], [13, 11]]
      .forEach(([x, y]) => { px(x, y, HEAD); px(x - 1 + (x > 10 ? 0 : 1), y + 1, EDGE); });
    px(6, 2, LIGHT); px(13, 7, LIGHT);
  } else if (kind === 'hacha') {
    const rows = { 1: [9, 11], 2: [8, 12], 3: [8, 13], 4: [8, 14], 5: [9, 14], 6: [10, 13], 7: [11, 12] };
    for (const [y, [a, b]] of Object.entries(rows)) for (let x = a; x <= b; x++) px(x, +y, x === b ? EDGE : HEAD);
    px(10, 3, LIGHT); px(11, 4, LIGHT);
  } else {
    const rows = { 0: [12, 13], 1: [11, 14], 2: [10, 15], 3: [10, 15], 4: [11, 14], 5: [12, 13] };
    for (const [y, [a, b]] of Object.entries(rows)) for (let x = a; x <= b; x++) px(x, +y, x === b ? EDGE : HEAD);
    px(12, 2, LIGHT);
  }
  return c;
}

function paintTex(id) {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d');
  const rnd = mulberry32(id * 7919 + 13);
  const pick = a => a[Math.floor(rnd() * a.length)];
  const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  const noise = cols => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, pick(cols)); };
  const edge = (light, dark) => {
    g.fillStyle = light; g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 1, 16);
    g.fillStyle = dark; g.fillRect(0, 15, 16, 1); g.fillRect(15, 0, 1, 16);
  };
  const STONE = ['#8a8a8a', '#7d7d7d', '#959595', '#6f6f6f'];
  const DIRT = ['#8b5a2b', '#7a4e25', '#9a6634', '#6e4520'];
  const ore = cols => {
    noise(STONE);
    for (let i = 0; i < 5; i++) {
      const x = 1 + Math.floor(rnd() * 13), y = 1 + Math.floor(rnd() * 13);
      px(x, y, cols[0]); px(x + 1, y, cols[1]); px(x, y + 1, cols[1]); px(x + 1, y + 1, cols[2]);
    }
  };
  switch (id) {
    case B.GRASS:
      noise(DIRT);
      for (let x = 0; x < 16; x++) {
        const d = 3 + Math.floor(rnd() * 3);
        for (let y = 0; y < d; y++) px(x, y, pick(['#5cb83a', '#4fa632', '#6bc847']));
      }
      break;
    case B.DIRT: noise(DIRT); break;
    case B.STONE: noise(STONE); break;
    case B.LOG:
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++)
        px(x, y, (x % 5 === 0 || x === 15) ? '#4a3218' : pick(['#6b4a26', '#73502a', '#5f4120']));
      break;
    case B.LEAVES:
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++)
        if (rnd() > 0.13) px(x, y, pick(['#2e8b2e', '#3aa03a', '#247a24', '#45b045']));
      break;
    case B.SAND: noise(['#e8d9a0', '#dccb8c', '#f0e2ae', '#d4c27f']); break;
    case B.COAL: ore(['#222', '#333', '#111']); break;
    case B.IRON: ore(['#d8a47f', '#c48d66', '#e9bf9c']); break;
    case B.GOLD: ore(['#ffd84a', '#f2b82e', '#fff08a']); break;
    case B.DIAMOND: ore(['#5ff2ec', '#2fc9c4', '#a8fffb']); break;
    case B.BEDROCK: noise(['#2a2a2a', '#444', '#555', '#1c1c1c']); break;
    case B.PLANKS:
      noise(['#b8894f', '#a97c45', '#c49558']);
      for (let x = 0; x < 16; x++) [3, 7, 11, 15].forEach(y => px(x, y, '#7c5a2e'));
      for (let r = 0; r < 4; r++) for (let y = r * 4; y < r * 4 + 3; y++) px(r % 2 ? 4 : 11, y, '#7c5a2e');
      break;
    case B.GLASS:
      g.fillStyle = 'rgba(200,240,255,0.25)'; g.fillRect(0, 0, 16, 16);
      edge('#e9fbff', '#bfe6f2');
      [[3, 3], [4, 4], [5, 5], [10, 9], [11, 10]].forEach(([x, y]) => px(x, y, '#ffffff'));
      break;
    case B.BRICK:
      g.fillStyle = '#bdb3a6'; g.fillRect(0, 0, 16, 16);
      for (let r = 0; r < 4; r++) {
        const off = r % 2 ? 4 : 0;
        for (let b = -1; b < 2; b++) {
          const x0 = b * 8 + off;
          for (let y = r * 4; y < r * 4 + 3; y++) for (let x = x0; x < x0 + 7; x++)
            if (x >= 0 && x < 16) px(x, y, pick(['#a8452f', '#b54e36', '#9a3d28']));
        }
      }
      break;
    case B.GOLDB: noise(['#ffd84a', '#f7c93a', '#ffe57a']); edge('#fff3b0', '#c9971f'); break;
    case B.DIAMB: noise(['#5ff2ec', '#4fe3e0', '#8ffaf6']); edge('#d9fffd', '#23a8a4'); break;
    case B.FLOWER: {
      for (let y = 8; y < 16; y++) px(7, y, '#2e8b2e');
      px(6, 11, '#3aa03a'); px(8, 13, '#3aa03a');
      const pc = '#e23b3b';
      [[7, 4], [6, 5], [8, 5], [7, 6], [6, 4], [8, 4], [6, 6], [8, 6]].forEach(([x, y]) => px(x, y, pc));
      px(7, 5, '#f2c94c');
      break;
    }
    case B.POKE:
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++)
        px(x, y, y < 7 ? pick(['#e23b3b', '#d63232']) : y < 9 ? '#222' : pick(['#f4f4f4', '#e6e6e6']));
      g.fillStyle = '#222'; g.fillRect(5, 5, 6, 6);
      g.fillStyle = '#fff'; g.fillRect(6, 6, 4, 4);
      break;
  }
  return c;
}

function darkTex(src, a) {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d'); g.drawImage(src, 0, 0);
  g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, 16, 16);
  return c;
}

function buildTextures() {
  for (const id in BLOCKS) if (+id) TEX[id] = paintTex(+id);
  for (const k in TOOLS) TOOLTEX[k] = paintTool(k);
  TEXBG.stone = darkTex(TEX[B.STONE], 0.6);
  TEXBG.dirt = darkTex(TEX[B.DIRT], 0.6);
  // grietas al picar (5 etapas)
  const rnd = mulberry32(42), pts = [];
  for (let i = 0; i < 60; i++) pts.push([Math.floor(rnd() * 16), Math.floor(rnd() * 16)]);
  for (let s = 1; s <= 5; s++) {
    const c = document.createElement('canvas'); c.width = c.height = 16;
    const g = c.getContext('2d'); g.fillStyle = 'rgba(0,0,0,0.55)';
    pts.slice(0, s * 12).forEach(([x, y]) => g.fillRect(x, y, 1, 1));
    CRACKS.push(c);
  }
}

// ---------------------------------------------------------------------
//  Generación del mundo
// ---------------------------------------------------------------------
function genWorld(seed) {
  const rnd = mulberry32(seed);
  const w = new Uint8Array(WW * WH), surf = new Array(WW);
  const set = (x, y, v) => { if (x >= 0 && x < WW && y >= 0 && y < WH) w[y * WW + x] = v; };
  const get = (x, y) => (x >= 0 && x < WW && y >= 0 && y < WH) ? w[y * WW + x] : B.BEDROCK;
  const octave = (step, amp) => {
    const pts = []; for (let i = 0; i <= Math.ceil(WW / step) + 1; i++) pts.push(rnd());
    return x => { const i = Math.floor(x / step), t = x / step - i, s = t * t * (3 - 2 * t); return (pts[i] * (1 - s) + pts[i + 1] * s) * amp; };
  };
  const o1 = octave(40, 14), o2 = octave(14, 5), o3 = octave(6, 2);
  for (let x = 0; x < WW; x++) surf[x] = Math.floor(18 + o1(x) + o2(x) + o3(x));
  const mid = WW >> 1;
  for (let x = mid - 5; x <= mid + 5; x++) surf[x] = Math.min(surf[mid], 32);

  for (let x = 0; x < WW; x++) {
    const sandy = surf[x] >= 33;
    for (let y = 0; y < WH; y++) {
      let v = B.AIR;
      if (y >= WH - 1 || (y >= WH - 3 && rnd() < 0.5)) v = B.BEDROCK;
      else if (y < surf[x]) v = B.AIR;
      else if (y === surf[x]) v = sandy ? B.SAND : B.GRASS;
      else if (y < surf[x] + 4) v = sandy ? B.SAND : B.DIRT;
      else v = B.STONE;
      w[y * WW + x] = v;
    }
  }
  // cuevas (gusanos que excavan)
  for (let k = 0; k < 20; k++) {
    let x = rnd() * WW, y = 34 + rnd() * (WH - 42), ang = rnd() * Math.PI * 2;
    const len = 30 + rnd() * 70;
    for (let i = 0; i < len; i++) {
      ang += (rnd() - 0.5) * 0.6; x += Math.cos(ang); y += Math.sin(ang) * 0.6;
      const r = 1 + rnd() * 1.3;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const tx = Math.floor(x + dx), ty = Math.floor(y + dy);
        if (dx * dx + dy * dy <= r * r && tx > 0 && tx < WW - 1 && ty > surf[tx] + 4 && get(tx, ty) !== B.BEDROCK) set(tx, ty, B.AIR);
      }
    }
  }
  // minerales
  const vein = (id, minY, chance, size) => {
    for (let y = minY; y < WH - 1; y++) for (let x = 0; x < WW; x++) {
      if (get(x, y) !== B.STONE || rnd() > chance) continue;
      for (let i = 0; i < size; i++) {
        const tx = x + Math.floor(rnd() * 3) - 1, ty = y + Math.floor(rnd() * 3) - 1;
        if (get(tx, ty) === B.STONE) set(tx, ty, id);
      }
    }
  };
  vein(B.COAL, 22, 0.012, 4); vein(B.IRON, 32, 0.007, 3); vein(B.GOLD, 46, 0.0045, 3); vein(B.DIAMOND, 56, 0.0035, 2);
  // árboles y flores
  for (let x = 3; x < WW - 3; x++) {
    if (get(x, surf[x]) !== B.GRASS) continue;
    if (rnd() < 0.08 && Math.abs(x - mid) > 3) {
      const h = 4 + Math.floor(rnd() * 2), top = surf[x] - h;
      for (let i = 1; i <= h; i++) set(x, surf[x] - i, B.LOG);
      for (let dy = -2; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (dy === -2 && Math.abs(dx) > 1) continue;
        if (dy === 1 && dx === 0) continue;
        if (get(x + dx, top + dy) === B.AIR) set(x + dx, top + dy, B.LEAVES);
      }
      x += 4;
    } else if (rnd() < 0.12) set(x, surf[x] - 1, B.FLOWER);
  }
  return { w, surf };
}

// ---------------------------------------------------------------------
//  Dibujos de personajes (pixel-art)
// ---------------------------------------------------------------------
const DOG_GRID = [
  '......WWWW..',
  '.....WWWWWWN',
  '.....KWEWWWW',
  'W....KWWWWW.',
  'W....KCCWW..',
  '.WWWWWWWWW..',
  '.wwwwwwwww..'
];
const DOG_LEGS = [['.WW....WW...', '.WW....WW...'], ['W..W..W..W..', 'W..W..W..W..']];
const DOG_PAL = { W: '#ffffff', w: '#d9d9d9', K: '#1a1a1a', E: '#1a1a1a', N: '#1a1a1a', C: '#e23b3b' };

const IMG = {};
function pimg(id) {
  if (!IMG[id]) { const im = new Image(); im.src = pokeImg(id); IMG[id] = im; }
  return IMG[id];
}

// ---------------------------------------------------------------------
//  Juego
// ---------------------------------------------------------------------
const Game = {
  canvas: null, g: null, T: 32, dpr: 1, running: false, paused: false, last: 0,
  seed: 1, w: null, surf: null, time: 0.12,
  p: null, dog: null, buddy: null, sniffer: null, wild: [], particles: [], floaters: [],
  input: { left: false, right: false, jump: false }, tool: 'pico',
  jobs: [], drag: null, cursor: null, hint: null, spawnT: 6, sniffT: 25, cam: { x: 0, y: 0 },

  init(canvas) {
    this.canvas = canvas; this.g = canvas.getContext('2d');
    buildTextures();
    addEventListener('resize', () => this.resize());
    this.bindPointer();
    this.bindKeys();
  },

  resize() {
    const c = this.canvas; this.dpr = Math.min(devicePixelRatio || 1, 3);
    c.width = Math.floor(c.clientWidth * this.dpr); c.height = Math.floor(c.clientHeight * this.dpr);
    this.T = Math.max(16, Math.floor(Math.min(c.height / 11, c.width / 13)));
  },

  // ---------- mundo ----------
  get(x, y) { return (x < 0 || x >= WW || y >= WH) ? B.BEDROCK : y < 0 ? B.AIR : this.w[y * WW + x]; },
  set(x, y, v) { if (x >= 0 && x < WW && y >= 0 && y < WH) { this.w[y * WW + x] = v; } },
  solid(x, y) { return BLOCKS[this.get(x, y)].solid; },

  newWorld(seed) {
    this.seed = seed || (Math.random() * 1e9) | 0;
    const r = genWorld(this.seed); this.w = r.w; this.surf = r.surf;
    const mid = WW >> 1;
    this.time = 0.12;
    this.spawnEntities(mid + 0.15, this.surf[mid] - 1.85);
  },

  spawnEntities(px, py) {
    const mid = WW >> 1;
    this.p = { kind: 'player', x: px, y: py, w: 0.7, h: 1.8, vx: 0, vy: 0, face: 1, walk: 0, swing: 0 };
    this.dog = { kind: 'dog', x: px - 1.5, y: py + 1, w: 0.85, h: 0.64, vx: 0, vy: 0, face: 1, walk: 0 };
    this.buddy = null;
    this.sniffer = { kind: 'sniffer', x: mid + 4, y: this.surf[mid] - 1.3, w: 1.9, h: 1.2, vx: 0, vy: 0, face: -1, walk: 0, ai: 2, home: mid + 4 };
    this.wild = []; this.particles = []; this.floaters = [];
    this.unstuck(this.p);
  },

  serialize() {
    let s = '';
    for (let i = 0; i < this.w.length; i++) s += String.fromCharCode(48 + this.w[i]);
    return { seed: this.seed, w: s, px: this.p.x, py: this.p.y, time: this.time };
  },

  load(d) {
    try {
      this.seed = d.seed;
      const r = genWorld(d.seed); this.surf = r.surf; this.w = r.w;
      if (d.w && d.w.length === WW * WH) for (let i = 0; i < d.w.length; i++) this.w[i] = d.w.charCodeAt(i) - 48;
      this.time = d.time || 0.12;
      this.spawnEntities(d.px, d.py);
      return true;
    } catch (e) { return false; }
  },

  // ---------- ciclo ----------
  start() {
    if (!this.w) this.newWorld();
    this.resize(); this.syncBuddy();
    this.running = true; this.paused = false; this.last = performance.now();
    requestAnimationFrame(t => this.frame(t));
  },
  stop() { this.running = false; this.jobs = []; this.drag = null; this.input.left = this.input.right = this.input.jump = false; },

  frame(t) {
    if (!this.running) return;
    const dt = Math.min(0.033, (t - this.last) / 1000); this.last = t;
    if (!this.paused) this.update(dt);
    this.draw();
    requestAnimationFrame(t2 => this.frame(t2));
  },

  // ---------- física ----------
  collides(e) {
    const x0 = Math.floor(e.x), x1 = Math.floor(e.x + e.w - 1e-4), y0 = Math.floor(e.y), y1 = Math.floor(e.y + e.h - 1e-4);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.solid(x, y)) return true;
    return false;
  },
  unstuck(e) { let n = 0; while (this.collides(e) && e.y > 0 && n++ < 80) e.y -= 1; },

  move(e, dt) {
    e.vy = Math.min(e.vy + GRAV * dt, 22);
    let hitX = false;
    e.x = clamp(e.x + e.vx * dt, 0, WW - e.w);
    if (this.collides(e)) {
      hitX = true;
      if (e.vx > 0) e.x = Math.floor(e.x + e.w) - e.w - 1e-3;
      else if (e.vx < 0) e.x = Math.floor(e.x) + 1 + 1e-3;
    }
    e.y += e.vy * dt; e.onGround = false;
    if (this.collides(e)) {
      if (e.vy > 0) { e.y = Math.floor(e.y + e.h) - e.h - 1e-3; e.onGround = true; }
      else if (e.vy < 0) e.y = Math.floor(e.y) + 1 + 1e-3;
      e.vy = 0;
    }
    if (e.y > WH) { e.y = 0; }
    return hitX;
  },

  canStep(e, dir) {
    const fx = dir > 0 ? Math.floor(e.x + e.w + 0.1) : Math.floor(e.x - 0.1);
    const fy = Math.floor(e.y + e.h - 0.05);
    return this.solid(fx, fy) && !this.solid(fx, fy - 1) && !this.solid(fx, fy - 2);
  },

  follow(e, target, speed, dt) {
    const dx = target - e.x;
    if (Math.abs(dx) > 0.5) { e.vx = Math.sign(dx) * Math.min(speed, Math.abs(dx) * 3 + 1); e.face = Math.sign(dx); }
    else e.vx = 0;
    const hit = this.move(e, dt);
    if (e.onGround && (hit || (this.p.y + this.p.h < e.y + e.h - 1.5 && Math.abs(dx) < 2.5))) e.vy = -JUMP;
    if (Math.abs(e.x - this.p.x) > 14 || Math.abs(e.y - this.p.y) > 12) { e.x = this.p.x; e.y = this.p.y; e.vy = 0; this.unstuck(e); }
    e.walk += Math.abs(e.vx) * dt * 3;
  },

  update(dt) {
    const p = this.p, inp = this.input;
    this.time = (this.time + dt / DAY_LEN) % 1;

    // Simón: las flechas mandan; si no se tocan, camina solo hacia el bloque pendiente
    const manual = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (manual && this.jobs.length) this.jobs = [];
    const auto = this.workJobs(dt);
    const dir = manual || auto;
    p.vx = dir * SPEED; if (dir) p.face = dir;
    if (inp.jump && p.onGround) { p.vy = -JUMP; }
    const hit = this.move(p, dt);
    if (hit && dir && p.onGround && this.canStep(p, dir)) p.vy = -JUMP;   // salto automático
    else if (hit && auto && p.onGround) this.clearPath(auto);              // pared alta: Simón abre camino
    p.walk = dir ? p.walk + dt * 12 : 0;

    // compañeros
    this.follow(this.dog, p.x + (p.face > 0 ? -1.5 : 1.5), SPEED * 1.15, dt);
    if (this.buddy) this.follow(this.buddy, p.x + (p.face > 0 ? -2.9 : 2.9), SPEED * 1.1, dt);

    // Sniffer: pasea cerca de su casa
    const sn = this.sniffer;
    sn.ai -= dt;
    if (sn.ai <= 0) { sn.ai = 2 + Math.random() * 4; const r = Math.random(); sn.vx = r < 0.4 ? 0 : (r < 0.7 ? 1 : -1) * 1.1; if (sn.x < sn.home - 8) sn.vx = 1.1; if (sn.x > sn.home + 8) sn.vx = -1.1; if (sn.vx) sn.face = Math.sign(sn.vx); }
    if (this.move(sn, dt) && sn.onGround) sn.vy = -JUMP * 0.8;
    sn.walk += Math.abs(sn.vx) * dt * 3;

    // Pokémon salvajes
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawnT = 7 + Math.random() * 8; if (this.wild.length < 4) this.spawnWild(); }
    for (const e of this.wild) {
      if (e.caught != null) { e.caught -= dt; continue; }
      if (e.flee != null) { e.flee -= dt; e.vx = e.face * 7; }
      else {
        e.ai -= dt;
        if (e.ai <= 0) { e.ai = 1 + Math.random() * 3; const r = Math.random(); e.vx = r < 0.35 ? 0 : (r < 0.67 ? 1 : -1) * 2.2; if (e.vx) e.face = Math.sign(e.vx); }
      }
      if (this.move(e, dt) && e.onGround) e.vy = -JUMP;
      e.walk += dt;
    }
    this.wild = this.wild.filter(e => !(e.caught != null && e.caught <= 0) && !(e.flee != null && e.flee <= 0) && Math.abs(e.x - p.x) < 45);

    // Snoopy olfatea
    this.sniffT -= dt;
    if (this.sniffT <= 0) { this.sniffT = 30 + Math.random() * 15; this.sniff(); }
    if (this.hint) { this.hint.t -= dt; if (this.hint.t <= 0 || !this.get(this.hint.x, this.hint.y)) this.hint = null; }

    // partículas y textos
    for (const q of this.particles) { q.vy += 20 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.t -= dt; }
    this.particles = this.particles.filter(q => q.t > 0);
    for (const f of this.floaters) { f.y -= dt * 1.2; f.t -= dt; }
    this.floaters = this.floaters.filter(f => f.t > 0);
    for (const e of [this.dog, this.buddy, this.sniffer, ...this.wild]) if (e && e.bubble) { e.bubble.t -= dt; if (e.bubble.t <= 0) e.bubble = null; }

    // cámara
    const vw = this.canvas.width / this.T, vh = this.canvas.height / this.T;
    const tx = p.x + p.w / 2 - vw / 2, ty = p.y + 0.9 - vh * 0.55;
    this.cam.x += (clamp(tx, 0, WW - vw) - this.cam.x) * Math.min(1, dt * 8);
    this.cam.y += (clamp(ty, -4, WH - vh) - this.cam.y) * Math.min(1, dt * 8);
  },

  // ---------- acciones ----------
  inReach(tx, ty) {
    const p = this.p;
    return Math.hypot(tx + 0.5 - (p.x + p.w / 2), ty + 0.5 - (p.y + 0.6)) <= REACH;
  },

  breakBlock(tx, ty) {
    const id = this.get(tx, ty), def = BLOCKS[id];
    this.set(tx, ty, B.AIR);
    this.burst(tx + 0.5, ty + 0.5, TEX[id]);
    App.sound('break');
    if (def.drop) { App.addItem(def.drop, 1); this.floater(tx + 0.5, ty, `+1 ${BLOCKS[def.drop].n}`, '#fff'); }
    if (def.cr) { App.addCredits(def.cr); this.floater(tx + 0.5, ty - 0.6, `+${def.cr} 💎`, '#7ff'); }
    if (def.fact) App.learnFact(id);
    // lo que estaba encima y no es sólido (flores) cae
    if (this.get(tx, ty - 1) === B.FLOWER) { this.set(tx, ty - 1, B.AIR); App.addItem(B.FLOWER, 1); }
    App.dirty = true;
  },

  // ---------- trabajos: un toque = Simón va y lo hace ----------
  diggable(x, y) { const id = this.get(x, y); return y >= 0 && id !== B.AIR && id !== B.BEDROCK; },
  queued(x, y) { return this.jobs.some(j => j.x === x && j.y === y); },
  toolSpeed(id) { const t = TOOLS[this.tool]; return t && t.fast.includes(id) ? 3 : 1; },
  digK(j) { const id = this.get(j.x, j.y); return id ? clamp(j.prog * this.toolSpeed(id) / BLOCKS[id].h, 0, 1) : 0; },

  addDig(x, y) {
    if (!this.diggable(x, y) || this.queued(x, y) || this.jobs.length >= 20) return;
    this.jobs.push({ type: 'dig', x, y, prog: 0, stuck: 0 });
  },

  // fx, fy = dónde cayó el dedo dentro del bloque (0 a 1). exact = solo si la celda está vacía (al arrastrar)
  addPlace(x, y, fx, fy, exact) {
    if (!App.selectedBlock()) { App.toast('No tienes bloques. ¡Pica algunos primero! ⛏'); return; }
    if (this.get(x, y) !== B.AIR) {
      if (exact) return;
      // tocaste un bloque: el nuevo se pone pegado, en el lado más cercano al dedo (preferimos encima)
      const faces = [[0, -1, fy * 0.6], [0, 1, 1 - fy], [-1, 0, fx], [1, 0, 1 - fx]].sort((a, b) => a[2] - b[2]);
      const f = faces.find(([dx, dy]) => this.get(x + dx, y + dy) === B.AIR && !this.queued(x + dx, y + dy));
      if (!f) return;
      x += f[0]; y += f[1];
    }
    if (y < 0 || this.queued(x, y) || this.jobs.length >= 20) return;
    this.jobs.push({ type: 'place', x, y, prog: 0, stuck: 0 });
  },

  // Avanza el primer trabajo. Devuelve -1/1 si Simón debe caminar para alcanzarlo, 0 si no.
  workJobs(dt) {
    const p = this.p, j = this.jobs[0];
    if (!j) return 0;
    const valid = j.type === 'dig' ? this.diggable(j.x, j.y) : this.get(j.x, j.y) === B.AIR;
    if (!valid) { this.jobs.shift(); return 0; }
    if (!this.inReach(j.x, j.y)) {
      const dx = j.x + 0.5 - (p.x + p.w / 2);
      j.stuck = Math.abs(p.x - (j.lastX ?? -9)) < 0.005 ? j.stuck + dt : 0; j.lastX = p.x;
      if (Math.abs(dx) < 1 || j.stuck > 0.8) { this.jobs = []; App.toast('No alcanzo ese bloque 😅'); return 0; }
      return Math.sign(dx);
    }
    p.face = j.x + 0.5 > p.x + p.w / 2 ? 1 : -1;
    j.prog += dt; p.swing += dt;
    if (j.type === 'dig') {
      const id = this.get(j.x, j.y);
      if (this.digK(j) >= 1) {
        this.jobs.shift();
        if (id === B.LOG && this.tool === 'hacha') this.fellTree(j.x, j.y); else this.breakBlock(j.x, j.y);
      }
    } else if (j.prog >= 0.12) { this.jobs.shift(); this.placeBlock(j.x, j.y); }
    return 0;
  },

  // Cuando camina solo hacia un bloque y una pared se lo impide, pica la pared (pies y cabeza)
  clearPath(dir) {
    const p = this.p, fx = dir > 0 ? Math.floor(p.x + p.w + 0.05) : Math.floor(p.x - 0.05);
    const fy = Math.floor(p.y + p.h - 0.05);
    if (this.jobs[0]) this.jobs[0].stuck = 0;
    for (const y of [fy, fy - 1]) {
      if (this.diggable(fx, y) && !this.queued(fx, y)) this.jobs.unshift({ type: 'dig', x: fx, y, prog: 0, stuck: 0 });
    }
  },

  placeBlock(x, y) {
    const id = App.selectedBlock();
    if (!id) { this.jobs = []; App.toast('¡Se acabaron los bloques! ⛏'); return; }
    if (id === B.FLOWER && !this.solid(x, y + 1)) return;
    if (BLOCKS[id].solid) {
      for (const e of [this.p, this.dog, this.buddy, this.sniffer, ...this.wild]) {
        if (e && x < e.x + e.w && x + 1 > e.x && y < e.y + e.h && y + 1 > e.y) return;
      }
    }
    if (!App.useItem(id)) return;
    this.set(x, y, id);
    this.burst(x + 0.5, y + 0.5, TEX[id], 4);
    App.sound('place'); App.dirty = true;
  },

  // Hacha: cae el árbol completo (troncos y hojas unidos)
  fellTree(x, y) {
    const seen = new Set(), stack = [[x, y]], cells = [];
    while (stack.length && cells.length < 90) {
      const [cx, cy] = stack.pop(), k = cy * WW + cx;
      if (seen.has(k)) continue; seen.add(k);
      const id = this.get(cx, cy);
      if (id !== B.LOG && id !== B.LEAVES) continue;
      cells.push([cx, cy, id]);
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    let logs = 0;
    cells.forEach(([cx, cy, id], i) => {
      this.set(cx, cy, B.AIR);
      if (id === B.LOG) logs++;
      if (i % 3 === 0) this.burst(cx + 0.5, cy + 0.5, TEX[id], 4);
    });
    App.addItem(B.LOG, logs);
    App.sound('break');
    this.floater(x + 0.5, y - 1, `+${logs} Tronco 🌳`, '#fff');
    App.learnFact(B.LOG);
    App.dirty = true;
  },

  burst(x, y, tex, n = 10) {
    const g = tex.getContext('2d');
    for (let i = 0; i < n; i++) {
      const d = g.getImageData(Math.floor(Math.random() * 16), Math.floor(Math.random() * 16), 1, 1).data;
      this.particles.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 6, t: 0.6 + Math.random() * 0.4, col: `rgba(${d[0]},${d[1]},${d[2]},${d[3] / 255 || 1})` });
    }
  },
  floater(x, y, txt, col) { this.floaters.push({ x, y, txt, col, t: 1.4 }); },

  spawnWild() {
    const p = this.p, side = Math.random() < 0.5 ? -1 : 1;
    const x = clamp(Math.floor(p.x + side * (9 + Math.random() * 10)), 2, WW - 3);
    let y = 0; while (y < WH && !this.solid(x, y)) y++;
    if (y >= WH - 2 || y < 2) return;
    const owned = App.state.dex;
    const rare = Math.random() < 0.1;
    let pool = POKEMON.filter(q => q.r === (rare ? 'r' : 'c'));
    const fresh = pool.filter(q => !owned[q.id]);
    if (fresh.length && Math.random() < 0.6) pool = fresh;
    const poke = pool[Math.floor(Math.random() * pool.length)];
    pimg(poke.id);
    this.wild.push({ kind: 'wild', pid: poke.id, x: x + 0.05, y: y - 0.92, w: 0.9, h: 0.9, vx: 0, vy: 0, face: -side, ai: 1, walk: 0 });
  },

  catchResult(e, ok) {
    if (ok) {
      e.caught = 0.9; e.vx = 0;
      this.floater(e.x + 0.5, e.y - 0.5, `¡${POKE_BY_ID[e.pid].n} atrapado!`, '#ffe066');
    } else {
      e.flee = 1.6; e.face = e.x > this.p.x ? 1 : -1;
      e.bubble = { txt: '💨', t: 1.5 };
    }
  },

  sniff() {
    const d = this.dog;
    let best = null;
    for (let y = Math.floor(d.y) - 8; y <= Math.floor(d.y) + 8; y++)
      for (let x = Math.floor(d.x) - 8; x <= Math.floor(d.x) + 8; x++) {
        const id = this.get(x, y);
        if (id >= B.COAL && id <= B.DIAMOND && (!best || id > best.id)) best = { x, y, id };
      }
    if (best) {
      this.hint = { x: best.x, y: best.y, t: 12 };
      d.bubble = { txt: '!', t: 3 };
      App.sound('bark');
      App.toast(`🐾 ¡Snoopy olfateó ${BLOCKS[best.id].n.toLowerCase()} cerca! Sigue la luz amarilla.`);
    } else if (Math.random() < 0.35) {
      d.bubble = { txt: '🦴', t: 3 };
      App.addCredits(3);
      App.toast('🦴 Snoopy desenterró un hueso: +3 💎');
    }
  },

  syncBuddy() {
    const id = App.state.buddy;
    if (!id) { this.buddy = null; return; }
    pimg(id);
    if (!this.buddy || this.buddy.pid !== id) this.buddy = { kind: 'buddy', pid: id, x: this.p.x - 2.5, y: this.p.y, w: 0.9, h: 0.9, vx: 0, vy: 0, face: 1, walk: 0 };
  },

  // ---------- entrada ----------
  toWorld(ev) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) * this.dpr) / this.T + this.cam.x, y: ((ev.clientY - r.top) * this.dpr) / this.T + this.cam.y };
  },

  hitEntity(x, y) {
    const list = [...this.wild.filter(e => e.caught == null && e.flee == null), this.buddy, this.dog, this.sniffer];
    for (const e of list) {
      if (!e) continue;
      const pad = e.kind === 'wild' ? 0.45 : 0.2;
      if (x > e.x - pad && x < e.x + e.w + pad && y > e.y - pad - 0.4 && y < e.y + e.h + pad) return e;
    }
    return null;
  },

  bindPointer() {
    const c = this.canvas;
    c.addEventListener('contextmenu', e => e.preventDefault());
    c.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      if (this.paused) return;
      App.unlockAudio();
      const w = this.toWorld(ev);
      this.cursor = w;
      const e = this.hitEntity(w.x, w.y);
      if (e) { this.tapEntity(e); return; }
      // un toque basta: Simón camina hasta el bloque y lo pica o construye él solo
      const tx = Math.floor(w.x), ty = Math.floor(w.y);
      const build = ev.button === 2 || this.tool === 'bloque';
      this.drag = { id: ev.pointerId, build, key: tx + ',' + ty };
      if (build) this.addPlace(tx, ty, w.x - tx, w.y - ty, false); else this.addDig(tx, ty);
      try { c.setPointerCapture(ev.pointerId); } catch (_) { }
    });
    c.addEventListener('pointermove', ev => {
      const w = this.toWorld(ev); this.cursor = w;
      const d = this.drag;
      if (!d || d.id !== ev.pointerId) return;
      // arrastrar el dedo: pica (o construye) todo lo que toca
      const tx = Math.floor(w.x), ty = Math.floor(w.y), key = tx + ',' + ty;
      if (key === d.key) return;
      d.key = key;
      if (d.build) this.addPlace(tx, ty, 0, 0, true); else this.addDig(tx, ty);
    });
    const end = ev => { if (this.drag && this.drag.id === ev.pointerId) this.drag = null; if (ev.pointerType !== 'mouse') this.cursor = null; };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
  },

  tapEntity(e) {
    if (e.kind === 'wild') { App.openCatch(e); }
    else if (e.kind === 'dog') { e.bubble = { txt: '❤', t: 1.5 }; App.sound('bark'); this.floater(e.x + 0.4, e.y - 0.3, '¡Guau!', '#fff'); if (e.onGround) e.vy = -JUMP * 0.7; }
    else if (e.kind === 'buddy') { e.bubble = { txt: '❤', t: 1.5 }; App.sound('pop'); if (e.onGround) e.vy = -JUMP * 0.7; }
    else if (e.kind === 'sniffer') { e.bubble = { txt: '🛒', t: 1.5 }; App.sound('pop'); App.toast('¡El Sniffer te abre su tienda!'); App.go('shop'); }
  },

  bindKeys() {
    const map = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'jump', KeyW: 'jump', Space: 'jump' };
    addEventListener('keydown', e => {
      if (!this.running) return;
      if (map[e.code]) { this.input[map[e.code]] = true; e.preventDefault(); }
      if (e.code === 'KeyQ') App.cycleTool();
      if (e.code === 'KeyE') App.openCraft();
      if (/^Digit[1-9]$/.test(e.code)) App.selectSlot(+e.code.slice(5) - 1);
    });
    addEventListener('keyup', e => { if (map[e.code]) this.input[map[e.code]] = false; });
  },

  // ---------- dibujo ----------
  daylight() { return clamp((Math.sin(this.time * Math.PI * 2) + 0.3) / 1.0, 0, 1); },

  draw() {
    const g = this.g, T = this.T, c = this.canvas, W = c.width, H = c.height;
    g.imageSmoothingEnabled = false;
    const day = this.daylight();
    // cielo
    const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const top = mix([8, 12, 40], [92, 170, 240], day), bot = mix([30, 30, 70], [190, 228, 255], day);
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, `rgb(${top})`); grad.addColorStop(1, `rgb(${bot})`);
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    // sol / luna
    const ang = this.time * Math.PI * 2;
    const sx = W / 2 - Math.cos(ang) * W * 0.45, sy = H * 0.75 - Math.sin(ang) * H * 0.65;
    g.fillStyle = '#ffe680'; g.fillRect(sx - T * 0.6, sy - T * 0.6, T * 1.2, T * 1.2);
    const mx = W / 2 + Math.cos(ang) * W * 0.45, my = H * 0.75 + Math.sin(ang) * H * 0.65;
    g.fillStyle = '#e8ecff'; g.fillRect(mx - T * 0.5, my - T * 0.5, T, T);
    if (day < 0.5) { // estrellas
      g.fillStyle = `rgba(255,255,255,${(0.5 - day) * 2})`;
      for (let i = 0; i < 40; i++) g.fillRect((i * 97 % 100) / 100 * W, (i * 53 % 60) / 100 * H, 2 * this.dpr, 2 * this.dpr);
    }
    // nubes (paralaje)
    g.fillStyle = `rgba(255,255,255,${0.35 + day * 0.5})`;
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 0.37 * W + performance.now() * 0.01 * this.dpr - this.cam.x * T * 0.2) % (W + 4 * T) + W + 4 * T) % (W + 4 * T) - 2 * T;
      const cy = (0.08 + (i % 3) * 0.07) * H;
      g.fillRect(cx, cy, T * 2.5, T * 0.6); g.fillRect(cx + T * 0.5, cy - T * 0.35, T * 1.4, T * 0.4);
    }

    const camPx = Math.floor(this.cam.x * T), camPy = Math.floor(this.cam.y * T);
    const x0 = Math.max(0, Math.floor(this.cam.x)), x1 = Math.min(WW - 1, Math.ceil(this.cam.x + W / T));
    const y0 = Math.max(0, Math.floor(this.cam.y)), y1 = Math.min(WH - 1, Math.ceil(this.cam.y + H / T));
    const p = this.p, pcx = p.x + p.w / 2, pcy = p.y + 0.8;
    const job = this.jobs[0], dj = job && job.type === 'dig' && job.prog > 0 ? job : null;
    const djK = dj ? this.digK(dj) : 0;

    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const id = this.w[y * WW + x], sx2 = x * T - camPx, sy2 = y * T - camPy;
      const under = y > this.surf[x], digging = dj && dj.x === x && dj.y === y;
      if (under && (id === B.AIR || !BLOCKS[id].solid || id === B.GLASS || id === B.LEAVES || digging))
        g.drawImage(y > this.surf[x] + 3 ? TEXBG.stone : TEXBG.dirt, sx2, sy2, T, T);
      if (id && digging) {
        // el bloque se achica y se agrieta mientras Simón lo pica
        const s = T * (1 - 0.6 * djK), o = (T - s) / 2 + Math.sin(performance.now() / 30) * T * 0.03;
        g.drawImage(TEX[id], sx2 + o, sy2 + (T - s) / 2, s, s);
        g.drawImage(CRACKS[clamp(Math.floor(djK * 5), 0, 4)], sx2 + o, sy2 + (T - s) / 2, s, s);
      } else if (id) g.drawImage(TEX[id], sx2, sy2, T, T);
      const depth = y - this.surf[x] - 3;
      if (depth > 0) {
        let a = Math.min(0.55, depth / 30);
        a *= clamp((Math.hypot(x + 0.5 - pcx, y + 0.5 - pcy) - 2) / 6, 0.12, 1);
        g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(sx2, sy2, T, T);
      }
    }

    // bloques en espera: amarillo = para picar, bloque transparente = para construir
    const sel = App.selectedBlock();
    g.lineWidth = Math.max(2, T / 14);
    for (const j of this.jobs) {
      const jx = j.x * T - camPx, jy = j.y * T - camPy;
      if (j.type === 'dig') { g.strokeStyle = 'rgba(255,220,60,0.95)'; g.strokeRect(jx + 2, jy + 2, T - 4, T - 4); }
      else if (sel) { g.globalAlpha = 0.5; g.drawImage(TEX[sel], jx, jy, T, T); g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,0.9)'; g.strokeRect(jx + 2, jy + 2, T - 4, T - 4); }
    }
    if (this.cursor && !this.jobs.length) {   // marco del mouse en computador
      g.strokeStyle = 'rgba(255,255,255,0.7)';
      g.strokeRect(Math.floor(this.cursor.x) * T - camPx + 1, Math.floor(this.cursor.y) * T - camPy + 1, T - 2, T - 2);
    }
    // pista de Snoopy
    if (this.hint) {
      const hx = this.hint.x * T - camPx, hy = this.hint.y * T - camPy;
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 150);
      if (hx > -T && hx < W && hy > -T && hy < H) {
        g.strokeStyle = `rgba(255,220,60,${0.5 + pulse * 0.5})`; g.lineWidth = T / 8;
        g.strokeRect(hx, hy, T, T);
      } else {
        const ax = clamp(hx, T, W - T), ay = clamp(hy, T * 1.5, H - T * 2);
        g.fillStyle = `rgba(255,220,60,${0.6 + pulse * 0.4})`;
        g.beginPath(); g.arc(ax, ay, T * 0.35, 0, Math.PI * 2); g.fill();
        g.font = `bold ${T * 0.45}px sans-serif`; g.textAlign = 'center'; g.fillStyle = '#000';
        g.fillText(hx < 0 ? '◀' : hx > W ? '▶' : hy > H ? '▼' : '▲', ax, ay + T * 0.16);
      }
    }

    // entidades
    const ex = e => e.x * T - camPx;
    const ey = e => e.y * T - camPy;
    this.drawSniffer(g, this.sniffer, ex(this.sniffer), ey(this.sniffer), T);
    for (const e of this.wild) this.drawPoke(g, e, ex(e), ey(e), T, true);
    if (this.buddy) this.drawPoke(g, this.buddy, ex(this.buddy), ey(this.buddy), T, false);
    this.drawDog(g, this.dog, ex(this.dog), ey(this.dog), T);
    this.drawSimon(g, p, ex(p), ey(p), T);
    for (const e of [this.dog, this.buddy, this.sniffer, ...this.wild]) if (e && e.bubble) this.drawBubble(g, e.bubble.txt, ex(e) + e.w * T / 2, ey(e) - T * 0.5, T);

    for (const q of this.particles) { g.fillStyle = q.col; g.fillRect(q.x * T - camPx, q.y * T - camPy, T / 7, T / 7); }

    // noche
    if (day < 1) { g.fillStyle = `rgba(10,15,50,${(1 - day) * 0.3})`; g.fillRect(0, 0, W, H); }

    g.textAlign = 'center';
    for (const f of this.floaters) {
      g.font = `bold ${Math.round(T * 0.38)}px "Nunito", sans-serif`;
      g.globalAlpha = Math.min(1, f.t * 2);
      g.lineWidth = T / 10; g.strokeStyle = '#000'; g.strokeText(f.txt, f.x * T - camPx, f.y * T - camPy);
      g.fillStyle = f.col; g.fillText(f.txt, f.x * T - camPx, f.y * T - camPy);
      g.globalAlpha = 1;
    }
  },

  drawBubble(g, txt, x, y, T) {
    const s = T * 0.7;
    g.fillStyle = '#fff'; g.strokeStyle = '#222'; g.lineWidth = 2;
    g.fillRect(x - s / 2, y - s, s, s * 0.85); g.strokeRect(x - s / 2, y - s, s, s * 0.85);
    g.font = `bold ${Math.round(T * 0.42)}px sans-serif`; g.textAlign = 'center'; g.fillStyle = '#d22';
    g.fillText(txt, x, y - s * 0.3);
  },

  drawSimon(g, p, x, y, T) {
    const skin = SKINS[App.state.skin] || SKINS.clasico;
    const u = T / 16, ox = x + (p.w * T - T) / 2, oy = y + p.h * T - 29 * u;
    const R = (rx, ry, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(ox + rx * u), Math.round(oy + ry * u), Math.ceil(w * u), Math.ceil(h * u)); };
    const SK = '#f1c27d', f = p.face;
    const lift = Math.sin(p.walk) * 2, l1 = Math.max(0, lift), l2 = Math.max(0, -lift);
    // piernas
    R(4, 18, 4, 11 - l1, skin.pants); R(4, 27 - l1, 4, 2, skin.shoes);
    R(8, 18, 4, 11 - l2, skin.pants); R(8, 27 - l2, 4, 2, skin.shoes);
    // brazo de atrás
    const sw = Math.sin(p.walk) * 1.5;
    const backX = f > 0 ? 1 : 12, frontX = f > 0 ? 12 : 1;
    R(backX, 8 - sw, 3, 7, skin.shirt); R(backX, 15 - sw, 3, 3, SK);
    // cuerpo
    R(4, 8, 8, 10, skin.shirt); R(4, 17, 8, 1, 'rgba(0,0,0,0.25)');
    // cabeza
    R(4, 0, 8, 8, SK); R(4, 0, 8, 2, skin.hair);
    if (f > 0) R(4, 2, 2, 3, skin.hair); else R(10, 2, 2, 3, skin.hair);
    R(5, 4, 2, 1, '#fff'); R(9, 4, 2, 1, '#fff');
    R(f > 0 ? 6 : 5, 4, 1, 1, '#2b3fbf'); R(f > 0 ? 10 : 9, 4, 1, 1, '#2b3fbf');
    R(7, 6, 2, 1, '#a0522d');
    if (skin.cap) { R(4, -1, 8, 2.5, skin.cap); R(f > 0 ? 10 : 2, 1, 4, 1, skin.capBrim); }
    // brazo de adelante + herramienta
    const j = this.jobs[0], working = j && this.inReach(j.x, j.y);
    const raise = working ? Math.abs(Math.sin(p.swing * 14)) * 3 : 0;
    R(frontX, 8 + sw - raise, 3, 7, skin.shirt); R(frontX, 15 + sw - raise, 3, 3, SK);
    const hx = ox + (frontX + 1.5) * u, hy = oy + (16.5 + sw - raise) * u;
    g.save(); g.translate(hx, hy); g.scale(f, 1);
    if (TOOLTEX[this.tool]) {
      // la herramienta se balancea mientras trabaja; el mango queda en la mano
      g.rotate(-0.2 + (working ? Math.sin(p.swing * 14) * 0.8 : 0));
      const s = u * 0.8;
      g.drawImage(TOOLTEX[this.tool], -2.5 * s, -13.5 * s, 16 * s, 16 * s);
    } else {
      const id = App.selectedBlock();
      if (id) g.drawImage(TEX[id], u * 0.5, -u * 4, u * 6, u * 6);
    }
    g.restore();
  },

  drawDog(g, d, x, y, T) {
    const u = T / 14, acc = App.state.snoopyAcc || {};
    const grid = DOG_GRID.concat(Math.abs(d.vx) > 0.1 ? DOG_LEGS[Math.floor(d.walk * 2) % 2] : DOG_LEGS[0]);
    const flip = d.face < 0;
    const P = (cx, cy, col) => { g.fillStyle = col; g.fillRect(Math.round(x + (flip ? 11 - cx : cx) * u), Math.round(y + cy * u), Math.ceil(u), Math.ceil(u)); };
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x, y + 9 * u, 12 * u, u * 0.8);
    grid.forEach((row, cy) => { for (let cx = 0; cx < row.length; cx++) { const ch = row[cx]; if (ch !== '.') P(cx, cy, DOG_PAL[ch]); } });
    if (acc.capa) { for (let cx = 1; cx <= 5; cx++) { P(cx, 4, '#d02f2f'); P(cx, 5, '#b52424'); } P(0, 5, '#b52424'); }
    if (acc.piloto) { for (let cx = 6; cx <= 9; cx++) P(cx, 0, '#6b4423'); P(5, 0, '#6b4423'); P(8, 1, '#7ec8f5'); P(9, 1, '#7ec8f5'); }
  },

  drawSniffer(g, s, x, y, T) {
    // usa el mismo dibujo del logo (filas 4 a 13): 16 x 10 pixeles = 1.92 x 1.2 bloques
    const u = T * 0.12, flip = s.face < 0, bob = Math.abs(s.vx) > 0.1 ? Math.round(Math.sin(s.walk * 3)) : 0;
    for (let r = 4; r <= 13; r++) {
      const row = LOGO_GRID[r];
      for (let cx = 0; cx < 16; cx++) {
        const ch = row[cx];
        if ('scTD'.includes(ch)) continue;
        g.fillStyle = LOGO_PAL[ch];
        const lift = ch === 'L' ? 0 : bob * u * 0.4;
        g.fillRect(Math.round(x + (flip ? 15 - cx : cx) * u), Math.round(y + (r - 4) * u + lift), Math.ceil(u), Math.ceil(u));
      }
    }
  },

  drawPoke(g, e, x, y, T, wild) {
    const size = T * 2.2, cx = x + e.w * T / 2, bottom = y + e.h * T;
    if (e.caught != null) {
      const k = clamp(e.caught / 0.9, 0, 1), r = T * 0.3;
      g.fillStyle = '#e23b3b'; g.beginPath(); g.arc(cx, bottom - r - (1 - k) * T, r, Math.PI, 0); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, bottom - r - (1 - k) * T, r, 0, Math.PI); g.fill();
      g.fillStyle = '#222'; g.fillRect(cx - r, bottom - r - (1 - k) * T - 2, r * 2, 4);
      return;
    }
    const im = pimg(e.pid), hop = Math.abs(Math.sin(e.walk * 4)) * T * 0.08;
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(cx, bottom, T * 0.4, T * 0.1, 0, 0, Math.PI * 2); g.fill();
    if (im.complete && im.naturalWidth) {
      g.save(); g.translate(cx, bottom - size * 0.82 - hop);
      if (e.face > 0) g.scale(-1, 1);
      g.drawImage(im, -size / 2, 0, size, size); g.restore();
    } else {
      g.fillStyle = '#e23b3b'; g.fillRect(cx - T * 0.3, bottom - T * 0.6, T * 0.6, T * 0.3);
      g.fillStyle = '#fff'; g.fillRect(cx - T * 0.3, bottom - T * 0.3, T * 0.6, T * 0.3);
    }
    if (wild) {
      const name = POKE_BY_ID[e.pid].n;
      g.font = `bold ${Math.round(T * 0.28)}px "Nunito", sans-serif`; g.textAlign = 'center';
      const tw = g.measureText(name).width + T * 0.2, ty = bottom - size * 0.75;
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(cx - tw / 2, ty - T * 0.3, tw, T * 0.38);
      g.fillStyle = '#ffe066'; g.fillText(name, cx, ty - T * 0.02);
      if (Math.sin(performance.now() / 200 + e.x) > 0.6) { g.fillStyle = '#fff59d'; g.fillRect(cx + T * 0.45, ty - T * 0.55, T * 0.12, T * 0.12); }
    }
  }
};
