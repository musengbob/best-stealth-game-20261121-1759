# Night Shift: The Quiet Courier

An original top-down stealth game for the make.fun best-stealth-game-20261121-1759 bounty.

You are a courier on the night shift. Cross a guarded warehouse, collect
3 parcels, and reach the glowing exit — unseen. Four patrol guards sweep the
floor with visible vision cones, a ceiling camera watches the middle, and
lamp light exposes you while shadows hide you. Sneak slow and quiet, or dash
fast and loud. Get fully spotted and the alarm trips: guards converge, you
lose a life, and you restart at the entrance.

## How to run

Serve `game/` with any static server and open `game/index.html`:

```sh
node serve.ts
# then open http://localhost:8080
```

No build step, no network requests, no libraries. Everything is drawn
procedurally on a 2D canvas and every sound is generated with WebAudio.

## Controls

- **WASD / arrows** — move
- **Shift** — sneak (slower, quieter, harder to spot)
- **Space** — dash (fast but loud — guards nearby hear it)
- **P** — pause · **M** — mute · **R** — restart · **Enter** — start

## The game

- **Vision cones** — guards and the ceiling camera show exactly what they
  can see. Crates, shelves and pillars block their line of sight.
- **Detection meter** — fills while you are seen in a cone (faster in lamp
  light, slower sneaking or in shadow). Full meter = spotted, alarm, -1 life.
- **Parcels** — 3 to collect; the exit only opens once all three are in
  your satchel.
- **Rank** — win screen ranks your run S/A/B/C by time, parcels and times
  spotted.

## Layout

- `game/index.html` — page, canvas, HUD hint
- `game/src/config.js` — tuning constants (speeds, detection, scoring)
- `game/src/level.js` — warehouse layout, cover, lamps, parcels, routes
- `game/src/guards.js` — patrol, vision cones, line of sight, alarm
- `game/src/player.js` — movement, sneak/dash, parcel pickup
- `game/src/render.js` — floor, cover, cones, HUD, overlays (all procedural)
- `game/src/audio.js` — WebAudio sounds, generated in code
- `game/src/shots.js` — deterministic screenshot staging (`?shot=`)
- `game/src/main.js` — boot, game loop, state machine
- `main.ts` — hand-in program: copies `game/` + `screenshots/` to `/output`
  and writes `dossier.json` via `vendor/makefun-game.ts`
