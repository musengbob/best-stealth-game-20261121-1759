// Night Shift: The Quiet Courier — boot, game loop and state machine.
// Wires input, the courier, the guards, the camera, sound and rendering
// together. States: title → playing ⇄ paused → win / lose. Being spotted
// trips an alarm, costs a life and restarts the courier at the entrance;
// losing the last life ends the shift.

import { WORLD, GAME, DETECTION } from './config.js';
import { GUARD_ROUTES, CEILING_CAMERA } from './level.js';
import { PatrolGuard, CeilingCamera, applyDashNoise } from './guards.js';
import { Courier } from './player.js';
import { Renderer } from './render.js';
import { SoundBank } from './audio.js';
import { readShotParams, stageShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = WORLD.width;
canvas.height = WORLD.height;

const renderer = new Renderer(canvas);
const sounds = new SoundBank();
const keys = Object.create(null);

export const game = {
  state: 'title', // title | playing | paused | win | lose
  player: new Courier(),
  guards: GUARD_ROUTES.map((route) => new PatrolGuard(route)),
  camera: new CeilingCamera(CEILING_CAMERA),
  alarm: { active: false, timer: 0 },
  lives: GAME.lives,
  elapsed: 0,
  timesSpotted: 0,
  maxDetection: 0,
  score: 0,
  rank: 'C',
  frozenTime: null, // set by a ?shot= stage: render with a fixed clock
};

window.__game = game; // playtest hook: inspect state from the console

function resetRun() {
  game.player = new Courier();
  game.guards = GUARD_ROUTES.map((route) => new PatrolGuard(route));
  game.camera = new CeilingCamera(CEILING_CAMERA);
  game.alarm = { active: false, timer: 0 };
  game.lives = GAME.lives;
  game.elapsed = 0;
  game.timesSpotted = 0;
  game.maxDetection = 0;
  game.score = 0;
  game.rank = 'C';
  game.state = 'playing';
}

function computeRank() {
  const timeBonus = Math.max(0, (GAME.parSeconds - game.elapsed) * GAME.timeBonusPerSecond);
  game.score = Math.round(
    game.player.parcels * GAME.parcelScore + timeBonus - game.timesSpotted * GAME.spottedPenalty,
  );
  if (game.score >= 4200) game.rank = 'S';
  else if (game.score >= 3400) game.rank = 'A';
  else if (game.score >= 2600) game.rank = 'B';
  else game.rank = 'C';
}

function tripAlarm() {
  game.timesSpotted += 1;
  game.lives -= 1;
  game.alarm = { active: true, timer: DETECTION.alarmSeconds };
  sounds.alert();
  if (game.lives <= 0) {
    game.state = 'lose';
    sounds.lose();
  }
}

function endAlarm() {
  game.alarm.active = false;
  game.alarm.timer = 0;
  for (const g of game.guards) g.detection = 0;
  game.camera.detection = 0;
  game.maxDetection = 0;
  if (game.state !== 'playing') return;
  // Slip back to the entrance, unseen for a couple of seconds.
  game.player.x = 92;
  game.player.y = 648;
  game.player.graceTimer = DETECTION.graceSeconds;
}

function update(dt) {
  if (game.state !== 'playing') return;
  game.elapsed += dt;

  game.player.update(dt, keys, null, () => sounds.pickup());
  if (game.player.stepped) sounds.step();

  let max = 0;
  for (const guard of game.guards) {
    max = Math.max(max, guard.update(dt, game.player, game.alarm));
  }
  max = Math.max(max, game.camera.update(dt, game.player));
  game.maxDetection = max;

  if (max >= 1 && !game.alarm.active && game.player.graceTimer <= 0) {
    tripAlarm();
  }
  if (game.alarm.active) {
    game.alarm.timer -= dt;
    if (game.alarm.timer <= 0) endAlarm();
  }
  if (game.player.atExit()) {
    game.state = 'win';
    computeRank();
    sounds.win();
  }
}

function frame(now) {
  const t = game.frozenTime !== null ? game.frozenTime : now / 1000;
  if (game.frozenTime === null) {
    const dt = Math.min(0.05, (now - frame.last) / 1000 || 0);
    frame.last = now;
    update(dt);
  }
  renderer.render(game, t);
  requestAnimationFrame(frame);
}
frame.last = 0;

function keyName(event) {
  return event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
}

window.addEventListener('keydown', (event) => {
  const key = keyName(event);
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
    event.preventDefault();
  }
  sounds.ensure();
  keys[key] = true;

  if (key === 'enter' && game.state === 'title') {
    resetRun();
    return;
  }
  if (key === 'r' && (game.state === 'win' || game.state === 'lose' || game.state === 'playing')) {
    resetRun();
    return;
  }
  if (key === 'p' && (game.state === 'playing' || game.state === 'paused')) {
    game.state = game.state === 'playing' ? 'paused' : 'playing';
    return;
  }
  if (key === 'm') {
    sounds.toggleMute();
    return;
  }
  if (key === ' ' && game.state === 'playing') {
    if (game.player.tryDash()) {
      sounds.dash();
      applyDashNoise(game.guards, game.camera, game.player);
    }
  }
});

window.addEventListener('keyup', (event) => {
  keys[keyName(event)] = false;
});

canvas.addEventListener('pointerdown', () => {
  sounds.ensure();
  if (game.state === 'title') resetRun();
});

// Stage a deterministic screenshot scene when ?shot= is present, then
// freeze the simulation clock so the render is identical on every load.
const { shot } = readShotParams();
if (stageShot(game, shot)) {
  game.frozenTime = game.frozenTime ?? 1.2;
} else {
  game.state = 'title';
}

requestAnimationFrame(frame);
