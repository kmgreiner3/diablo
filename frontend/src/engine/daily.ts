import type { Question } from "./types";

// Deterministic rollover at America/New_York midnight. All players on the same
// local date see the same questions.
export function todayKey(d = new Date()): string {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return f.format(d);
}

// Days since 2026-01-01 (New York). Used as the cycle index so partitions
// advance by exactly one per calendar day, regardless of timezone of the viewer.
// DAY_OFFSET is a permanent shift of the whole cycle. Bump it by +1 when the
// authored content replaces a day's slice in-place (so users don't see the
// questions they already played on that date).
const DAY_OFFSET = 1;
export function dayIndex(dateKey: string): number {
  const epoch = Date.UTC(2026, 0, 1);
  const [y, m, d] = dateKey.split("-").map(Number);
  const today = Date.UTC(y, m - 1, d);
  return Math.floor((today - epoch) / 86_400_000) + DAY_OFFSET;
}

// xmur3 string hash -> seed
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Stable shuffle using a fixed seed derived from the bank key. Same bank key
 * always produces the same shuffle, so the cycle order is deterministic per
 * bank but unpredictable from the JSON order in the repo.
 */
function stableShuffle<T>(arr: T[], seed: string): T[] {
  const s = xmur3(seed)();
  const rand = mulberry32(s);
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Cycle-based daily pick: partition the bank into non-overlapping windows of
 * size `n` and advance one window per day. No question repeats within a cycle
 * (cycle length = ceil(bankSize / n) days).
 *
 * If the bank isn't a clean multiple of `n`, the last window wraps around to
 * the beginning of the shuffled bank, which briefly allows a question to
 * appear twice at the wrap boundary. For our configured bank of 15 with n=5
 * this divides cleanly, so no wrap overlap occurs.
 */
export function pickDaily(
  questions: Question[],
  bankKey: string,
  dateKey: string,
  n: number
): Question[] {
  if (questions.length === 0) return [];
  const order = stableShuffle(questions, bankKey);
  const len = order.length;
  const cycleLength = Math.max(1, Math.ceil(len / n));
  const di = ((dayIndex(dateKey) % cycleLength) + cycleLength) % cycleLength;
  const start = di * n;
  const slice: Question[] = [];
  for (let i = 0; i < Math.min(n, len); i++) {
    slice.push(order[(start + i) % len]);
  }
  return slice.sort((a, b) => a.difficulty - b.difficulty);
}

/**
 * Cycle-based bonus pick: one question per day, advancing one per day through
 * a stable-shuffled bank. Cycle length = bank size days.
 */
export function pickDailyBonus(
  questions: Question[],
  bankKey: string,
  dateKey: string
): Question {
  const order = stableShuffle(questions, `bonus|${bankKey}`);
  const di = ((dayIndex(dateKey) % order.length) + order.length) % order.length;
  return order[di];
}
