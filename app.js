'use strict';
// =====================================================================
//  SIMONCRAFT · Aplicación: menús, pruebas, tienda, Pokédex, guardado
// =====================================================================

const SAVE_KEY = 'simoncraft-save-v1';
// Aplicación web de Apps Script donde se guardan los resultados (se puede cambiar en Ajustes)
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxB_VZtKjf75ZD_ezK_rQEoRdfSGALqHIf7RCnQ6Mm2gcXJ2_bXnJxGyPCr9VH1wN6Q/exec';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pickOne = a => a[Math.floor(Math.random() * a.length)];
const today = () => new Date().toLocaleDateString('sv');   // AAAA-MM-DD
// número en palabras (0 a 100)
const numWord = n => {
  const u = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince',
    'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco',
    'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  if (n < 30) return u[n];
  if (n === 100) return 'cien';
  const d = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'][Math.floor(n / 10)];
  return n % 10 ? `${d} y ${u[n % 10]}` : d;
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const DEFAULT_STATE = () => ({
  name: 'Simón', curso: '', level: 1, credits: 30,
  inv: { 12: 10 }, sel: 12, tool: 'pico',
  dex: {}, buddy: 0,
  stats: { len: { ok: 0, n: 0 }, mat: { ok: 0, n: 0 }, cie: { ok: 0, n: 0 } },
  packsOnce: {}, packsDaily: {},
  skins: { clasico: 1 }, skin: 'clasico', snoopyAcc: {}, snoopyOwned: {},
  facts: {}, sound: true, voice: true, helpSeen: false, scriptUrl: '', world: null
});

const App = {
  state: DEFAULT_STATE(),
  dirty: false,
  screen: 'menu', prev: 'menu',

  // ------------------------------------------------------------------
  init() {
    this.load();
    this.readUrlParams();
    this.paintBackgrounds();
    Game.init($('#world'));
    if (this.state.world) Game.load(this.state.world);
    this.bindUI();
    this.refreshCredits();
    $('#btn-play').textContent = this.state.world ? '▶ Continuar' : '▶ Jugar';
    setInterval(() => { if (this.dirty) this.save(); }, 15000);
    addEventListener('visibilitychange', () => { if (document.hidden) this.save(); });
    addEventListener('pagehide', () => this.save());
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
    addEventListener('beforeinstallprompt', e => { e.preventDefault(); this.installEvt = e; $('#btn-install').classList.remove('hidden'); });
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) this.state = Object.assign(DEFAULT_STATE(), JSON.parse(raw));
    } catch (e) { /* sin almacenamiento: se juega igual */ }
    if (!this.state.scriptUrl) this.state.scriptUrl = DEFAULT_SCRIPT_URL;
  },
  save() {
    try {
      if (Game.w) this.state.world = Game.serialize();
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
      this.dirty = false;
    } catch (e) { }
  },

  // El profesor puede compartir un enlace como: index.html?script=URL&curso=3B
  readUrlParams() {
    const q = new URLSearchParams(location.search);
    if (q.get('script')) this.state.scriptUrl = q.get('script');
    if (q.get('curso')) this.state.curso = q.get('curso');
    if (q.toString()) { history.replaceState(null, '', location.pathname); this.save(); }
  },

  paintBackgrounds() {
    // logo del Sniffer
    for (const id of ['#logo', '#logo-bye']) {
      const lg = $(id).getContext('2d');
      LOGO_GRID.forEach((row, y) => [...row].forEach((ch, x) => { lg.fillStyle = LOGO_PAL[ch]; lg.fillRect(x, y, 1, 1); }));
    }
    // fondo de tierra pixelada para las pantallas
    const c = document.createElement('canvas'); c.width = c.height = 16;
    const g = c.getContext('2d'), r = mulberry32(5), cols = ['#6e4520', '#7a4e25', '#5f3b1b', '#835529'];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.fillStyle = cols[Math.floor(r() * 4)]; g.fillRect(x, y, 1, 1); }
    document.documentElement.style.setProperty('--dirt-img', `url(${c.toDataURL()})`);
  },

  // ------------------------------------------------------------------
  //  Navegación
  // ------------------------------------------------------------------
  go(name) {
    if (name === 'back') name = this.prev === this.screen ? 'menu' : this.prev;
    if (name === this.screen) return;
    if (this.screen === 'game') { Game.stop(); this.save(); }
    if (this.screen !== name && ['menu', 'game'].includes(this.screen)) this.prev = this.screen;
    this.screen = name;
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'scr-' + name));
    this.unlockAudio();
    if (name === 'game') {
      Game.tool = this.state.tool || 'pico';
      this.goFullscreen(); Game.start(); this.renderHotbar(); this.tickClock();
      if (!this.state.helpSeen) { this.state.helpSeen = true; this.save(); this.showHelp(); }
    }
    if (name === 'menu') $('#btn-play').textContent = this.state.world ? '▶ Continuar' : '▶ Jugar';
    if (name === 'tests') this.renderTests();
    if (name === 'shop') this.renderShop();
    if (name === 'dex') this.renderDex();
    if (name === 'settings') this.renderSettings();
    this.refreshCredits();
  },

  // Guardar: guarda el mundo, el inventario y los Pokémon, y sigue jugando
  saveGame() {
    this.save();
    Cloud.sync();
    this.sound('coin');
    this.toast('💾 ¡Partida guardada! Puedes seguir jugando.', 2500);
    Quiz.say('¡Partida guardada!');
  },

  // Salir: vuelve al menú. Por seguridad también guarda, para que nunca se pierda lo construido.
  exitGame() {
    this.go('menu');           // salir del juego siempre guarda
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => { });
  },

  // Salir de la aplicación: guarda todo y cierra la app para volver al celular.
  // Si el sistema no deja cerrarla (iPhone o navegador), muestra una pantalla de despedida.
  quitApp() {
    this.save();
    Cloud.sync();
    this.sound('pop');
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => { });
    this.go('bye');
    setTimeout(() => { try { window.close(); } catch (e) { } }, 400);
  },

  async goFullscreen() {
    if (!matchMedia('(pointer: coarse)').matches) return;
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape');
    } catch (e) { }
  },

  // Ayuda con dibujos grandes; también se lee en voz alta
  showHelp() {
    Game.paused = true;
    $('#modal-help .tools').innerHTML = Object.keys(TOOLS).map(k => `<img src="${this.toolUrl(k)}" alt="${TOOLS[k].n}">`).join('');
    $('#modal-help').classList.add('open');
    Quiz.say('¡Hola! Soy Simón. Elige el pico, el hacha o la pala abajo, y toca un bloque: yo voy y lo pico. ' +
      'Si arrastras el dedo, pico todo lo que tocas. Para construir, elige un bloque y toca donde quieras ponerlo. ' +
      'Toca un Pokémon para atraparlo. ¡A jugar!');
  },

  tickClock() {
    if (this.screen !== 'game') return;
    $('#clock').textContent = Game.daylight() > 0.25 ? '☀' : '🌙';
    setTimeout(() => this.tickClock(), 2000);
  },

  bindUI() {
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-go]'); if (t) { this.sound('pop'); this.go(t.dataset.go); }
      const c = e.target.closest('[data-close]'); if (c) c.closest('.modal').classList.remove('open');
    });
    // controles táctiles (se mantienen presionados)
    const hold = (id, key) => {
      const el = $(id);
      const on = e => { e.preventDefault(); Game.input[key] = true; el.classList.add('on'); this.unlockAudio(); };
      const off = () => { Game.input[key] = false; el.classList.remove('on'); };
      el.addEventListener('pointerdown', on);
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => el.addEventListener(ev, off));
      el.addEventListener('contextmenu', e => e.preventDefault());
    };
    hold('#b-left', 'left'); hold('#b-right', 'right'); hold('#b-jump', 'jump');
    $('#btn-craft').addEventListener('click', () => this.openCraft());
    $('#btn-save').addEventListener('click', () => this.saveGame());
    $('#btn-exit').addEventListener('click', () => this.exitGame());
    $('#btn-quit').addEventListener('click', () => this.quitApp());
    $('#q-next').addEventListener('click', () => Quiz.next());
    $('#q-speak').addEventListener('click', () => Quiz.speak());
    $('#pack-ok').addEventListener('click', () => { $('#modal-pack').classList.remove('open'); this.renderShop(); });
    $('#btn-install').addEventListener('click', async () => { if (this.installEvt) { this.installEvt.prompt(); this.installEvt = null; $('#btn-install').classList.add('hidden'); } });
    // ajustes
    $('#set-name').addEventListener('change', e => { this.state.name = e.target.value.trim() || 'Simón'; this.save(); });
    $('#set-curso').addEventListener('change', e => { this.state.curso = e.target.value.trim(); this.save(); });
    $('#set-sound').addEventListener('change', e => { this.state.sound = e.target.checked; this.save(); });
    $('#set-voice').addEventListener('change', e => { this.state.voice = e.target.checked; this.save(); });
    $('#btn-help').addEventListener('click', () => this.showHelp());
    $('#rotate-ok').addEventListener('click', () => $('#rotate').classList.add('hidden'));
    addEventListener('resize', () => { if (this.screen === 'dex') this.renderDex(); });
    $('#help-ok').addEventListener('click', () => { $('#modal-help').classList.remove('open'); Game.paused = false; });
    $('#set-url').addEventListener('change', e => { this.state.scriptUrl = e.target.value.trim() || DEFAULT_SCRIPT_URL; e.target.value = this.state.scriptUrl; this.save(); });
    $('#btn-sync').addEventListener('click', () => Cloud.sync(true));
    $('#btn-ranking').addEventListener('click', () => Cloud.showRanking());
    $('#btn-newworld').addEventListener('click', () => {
      if (!confirm('¿Crear un mundo nuevo? Se perderá lo construido (tus Pokémon y créditos se mantienen).')) return;
      Game.newWorld(); this.save(); this.toast('🌍 ¡Mundo nuevo creado!');
    });
    $('#btn-reset').addEventListener('click', () => {
      if (!confirm('¿Borrar TODO el progreso? Esto no se puede deshacer.')) return;
      localStorage.removeItem(SAVE_KEY); location.reload();
    });
  },

  // ------------------------------------------------------------------
  //  Inventario y barra de bloques
  // ------------------------------------------------------------------
  items() { return Object.keys(this.state.inv).map(Number).filter(id => this.state.inv[id] > 0).sort((a, b) => a - b); },
  texUrl(id) { this._tu = this._tu || {}; return this._tu[id] || (this._tu[id] = TEX[id].toDataURL()); },
  addItem(id, n) { this.state.inv[id] = (this.state.inv[id] || 0) + n; this.renderHotbar(); this.dirty = true; },
  useItem(id) {
    if (!(this.state.inv[id] > 0)) return false;
    this.state.inv[id]--;
    if (!this.state.inv[id]) delete this.state.inv[id];
    this.renderHotbar(); this.dirty = true;
    return true;
  },
  selectedBlock() {
    const s = this.state;
    if (s.inv[s.sel] > 0) return s.sel;
    const first = this.items()[0];
    if (first) s.sel = first;
    return first || 0;
  },
  // Barra de abajo: herramientas (pico, hacha, pala) y después los bloques para construir
  setTool(tool, block) {
    Game.tool = this.state.tool = tool;
    if (block) this.state.sel = block;
    Game.jobs = [];
    this.renderHotbar(); this.sound('pop');
    this.toast(tool === 'bloque' ? `🧱 Construir con ${BLOCKS[this.state.sel].n}: toca donde quieras ponerlo` : `${TOOLS[tool].n}: ${TOOLS[tool].tip}`, 1600);
  },
  cycleTool() {
    const list = [...Object.keys(TOOLS), ...(this.selectedBlock() ? ['bloque'] : [])];
    this.setTool(list[(list.indexOf(Game.tool) + 1) % list.length]);
  },
  selectSlot(i) {
    const tools = Object.keys(TOOLS);
    if (i < tools.length) return this.setTool(tools[i]);
    const id = this.items()[i - tools.length]; if (id) this.setTool('bloque', id);
  },
  toolUrl(k) { this._tl = this._tl || {}; return this._tl[k] || (this._tl[k] = TOOLTEX[k].toDataURL()); },
  renderHotbar() {
    if (this.screen !== 'game') return;
    if (Game.tool === 'bloque' && !this.selectedBlock()) Game.tool = this.state.tool = 'pico';
    const sel = this.selectedBlock(), tool = Game.tool;
    const tools = Object.entries(TOOLS).map(([k, t]) =>
      `<button class="slot tool ${tool === k ? 'sel' : ''}" data-tool="${k}" title="${t.n}"><img src="${this.toolUrl(k)}" alt="${t.n}"></button>`).join('');
    const blocks = this.items().map(id =>
      `<button class="slot ${tool === 'bloque' && id === sel ? 'sel' : ''}" data-id="${id}" title="${BLOCKS[id].n}"><img src="${this.texUrl(id)}" alt="${BLOCKS[id].n}"><b>${this.state.inv[id]}</b></button>`).join('');
    $('#hotbar').innerHTML = tools + '<i class="sep"></i>' + blocks;
    $$('#hotbar [data-tool]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); this.setTool(b.dataset.tool); }));
    $$('#hotbar [data-id]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); this.setTool('bloque', +b.dataset.id); }));
    // que el bloque elegido quede a la vista dentro de la barra
    const s = $('#hotbar .slot.sel'); if (s) s.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  },

  // ------------------------------------------------------------------
  //  Crafteo
  // ------------------------------------------------------------------
  openCraft() {
    if (this.screen !== 'game') return;
    const inv = this.state.inv, img = id => `<img src="${this.texUrl(id)}" alt="${BLOCKS[id].n}" title="${BLOCKS[id].n}">`;
    $('#inv').innerHTML = this.items().map(id => `<div class="slot" title="${BLOCKS[id].n}">${img(id)}<b>${inv[id]}</b></div>`).join('') || '<p>Vacío</p>';
    $('#recipes').innerHTML = RECIPES.map((r, i) => {
      const can = Object.entries(r.from).every(([id, n]) => (inv[id] || 0) >= n);
      const list = o => Object.entries(o).map(([id, n]) => `<span class="it">${n}× ${img(id)}</span>`).join(' + ');
      return `<div class="recipe">${list(r.from)} ➜ ${list(r.to)}<button class="mc-btn small green" data-r="${i}" ${can ? '' : 'disabled'}>Fabricar</button><span class="tip">💡 ${r.tip}</span></div>`;
    }).join('');
    $$('#recipes [data-r]').forEach(b => b.addEventListener('click', () => {
      const r = RECIPES[+b.dataset.r];
      Object.entries(r.from).forEach(([id, n]) => { inv[id] -= n; if (!inv[id]) delete inv[id]; });
      Object.entries(r.to).forEach(([id, n]) => this.addItem(+id, n));
      this.sound('coin'); this.openCraft();
    }));
    $('#modal-craft').classList.add('open');
  },

  // ------------------------------------------------------------------
  //  Créditos, avisos y datos curiosos
  // ------------------------------------------------------------------
  addCredits(n) { this.state.credits += n; this.refreshCredits(); this.dirty = true; if (n > 0) this.sound('coin'); },
  refreshCredits() { $$('.cr').forEach(e => e.textContent = this.state.credits); },
  toast(msg, ms = 2600, cls = '') {
    const t = document.createElement('div'); t.className = 'toast ' + cls; t.textContent = msg;
    $('#toasts').appendChild(t);
    while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
    setTimeout(() => t.remove(), ms);
  },
  learnFact(id) {
    if (this.state.facts[id]) return;
    this.state.facts[id] = 1;
    this.toast(`💡 ¿Sabías que...? ${BLOCKS[id].fact}`, 6000, 'fact');
  },

  // ------------------------------------------------------------------
  //  Sonidos (sintetizados, sin archivos)
  // ------------------------------------------------------------------
  unlockAudio() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { }
  },
  sound(kind) {
    if (!this.state.sound || !this.ac) return;
    const ac = this.ac, t = ac.currentTime;
    const tone = (f, d, type = 'square', when = 0, vol = 0.08) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t + when);
      g.gain.setValueAtTime(vol, t + when); g.gain.exponentialRampToValueAtTime(0.0001, t + when + d);
      o.connect(g).connect(ac.destination); o.start(t + when); o.stop(t + when + d);
    };
    switch (kind) {
      case 'break': tone(140, 0.08, 'sawtooth', 0, 0.06); tone(90, 0.1, 'square', 0.03, 0.05); break;
      case 'place': tone(220, 0.07, 'triangle', 0, 0.12); break;
      case 'pop': tone(660, 0.06, 'square', 0, 0.05); break;
      case 'coin': tone(988, 0.07); tone(1319, 0.12, 'square', 0.07); break;
      case 'ok': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', i * 0.08)); break;
      case 'bad': tone(300, 0.15, 'sawtooth'); tone(200, 0.25, 'sawtooth', 0.15); break;
      case 'bark': tone(520, 0.06, 'square', 0, 0.1); tone(420, 0.08, 'square', 0.12, 0.1); break;
      case 'pack': [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.15, 'triangle', i * 0.1, 0.1)); break;
    }
  },

  // ------------------------------------------------------------------
  //  Pantalla de pruebas
  // ------------------------------------------------------------------
  renderTests() {
    const s = this.state;
    const lv = [['1', '🐣 Fácil · 5 y 6 años'], ['2', '🐥 Medio · 7 y 8 años'], ['3', '🦅 Difícil · 9 y 10 años'], ['4', '🏆 Experto · 11 y 12 años']];
    $('#levels').innerHTML = lv.map(([v, t]) => `<button class="mc-btn small ${+v === s.level ? 'sel' : ''}" data-lv="${v}">${t}</button>`).join('');
    $$('#levels [data-lv]').forEach(b => b.addEventListener('click', () => { s.level = +b.dataset.lv; this.save(); this.renderTests(); }));
    $('#subjects').innerHTML = Object.entries(SUBJECTS).map(([k, sub]) => {
      const st = s.stats[k], pct = st.n ? Math.round(st.ok / st.n * 100) : 0;
      return `<button class="subject" style="background:${sub.color}" data-sub="${k}">
        <div class="ico">${sub.icon}</div><h4>${sub.n}</h4>
        <p>${st.ok} de ${st.n} respuestas correctas</p><div class="meter"><i style="width:${pct}%"></i></div></button>`;
    }).join('');
    $$('#subjects [data-sub]').forEach(b => b.addEventListener('click', () => Quiz.startTest(b.dataset.sub)));
  },

  // ------------------------------------------------------------------
  //  Tienda
  // ------------------------------------------------------------------
  packStatus(p) {
    const s = this.state;
    if (p.kind === 'skin' && s.skins[p.skin]) return s.skin === p.skin ? 'using' : 'owned';
    if (p.kind === 'snoopy' && s.snoopyOwned[p.acc]) return s.snoopyAcc[p.acc] ? 'using' : 'owned';
    if (p.free === 'once') return s.packsOnce[p.id] ? 'done' : 'free';
    if (p.free === 'daily') return s.packsDaily[p.id] === today() ? 'tomorrow' : 'free';
    return 'buy';
  },
  // La tienda va en pestañas para que cada una quepa en la pantalla sin desplazarse
  renderShop() {
    const groups = [
      ['🎁 Gratis', PACKS.filter(p => p.free)],
      ['⚡ Pokémon', PACKS.filter(p => !p.free && p.kind === 'poke')],
      ['🧱 Bloques', PACKS.filter(p => !p.free && p.kind === 'blocks')],
      ['🧢 Estilos', PACKS.filter(p => p.kind === 'skin' || p.kind === 'snoopy')]
    ];
    this.shopTab = this.shopTab || 0;
    $('#shop-tabs').innerHTML = groups.map(([t], i) => `<button class="mc-btn small ${i === this.shopTab ? 'sel' : ''}" data-tab="${i}">${t}</button>`).join('');
    $$('#shop-tabs [data-tab]').forEach(b => b.addEventListener('click', () => { this.shopTab = +b.dataset.tab; this.sound('pop'); this.renderShop(); }));
    $('#shop').innerHTML = [groups[this.shopTab]].map(([, list]) => list.map(p => {
      const st = this.packStatus(p);
      const btn = {
        free: `<button class="mc-btn green" data-pack="${p.id}">¡GRATIS!</button>`,
        tomorrow: `<button class="mc-btn" disabled>Vuelve mañana</button>`,
        done: `<button class="mc-btn" disabled>Ya abierto</button>`,
        using: `<button class="mc-btn" data-pack="${p.id}">${p.kind === 'snoopy' ? 'Quitar' : 'En uso ✔'}</button>`,
        owned: `<button class="mc-btn green" data-pack="${p.id}">Usar</button>`,
        buy: `<button class="mc-btn" data-pack="${p.id}" ${this.state.credits < p.price ? 'disabled' : ''}>Comprar · ${p.price} 💎</button>`
      }[st];
      return `<div class="card ${p.free ? 'free' : ''}"><div class="ico">${p.icon}</div><h4>${p.n}</h4><p>${p.desc}</p>${btn}</div>`;
    }).join('')).join('');
    $$('#shop [data-pack]').forEach(b => b.addEventListener('click', () => this.buyPack(PACKS.find(p => p.id === b.dataset.pack))));
  },

  buyPack(p) {
    const s = this.state, st = this.packStatus(p);
    if (st === 'owned' || st === 'using') {
      if (p.kind === 'skin') s.skin = p.skin;
      else s.snoopyAcc[p.acc] = !s.snoopyAcc[p.acc];
      this.save(); this.renderShop(); this.sound('pop'); return;
    }
    if (st === 'buy') {
      if (s.credits < p.price) { this.toast('Te faltan créditos. ¡Haz una prueba para ganar más!'); return; }
      s.credits -= p.price;
    } else if (st === 'free') {
      if (p.free === 'once') s.packsOnce[p.id] = 1; else s.packsDaily[p.id] = today();
    } else return;
    this.refreshCredits();
    this.openPack(p);
    this.save();
  },

  rollPokes(p) {
    const out = (p.fixed || []).map(id => POKE_BY_ID[id]);
    for (let i = 0; i < p.count; i++) {
      let rar = p.pool === 'c' ? 'c' : (p.legend && i < p.legend) ? 'l' : Math.random() < (p.rare ?? 0.12) ? 'r' : 'c';
      let pool = POKEMON.filter(q => q.r === rar && (!p.type || q.t === p.type));
      if (!pool.length) pool = POKEMON.filter(q => !p.type || q.t === p.type);
      out.push(pickOne(pool));
    }
    return out;
  },

  openPack(p) {
    const s = this.state, cards = $('#pack-cards');
    $('#pack-title').textContent = `${p.icon} ${p.n}`;
    let html = '';
    if (p.kind === 'poke') {
      for (const mon of this.rollPokes(p)) {
        const isNew = !s.dex[mon.id];
        s.dex[mon.id] = (s.dex[mon.id] || 0) + 1;
        if (!isNew) s.credits += 5;
        html += `<div class="pcard"><div class="in"><div class="b">✦</div><div class="f">
          <img src="${pokeImg(mon.id)}" alt="${mon.n}"><b class="rar-${mon.r}">${mon.n}</b><small>Tipo ${mon.t}</small>
          ${isNew ? '<span class="new">¡NUEVO!</span>' : '<span class="dup">Repetido: +5 💎</span>'}</div></div></div>`;
      }
    } else if (p.kind === 'blocks') {
      for (const [id, n] of Object.entries(p.items)) {
        s.inv[id] = (s.inv[id] || 0) + n;
        html += `<div class="pcard"><div class="in"><div class="b">✦</div><div class="f"><img src="${this.texUrl(id)}" alt=""><b>${BLOCKS[id].n}</b><small>× ${n}</small></div></div></div>`;
      }
    } else if (p.kind === 'skin') {
      s.skins[p.skin] = 1; s.skin = p.skin;
      html = `<div class="pcard"><div class="in"><div class="b">✦</div><div class="f"><div style="font-size:60px">${p.icon}</div><b>${p.n}</b><small>¡Simón ya lo lleva puesto!</small></div></div></div>`;
    } else if (p.kind === 'snoopy') {
      s.snoopyOwned[p.acc] = 1; s.snoopyAcc[p.acc] = true;
      html = `<div class="pcard"><div class="in"><div class="b">✦</div><div class="f"><div style="font-size:60px">${p.icon}</div><b>${p.n}</b><small>¡Snoopy lo lleva puesto!</small></div></div></div>`;
    }
    cards.innerHTML = html;
    $('#modal-pack').classList.add('open');
    this.sound('pack');
    $$('#pack-cards .pcard').forEach((c, i) => setTimeout(() => { c.classList.add('flip'); this.sound('pop'); }, 450 + i * 450));
    this.refreshCredits();
    Cloud.sync();
  },

  // ------------------------------------------------------------------
  //  Pokédex
  // ------------------------------------------------------------------
  // Pokédex por páginas: se calcula cuántas tarjetas caben en la pantalla
  renderDex() {
    const s = this.state, got = POKEMON.filter(p => s.dex[p.id]).length;
    $('#dex-count').textContent = `${got} / ${POKEMON.length}`;
    const box = $('#dex'), cw = 104, ch = 118;
    const cols = Math.max(2, Math.floor((box.clientWidth + 8) / (cw + 8)));
    const rows = Math.max(1, Math.floor((box.clientHeight + 8) / (ch + 8)));
    const per = cols * rows, pages = Math.ceil(POKEMON.length / per);
    const list = [...POKEMON].sort((a, b) => (s.dex[b.id] ? 1 : 0) - (s.dex[a.id] ? 1 : 0));   // los atrapados primero
    this.dexPage = clamp(this.dexPage || 0, 0, pages - 1);
    box.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    $('#dex-prev').disabled = this.dexPage === 0;
    $('#dex-next').disabled = this.dexPage >= pages - 1;
    $('#dex-prev').onclick = () => { this.dexPage--; this.sound('pop'); this.renderDex(); };
    $('#dex-next').onclick = () => { this.dexPage++; this.sound('pop'); this.renderDex(); };
    box.innerHTML = list.slice(this.dexPage * per, (this.dexPage + 1) * per).map(p => {
      const own = s.dex[p.id];
      return `<div class="mon ${own ? '' : 'locked'} ${s.buddy === p.id ? 'buddy' : ''}" data-id="${p.id}">
        ${own > 1 ? `<span class="cnt">×${own}</span>` : ''}
        <img src="${pokeImg(p.id)}" alt="${own ? p.n : '???'}">
        <div class="nm ${own ? 'rar-' + p.r : ''}">${own ? p.n : '???'}</div></div>`;
    }).join('');
    $$('#dex .mon:not(.locked)').forEach(m => m.addEventListener('click', () => {
      const id = +m.dataset.id;
      s.buddy = s.buddy === id ? 0 : id;
      this.save(); this.renderDex(); this.sound('pop');
      if (s.buddy) this.toast(`🐾 ${POKE_BY_ID[id].n} ahora acompaña a Simón y Snoopy`);
    }));
  },

  // ------------------------------------------------------------------
  //  Ajustes
  // ------------------------------------------------------------------
  renderSettings() {
    const s = this.state;
    $('#set-name').value = s.name; $('#set-curso').value = s.curso;
    $('#set-sound').checked = s.sound; $('#set-voice').checked = s.voice; $('#set-url').value = s.scriptUrl;
  },

  // ------------------------------------------------------------------
  //  Atrapar Pokémon desde el mundo
  // ------------------------------------------------------------------
  openCatch(e) { Game.paused = true; Game.jobs = []; Quiz.startCatch(e); }
};

// =====================================================================
//  Preguntas
// =====================================================================
const Quiz = {
  mode: 'test', list: [], i: 0, ok: 0, cur: null, entity: null, recent: [],

  // Matemática: reconocer números (contar, identificar, mayor/menor, orden) y sumas/restas simples.
  // Sin multiplicar ni dividir. El nivel solo cambia el tamaño de los números (10, 20, 50, 100).
  math(l) {
    const max = { 1: 10, 2: 20, 3: 50, 4: 100 }[l] || 10;
    const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    // 3 números distintos cercanos al correcto, dentro de 0..max
    const near = (a, lo = 0, hi = max) => {
      const s = new Set([a]);
      for (const d of shuffle([1, -1, 2, -2, 3, -3, 10, -10, 5])) { if (s.size >= 4) break; if (a + d >= lo && a + d <= hi) s.add(a + d); }
      while (s.size < 4) s.add(r(lo, hi));
      return [...s];
    };
    const kinds = ['count', 'name', 'big', 'small', 'after', 'before', 'missing', 'sum', 'sum', 'sub', 'sub'];
    if (max > 20) kinds.splice(0, 1);          // contar más de 20 objetos es muy largo
    const k = pickOne(kinds);
    const [ico, obj] = pickOne([['🍎', 'manzanas'], ['⭐', 'estrellas'], ['🐟', 'peces'], ['🦴', 'huesos'], ['⚽', 'pelotas'], ['🌸', 'flores']]);
    let q, o, e;
    const opMax = l <= 2 ? 10 : 20;   // sumas y restas siempre sencillas
    if (k === 'sum') {
      const a = r(2, opMax), x = r(1, a - 1), y = a - x;
      q = `¿Cuánto es ${x} + ${y}?` + (a <= 10 ? `\n${ico.repeat(x)}  +  ${ico.repeat(y)}` : '');
      o = near(a); e = `${x} + ${y} = ${a}. ¡Juntamos todo y contamos!`;
    } else if (k === 'sub') {
      const x = r(2, opMax), y = r(1, Math.min(x - 1, 5)), a = x - y;
      q = x <= 10 ? `Hay ${x} ${obj} y Snoopy se lleva ${y}. ¿Cuántas quedan?\n${ico.repeat(x)}` : `¿Cuánto es ${x} − ${y}?`;
      o = near(a); e = `${x} − ${y} = ${a}. Si quitamos ${y}, quedan ${a}.`;
    } else if (k === 'count') {
      const a = r(1, Math.min(max, 12));
      q = `¿Cuántas ${obj} hay?\n${ico.repeat(a)}`; o = near(a, 1); e = `Contando una por una hay ${a} ${obj}.`;
    } else if (k === 'name') {
      const a = r(0, max);
      q = `¿Cuál es el número ${numWord(a).toUpperCase()}?`; o = near(a); e = `${numWord(a)[0].toUpperCase() + numWord(a).slice(1)} se escribe ${a}.`;
    } else if (k === 'big' || k === 'small') {
      const s = new Set(); while (s.size < 4) s.add(r(0, max));
      const nums = [...s].sort((x, y) => x - y), a = k === 'big' ? nums[3] : nums[0];
      q = `¿Qué número es MÁS ${k === 'big' ? 'GRANDE' : 'PEQUEÑO'}?`; o = [a, ...nums.filter(n => n !== a)];
      e = k === 'big' ? `El ${a} es el más grande de todos.` : `El ${a} es el más pequeño de todos.`;
    } else if (k === 'after') {
      const a = r(1, max);
      q = `¿Qué número viene DESPUÉS del ${a - 1}?`; o = near(a); e = `Contando: ${a - 1}, ${a}. Después del ${a - 1} viene el ${a}.`;
    } else if (k === 'before') {
      const a = r(0, max - 1);
      q = `¿Qué número va ANTES del ${a + 1}?`; o = near(a); e = `Contando: ${a}, ${a + 1}. Antes del ${a + 1} va el ${a}.`;
    } else {
      const start = r(0, max - 3), hole = r(1, 2), seq = [start, start + 1, start + 2, start + 3];
      const a = seq[hole]; seq[hole] = '__';
      q = `¿Qué número falta?\n${seq.join(' , ')}`; o = near(a); e = `Contando en orden: ${start}, ${start + 1}, ${start + 2}, ${start + 3}.`;
    }
    return { s: 'mat', q, o: o.map(String), e };
  },

  make(subject, level) {
    if (subject === 'mat') return this.math(level);
    let pool = QUESTIONS.filter(q => q.s === subject && q.l <= level && !this.recent.includes(q));
    const exact = pool.filter(q => q.l === level);
    if (exact.length && Math.random() < 0.7) pool = exact;
    if (!pool.length) { this.recent = []; pool = QUESTIONS.filter(q => q.s === subject && q.l <= level); }
    const q = pickOne(pool);
    this.recent.push(q); if (this.recent.length > 20) this.recent.shift();
    return q;
  },

  startTest(subject) {
    this.mode = 'test'; this.subject = subject; this.i = 0; this.ok = 0;
    this.list = Array.from({ length: 4 }, () => this.make(subject, App.state.level));
    this.open();
  },

  startCatch(e) {
    this.mode = 'catch'; this.entity = e; this.i = 0; this.ok = 0;
    this.subject = pickOne(Object.keys(SUBJECTS));
    this.list = [this.make(this.subject, App.state.level)];
    this.open();
  },

  open() { $('#modal-quiz').classList.add('open'); this.show(); },

  show() {
    const q = this.list[this.i], sub = SUBJECTS[q.s];
    const correct = q.o[0];
    this.cur = { q, opts: shuffle([...q.o]), correct, tries: 0 };
    $('#q-subject').textContent = `${sub.icon} ${sub.n}`;
    $('#q-subject').style.background = sub.color;
    $('#q-progress').textContent = this.mode === 'test' ? `${this.i + 1} / ${this.list.length}` : '';
    if (this.mode === 'catch') {
      const mon = POKE_BY_ID[this.entity.pid];
      $('#q-poke').innerHTML = `<img src="${pokeImg(mon.id)}" alt="${mon.n}"><p>¡Un <b>${mon.n}</b> salvaje! Responde bien para atraparlo.</p>`;
    } else $('#q-poke').innerHTML = '';
    $('#q-text').textContent = q.q;
    $('#q-feedback').innerHTML = '';
    $('#q-next').classList.add('hidden');
    $('#q-options').innerHTML = this.cur.opts.map((o, i) => `<button data-i="${i}">${esc(o)}</button>`).join('');
    $$('#q-options button').forEach(b => b.addEventListener('click', () => this.answer(b)));
    if (App.state.voice) this.speak();
  },

  // Lee en voz alta (para niños que aún no leen). Los emojis no se leen.
  say(text, ms = 0) {
    if (!App.state.voice || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const clean = String(text).replace(/\p{Extended_Pictographic}|️|‍/gu, '').replace(/__/g, 'cuál').replace(/\n/g, '. ');
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'es-ES'; u.rate = 0.85;
      const v = speechSynthesis.getVoices().find(x => x.lang.startsWith('es'));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    }, ms);
  },
  speak() {
    if (!this.cur) return;
    const voiceWas = App.state.voice; App.state.voice = true;
    const intro = this.mode === 'catch' ? `¡Un ${POKE_BY_ID[this.entity.pid].n} salvaje! ` : '';
    this.say(`${intro}${this.cur.q.q} ... ${this.cur.opts.join('... ')}`);
    App.state.voice = voiceWas;
  },

  // Si se equivoca puede intentar de nuevo: la opción incorrecta se tacha.
  answer(btn) {
    const { q, opts, correct } = this.cur;
    const chosen = opts[+btn.dataset.i], good = chosen === correct;
    const first = this.cur.tries === 0;
    this.cur.tries++;
    const st = App.state.stats[q.s];
    if (first) { st.n++; if (good) st.ok++; }
    App.dirty = true;
    if (!good) {
      btn.classList.add('bad'); btn.disabled = true;
      App.sound('bad');
      const msg = pickOne(['¡Casi! Intenta otra vez 💪', '¡Uy! Prueba con otra 🙂', 'Esa no es. ¡Tú puedes! ⭐']);
      $('#q-feedback').textContent = msg;
      this.say(msg);
      return;
    }
    $$('#q-options button').forEach(b => { b.disabled = true; });
    btn.classList.add('ok');
    if (first) this.ok++;
    this.firstTry = first;
    const prize = this.mode === 'test' ? (first ? 10 : 5) : 0;
    if (prize) App.addCredits(prize);
    App.sound('ok');
    const head = pickOne(['¡Muy bien!', '¡Excelente!', '¡Correcto!', '¡Súper!']);
    $('#q-feedback').innerHTML = `${esc('✅ ' + head)}${prize ? ` +${prize} 💎` : ''}<span class="exp">💡 ${esc(q.e)}</span>`;
    this.say(`${head} ${q.e}`);
    const last = this.i >= this.list.length - 1;
    $('#q-next').textContent = this.mode === 'catch' ? 'Continuar ▶' : last ? 'Ver resultado ▶' : 'Siguiente ▶';
    $('#q-next').classList.remove('hidden');
  },

  next() {
    if (this.mode === 'catch') return this.finishCatch();
    if (this.i < this.list.length - 1) { this.i++; this.show(); return; }
    if (this.i === this.list.length - 1 && !this.done) return this.finishTest();
    this.close();
  },

  finishTest() {
    this.done = true;
    const n = this.list.length, perfect = this.ok === n;
    if (perfect) App.addCredits(10);
    // todas se terminan respondiendo bien: 10 a la primera, 5 al reintentar
    const earned = this.ok * 10 + (n - this.ok) * 5 + (perfect ? 10 : 0);
    const nStars = Math.max(1, Math.round(this.ok / n * 3));
    const stars = '⭐'.repeat(nStars) + '☆'.repeat(3 - nStars);
    const msg = perfect ? '¡Perfecto! Snoopy está orgulloso 🐶' : this.ok >= n / 2 ? '¡Muy bien! Sigue practicando 💪' : '¡Buen trabajo! Practicando aprendes más 🌱';
    $('#q-poke').innerHTML = ''; $('#q-options').innerHTML = ''; $('#q-feedback').innerHTML = '';
    $('#q-progress').textContent = '';
    $('#q-text').innerHTML = `<div class="result"><div class="stars">${stars}</div><div class="big">${this.ok} / ${n} a la primera</div><div>${msg}</div><div class="big">+${earned} 💎</div></div>`;
    this.say(`${msg} Ganaste ${earned} créditos.`);
    $('#q-next').textContent = 'Volver';
    App.save();
    Cloud.result(this.subject, this.ok, n);
  },

  finishCatch() {
    // el botón Continuar solo aparece al responder bien, así que siempre se atrapa
    const e = this.entity, mon = POKE_BY_ID[e.pid];
    const isNew = !App.state.dex[mon.id];
    App.state.dex[mon.id] = (App.state.dex[mon.id] || 0) + 1;
    App.addCredits(5);
    App.toast(isNew ? `🎉 ¡Atrapaste a ${mon.n}! Nuevo en tu Pokédex. +5 💎` : `¡Atrapaste otro ${mon.n}! +5 💎`);
    this.say(`¡Atrapaste a ${mon.n}!`);
    Cloud.result(this.subject, this.ok, 1);
    Game.catchResult(e, true);
    App.save();
    this.close();
  },

  close() {
    this.done = false;
    if ('speechSynthesis' in window && this.mode === 'test') speechSynthesis.cancel();
    $('#modal-quiz').classList.remove('open');
    Game.paused = false;
    if (App.screen === 'tests') App.renderTests();
  }
};

// =====================================================================
//  Conexión con Google Apps Script (opcional)
// =====================================================================
const Cloud = {
  player() {
    const s = App.state;
    return { name: s.name, curso: s.curso, credits: s.credits, dex: Object.keys(s.dex).length, level: s.level, stats: s.stats };
  },
  async post(body) {
    const url = App.state.scriptUrl;
    if (!url) return null;
    try {
      // text/plain evita la verificación CORS previa (Apps Script la soporta así)
      const r = await fetch(url, { method: 'POST', body: JSON.stringify(body) });
      return await r.json();
    } catch (e) { return null; }
  },
  result(subject, ok, total) { this.post({ action: 'result', player: this.player(), result: { subject, ok, total, level: App.state.level } }); },
  async sync(manual) {
    if (!App.state.scriptUrl) { if (manual) $('#cloud-status').textContent = 'Primero pega la URL de Apps Script.'; return; }
    if (manual) $('#cloud-status').textContent = 'Sincronizando...';
    const r = await this.post({ action: 'sync', player: this.player() });
    if (manual) $('#cloud-status').textContent = r && r.ok ? '✅ ¡Progreso guardado en Google!' : '⚠ No se pudo conectar. Revisa la URL y que la app esté publicada para "Cualquier persona".';
  },
  async showRanking() {
    const url = App.state.scriptUrl;
    if (!url) { $('#cloud-status').textContent = 'Primero pega la URL de Apps Script.'; return; }
    $('#cloud-status').textContent = 'Cargando ranking...';
    try {
      const r = await (await fetch(`${url}?action=ranking&curso=${encodeURIComponent(App.state.curso)}`)).json();
      $('#ranking').innerHTML = (r.ranking || []).map(p => `<li>${esc(p.name)} ${p.curso ? '(' + esc(p.curso) + ')' : ''} — 📖 ${p.dex} Pokémon · 💎 ${p.credits}</li>`).join('') || '<li>Aún no hay jugadores.</li>';
      $('#cloud-status').textContent = `🏆 Ranking ${App.state.curso ? 'del curso ' + App.state.curso : 'general'}`;
    } catch (e) { $('#cloud-status').textContent = '⚠ No se pudo cargar el ranking.'; }
  }
};

App.init();
