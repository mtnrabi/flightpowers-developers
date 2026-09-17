#!/usr/bin/env node
/**
 * The histogram walk, tested on fake histograms.
 *
 * WHY THIS ONE FUNCTION HAS A TEST WHEN NOTHING ELSE HERE DOES. It is the only
 * arithmetic on the admin page whose output cannot be sanity-checked by
 * looking at it: a p99 of "1024 MB" looks exactly as plausible when the walk
 * is off by one bucket as when it is right, and the two numbers on this page
 * that a production decision hangs on -- the memory p99 and the OVERFLOW case
 * -- are both produced by it.
 *
 * Run with `npm test`. It runs under plain node (--experimental-strip-types),
 * which is why src/lib/admin/histogram.ts deliberately has no `server-only`
 * import and no database client: it is arithmetic over an array.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { percentileFrom } from '../src/lib/admin/histogram.ts';

/** The lane / duration edges. 15 edges, so 16 slots. */
const MS = [250, 500, 1000, 2000, 3000, 5000, 8000, 12000, 16000, 20000, 25000, 30000, 40000, 60000, 90000];
/** The Lambda memory edges, in MB. */
const MB = [128, 192, 256, 320, 384, 448, 512, 576, 640, 704, 768, 896, 1024, 1536, 2048];

/** A 16-slot histogram from `{slotIndex: count}`, 0-based. */
function hist(counts) {
  const out = new Array(16).fill(0);
  for (const [index, n] of Object.entries(counts)) out[Number(index)] = n;
  return out;
}

test('an empty histogram states nothing, and is not an overflow', () => {
  assert.deepEqual(percentileFrom(hist({}), 0.5, MB), { value: null, overflow: false });
  assert.deepEqual(percentileFrom(new Array(16).fill(0), 0.99, MS), {
    value: null,
    overflow: false,
  });
});

test('the percentile is the UPPER EDGE of the bucket it lands in', () => {
  // Everything in slot 0, i.e. under the first edge.
  assert.deepEqual(percentileFrom(hist({ 0: 100 }), 0.5, MB), { value: 128, overflow: false });
  // Everything in slot 3 -> upper edge MB[3].
  assert.deepEqual(percentileFrom(hist({ 3: 40 }), 0.99, MB), { value: 320, overflow: false });
  assert.deepEqual(percentileFrom(hist({ 5: 7 }), 0.5, MS), { value: 5000, overflow: false });
});

test('the median splits the counts, the p99 follows the tail', () => {
  // 90 calls around 180 MB (slot 1), 9 at ~500 MB (slot 6), 1 at ~1000 MB (slot 12).
  const h = hist({ 1: 90, 6: 9, 12: 1 });
  assert.deepEqual(percentileFrom(h, 0.5, MB), { value: 192, overflow: false });
  // 99% of 100 is 99: the cumulative count reaches 99 exactly in slot 6.
  assert.deepEqual(percentileFrom(h, 0.99, MB), { value: 512, overflow: false });
  // One more sample in the tail pushes the p99 into the last populated slot.
  assert.deepEqual(percentileFrom(hist({ 1: 90, 6: 9, 12: 2 }), 0.99, MB), {
    value: 1024,
    overflow: false,
  });
});

test('THE OVERFLOW SLOT CANNOT BE STATED AS A NUMBER', () => {
  // Slot 15 is `>= 2048 MB` / `>= 90 s`. It has no upper edge, so the answer
  // is null WITH overflow set -- never the top edge, which would turn "at
  // least 2048 MB" into "exactly 2048 MB".
  assert.deepEqual(percentileFrom(hist({ 15: 5 }), 0.5, MB), { value: null, overflow: true });
  assert.deepEqual(percentileFrom(hist({ 15: 5 }), 0.5, MS), { value: null, overflow: true });

  // A median inside the bounded range with a tail in the overflow: the median
  // is a number, the p99 is not.
  const h = hist({ 2: 98, 15: 2 });
  assert.deepEqual(percentileFrom(h, 0.5, MB), { value: 256, overflow: false });
  assert.deepEqual(percentileFrom(h, 0.99, MB), { value: null, overflow: true });
});

test('slot 15 is the boundary: slot 14 still has an edge', () => {
  assert.deepEqual(percentileFrom(hist({ 14: 3 }), 0.5, MB), { value: 2048, overflow: false });
  assert.deepEqual(percentileFrom(hist({ 14: 3 }), 0.5, MS), { value: 90000, overflow: false });
});

test('a histogram longer than the reader knows about overflows rather than throwing', () => {
  const longer = [...hist({ 0: 1 }), 0, 0];
  assert.deepEqual(percentileFrom(longer, 0.5, MB), { value: 128, overflow: false });
  const tail = new Array(18).fill(0);
  tail[17] = 4;
  assert.deepEqual(percentileFrom(tail, 0.5, MB), { value: null, overflow: true });
});
