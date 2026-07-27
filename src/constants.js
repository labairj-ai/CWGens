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
  HEX_SIZE = Math.round(Math.min(hexByW, hexByH));

  // Center the grid on screen.
  const gridW = HEX_SIZE * (2 + 1.5 * (COLS - 1));
  const gridH = HEX_SIZE * S3 * ROWS;
  MAP_X = (sw - gridW) / 2 + HEX_SIZE;
  MAP_Y = (sh - gridH) / 2 + HEX_SIZE * S3 * 0.5;
}

export const HUD_TOP = 0;

export const S = {
  MENU:        'menu',
  SIDE_SELECT: 'side_select',
  PLAYER_TURN: 'player_turn',
  ENEMY_TURN:  'enemy_turn',
  NIGHT:       'night',
  VICTORY:     'victory',
  DEFEAT:      'defeat',
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

export const GETTYSBURG_TERRAIN = [
  ['H','H','O','H','O','O','O','T','T','O','O','O','O','H','H','H'],
  ['O','H','H','O','O','R','O','T','T','R','O','O','H','H','O','O'],
  ['O','O','H','H','O','R','T','T','O','O','O','O','H','O','O','O'],
  ['O','O','H','H','O','R','O','O','O','O','O','H','H','H','O','O'],
  ['O','O','H','H','O','R','O','O','O','O','H','H','H','O','O','O'],
  ['O','O','H','H','O','O','O','W','W','O','H','H','H','O','O','O'],
  ['O','O','O','H','O','O','O','W','O','O','O','H','H','O','O','O'],
  ['O','O','O','O','O','F','F','O','O','F','O','O','H','H','O','O'],
  ['O','O','O','O','F','F','O','O','F','F','O','O','O','H','H','O'],
];

export const GETTYSBURG_UNITS = [
  { id:'c1', name:"Rodes' Division",  commander:'Maj. Gen. Rodes',     type:'infantry',  side:'confederate', q:2,  r:1, morale:88, strength:9,  infl:7, ldrorg:7, loyal:8, hlth:8 },
  { id:'c2', name:"Heth's Division",  commander:'Maj. Gen. Heth',      type:'infantry',  side:'confederate', q:2,  r:3, morale:85, strength:9,  infl:6, ldrorg:6, loyal:7, hlth:7 },
  { id:'c3', name:"McLaws' Division", commander:'Maj. Gen. McLaws',    type:'infantry',  side:'confederate', q:2,  r:5, morale:82, strength:8,  infl:7, ldrorg:8, loyal:7, hlth:8 },
  { id:'c4', name:"Hood's Division",  commander:'Maj. Gen. Hood',      type:'infantry',  side:'confederate', q:2,  r:7, morale:85, strength:9,  infl:8, ldrorg:7, loyal:8, hlth:6 },
  { id:'c5', name:"Early's Division", commander:'Maj. Gen. Early',     type:'infantry',  side:'confederate', q:1,  r:0, morale:80, strength:8,  infl:7, ldrorg:7, loyal:6, hlth:8 },
  { id:'c6', name:"Stuart's Cavalry", commander:'Maj. Gen. Stuart',    type:'cavalry',   side:'confederate', q:1,  r:4, morale:90, strength:7,  infl:9, ldrorg:8, loyal:8, hlth:9 },
  { id:'c7', name:"Long. Artillery",  commander:'Col. Alexander',      type:'artillery', side:'confederate', q:3,  r:4, morale:78, strength:8,  infl:7, ldrorg:9, loyal:8, hlth:8 },
  { id:'c8', name:"Gen. R.E. Lee",    commander:'Gen. Robert E. Lee',  type:'general',   side:'confederate', q:1,  r:2, morale:95, strength:10, infl:10,ldrorg:9, loyal:10,hlth:7 },
  { id:'u1', name:"Howard's Corps",   commander:'Maj. Gen. Howard',    type:'infantry',  side:'union', q:13, r:1, morale:80, strength:8,  infl:6, ldrorg:6, loyal:8, hlth:8 },
  { id:'u2', name:"Reynolds' Corps",  commander:'Maj. Gen. Reynolds',  type:'infantry',  side:'union', q:13, r:3, morale:85, strength:9,  infl:9, ldrorg:9, loyal:9, hlth:7 },
  { id:'u3', name:"Hancock's Corps",  commander:'Maj. Gen. Hancock',   type:'infantry',  side:'union', q:13, r:5, morale:88, strength:9,  infl:9, ldrorg:9, loyal:9, hlth:8 },
  { id:'u4', name:"Sickles' Corps",   commander:'Maj. Gen. Sickles',   type:'infantry',  side:'union', q:12, r:7, morale:80, strength:8,  infl:7, ldrorg:6, loyal:7, hlth:7 },
  { id:'u5', name:"Sedgwick's Corps", commander:'Maj. Gen. Sedgwick',  type:'infantry',  side:'union', q:14, r:6, morale:82, strength:8,  infl:8, ldrorg:8, loyal:9, hlth:9 },
  { id:'u6', name:"Buford's Cavalry", commander:'Brig. Gen. Buford',   type:'cavalry',   side:'union', q:11, r:3, morale:85, strength:7,  infl:8, ldrorg:8, loyal:9, hlth:6 },
  { id:'u7', name:"Arty. Reserve",    commander:'Brig. Gen. Hunt',     type:'artillery', side:'union', q:13, r:4, morale:78, strength:8,  infl:8, ldrorg:9, loyal:9, hlth:8 },
  { id:'u8', name:"Gen. Meade",       commander:'Maj. Gen. Meade',     type:'general',   side:'union', q:14, r:4, morale:92, strength:10, infl:9, ldrorg:9, loyal:9, hlth:8 },
];

export const TURNS_PER_DAY = 6;
export const MAX_TURNS = 20;
export const MORALE_ROUT_THRESHOLD = 10;
export const MORALE_RETREAT_THRESHOLD = 28;
export const VICTORY_MORALE_PCT = 0.28;
export const DIG_IN_COVER = 0.22;

export const REINFORCEMENTS = [
  { turn:4,  id:'c9',  name:"Pender's Division",  commander:'Maj. Gen. Pender',   type:'infantry', side:'confederate', q:1,  r:6, morale:85, strength:9,  infl:8, ldrorg:7, loyal:8, hlth:7 },
  { turn:4,  id:'u9',  name:"Slocum's XII Corps",  commander:'Maj. Gen. Slocum',   type:'infantry', side:'union',       q:14, r:1, morale:82, strength:9,  infl:7, ldrorg:8, loyal:9, hlth:8 },
  { turn:10, id:'c10', name:"Pickett's Division",  commander:'Maj. Gen. Pickett',  type:'infantry', side:'confederate', q:1,  r:3, morale:92, strength:10, infl:8, ldrorg:7, loyal:8, hlth:8 },
  { turn:10, id:'u10', name:"Crawford's Division", commander:'Brig. Gen. Crawford',type:'infantry', side:'union',       q:14, r:5, morale:80, strength:8,  infl:6, ldrorg:7, loyal:8, hlth:8 },
];
