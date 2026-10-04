const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies, extras = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true }
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }, ...extras });
  return exports;
}
const engine = load('src/app/components/arcade/farkle.ts', {});
const personalities = load('src/app/components/arcade/personality-reactions.ts', {});
const reactions = load('src/app/components/arcade/reactions.ts', { './personality-reactions': personalities }, { Math });
for (const character of [{ moe: 10, emotion: 'joy calm', musicEnjoyer: true }, { emotion: 'joy', musicEnjoyer: true }, { emotion: 'calm', musicEnjoyer: true }]) {
  for (const ownTurn of [true, false]) for (const event of ['bank', 'farkle', 'win']) {
    const pool = personalities.personalityReactions(character, event, 150, ownTurn);
    assert.ok(pool.length >= 6);
    assert.equal(new Set(pool).size, pool.length);
    const seen = [];
    for (let i = 0; i < pool.length; i++) {
      const line = reactions.characterReaction(character, event, 150, 'you', ownTurn, seen);
      assert.ok(pool.includes(line), 'Personality must outrank music');
      assert.ok(!seen.includes(line), 'Avoid repeating available lines'); seen.push(line);
    }
  }
}
assert.deepEqual(personalities.personalityReactions({ moe: 10 }, 'bank', 150, true), personalities.personalityReactions({ moe: 10, emotion: 'calm joy', musicEnjoyer: true }, 'bank', 150, true));
const musicCharacter = { musicEnjoyer: true };
const musicLine = reactions.characterReaction(musicCharacter, 'bank', 150, 'you', true);
assert.notEqual(reactions.characterReaction(musicCharacter, 'bank', 150, 'you', true, [musicLine]), musicLine);
assert.match(reactions.characterReaction({ straightforward: true }, 'bank', 150, 'you', true), /150|turn|steady/);
const { scoreDice, bestSelection } = engine;
for (const [dice, expected] of [
  [[], 0], [[1], 100], [[5], 50], [[2], 0], [[1, 2], 0],
  [[1, 1, 1], 1000], [[2, 2, 2], 200], [[6, 6, 6, 6], 1200],
  [[1, 1, 1, 1, 1, 1], 8000], [[1, 2, 3, 4, 5, 6], 1500],
  [[2, 2, 4, 4, 6, 6], 1500], [[1, 5, 3, 3, 3], 450], [[0], 0]
]) assert.equal(scoreDice(dice), expected, `Score for ${dice}`);
assert.equal(bestSelection([2, 3, 4, 6]).score, 0);
assert.equal(bestSelection([1, 2, 5]).score, 150);
// All possible six-die rolls: the bot's selection must be legal and include every scoring opportunity.
for (let value = 0; value < 6 ** 6; value++) {
  let n = value;
  const dice = Array.from({ length: 6 }, () => { const d = n % 6 + 1; n = Math.floor(n / 6); return d; });
  const best = bestSelection(dice);
  assert.equal(scoreDice(best.indices.map(i => dice[i])), best.score);
  const expectedScoring = dice.includes(1) || dice.includes(5) || [2, 3, 4, 6].some(d => dice.filter(v => v === d).length >= 3)
    || new Set(dice).size === 6 || [1, 2, 3, 4, 5, 6].filter(d => dice.filter(v => v === d).length === 2).length === 3;
  assert.equal(best.score > 0, expectedScoring);
}

const timers = [];
const roster = { getCharacters() {} };
const http = {};
const rx = { Subscription: class { add() {} unsubscribe() {} }, timeout: () => {} };
const math = Object.create(Math);
const { Arcade } = load('src/app/components/arcade/arcade.ts', {
  '@angular/core': { Component: () => target => target, inject: token => token === 'roster' ? roster : http },
  '@angular/common': { CommonModule: {} }, '@angular/forms': { FormsModule: {} },
  '@angular/common/http': { HttpClient: 'http' }, rxjs: rx,
  '../../services/character.service': { CharacterService: 'roster' },
  '../../utils/character-assets': { iconAssetPath: path => path }, './farkle': engine, './reactions': reactions
}, { Math: math, setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout: () => {} });
function game() {
  const g = new Arcade();
  g.characters = [1, 2, 3, 4].map(id => ({ id, name: `Character ${id}`, shortName: `C${id}` }));
  g.characters.push({ id: 999, name: 'Me', shortName: 'Me', status: 'me', img: 'extended/Me.png' });
  g.start(); return g;
}
let g = game();
assert.equal(g.current.name, 'Me');
assert.equal(g.current.character.id, 999);
assert.equal(g.current.character.img, 'extended/Me.png');
g.selectSeat(1); g.choose(999); assert.equal(g.opponentIds[0], -1);
g.choose(2); assert.equal(g.opponentIds[0], 2);
g.selectSeat(0); g.choose(-1); assert.equal(g.playerId, 999);
g.hoveredId = 3; assert.equal(g.preview.id, 3); assert.equal(g.playerId, 999);
g.selectSeat(2); g.setOpponentCount(1); assert.equal(g.selectionSeat, 0);
g.search = 'me'; assert.equal(g.visibleCharacters.length, 1);
g = game();
assert.notEqual(g.players[1].character.id, g.players[2].character.id);
g.playerId = 1; g.opponentIds = [1]; g.start(); assert.match(g.error, /different/);
g = game(); g.dice = [1, 2]; g.selected = [0, 1]; g.bank();
assert.equal(g.active, 0); assert.equal(g.players[0].score, 0);
g.selected = [0]; g.bank(); assert.equal(g.players[0].score, 100); assert.equal(g.active, 1);
assert.equal(g.message, 'You banked 100 points.');
assert.ok(g.history.some(line => line.name === 'Game' && line.text === 'You banked 100 points.'));
assert.ok(g.history.some(line => line.name === g.players[1].name));
g = game(); g.turnPoints = 450;
let roll = [2, 3, 4, 6, 2, 3]; math.random = () => (roll.shift() - 0.5) / 6;
g.roll(); assert.equal(g.active, 1); assert.equal(g.players[0].score, 0); assert.equal(g.turnPoints, 0);
g = game(); g.dice = [1, 1, 1, 1, 1, 1]; g.selected = [0, 1, 2, 3, 4, 5]; math.random = () => 0;
g.roll(); assert.equal(g.turnPoints, 8000); assert.equal(g.dice.length, 6);
g = game(); g.target = 100; g.dice = [1]; g.selected = [0]; g.bank();
assert.equal(g.finalTurns, 2); assert.equal(g.winner, null);
g.dice = [1]; g.selected = [0]; g.bank(); assert.equal(g.finalTurns, 1);
g.dice = [5]; g.selected = [0]; g.bank(); assert.equal(g.winner.name, 'Me');
g = game(); g.active = 1; g.dice = [1, 1, 1]; g.botStep(); assert.equal(g.players[1].score, 1000);
g = game(); g.ngOnDestroy(); assert.equal(g.session, 2);
timers.length = 0;
let seed = 123456;
math.random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 2 ** 32; };
g = game();
for (let step = 0; step < 10000 && !g.winner; step++) {
  if (g.humanTurn) {
    if (!g.dice.length) g.roll();
    else { g.selected = bestSelection(g.dice).indices; g.bank(); }
  } else {
    const callback = timers.shift();
    assert.ok(callback, 'Computer turn must have a scheduled action'); callback();
  }
}
assert.ok(g.winner, 'A complete game must finish');
assert.ok(g.winner.score >= g.target);
console.log('Arcade checks passed: 46,656 rolls, turn transitions, and a complete game.');
