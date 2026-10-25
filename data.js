'use strict';
// =====================================================================
//  SIMONCRAFT · Datos del juego (bloques, Pokémon, tienda y preguntas)
//  Para agregar preguntas nuevas, edita QUESTIONS más abajo.
// =====================================================================

// ---------- Logo: Sniffer en pixel-art (16x16) ----------
const LOGO_GRID = [
  'ssssssssssssssss',
  'sssccccsssssssss',
  'ssccccccssssscss',
  'sssssssssssscccs',
  'sssgGgGgGsssssss',
  'ssgGgGgGgGgsssss',
  'sgGgGgGgGgGRssss',
  'sRRRRRRRRRWERsss',
  'rRRRRRRRRRRRROOs',
  'rRRRRRRRRRRROOON',
  'rrRRRRRRRRRrssss',
  'srrrrrrrrrrsssss',
  'ssLLssLLsLLsssss',
  'ssLLssLLsLLsssss',
  'TTTTTTTTTTTTTTTT',
  'DDDDDDDDDDDDDDDD'
];
const LOGO_PAL = {
  s: '#7EC8F5', c: '#FFFFFF', g: '#6ABE45', G: '#3F8F2F', R: '#B5443A', r: '#7D2A24',
  W: '#FFFFFF', E: '#1A1A1A', O: '#E07A5F', N: '#F2C94C', L: '#4A2A1C', T: '#5CB83A', D: '#8B5A2B'
};

// ---------- Bloques ----------
const B = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, LOG: 4, LEAVES: 5, SAND: 6, COAL: 7, IRON: 8, GOLD: 9,
  DIAMOND: 10, BEDROCK: 11, PLANKS: 12, GLASS: 13, BRICK: 14, GOLDB: 15, DIAMB: 16, FLOWER: 17, POKE: 18
};

// n = nombre, h = segundos para picar, solid = choca, drop = qué bloque entrega, cr = créditos al picar
const BLOCKS = {
  0:  { n: 'Aire', solid: false },
  1:  { n: 'Pasto', h: 0.3, solid: true, drop: 2, fact: 'El pasto hace fotosíntesis: transforma la luz del Sol en alimento.' },
  2:  { n: 'Tierra', h: 0.3, solid: true, drop: 2, fact: 'La tierra tiene minerales, agua y restos de plantas que alimentan a las raíces.' },
  3:  { n: 'Piedra', h: 0.6, solid: true, drop: 3, fact: 'Las rocas tardan millones de años en formarse. Hay rocas ígneas, sedimentarias y metamórficas.' },
  4:  { n: 'Tronco', h: 0.5, solid: true, drop: 4, fact: 'Los troncos tienen anillos: ¡cada anillo es un año de vida del árbol!' },
  5:  { n: 'Hojas', h: 0.15, solid: true, drop: 5, fact: 'Las hojas liberan el oxígeno que respiramos.' },
  6:  { n: 'Arena', h: 0.25, solid: true, drop: 6, fact: 'La arena son pedacitos de roca. ¡Al derretirla se fabrica vidrio!' },
  7:  { n: 'Carbón', h: 0.7, solid: true, drop: 7, cr: 1, fact: 'El carbón se formó con plantas que vivieron hace millones de años.' },
  8:  { n: 'Hierro', h: 0.8, solid: true, drop: 8, cr: 2, fact: 'Los imanes atraen el hierro. ¡Tu sangre también tiene hierro!' },
  9:  { n: 'Oro', h: 0.9, solid: true, drop: 9, cr: 4, fact: 'El oro no se oxida: por eso sigue brillando después de miles de años.' },
  10: { n: 'Diamante', h: 1.0, solid: true, drop: 10, cr: 8, fact: 'El diamante es carbono muy apretado. ¡Es el mineral natural más duro!' },
  11: { n: 'Roca madre', h: Infinity, solid: true },
  12: { n: 'Tablas', h: 0.4, solid: true, drop: 12 },
  13: { n: 'Vidrio', h: 0.3, solid: true, drop: 13 },
  14: { n: 'Ladrillos', h: 0.6, solid: true, drop: 14 },
  15: { n: 'Bloque de oro', h: 0.7, solid: true, drop: 15 },
  16: { n: 'Bloque de diamante', h: 0.8, solid: true, drop: 16 },
  17: { n: 'Flor', h: 0.05, solid: false, drop: 17 },
  18: { n: 'Pokébloque', h: 0.3, solid: true, drop: 18 }
};

const RECIPES = [
  { from: { 4: 1 }, to: { 12: 4 }, tip: '1 tronco se corta en 4 tablas. 1 × 4 = 4' },
  { from: { 6: 2 }, to: { 13: 1 }, tip: 'Con calor, la arena se derrite y se convierte en vidrio.' },
  { from: { 3: 2, 6: 1 }, to: { 14: 2 }, tip: '2 piedras + 1 arena = 2 ladrillos' },
  { from: { 9: 4 }, to: { 15: 1 }, tip: '4 minerales de oro forman 1 bloque de oro.' },
  { from: { 10: 4 }, to: { 16: 1 }, tip: '4 diamantes forman 1 bloque de diamante.' },
  { from: { 8: 1, 7: 1 }, to: { 18: 2 }, tip: 'Hierro + carbón = ¡Pokébloques!' }
];

// ---------- Herramientas ----------
// Cualquier herramienta rompe cualquier bloque, pero la correcta es 3 veces más rápida.
const TOOLS = {
  pico:  { n: 'Pico',  tip: 'Para piedra y minerales', fast: [3, 7, 8, 9, 10, 13, 14, 15, 16, 18] },
  hacha: { n: 'Hacha', tip: '¡Corta el árbol completo!', fast: [4, 5, 12] },
  pala:  { n: 'Pala',  tip: 'Para tierra, pasto y arena', fast: [1, 2, 6, 17] }
};

// ---------- Pokémon ----------
// r: c = común, r = raro, l = legendario
const POKEMON = [
  { id: 1, n: 'Bulbasaur', t: 'planta', r: 'c' }, { id: 2, n: 'Ivysaur', t: 'planta', r: 'r' }, { id: 3, n: 'Venusaur', t: 'planta', r: 'r' },
  { id: 43, n: 'Oddish', t: 'planta', r: 'c' }, { id: 69, n: 'Bellsprout', t: 'planta', r: 'c' }, { id: 152, n: 'Chikorita', t: 'planta', r: 'c' },
  { id: 252, n: 'Treecko', t: 'planta', r: 'c' }, { id: 387, n: 'Turtwig', t: 'planta', r: 'c' }, { id: 495, n: 'Snivy', t: 'planta', r: 'c' },
  { id: 810, n: 'Grookey', t: 'planta', r: 'c' },
  { id: 4, n: 'Charmander', t: 'fuego', r: 'c' }, { id: 5, n: 'Charmeleon', t: 'fuego', r: 'r' }, { id: 6, n: 'Charizard', t: 'fuego', r: 'r' },
  { id: 37, n: 'Vulpix', t: 'fuego', r: 'c' }, { id: 58, n: 'Growlithe', t: 'fuego', r: 'c' }, { id: 77, n: 'Ponyta', t: 'fuego', r: 'c' },
  { id: 155, n: 'Cyndaquil', t: 'fuego', r: 'c' }, { id: 255, n: 'Torchic', t: 'fuego', r: 'c' }, { id: 390, n: 'Chimchar', t: 'fuego', r: 'c' },
  { id: 498, n: 'Tepig', t: 'fuego', r: 'c' }, { id: 813, n: 'Scorbunny', t: 'fuego', r: 'c' },
  { id: 7, n: 'Squirtle', t: 'agua', r: 'c' }, { id: 8, n: 'Wartortle', t: 'agua', r: 'r' }, { id: 9, n: 'Blastoise', t: 'agua', r: 'r' },
  { id: 54, n: 'Psyduck', t: 'agua', r: 'c' }, { id: 60, n: 'Poliwag', t: 'agua', r: 'c' }, { id: 79, n: 'Slowpoke', t: 'agua', r: 'c' },
  { id: 129, n: 'Magikarp', t: 'agua', r: 'c' }, { id: 131, n: 'Lapras', t: 'agua', r: 'r' }, { id: 158, n: 'Totodile', t: 'agua', r: 'c' },
  { id: 258, n: 'Mudkip', t: 'agua', r: 'c' }, { id: 393, n: 'Piplup', t: 'agua', r: 'c' }, { id: 501, n: 'Oshawott', t: 'agua', r: 'c' },
  { id: 816, n: 'Sobble', t: 'agua', r: 'c' },
  { id: 25, n: 'Pikachu', t: 'eléctrico', r: 'c' }, { id: 26, n: 'Raichu', t: 'eléctrico', r: 'r' }, { id: 81, n: 'Magnemite', t: 'eléctrico', r: 'c' },
  { id: 100, n: 'Voltorb', t: 'eléctrico', r: 'c' }, { id: 125, n: 'Electabuzz', t: 'eléctrico', r: 'r' }, { id: 172, n: 'Pichu', t: 'eléctrico', r: 'c' },
  { id: 179, n: 'Mareep', t: 'eléctrico', r: 'c' }, { id: 403, n: 'Shinx', t: 'eléctrico', r: 'c' },
  { id: 16, n: 'Pidgey', t: 'normal', r: 'c' }, { id: 19, n: 'Rattata', t: 'normal', r: 'c' }, { id: 39, n: 'Jigglypuff', t: 'normal', r: 'c' },
  { id: 52, n: 'Meowth', t: 'normal', r: 'c' }, { id: 133, n: 'Eevee', t: 'normal', r: 'r' }, { id: 143, n: 'Snorlax', t: 'normal', r: 'r' },
  { id: 161, n: 'Sentret', t: 'normal', r: 'c' }, { id: 216, n: 'Teddiursa', t: 'normal', r: 'c' },
  { id: 35, n: 'Clefairy', t: 'hada', r: 'c' }, { id: 175, n: 'Togepi', t: 'hada', r: 'c' }, { id: 92, n: 'Gastly', t: 'fantasma', r: 'c' },
  { id: 94, n: 'Gengar', t: 'fantasma', r: 'r' }, { id: 74, n: 'Geodude', t: 'roca', r: 'c' }, { id: 95, n: 'Onix', t: 'roca', r: 'r' },
  { id: 66, n: 'Machop', t: 'lucha', r: 'c' }, { id: 63, n: 'Abra', t: 'psíquico', r: 'c' }, { id: 147, n: 'Dratini', t: 'dragón', r: 'r' },
  { id: 149, n: 'Dragonite', t: 'dragón', r: 'r' },
  { id: 144, n: 'Articuno', t: 'hielo', r: 'l' }, { id: 145, n: 'Zapdos', t: 'eléctrico', r: 'l' }, { id: 146, n: 'Moltres', t: 'fuego', r: 'l' },
  { id: 150, n: 'Mewtwo', t: 'psíquico', r: 'l' }, { id: 151, n: 'Mew', t: 'psíquico', r: 'l' }, { id: 249, n: 'Lugia', t: 'psíquico', r: 'l' },
  { id: 250, n: 'Ho-Oh', t: 'fuego', r: 'l' }, { id: 384, n: 'Rayquaza', t: 'dragón', r: 'l' }
];
const POKE_BY_ID = Object.fromEntries(POKEMON.map(p => [p.id, p]));
const pokeImg = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

// ---------- Estilos (skins) de Simón ----------
const SKINS = {
  clasico:    { n: 'Clásico',    shirt: '#2fa7c9', pants: '#3b4fa8', hair: '#5a3a1e', shoes: '#555' },
  entrenador: { n: 'Entrenador', shirt: '#e23b3b', pants: '#2b4f9c', hair: '#2b1a10', shoes: '#222', cap: '#e23b3b', capBrim: '#ffffff' },
  minero:     { n: 'Minero',     shirt: '#e8892b', pants: '#5b4a3a', hair: '#7a4b22', shoes: '#3a2a1a', cap: '#f2c94c', capBrim: '#d4a82a' },
  diamante:   { n: 'Diamante',   shirt: '#4fe3e0', pants: '#2bb3b0', hair: '#3a2410', shoes: '#1d8a88', cap: '#4fe3e0', capBrim: '#2bb3b0' }
};

// ---------- Tienda ----------
// free: 'daily' = gratis una vez al día, 'once' = gratis una sola vez
const PACKS = [
  { id: 'bienvenida', n: 'Pack Bienvenida', icon: '🎁', price: 0, free: 'once', kind: 'poke', fixed: [25], count: 2, pool: 'c', desc: '¡Pikachu + 2 Pokémon sorpresa!' },
  { id: 'diario', n: 'Pack Diario', icon: '📅', price: 0, free: 'daily', kind: 'poke', count: 3, pool: 'c', desc: '3 Pokémon comunes gratis cada día.' },
  { id: 'bloques', n: 'Bloques Básicos', icon: '🧱', price: 0, free: 'daily', kind: 'blocks', items: { 12: 20, 3: 15, 13: 6, 17: 4 }, desc: 'Tablas, piedra, vidrio y flores gratis cada día.' },
  { id: 'fuego', n: 'Pack Fuego', icon: '🔥', price: 40, kind: 'poke', type: 'fuego', count: 3, desc: '3 Pokémon de tipo fuego.' },
  { id: 'agua', n: 'Pack Agua', icon: '💧', price: 40, kind: 'poke', type: 'agua', count: 3, desc: '3 Pokémon de tipo agua.' },
  { id: 'planta', n: 'Pack Planta', icon: '🌿', price: 40, kind: 'poke', type: 'planta', count: 3, desc: '3 Pokémon de tipo planta.' },
  { id: 'electrico', n: 'Pack Eléctrico', icon: '⚡', price: 40, kind: 'poke', type: 'eléctrico', count: 3, desc: '3 Pokémon de tipo eléctrico.' },
  { id: 'misterio', n: 'Pack Misterio', icon: '❓', price: 70, kind: 'poke', count: 4, rare: 0.35, desc: '4 Pokémon de cualquier tipo. ¡Más raros!' },
  { id: 'legendario', n: 'Pack Legendario', icon: '👑', price: 150, kind: 'poke', legend: 1, count: 3, rare: 1, desc: '1 legendario garantizado + 2 raros.' },
  { id: 'magicos', n: 'Bloques Mágicos', icon: '✨', price: 50, kind: 'blocks', items: { 15: 8, 16: 4, 18: 10, 14: 20 }, desc: 'Oro, diamante, Pokébloques y ladrillos.' },
  { id: 'skin-entrenador', n: 'Estilo Entrenador', icon: '🧢', price: 40, kind: 'skin', skin: 'entrenador', desc: 'Gorra roja de entrenador Pokémon.' },
  { id: 'skin-minero', n: 'Estilo Minero', icon: '⛑️', price: 50, kind: 'skin', skin: 'minero', desc: 'Casco amarillo para las cuevas.' },
  { id: 'skin-diamante', n: 'Armadura Diamante', icon: '💠', price: 120, kind: 'skin', skin: 'diamante', desc: '¡La armadura más brillante!' },
  { id: 'snoopy-capa', n: 'Capa de Snoopy', icon: '🦸', price: 30, kind: 'snoopy', acc: 'capa', desc: 'Snoopy se vuelve superhéroe.' },
  { id: 'snoopy-piloto', n: 'Gorro de Piloto', icon: '✈️', price: 40, kind: 'snoopy', acc: 'piloto', desc: 'Gorro y gafas de aviador para Snoopy.' }
];

const SUBJECTS = {
  len: { n: 'Lenguaje', icon: '📖', color: '#e2a03b' },
  mat: { n: 'Matemática', icon: '➗', color: '#3b8fe2' },
  cie: { n: 'Ciencias', icon: '🔬', color: '#4caf50' }
};

// ---------- Preguntas ----------
// s = asignatura, l = nivel (1: 5-6 años, 2: 7-8 años, 3: 9-10 años, 4: 11-12 años), q = pregunta,
// o = opciones (la PRIMERA es la correcta; el juego las desordena), e = explicación
// Las preguntas se leen en voz alta: los emojis no se leen, solo ayudan a quien aún no lee.
const QUESTIONS = [
  // ---- LENGUAJE · Nivel 1 (5 y 6 años) ----
  { s: 'len', l: 1, q: '🐶 ¿Con qué letra empieza PERRO?', o: ['P', 'M', 'S', 'L'], e: 'PE-RRO empieza con P.' },
  { s: 'len', l: 1, q: '🐱 ¿Con qué letra empieza GATO?', o: ['G', 'P', 'T', 'M'], e: 'GA-TO empieza con G.' },
  { s: 'len', l: 1, q: '🐝 ¿Con qué vocal empieza ABEJA?', o: ['A', 'E', 'I', 'O'], e: 'A-BE-JA empieza con A.' },
  { s: 'len', l: 1, q: '🏝️ ¿Con qué vocal empieza ISLA?', o: ['I', 'A', 'O', 'U'], e: 'IS-LA empieza con I.' },
  { s: 'len', l: 1, q: '🐻 ¿Con qué vocal empieza OSO?', o: ['O', 'A', 'U', 'E'], e: 'O-SO empieza con O.' },
  { s: 'len', l: 1, q: '🍇 ¿Con qué vocal empieza UVA?', o: ['U', 'O', 'A', 'I'], e: 'U-VA empieza con U.' },
  { s: 'len', l: 1, q: '🐘 ¿Con qué vocal empieza ELEFANTE?', o: ['E', 'A', 'I', 'O'], e: 'E-LE-FAN-TE empieza con E.' },
  { s: 'len', l: 1, q: '¿Cuál de estas letras es una vocal?', o: ['A', 'M', 'P', 'S'], e: 'Las vocales son A, E, I, O, U.' },
  { s: 'len', l: 1, q: '¿Cuál de estas letras es una vocal?', o: ['O', 'T', 'L', 'R'], e: 'Las vocales son A, E, I, O, U.' },
  { s: 'len', l: 1, q: '☀️ ¿Qué palabra rima con SOL?', o: ['COL', 'MESA', 'PATO', 'LUNA'], e: 'SOL y COL terminan igual: -OL.' },
  { s: 'len', l: 1, q: '🐭 ¿Qué palabra rima con RATÓN?', o: ['CAMIÓN', 'PERRO', 'SAPO', 'NUBE'], e: 'RATÓN y CAMIÓN terminan igual: -ÓN.' },
  { s: 'len', l: 1, q: '¿Dónde dice MAMÁ?', o: ['MAMÁ', 'PAPÁ', 'MESA', 'MANO'], e: 'M-A-M-Á dice MAMÁ.' },
  { s: 'len', l: 1, q: '🐟 ¿Dónde dice PEZ?', o: ['PEZ', 'PIE', 'PAN', 'SAL'], e: 'P-E-Z dice PEZ.' },
  { s: 'len', l: 1, q: '🦆 ¿Cuántas sílabas tiene PATO? (aplaude: PA - TO)', o: ['2', '1', '3', '4'], e: 'PA - TO: son 2 aplausos, 2 sílabas.' },
  { s: 'len', l: 1, q: '☀️ ¿Cuántas sílabas tiene SOL? (aplaude)', o: ['1', '2', '3', '4'], e: 'SOL se dice con 1 aplauso: 1 sílaba.' },
  { s: 'len', l: 1, q: '⬆️ ¿Qué es lo contrario de ARRIBA?', o: ['ABAJO', 'ADENTRO', 'LEJOS', 'GRANDE'], e: 'Lo contrario de arriba es abajo.' },
  { s: 'len', l: 1, q: '🥶 ¿Qué es lo contrario de FRÍO?', o: ['CALIENTE', 'NIEVE', 'AGUA', 'AZUL'], e: 'Lo contrario de frío es caliente.' },
  { s: 'len', l: 1, q: '🧒 ¿Con qué letra empieza SIMÓN?', o: ['S', 'M', 'N', 'C'], e: 'SI-MÓN empieza con S.' },
  { s: 'len', l: 1, q: '⚡ ¿Con qué letra empieza PIKACHU?', o: ['P', 'K', 'C', 'A'], e: 'PI-KA-CHU empieza con P.' },
  { s: 'len', l: 1, q: '🌙 ¿Con qué letra empieza LUNA?', o: ['L', 'N', 'M', 'T'], e: 'LU-NA empieza con L.' },

  // ---- CIENCIAS · Nivel 1 (5 y 6 años) ----
  { s: 'cie', l: 1, q: '¿Qué animal dice "guau guau"?', o: ['🐶 perro', '🐱 gato', '🐮 vaca', '🐔 gallina'], e: 'El perro ladra: ¡guau guau! Como Snoopy.' },
  { s: 'cie', l: 1, q: '¿Qué animal dice "miau"?', o: ['🐱 gato', '🐶 perro', '🐷 cerdo', '🐴 caballo'], e: 'El gato maúlla: ¡miau!' },
  { s: 'cie', l: 1, q: '¿Qué animal vive en el agua?', o: ['🐟 pez', '🐶 perro', '🐔 gallina', '🐴 caballo'], e: 'El pez vive en el agua y respira con branquias.' },
  { s: 'cie', l: 1, q: '¿Qué animal puede volar?', o: ['🐦 pájaro', '🐶 perro', '🐷 cerdo', '🐢 tortuga'], e: 'Los pájaros vuelan con sus alas.' },
  { s: 'cie', l: 1, q: '¿Con qué miramos?', o: ['👀 ojos', '👂 orejas', '👃 nariz', '👄 boca'], e: 'Miramos con los ojos.' },
  { s: 'cie', l: 1, q: '¿Con qué escuchamos?', o: ['👂 orejas', '👀 ojos', '👃 nariz', '✋ manos'], e: 'Escuchamos con las orejas.' },
  { s: 'cie', l: 1, q: '¿Qué nos da luz y calor durante el día?', o: ['☀️ el Sol', '🌙 la Luna', '☁️ una nube', '🌈 el arcoíris'], e: 'El Sol nos da luz y calor.' },
  { s: 'cie', l: 1, q: '¿Qué vemos en el cielo de noche?', o: ['🌙 la Luna', '☀️ el Sol', '🌈 el arcoíris', '🌻 un girasol'], e: 'De noche vemos la Luna y las estrellas.' },
  { s: 'cie', l: 1, q: '¿Qué necesita una planta para crecer?', o: ['💧 agua', '🍬 dulces', '🧸 juguetes', '📺 tele'], e: 'Las plantas necesitan agua, luz y tierra.' },
  { s: 'cie', l: 1, q: '¿Qué fruta es amarilla?', o: ['🍌 plátano', '🍓 frutilla', '🍇 uva', '🍉 sandía'], e: 'El plátano es amarillo.' },
  { s: 'cie', l: 1, q: '¿Qué usamos cuando llueve?', o: ['☂️ paraguas', '🕶️ lentes de sol', '🩴 chalas', '🏖️ toalla de playa'], e: 'El paraguas nos protege de la lluvia.' },
  { s: 'cie', l: 1, q: '¿Qué cosa es fría?', o: ['🧊 hielo', '🔥 fuego', '☀️ sol', '☕ té caliente'], e: 'El hielo es agua congelada: ¡es muy frío!' },
  { s: 'cie', l: 1, q: '¿Qué come un conejo?', o: ['🥕 zanahoria', '🍖 carne', '🍕 pizza', '🍭 dulces'], e: 'Los conejos comen plantas, como la zanahoria.' },
  { s: 'cie', l: 1, q: '🐶 ¿Cuántas patas tiene un perro?', o: ['4', '2', '6', '8'], e: 'Los perros tienen 4 patas.' },
  { s: 'cie', l: 1, q: '¿Qué nos ayuda a crecer sanos?', o: ['🍎 comer fruta', '🍭 muchos dulces', '📺 tele todo el día', '😴 no dormir'], e: 'Comer fruta, jugar y dormir bien nos mantiene sanos.' },
  { s: 'cie', l: 1, q: '¿Con qué parte del cuerpo caminamos?', o: ['🦵 piernas', '👂 orejas', '👃 nariz', '👀 ojos'], e: 'Caminamos con las piernas.' },
  { s: 'cie', l: 1, q: '¿Cuál animal es el más grande?', o: ['🐘 elefante', '🐜 hormiga', '🐭 ratón', '🐝 abeja'], e: 'El elefante es enorme: ¡el animal terrestre más grande!' },
  { s: 'cie', l: 1, q: '¿Con qué olemos las flores?', o: ['👃 nariz', '👂 orejas', '🦶 pies', '✋ manos'], e: 'Olemos con la nariz. ¡Snoopy y el Sniffer tienen muy buen olfato!' },

  // ---- LENGUAJE ----
  { s: 'len', l: 2, q: '¿Cuál de estas palabras es un animal?', o: ['perro', 'mesa', 'azul', 'correr'], e: 'Perro es un animal. Mesa es un objeto, azul es un color y correr es una acción.' },
  { s: 'len', l: 2, q: '¿Qué letra falta en "__apato"?', o: ['z', 's', 'c', 'x'], e: 'Zapato se escribe con Z.' },
  { s: 'len', l: 2, q: '¿Cuántas sílabas tiene "mariposa"?', o: ['4', '3', '2', '5'], e: 'ma - ri - po - sa: son 4 sílabas.' },
  { s: 'len', l: 2, q: '¿Cuál es lo contrario de "grande"?', o: ['pequeño', 'alto', 'gordo', 'largo'], e: 'Lo contrario (antónimo) de grande es pequeño.' },
  { s: 'len', l: 2, q: '¿Qué nombre empieza con la letra P?', o: ['Pikachu', 'Snoopy', 'Mewtwo', 'Charmander'], e: 'Pikachu empieza con P.' },
  { s: 'len', l: 2, q: '¿Qué palabra rima con "gato"?', o: ['pato', 'perro', 'sol', 'mesa'], e: 'Gato y pato terminan igual: -ato.' },
  { s: 'len', l: 2, q: '¿Qué palabra va primero en el abecedario?', o: ['árbol', 'casa', 'mono', 'sol'], e: 'Árbol empieza con A, que es la primera letra.' },
  { s: 'len', l: 2, q: '¿Cuántas vocales hay en español?', o: ['5', '4', '6', '7'], e: 'Las vocales son a, e, i, o, u: son 5.' },
  { s: 'len', l: 2, q: '¿Qué palabra está en plural (más de uno)?', o: ['bloques', 'perro', 'casa', 'sol'], e: 'Bloques termina en -s y nombra a varios.' },
  { s: 'len', l: 2, q: 'Completa: "Simón ___ un bloque."', o: ['pone', 'pongo', 'ponemos', 'ponen'], e: 'Simón es una persona (él), entonces decimos "pone".' },
  { s: 'len', l: 2, q: '¿Cuál es lo contrario de "día"?', o: ['noche', 'sol', 'mañana', 'luz'], e: 'Lo contrario del día es la noche.' },
  { s: 'len', l: 2, q: '¿Cuál de estas palabras es un color?', o: ['verde', 'saltar', 'piedra', 'rápido'], e: 'Verde es un color, como el pasto de SimonCraft.' },
  { s: 'len', l: 3, q: '¿Cuál de estas palabras es un sustantivo?', o: ['montaña', 'correr', 'bonito', 'rápidamente'], e: 'Los sustantivos nombran personas, animales, cosas o lugares. Montaña es un lugar.' },
  { s: 'len', l: 3, q: '¿Cuál de estas palabras es un verbo?', o: ['saltar', 'casa', 'feliz', 'azul'], e: 'Los verbos son acciones. Saltar es una acción.' },
  { s: 'len', l: 3, q: '¿Cuál de estas palabras es un adjetivo?', o: ['valiente', 'perro', 'comer', 'ayer'], e: 'Los adjetivos dicen cómo es algo. "Valiente" describe a alguien.' },
  { s: 'len', l: 3, q: '¿Cuál es un sinónimo de "feliz"?', o: ['contento', 'triste', 'enojado', 'cansado'], e: 'Sinónimos son palabras que significan lo mismo: feliz = contento.' },
  { s: 'len', l: 3, q: '¿Cuál palabra está bien escrita?', o: ['bicicleta', 'vicicleta', 'bisicleta', 'visicleta'], e: 'Se escribe bicicleta, con B y con C.' },
  { s: 'len', l: 3, q: '¿Cuál palabra está bien escrita?', o: ['hormiga', 'ormiga', 'hormija', 'ormija'], e: 'Hormiga lleva H al inicio y se escribe con G.' },
  { s: 'len', l: 3, q: '¿Qué signos se usan para hacer una pregunta?', o: ['¿ ?', '¡ !', ', ,', '. .'], e: 'En español la pregunta se abre con ¿ y se cierra con ?.' },
  { s: 'len', l: 3, q: '¿Cuál es el plural de "lápiz"?', o: ['lápices', 'lápizes', 'lápizs', 'lápiz'], e: 'Cuando una palabra termina en Z, en plural cambia a C: lápiz → lápices.' },
  { s: 'len', l: 3, q: '¿Qué palabra es aguda (se dice más fuerte al final)?', o: ['corazón', 'mesa', 'árbol', 'lápiz'], e: 'co-ra-ZÓN: la fuerza está en la última sílaba.' },
  { s: 'len', l: 3, q: '¿Cuál es lo contrario de "abrir"?', o: ['cerrar', 'empujar', 'entrar', 'mirar'], e: 'El antónimo de abrir es cerrar.' },
  { s: 'len', l: 3, q: 'En "Snoopy corre rápido", ¿cuál es el verbo?', o: ['corre', 'Snoopy', 'rápido', 'ninguna'], e: '"Corre" es la acción que hace Snoopy.' },
  { s: 'len', l: 3, q: '¿Qué tipo de texto cuenta una historia con personajes?', o: ['cuento', 'receta', 'instructivo', 'afiche'], e: 'El cuento narra una historia con inicio, desarrollo y final.' },
  { s: 'len', l: 4, q: '¿Cuál palabra es esdrújula?', o: ['pájaro', 'canción', 'mesa', 'reloj'], e: 'PÁ-ja-ro: la fuerza está en la antepenúltima sílaba. Las esdrújulas siempre llevan tilde.' },
  { s: 'len', l: 4, q: '¿Cuál es el sujeto en "Los Pokémon juegan en el bosque"?', o: ['Los Pokémon', 'juegan', 'en el bosque', 'el bosque'], e: 'El sujeto es quien realiza la acción: los Pokémon.' },
  { s: 'len', l: 4, q: '¿Cuál es un sinónimo de "enorme"?', o: ['gigantesco', 'diminuto', 'ligero', 'rápido'], e: 'Enorme y gigantesco significan muy grande.' },
  { s: 'len', l: 4, q: '¿Cuál palabra está bien acentuada?', o: ['camión', 'camion', 'cámion', 'camíon'], e: 'Camión es aguda terminada en N, por eso lleva tilde en la Ó.' },
  { s: 'len', l: 4, q: '"Snoopy es un rayo cuando corre". ¿Qué quiere decir?', o: ['Que Snoopy corre muy rápido', 'Que Snoopy es eléctrico', 'Que Snoopy está mojado', 'Que Snoopy duerme'], e: 'Es lenguaje figurado: compara a Snoopy con un rayo porque es muy veloz.' },
  { s: 'len', l: 4, q: '¿Cuál es un sustantivo propio?', o: ['Simón', 'perro', 'ciudad', 'mineral'], e: 'Los sustantivos propios son nombres específicos y van con mayúscula.' },
  { s: 'len', l: 4, q: 'Completa: "Ayer Simón ___ una casa de madera."', o: ['construyó', 'construye', 'construirá', 'construyendo'], e: '"Ayer" indica pasado, por eso usamos "construyó".' },
  { s: 'len', l: 4, q: '¿Cuál de estas palabras es un adverbio?', o: ['lentamente', 'lento', 'lentitud', 'lentos'], e: 'Los adverbios dicen cómo se hace algo. Muchos terminan en -mente.' },
  { s: 'len', l: 4, q: '¿Cuál es el plural de "pez"?', o: ['peces', 'pezes', 'pezs', 'peses'], e: 'Pez termina en Z, y en plural cambia a C: peces.' },
  { s: 'len', l: 4, q: 'Completa: "Mira, ___ está el Sniffer."', o: ['ahí', 'hay', 'ay', 'ai'], e: '"Ahí" indica un lugar. "Hay" es del verbo haber y "¡ay!" es una exclamación.' },
  { s: 'len', l: 4, q: '¿Cuál palabra está MAL escrita?', o: ['havía', 'había', 'hacía', 'hoja'], e: 'La forma correcta es "había", con H y con B.' },
  { s: 'len', l: 4, q: '¿Qué parte del cuento presenta a los personajes y el lugar?', o: ['el inicio', 'el desarrollo', 'el final', 'el título'], e: 'En el inicio conocemos a los personajes y dónde ocurre la historia.' },

  // ---- CIENCIAS ----
  { s: 'cie', l: 2, q: '¿Qué necesita una planta para vivir?', o: ['agua, luz y aire', 'solo tierra', 'solo dulces', 'nada'], e: 'Las plantas necesitan agua, luz del Sol, aire y nutrientes del suelo.' },
  { s: 'cie', l: 2, q: '¿Cuántas patas tiene una araña?', o: ['8', '6', '4', '10'], e: 'Las arañas tienen 8 patas. ¡Los insectos tienen 6!' },
  { s: 'cie', l: 2, q: '¿Cuál de estos animales es un mamífero?', o: ['perro', 'gallina', 'pez', 'rana'], e: 'Los mamíferos toman leche de su mamá cuando son crías, como Snoopy.' },
  { s: 'cie', l: 2, q: '¿Cómo se llama el planeta donde vivimos?', o: ['Tierra', 'Marte', 'Sol', 'Luna'], e: 'Vivimos en el planeta Tierra.' },
  { s: 'cie', l: 2, q: '¿Con qué parte del cuerpo olemos?', o: ['nariz', 'oreja', 'mano', 'ojo'], e: 'Olemos con la nariz. ¡Snoopy y el Sniffer tienen un olfato increíble!' },
  { s: 'cie', l: 2, q: '¿Qué animal nace de un huevo?', o: ['gallina', 'gato', 'perro', 'vaca'], e: 'Los animales que nacen de huevos se llaman ovíparos.' },
  { s: 'cie', l: 2, q: '¿En qué estado está el hielo?', o: ['sólido', 'líquido', 'gaseoso', 'ninguno'], e: 'El hielo es agua en estado sólido.' },
  { s: 'cie', l: 2, q: '¿De dónde viene la luz del día?', o: ['del Sol', 'de la Luna', 'de las nubes', 'de los árboles'], e: 'El Sol es una estrella que nos da luz y calor.' },
  { s: 'cie', l: 2, q: '¿Qué parte de la planta está bajo la tierra?', o: ['la raíz', 'la flor', 'la hoja', 'el fruto'], e: 'La raíz sujeta la planta y absorbe agua del suelo.' },
  { s: 'cie', l: 2, q: '¿Cuál de estos es uno de los 5 sentidos?', o: ['el gusto', 'correr', 'dormir', 'saltar'], e: 'Los 5 sentidos son: vista, oído, olfato, gusto y tacto.' },
  { s: 'cie', l: 2, q: '¿Qué come un animal herbívoro?', o: ['plantas', 'carne', 'piedras', 'plástico'], e: 'Los herbívoros se alimentan solo de plantas.' },
  { s: 'cie', l: 2, q: '¿Cómo se llama el agua que cae de las nubes?', o: ['lluvia', 'sol', 'viento', 'arcoíris'], e: 'La lluvia es agua que cae de las nubes.' },
  { s: 'cie', l: 3, q: '¿Qué gas necesitamos para respirar?', o: ['oxígeno', 'humo', 'helio', 'dióxido de carbono'], e: 'Respiramos oxígeno, que producen las plantas.' },
  { s: 'cie', l: 3, q: '¿Cuál es el planeta más grande del sistema solar?', o: ['Júpiter', 'Tierra', 'Marte', 'Mercurio'], e: 'Júpiter es tan grande que cabrían más de 1.000 Tierras dentro.' },
  { s: 'cie', l: 3, q: '¿Qué órgano bombea la sangre?', o: ['el corazón', 'el pulmón', 'el estómago', 'el cerebro'], e: 'El corazón es un músculo que bombea sangre a todo el cuerpo.' },
  { s: 'cie', l: 3, q: 'Cuando el agua hierve, se transforma en...', o: ['vapor', 'hielo', 'arena', 'piedra'], e: 'Al hervir, el agua pasa de líquido a gas: vapor.' },
  { s: 'cie', l: 3, q: '¿Qué tipo de animal es una ballena?', o: ['mamífero', 'pez', 'ave', 'reptil'], e: 'La ballena respira aire y alimenta a sus crías con leche: es mamífero.' },
  { s: 'cie', l: 3, q: '¿Cuántos huesos tiene aproximadamente una persona adulta?', o: ['206', '50', '1000', '12'], e: 'Un adulto tiene 206 huesos.' },
  { s: 'cie', l: 3, q: 'Las plantas fabrican su alimento mediante la...', o: ['fotosíntesis', 'digestión', 'evaporación', 'erupción'], e: 'En la fotosíntesis, las plantas usan luz, agua y aire para fabricar alimento.' },
  { s: 'cie', l: 3, q: '¿Qué de esto atrae un imán?', o: ['un clip de metal', 'un trozo de madera', 'una hoja de papel', 'un vaso de vidrio'], e: 'Los imanes atraen objetos de hierro, como los clips.' },
  { s: 'cie', l: 3, q: '¿Cuál es un recurso natural renovable?', o: ['el viento', 'el petróleo', 'el carbón', 'el plástico'], e: 'El viento no se acaba: es renovable. El petróleo y el carbón sí se agotan.' },
  { s: 'cie', l: 3, q: '¿Cuál de estos animales es un insecto?', o: ['hormiga', 'araña', 'ciempiés', 'caracol'], e: 'Los insectos tienen 6 patas y 3 partes en su cuerpo, como la hormiga.' },
  { s: 'cie', l: 3, q: 'Los animales que comen plantas y carne se llaman...', o: ['omnívoros', 'herbívoros', 'carnívoros', 'insectívoros'], e: 'Omnívoro significa que come de todo.' },
  { s: 'cie', l: 3, q: '¿Qué capa de la Tierra pisamos?', o: ['la corteza', 'el núcleo', 'el manto', 'la atmósfera'], e: 'La corteza es la capa más externa y sólida de la Tierra.' },
  { s: 'cie', l: 4, q: '¿Qué tipo de roca se forma cuando el magma se enfría?', o: ['ígnea', 'sedimentaria', 'metamórfica', 'plástica'], e: 'Las rocas ígneas nacen del magma o lava enfriada.' },
  { s: 'cie', l: 4, q: '¿De qué está hecho el diamante?', o: ['carbono', 'hierro', 'oro', 'agua'], e: 'El diamante es carbono comprimido a enorme presión bajo la tierra.' },
  { s: 'cie', l: 4, q: '¿Qué planeta es conocido como "el planeta rojo"?', o: ['Marte', 'Venus', 'Saturno', 'Neptuno'], e: 'Marte se ve rojo por el óxido de hierro de su suelo.' },
  { s: 'cie', l: 4, q: '¿Cuál es la unidad básica de todos los seres vivos?', o: ['la célula', 'el átomo', 'el órgano', 'el hueso'], e: 'Todos los seres vivos están formados por células.' },
  { s: 'cie', l: 4, q: '¿Qué fuerza nos mantiene pegados al suelo?', o: ['la gravedad', 'la electricidad', 'el magnetismo', 'la fricción'], e: 'La gravedad atrae los objetos hacia el centro de la Tierra.' },
  { s: 'cie', l: 4, q: '¿Qué órgano controla todo el cuerpo?', o: ['el cerebro', 'el estómago', 'la rodilla', 'el hígado'], e: 'El cerebro envía órdenes a todo el cuerpo a través de los nervios.' },
  { s: 'cie', l: 4, q: '¿Qué ocurre en la condensación?', o: ['el vapor se convierte en líquido', 'el hielo se derrite', 'el agua se congela', 'el agua desaparece'], e: 'Al enfriarse, el vapor se condensa en gotitas: así se forman las nubes.' },
  { s: 'cie', l: 4, q: '¿Qué es un volcán?', o: ['una abertura por donde sale magma', 'una montaña de hielo', 'un lago profundo', 'una nube gigante'], e: 'Por los volcanes sale magma, gases y cenizas del interior de la Tierra.' },
  { s: 'cie', l: 4, q: '¿Cómo se llama la energía que viene del Sol?', o: ['solar', 'eólica', 'hidráulica', 'geotérmica'], e: 'La energía solar se aprovecha con paneles solares.' },
  { s: 'cie', l: 4, q: '¿Cuál de estos materiales conduce la electricidad?', o: ['el cobre', 'la madera', 'el plástico', 'la goma'], e: 'Los metales como el cobre son buenos conductores. Por eso los cables son de cobre.' },
  { s: 'cie', l: 4, q: 'Cuando una semilla germina, ¿qué sale primero?', o: ['la raíz', 'la flor', 'el fruto', 'la hoja'], e: 'Primero sale la raíz para buscar agua. ¡El Sniffer encuentra semillas antiguas!' },
  { s: 'cie', l: 4, q: '¿Cómo se llama la capa de gases que rodea la Tierra?', o: ['atmósfera', 'corteza', 'océano', 'manto'], e: 'La atmósfera nos protege y contiene el aire que respiramos.' },
  { s: 'cie', l: 4, q: '¿Cuál es el satélite natural de la Tierra?', o: ['la Luna', 'el Sol', 'Marte', 'una estrella'], e: 'La Luna gira alrededor de la Tierra.' }
];
