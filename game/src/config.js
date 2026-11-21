// Night Shift: The Quiet Courier — tuning constants.
// One place for every number that shapes how the game feels: movement,
// guard senses, detection, and scoring. Nothing here touches the DOM.

export const WORLD = {
  width: 1280,
  height: 720,
  wall: 24, // thickness of the outer warehouse wall, in pixels
};

export const PLAYER = {
  radius: 12,
  walkSpeed: 175, // px per second
  sneakSpeed: 92, // Shift: slower, quieter, harder to spot
  dashSpeed: 390, // Space: fast, loud, briefly obvious
  dashTime: 0.22, // seconds of dash speed per press
  dashCooldown: 1.1, // seconds before the next dash
  pickupRadius: 26,
  exitRadius: 30,
};

export const GUARD = {
  radius: 13,
  patrolSpeed: 72,
  chaseSpeed: 152,
  turnSpeed: 2.6, // radians per second while sweeping / turning
  coneRange: 225, // how far a guard can see, in pixels
  coneHalfAngle: 0.56, // radians either side of facing (~32 degrees)
  sweepArc: 0.85, // radians a sweeping guard turns through
  hearingRadius: 250, // dashing inside this radius is heard
};

export const CAMERA = {
  range: 265,
  coneHalfAngle: 0.42,
  sweepArc: 0.9,
  sweepSpeed: 0.55, // radians per second
};

export const DETECTION = {
  fillRate: 1.05, // meter per second at point blank, full light, walking
  decayRate: 0.30, // meter per second while unseen
  sneakFactor: 0.45, // sneaking multiplies the fill rate
  shadowFactor: 0.5, // standing in shadow multiplies the fill rate
  dashFactor: 1.9, // dashing multiplies the fill rate
  distanceFalloff: 0.55, // how much range weakens the fill rate
  alarmSeconds: 2.6, // how long the alarm lasts after being spotted
  graceSeconds: 2.0, // brief unseen grace after respawning
};

export const GAME = {
  lives: 3,
  parcelsNeeded: 3,
  parcelScore: 1000,
  spottedPenalty: 400,
  timeBonusPerSecond: 8, // bonus per second under the par time
  parSeconds: 150,
};

export const COLORS = {
  floorDark: '#141a2e',
  floorLight: '#1a2138',
  wall: '#2c3550',
  wallTop: '#3d4a6e',
  crate: '#5a4632',
  crateTop: '#7a6248',
  shelf: '#33415e',
  shelfTop: '#4a5a80',
  pillar: '#3a3f55',
  lampGlow: 'rgba(255, 190, 90, 0.10)',
  lampCore: '#ffd28a',
  cone: 'rgba(255, 214, 90, 0.16)',
  coneEdge: 'rgba(255, 214, 90, 0.45)',
  alarmCone: 'rgba(255, 70, 70, 0.22)',
  exitGlow: '#7dffb0',
  player: '#8fd3ff',
  playerSneak: '#6fb7e8',
  guard: '#ff9d5c',
  guardAlert: '#ff5252',
  parcel: '#ffd94d',
};
