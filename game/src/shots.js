// Night Shift: The Quiet Courier — screenshot staging.
// The game reads ?shot=<name>&seed=<n> and freezes into a deterministic,
// readable scene for each shot, so screenshots are real renders of the
// game's own code and identical on every load:
//   start   — the title screen
//   play    — mid-game: courier crouched behind a crate, a cone sweeping by
//   spotted — tense moment: alert meter part-filled, a guard turning in
//   end     — the win screen after reaching the exit with all parcels

export function readShotParams() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || '1');
  return { shot, seed: Number.isFinite(seed) ? seed : 1 };
}

// Stage one deterministic scene into a live game object. Returns true when
// a shot was staged (the caller then freezes the simulation clock).
export function stageShot(game, shot) {
  if (!shot) return false;
  const { player, guards, camera } = game;

  if (shot === 'start') {
    game.state = 'title';
    game.frozenTime = 1.2;
    return true;
  }

  if (shot === 'play') {
    // Courier sneaking behind the upper-middle crate cluster, one parcel
    // already in the satchel; Mara's cone sweeps just past, not spotting.
    game.state = 'playing';
    player.x = 500;
    player.y = 300;
    player.sneaking = true;
    player.facing = Math.PI / 2;
    player.collected.add('A');
    player.parcels = 1;
    guards[0].x = 470;
    guards[0].y = 250;
    guards[0].facing = Math.PI * 0.35;
    guards[0].state = 'sweep';
    guards[0].detection = 0.12;
    guards[1].x = 1030;
    guards[1].y = 330;
    guards[1].facing = Math.PI;
    guards[2].x = 640;
    guards[2].y = 620;
    guards[2].facing = -Math.PI / 2;
    guards[3].x = 630;
    guards[3].y = 420;
    guards[3].facing = Math.PI * 0.1;
    camera.facing = Math.PI / 2 + 0.5;
    game.elapsed = 47;
    game.maxDetection = 0.12;
    game.frozenTime = 1.2;
    return true;
  }

  if (shot === 'spotted') {
    // Courier caught in the open by Rook's cone: meter part-filled, the
    // guard turning toward the player, alarm about to trip. The courier
    // stands clear of the crates, centred in the red cone.
    game.state = 'playing';
    player.x = 640;
    player.y = 520;
    player.sneaking = false;
    player.facing = -Math.PI / 2;
    player.collected.add('A');
    player.collected.add('B');
    player.parcels = 2;
    guards[3].x = 700;
    guards[3].y = 420;
    guards[3].facing = 2.11; // turned toward the courier, clear line of sight
    guards[3].detection = 0.62;
    guards[3].seesPlayer = true;
    guards[0].x = 700;
    guards[0].y = 250;
    guards[0].facing = Math.PI * 0.6;
    guards[1].x = 1030;
    guards[1].y = 470;
    guards[1].facing = Math.PI;
    guards[2].x = 500;
    guards[2].y = 620;
    guards[2].facing = 0;
    camera.facing = Math.PI / 2 - 0.4;
    game.elapsed = 96;
    game.maxDetection = 0.62;
    game.frozenTime = 1.2;
    return true;
  }

  if (shot === 'end') {
    // Win screen: all three parcels, exit reached, rank shown.
    game.state = 'win';
    player.x = 1185;
    player.y = 60;
    player.collected.add('A');
    player.collected.add('B');
    player.collected.add('C');
    player.parcels = 3;
    game.elapsed = 132;
    game.timesSpotted = 1;
    game.score = 3420;
    game.rank = 'A';
    game.frozenTime = 1.2;
    return true;
  }

  return false;
}
