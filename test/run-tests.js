//(run: node tests/run-tests.js)
const assert = (cond, msg) => { if (!cond) { throw new Error('❌ ' + msg); } };

const {
  pad2, to12h, ampm, formatDisplayTime, parseHHMM, computeNextTrigger, DAY_LABELS
} = require('../script.js');

(function testBasics() {
  assert(pad2(3) === '03', 'pad2');
  assert(to12h(0) === 12 && to12h(13) === 1, 'to12h');
  assert(ampm(0) === 'AM' && ampm(13) === 'PM', 'ampm');
  assert(formatDisplayTime({h:14,m:5}, true) === '14:05', 'format 24h');
  assert(formatDisplayTime({h:14,m:5}, false) === '02:05 PM', 'format 12h');
  const t = parseHHMM('23:59'); assert(t.h === 23 && t.m === 59, 'parseHHMM');
})();

(function testComputeNextTriggerOneShot() {
  const now = new Date('2025-01-01T10:00:00');
  const alarm = { time:'10:01', repeat:[], enabled:true };
  const next = computeNextTrigger(alarm, now);
  assert(next.toISOString().startsWith('2025-01-01T10:01'), 'next same day future');

  const now2 = new Date('2025-01-01T10:02:00');
  const next2 = computeNextTrigger(alarm, now2);
  assert(next2.toISOString().startsWith('2025-01-02T10:01'), 'roll to next day');
})();

(function testComputeNextTriggerRepeat() {
  const wed = new Date('2025-01-01T10:00:00'); // Wednesday (3rd index: Wed)
  const alarm = { time:'09:00', repeat:[1,3,5], enabled:true }; // Mon, Wed, Fri
  const next = computeNextTrigger(alarm, wed);
  // It's Wed 10:00; next should be Fri 09:00
  const str = next.toISOString();
  assert(str.startsWith('2025-01-03T09:00'), 'repeat forward');
})();

console.log('✅ Tests passed');
