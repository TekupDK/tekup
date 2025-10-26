const Sequencer = require('@jest/test-sequencer').default;
const seedrandom = require('seedrandom');

class RandomSequencer extends Sequencer {
  sort(tests) {
    const seed = process.env.JEST_SEED || Date.now().toString();
    const rng = seedrandom(seed);
    const items = Array.from(tests);
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    console.log(`[jest-sequencer] seed=${seed} order randomized (${items.length} tests)`);
    return items;
  }
}
module.exports = RandomSequencer;
