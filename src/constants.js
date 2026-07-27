export const COLS = 16;
export const ROWS = 9;

const S3 = Math.sqrt(3);

// Layout constants — mutable so updateLayout() can resize them for any screen.
// Initial values match the original 900×600 desktop layout.
export let W       = 900;
export let H       = 600;
export let HEX_SIZE = 24;
export let HUD_H   = 88;
export let PANEL_H = 110;
export let HUD_BOTTOM  = 88;
export let PANEL_TOP   = 490;
export let PANEL_BOTTOM = 600;
export let MAP_X = 13.32;
export let MAP_Y = 126.84;

// Called by main.js on every resize.  Sets all layout variables so the hex
// grid fills the available screen with the largest integer hex size that fits.
export function updateLayout(sw, sh) {
  W = sw;
  H = sh;

  // Overlay heights (fixed screen-pixel sizes, not proportional — they are
  // drawn on top of the map, so they don't steal map space).
  HUD_H   = Math.max(36, Math.round(sh * 0.095));
  PANEL_H = Math.max(72, Math.round(sh * 0.18));
  HUD_BOTTOM  = HUD_H;
  PANEL_TOP   = sh - PANEL_H;
  PANEL_BOTTOM = sh;

  // Compute the largest hex size that fits the full grid on screen.
  // Use a small margin so hexes don't clip the edge.
  const margin  = 4;
  const hexByW  = (sw - margin * 2) / (2 + 1.5 * (COLS - 1));
  const hexByH  = (sh - margin * 2) / (S3 * ROWS);
  const fitAll  = Math.round(Math.min(hexByW, hexByH));
  // On mobile (narrow portrait), zoom in so hexes are larger and tappable;
  // the map overflows the screen and is navigated by panning.
  HEX_SIZE = sw < 600 ? Math.round(fitAll * 2) : fitAll;

  // Center the grid on screen.
  const gridW = HEX_SIZE * (2 + 1.5 * (COLS - 1));
  const gridH = HEX_SIZE * S3 * ROWS;
  MAP_X = (sw - gridW) / 2 + HEX_SIZE;
  MAP_Y = (sh - gridH) / 2 + HEX_SIZE * S3 * 0.5;
}

export const HUD_TOP = 0;

export const S = {
  MENU:         'menu',
  BATTLE_SELECT:'battle_select',
  SIDE_SELECT:  'side_select',
  PLAYER_TURN:  'player_turn',
  ENEMY_TURN:   'enemy_turn',
  NIGHT:        'night',
  VICTORY:      'victory',
  DEFEAT:       'defeat',
};

export const TERRAIN = {
  O: { name: 'Open Field', moveCost: 1,   cover: 0,    color: '#6e7838', label: '' },
  R: { name: 'Road',       moveCost: 0.5, cover: 0,    color: '#9e9060', label: 'road' },
  H: { name: 'Hill',       moveCost: 2,   cover: 0.20, color: '#6a6e30', label: 'hill' },
  F: { name: 'Forest',     moveCost: 2,   cover: 0.30, color: '#1c3010', label: 'wood' },
  T: { name: 'Town',       moveCost: 2,   cover: 0.25, color: '#60544a', label: 'town' },
  W: { name: 'River',      moveCost: 3,   cover: 0,    color: '#2a4a62', label: 'river' },
};

export const UNIT_TYPES = {
  infantry:  { name: 'Infantry',  moveRange: 2, attackRange: 1, ammoCap: 8,  canCharge: true  },
  cavalry:   { name: 'Cavalry',   moveRange: 4, attackRange: 1, ammoCap: 4,  canCharge: true  },
  artillery: { name: 'Artillery', moveRange: 2, attackRange: 2, ammoCap: 6,  canCharge: false },
  general:   { name: 'General',   moveRange: 3, attackRange: 0, ammoCap: 0,  canCharge: false },
};

export const COLORS = {
  union:       '#1a3a6b',
  unionLight:  '#2a5aab',
  confederate: '#6b5a3a',
  confLight:   '#9b8a5a',
  gold:        '#f0c040',
  moveBlue:    'rgba(60,100,220,0.35)',
  attackRed:   'rgba(220,50,50,0.35)',
  selectedGlow:'rgba(240,180,0,0.6)',
  hud:         '#1a1005',
  hudLine:     '#3a2a10',
  parchment:   '#c8b47a',
  darkText:    '#2a1a00',
  nightBg:     'rgba(0,0,20,0.85)',
};

export const TURNS_PER_DAY = 6;
export const MAX_TURNS = 20;
export const MORALE_ROUT_THRESHOLD = 10;
export const MORALE_RETREAT_THRESHOLD = 28;
export const VICTORY_MORALE_PCT = 0.28;
export const DIG_IN_COVER = 0.22;

export const BATTLES = [
  {
    id: 'bullrun', name: 'FIRST BULL RUN',
    place: 'Manassas, Virginia', dateLabel: 'July 21, 1861',
    month: 'July', startDay: 21, year: 1861,
    blurb: "The first great battle of the war. Green armies clash along Bull Run creek.",
    union: { army: 'Army of Northeastern Virginia', commander: 'Brig. Gen. Irvin McDowell' },
    confederate: { army: 'Army of the Potomac (CSA)', commander: 'Gen. P.G.T. Beauregard' },
    terrain: [
      ['O','O','F','F','O','W','W','O','O','O','F','F','O','O','O','O'],
      ['O','H','H','F','O','O','W','O','O','F','F','O','O','O','O','O'],
      ['O','H','H','O','O','O','O','W','O','O','O','O','O','O','H','O'],
      ['R','R','R','R','R','R','R','W','R','R','R','R','R','R','R','R'],
      ['O','O','H','H','H','T','O','W','W','O','O','O','F','O','O','O'],
      ['O','O','H','H','H','O','O','O','O','W','O','F','F','O','O','O'],
      ['O','O','O','H','H','O','O','O','O','W','O','F','O','O','O','H'],
      ['O','F','F','O','O','O','T','O','O','W','O','O','O','O','H','H'],
      ['O','F','F','O','O','O','O','O','O','O','W','O','O','O','H','H'],
    ],
    units: [
      { id:'c1', name:"Evans' Brigade",    commander:'Col. Evans',            type:'infantry',  side:'confederate', q:5,  r:2, morale:78, strength:6,  infl:6, ldrorg:5, loyal:7, hlth:8 },
      { id:'c2', name:"Bee's Brigade",     commander:'Brig. Gen. Bee',        type:'infantry',  side:'confederate', q:4,  r:4, morale:80, strength:7,  infl:7, ldrorg:6, loyal:7, hlth:7 },
      { id:'c3', name:"Bartow's Brigade",  commander:'Col. Bartow',           type:'infantry',  side:'confederate', q:3,  r:5, morale:79, strength:6,  infl:6, ldrorg:6, loyal:7, hlth:7 },
      { id:'c4', name:"Jackson's Brigade", commander:'Brig. Gen. Jackson',    type:'infantry',  side:'confederate', q:3,  r:4, morale:92, strength:8,  infl:9, ldrorg:9, loyal:9, hlth:8 },
      { id:'c5', name:"Early's Brigade",   commander:'Col. Early',            type:'infantry',  side:'confederate', q:2,  r:6, morale:81, strength:6,  infl:7, ldrorg:6, loyal:6, hlth:8 },
      { id:'c6', name:"Stuart's Cavalry",  commander:'Lt. Col. Stuart',       type:'cavalry',   side:'confederate', q:2,  r:2, morale:86, strength:5,  infl:8, ldrorg:7, loyal:8, hlth:9 },
      { id:'c7', name:"Imboden's Battery", commander:'Capt. Imboden',         type:'artillery', side:'confederate', q:4,  r:5, morale:76, strength:6,  infl:6, ldrorg:7, loyal:7, hlth:8 },
      { id:'c8', name:"Gen. Beauregard",   commander:'Gen. P.G.T. Beauregard',type:'general',   side:'confederate', q:1,  r:4, morale:90, strength:10, infl:9, ldrorg:8, loyal:8, hlth:8 },
      { id:'u1', name:"Burnside's Brigade",commander:'Col. Burnside',         type:'infantry',  side:'union', q:12, r:1, morale:79, strength:7, infl:6, ldrorg:6, loyal:8, hlth:8 },
      { id:'u2', name:"Porter's Brigade",  commander:'Col. Porter',           type:'infantry',  side:'union', q:13, r:2, morale:78, strength:7, infl:6, ldrorg:7, loyal:8, hlth:8 },
      { id:'u3', name:"Sherman's Brigade", commander:'Col. Sherman',          type:'infantry',  side:'union', q:12, r:4, morale:82, strength:7, infl:8, ldrorg:8, loyal:8, hlth:8 },
      { id:'u4', name:"Franklin's Brigade",commander:'Col. Franklin',         type:'infantry',  side:'union', q:13, r:5, morale:77, strength:6, infl:6, ldrorg:7, loyal:8, hlth:7 },
      { id:'u5', name:"Howard's Brigade",  commander:'Col. Howard',           type:'infantry',  side:'union', q:13, r:6, morale:76, strength:6, infl:6, ldrorg:6, loyal:8, hlth:8 },
      { id:'u6', name:"Palmer's Cavalry",  commander:'Maj. Palmer',           type:'cavalry',   side:'union', q:11, r:3, morale:78, strength:5, infl:6, ldrorg:6, loyal:7, hlth:8 },
      { id:'u7', name:"Griffin's Battery", commander:'Capt. Griffin',         type:'artillery', side:'union', q:12, r:3, morale:77, strength:6, infl:7, ldrorg:8, loyal:8, hlth:8 },
      { id:'u8', name:"Gen. McDowell",     commander:'Brig. Gen. McDowell',   type:'general',   side:'union', q:14, r:4, morale:85, strength:10,infl:7, ldrorg:7, loyal:8, hlth:7 },
    ],
    reinforcements: [],
  },
  {
    id: 'shiloh', name: 'BATTLE OF SHILOH',
    place: 'Pittsburg Landing, Tennessee', dateLabel: 'April 6-7, 1862',
    month: 'April', startDay: 6, year: 1862,
    blurb: "A dawn surprise attack drives Grant's camps back on the Tennessee River. Buell arrives on day two.",
    union: { army: 'Army of the Tennessee', commander: 'Maj. Gen. Ulysses S. Grant' },
    confederate: { army: 'Army of the Mississippi', commander: 'Gen. Albert Sidney Johnston' },
    terrain: [
      ['F','F','F','O','F','F','O','F','F','O','F','F','O','O','W','W'],
      ['F','F','O','O','F','F','O','O','F','F','O','F','F','O','W','W'],
      ['F','O','O','F','F','O','O','F','F','O','O','F','O','T','W','W'],
      ['O','O','F','F','O','O','F','F','O','O','F','F','O','O','W','W'],
      ['F','O','O','O','O','F','F','O','O','H','F','O','O','O','W','W'],
      ['R','R','R','R','R','R','R','R','R','R','R','R','R','O','W','W'],
      ['F','F','O','T','O','F','F','O','O','F','F','O','O','O','W','W'],
      ['F','F','O','O','O','F','F','O','F','F','O','O','H','O','W','W'],
      ['O','F','F','O','F','F','O','O','F','F','O','O','O','O','W','W'],
    ],
    units: [
      { id:'c1', name:"Hardee's Corps",        commander:'Maj. Gen. Hardee',        type:'infantry',  side:'confederate', q:1, r:2, morale:88, strength:9,  infl:8, ldrorg:8, loyal:8, hlth:8 },
      { id:'c2', name:"Bragg's Corps",          commander:'Maj. Gen. Bragg',          type:'infantry',  side:'confederate', q:1, r:4, morale:86, strength:9,  infl:7, ldrorg:8, loyal:7, hlth:7 },
      { id:'c3', name:"Polk's Corps",           commander:'Maj. Gen. Polk',           type:'infantry',  side:'confederate', q:2, r:6, morale:84, strength:8,  infl:7, ldrorg:6, loyal:8, hlth:8 },
      { id:'c4', name:"Breckinridge's Cps.",    commander:'Brig. Gen. Breckinridge',  type:'infantry',  side:'confederate', q:1, r:7, morale:83, strength:8,  infl:8, ldrorg:7, loyal:7, hlth:8 },
      { id:'c5', name:"Cheatham's Division",    commander:'Maj. Gen. Cheatham',       type:'infantry',  side:'confederate', q:2, r:3, morale:82, strength:7,  infl:7, ldrorg:6, loyal:8, hlth:8 },
      { id:'c6', name:"Forrest's Cavalry",      commander:'Col. Forrest',             type:'cavalry',   side:'confederate', q:0, r:5, morale:90, strength:6,  infl:9, ldrorg:8, loyal:8, hlth:9 },
      { id:'c7', name:"Ruggles' Battery",       commander:'Brig. Gen. Ruggles',       type:'artillery', side:'confederate', q:2, r:5, morale:80, strength:7,  infl:7, ldrorg:8, loyal:7, hlth:8 },
      { id:'c8', name:"Gen. A.S. Johnston",     commander:'Gen. A.S. Johnston',       type:'general',   side:'confederate', q:0, r:3, morale:92, strength:10, infl:9, ldrorg:8, loyal:9, hlth:8 },
      { id:'u1', name:"Sherman's Division",     commander:'Maj. Gen. Sherman',        type:'infantry',  side:'union', q:8,  r:6, morale:84, strength:8,  infl:9, ldrorg:8, loyal:9, hlth:8 },
      { id:'u2', name:"McClernand's Div.",      commander:'Maj. Gen. McClernand',     type:'infantry',  side:'union', q:9,  r:4, morale:80, strength:8,  infl:6, ldrorg:6, loyal:7, hlth:8 },
      { id:'u3', name:"Prentiss' Division",     commander:'Brig. Gen. Prentiss',      type:'infantry',  side:'union', q:8,  r:2, morale:78, strength:7,  infl:7, ldrorg:7, loyal:8, hlth:8 },
      { id:'u4', name:"Hurlbut's Division",     commander:'Brig. Gen. Hurlbut',       type:'infantry',  side:'union', q:11, r:5, morale:79, strength:8,  infl:6, ldrorg:7, loyal:8, hlth:8 },
      { id:'u5', name:"W.H.L. Wallace Div.",    commander:'Brig. Gen. Wallace',       type:'infantry',  side:'union', q:11, r:2, morale:81, strength:8,  infl:7, ldrorg:7, loyal:8, hlth:7 },
      { id:'u6', name:"4th Illinois Cav.",      commander:'Col. Dickey',              type:'cavalry',   side:'union', q:12, r:6, morale:76, strength:5,  infl:5, ldrorg:6, loyal:8, hlth:8 },
      { id:'u7', name:"Webster's Artillery",    commander:'Col. Webster',             type:'artillery', side:'union', q:12, r:3, morale:78, strength:7,  infl:7, ldrorg:8, loyal:8, hlth:8 },
      { id:'u8', name:"Gen. Grant",             commander:'Maj. Gen. Grant',          type:'general',   side:'union', q:13, r:3, morale:90, strength:10, infl:9, ldrorg:8, loyal:9, hlth:8 },
    ],
    reinforcements: [],
  },
  {
    id: 'antietam', name: 'BATTLE OF ANTIETAM',
    place: 'Sharpsburg, Maryland', dateLabel: 'September 17, 1862',
    month: 'September', startDay: 17, year: 1862,
    blurb: "The bloodiest single day of the war. Lee stands at Sharpsburg with Antietam Creek between the armies.",
    union: { army: 'Army of the Potomac', commander: 'Maj. Gen. George McClellan' },
    confederate: { army: 'Army of Northern Virginia', commander: 'Gen. Robert E. Lee' },
    terrain: [
      ['O','O','F','O','R','O','F','O','O','O','W','O','O','O','O','O'],
      ['O','F','F','O','R','O','F','F','O','O','W','O','O','H','O','O'],
      ['O','F','F','T','R','O','O','F','O','O','W','O','O','O','O','O'],
      ['O','O','F','O','R','O','O','O','O','R','R','R','O','O','O','O'],
      ['O','O','O','T','R','O','O','H','O','O','W','O','O','O','H','O'],
      ['O','O','T','T','R','O','O','O','O','O','W','O','O','O','O','O'],
      ['O','O','O','O','R','R','R','R','R','R','R','R','R','O','O','O'],
      ['O','F','O','O','R','O','O','O','H','O','W','O','O','H','H','O'],
      ['O','O','O','O','R','O','O','O','O','O','W','W','O','O','H','O'],
    ],
    units: [
      { id:'c1', name:"Jackson's Corps",    commander:'Maj. Gen. Jackson',    type:'infantry',  side:'confederate', q:3, r:1, morale:90, strength:9,  infl:9, ldrorg:9, loyal:9,  hlth:8 },
      { id:'c2', name:"Hood's Division",    commander:'Maj. Gen. Hood',       type:'infantry',  side:'confederate', q:5, r:2, morale:88, strength:8,  infl:8, ldrorg:7, loyal:8,  hlth:7 },
      { id:'c3', name:"D.H. Hill's Div.",   commander:'Maj. Gen. D.H. Hill',  type:'infantry',  side:'confederate', q:5, r:4, morale:84, strength:8,  infl:7, ldrorg:7, loyal:7,  hlth:8 },
      { id:'c4', name:"Longstreet's Corps", commander:'Maj. Gen. Longstreet', type:'infantry',  side:'confederate', q:3, r:6, morale:87, strength:9,  infl:9, ldrorg:8, loyal:8,  hlth:8 },
      { id:'c5', name:"Walker's Division",  commander:'Brig. Gen. Walker',    type:'infantry',  side:'confederate', q:2, r:7, morale:82, strength:7,  infl:6, ldrorg:7, loyal:7,  hlth:8 },
      { id:'c6', name:"Stuart's Cavalry",   commander:'Maj. Gen. Stuart',     type:'cavalry',   side:'confederate', q:1, r:2, morale:90, strength:7,  infl:9, ldrorg:8, loyal:8,  hlth:9 },
      { id:'c7', name:"S.D. Lee Artillery", commander:'Col. S.D. Lee',        type:'artillery', side:'confederate', q:3, r:3, morale:80, strength:8,  infl:7, ldrorg:9, loyal:8,  hlth:8 },
      { id:'c8', name:"Gen. R.E. Lee",      commander:'Gen. Robert E. Lee',   type:'general',   side:'confederate', q:2, r:5, morale:94, strength:10, infl:10,ldrorg:9, loyal:10, hlth:7 },
      { id:'u1', name:"Hooker's I Corps",   commander:'Maj. Gen. Hooker',     type:'infantry',  side:'union', q:13, r:0, morale:86, strength:9,  infl:8, ldrorg:8, loyal:8, hlth:8 },
      { id:'u2', name:"Mansfield's XII Cps.",commander:'Maj. Gen. Mansfield', type:'infantry',  side:'union', q:14, r:1, morale:80, strength:8,  infl:6, ldrorg:7, loyal:8, hlth:6 },
      { id:'u3', name:"Sumner's II Corps",  commander:'Maj. Gen. Sumner',     type:'infantry',  side:'union', q:13, r:3, morale:84, strength:9,  infl:7, ldrorg:6, loyal:9, hlth:7 },
      { id:'u4', name:"Franklin's VI Corps",commander:'Maj. Gen. Franklin',   type:'infantry',  side:'union', q:14, r:5, morale:82, strength:8,  infl:7, ldrorg:8, loyal:8, hlth:8 },
      { id:'u5', name:"Burnside's IX Corps",commander:'Maj. Gen. Burnside',   type:'infantry',  side:'union', q:13, r:7, morale:83, strength:9,  infl:6, ldrorg:6, loyal:8, hlth:8 },
      { id:'u6', name:"Pleasonton's Cav.",  commander:'Brig. Gen. Pleasonton',type:'cavalry',   side:'union', q:12, r:4, morale:84, strength:6,  infl:6, ldrorg:7, loyal:8, hlth:8 },
      { id:'u7', name:"Hunt's Artillery",   commander:'Brig. Gen. Hunt',      type:'artillery', side:'union', q:14, r:3, morale:80, strength:8,  infl:8, ldrorg:9, loyal:9, hlth:8 },
      { id:'u8', name:"Gen. McClellan",     commander:'Maj. Gen. McClellan',  type:'general',   side:'union', q:15, r:4, morale:88, strength:10, infl:8, ldrorg:9, loyal:7, hlth:9 },
    ],
    reinforcements: [],
  },
  {
    id: 'gettysburg', name: 'BATTLE OF GETTYSBURG',
    place: 'Gettysburg, Pennsylvania', dateLabel: 'July 1-3, 1863',
    month: 'July', startDay: 1, year: 1863,
    blurb: "The pivotal battle of the war. Lee invades the North and meets the Army of the Potomac.",
    union: { army: 'Army of the Potomac', commander: 'Maj. Gen. George Meade' },
    confederate: { army: 'Army of Northern Virginia', commander: 'Gen. Robert E. Lee' },
    terrain: [
      ['H','H','O','H','O','O','O','T','T','O','O','O','O','H','H','H'],
      ['O','H','H','O','O','R','O','T','T','R','O','O','H','H','O','O'],
      ['O','O','H','H','O','R','T','T','O','O','O','O','H','O','O','O'],
      ['O','O','H','H','O','R','O','O','O','O','O','H','H','H','O','O'],
      ['O','O','H','H','O','R','O','O','O','O','H','H','H','O','O','O'],
      ['O','O','H','H','O','O','O','W','W','O','H','H','H','O','O','O'],
      ['O','O','O','H','O','O','O','W','O','O','O','H','H','O','O','O'],
      ['O','O','O','O','O','F','F','O','O','F','O','O','H','H','O','O'],
      ['O','O','O','O','F','F','O','O','F','F','O','O','O','H','H','O'],
    ],
    units: [
      { id:'c1', name:"Rodes' Division",  commander:'Maj. Gen. Rodes',     type:'infantry',  side:'confederate', q:2,  r:1, morale:88, strength:9,  infl:7, ldrorg:7, loyal:8,  hlth:8 },
      { id:'c2', name:"Heth's Division",  commander:'Maj. Gen. Heth',      type:'infantry',  side:'confederate', q:2,  r:3, morale:85, strength:9,  infl:6, ldrorg:6, loyal:7,  hlth:7 },
      { id:'c3', name:"McLaws' Division", commander:'Maj. Gen. McLaws',    type:'infantry',  side:'confederate', q:2,  r:5, morale:82, strength:8,  infl:7, ldrorg:8, loyal:7,  hlth:8 },
      { id:'c4', name:"Hood's Division",  commander:'Maj. Gen. Hood',      type:'infantry',  side:'confederate', q:2,  r:7, morale:85, strength:9,  infl:8, ldrorg:7, loyal:8,  hlth:6 },
      { id:'c5', name:"Early's Division", commander:'Maj. Gen. Early',     type:'infantry',  side:'confederate', q:1,  r:0, morale:80, strength:8,  infl:7, ldrorg:7, loyal:6,  hlth:8 },
      { id:'c6', name:"Stuart's Cavalry", commander:'Maj. Gen. Stuart',    type:'cavalry',   side:'confederate', q:1,  r:4, morale:90, strength:7,  infl:9, ldrorg:8, loyal:8,  hlth:9 },
      { id:'c7', name:"Long. Artillery",  commander:'Col. Alexander',      type:'artillery', side:'confederate', q:3,  r:4, morale:78, strength:8,  infl:7, ldrorg:9, loyal:8,  hlth:8 },
      { id:'c8', name:"Gen. R.E. Lee",    commander:'Gen. Robert E. Lee',  type:'general',   side:'confederate', q:1,  r:2, morale:95, strength:10, infl:10,ldrorg:9, loyal:10, hlth:7 },
      { id:'u1', name:"Howard's Corps",   commander:'Maj. Gen. Howard',    type:'infantry',  side:'union', q:13, r:1, morale:80, strength:8,  infl:6, ldrorg:6, loyal:8, hlth:8 },
      { id:'u2', name:"Reynolds' Corps",  commander:'Maj. Gen. Reynolds',  type:'infantry',  side:'union', q:13, r:3, morale:85, strength:9,  infl:9, ldrorg:9, loyal:9, hlth:7 },
      { id:'u3', name:"Hancock's Corps",  commander:'Maj. Gen. Hancock',   type:'infantry',  side:'union', q:13, r:5, morale:88, strength:9,  infl:9, ldrorg:9, loyal:9, hlth:8 },
      { id:'u4', name:"Sickles' Corps",   commander:'Maj. Gen. Sickles',   type:'infantry',  side:'union', q:12, r:7, morale:80, strength:8,  infl:7, ldrorg:6, loyal:7, hlth:7 },
      { id:'u5', name:"Sedgwick's Corps", commander:'Maj. Gen. Sedgwick',  type:'infantry',  side:'union', q:14, r:6, morale:82, strength:8,  infl:8, ldrorg:8, loyal:9, hlth:9 },
      { id:'u6', name:"Buford's Cavalry", commander:'Brig. Gen. Buford',   type:'cavalry',   side:'union', q:11, r:3, morale:85, strength:7,  infl:8, ldrorg:8, loyal:9, hlth:6 },
      { id:'u7', name:"Arty. Reserve",    commander:'Brig. Gen. Hunt',     type:'artillery', side:'union', q:13, r:4, morale:78, strength:8,  infl:8, ldrorg:9, loyal:9, hlth:8 },
      { id:'u8', name:"Gen. Meade",       commander:'Maj. Gen. Meade',     type:'general',   side:'union', q:14, r:4, morale:92, strength:10, infl:9, ldrorg:9, loyal:9, hlth:8 },
    ],
    reinforcements: [
      { turn:4,  id:'c9',  name:"Pender's Division",  commander:'Maj. Gen. Pender',    type:'infantry', side:'confederate', q:1,  r:6, morale:85, strength:9,  infl:8, ldrorg:7, loyal:8, hlth:7 },
      { turn:4,  id:'u9',  name:"Slocum's XII Corps",  commander:'Maj. Gen. Slocum',    type:'infantry', side:'union',       q:14, r:1, morale:82, strength:9,  infl:7, ldrorg:8, loyal:9, hlth:8 },
      { turn:10, id:'c10', name:"Pickett's Division",  commander:'Maj. Gen. Pickett',   type:'infantry', side:'confederate', q:1,  r:3, morale:92, strength:10, infl:8, ldrorg:7, loyal:8, hlth:8 },
      { turn:10, id:'u10', name:"Crawford's Division", commander:'Brig. Gen. Crawford', type:'infantry', side:'union',       q:14, r:5, morale:80, strength:8,  infl:6, ldrorg:7, loyal:8, hlth:8 },
    ],
  },
];
