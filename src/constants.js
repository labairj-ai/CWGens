export const W = 900;
export const H = 600;
export const HEX_SIZE = 24;
export const COLS = 16;
export const ROWS = 9;

const S3 = Math.sqrt(3);
const HUD_H = 88;
const PANEL_H = 88;
const MAP_AREA_H = H - HUD_H - PANEL_H;
const GRID_W = HEX_SIZE * (2 + 1.5 * (COLS - 1));
const GRID_H = HEX_SIZE * S3 * ROWS;

export const MAP_X = (W - GRID_W) / 2 + HEX_SIZE;
export const MAP_Y = HUD_H + (MAP_AREA_H - GRID_H) / 2 + HEX_SIZE * S3 * 0.5;

export const HUD_TOP = 0;
export const HUD_BOTTOM = HUD_H;
export const PANEL_TOP = H - PANEL_H;
export const PANEL_BOTTOM = H;

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
  O: { name: 'Open Field', moveCost: 1,   cover: 0,    color: '#8fba56', stroke: '#6a9040', label: '' },
  R: { name: 'Road',       moveCost: 0.5, cover: 0,    color: '#c8b47a', stroke: '#a09055', label: 'road' },
  H: { name: 'Hill',       moveCost: 2,   cover: 0.20, color: '#9b7450', stroke: '#6e5030', label: 'hill' },
  F: { name: 'Forest',     moveCost: 2,   cover: 0.30, color: '#3a6e3a', stroke: '#2a5028', label: 'wood' },
  T: { name: 'Town',       moveCost: 2,   cover: 0.25, color: '#8a8070', stroke: '#606050', label: 'town' },
  W: { name: 'River',      moveCost: 3,   cover: 0,    color: '#4a8ab0', stroke: '#2a6090', label: 'river' },
};

export const UNIT_TYPES = {
  infantry:  { name: 'Infantry',  moveRange: 2, attackRange: 1, ammoCap: 8,  canCharge: true  },
  cavalry:   { name: 'Cavalry',   moveRange: 4, attackRange: 1, ammoCap: 4,  canCharge: true  },
  artillery: { name: 'Artillery', moveRange: 1, attackRange: 2, ammoCap: 6,  canCharge: false },
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
  { id:'c1', name:"Rodes' Division",  type:'infantry',  side:'confederate', q:2,  r:1, morale:88, strength:9  },
  { id:'c2', name:"Heth's Division",  type:'infantry',  side:'confederate', q:2,  r:3, morale:85, strength:9  },
  { id:'c3', name:"McLaws' Division", type:'infantry',  side:'confederate', q:2,  r:5, morale:82, strength:8  },
  { id:'c4', name:"Hood's Division",  type:'infantry',  side:'confederate', q:2,  r:7, morale:85, strength:9  },
  { id:'c5', name:"Early's Division", type:'infantry',  side:'confederate', q:1,  r:0, morale:80, strength:8  },
  { id:'c6', name:"Stuart's Cavalry", type:'cavalry',   side:'confederate', q:1,  r:4, morale:90, strength:7  },
  { id:'c7', name:"Long. Artillery",  type:'artillery', side:'confederate', q:3,  r:4, morale:78, strength:8  },
  { id:'c8', name:"Gen. R.E. Lee",    type:'general',   side:'confederate', q:1,  r:2, morale:95, strength:10 },
  { id:'u1', name:"Howard's Corps",   type:'infantry',  side:'union', q:13, r:1, morale:80, strength:8  },
  { id:'u2', name:"Reynolds' Corps",  type:'infantry',  side:'union', q:13, r:3, morale:85, strength:9  },
  { id:'u3', name:"Hancock's Corps",  type:'infantry',  side:'union', q:13, r:5, morale:88, strength:9  },
  { id:'u4', name:"Sickles' Corps",   type:'infantry',  side:'union', q:12, r:7, morale:80, strength:8  },
  { id:'u5', name:"Sedgwick's Corps", type:'infantry',  side:'union', q:14, r:6, morale:82, strength:8  },
  { id:'u6', name:"Buford's Cavalry", type:'cavalry',   side:'union', q:11, r:3, morale:85, strength:7  },
  { id:'u7', name:"Arty. Reserve",    type:'artillery', side:'union', q:13, r:4, morale:78, strength:8  },
  { id:'u8', name:"Gen. Meade",       type:'general',   side:'union', q:14, r:4, morale:92, strength:10 },
];

export const TURNS_PER_DAY = 6;
export const MAX_TURNS = 20;
export const MORALE_ROUT_THRESHOLD = 10;
export const MORALE_RETREAT_THRESHOLD = 28;
export const VICTORY_MORALE_PCT = 0.28;
