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

function seededShuffle<T>(arr: T[], seed: string): T[] {
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
 * Pick N questions from a bank for a given day, then sort by difficulty ascending
 * so the quiz ramps. Deterministic: same (bankKey, dateKey, n) -> same picks.
 */
export function pickDaily(
  questions: Question[],
  bankKey: string,
  dateKey: string,
  n: number
): Question[] {
  const shuffled = seededShuffle(questions, `${dateKey}|${bankKey}`);
  const picked = shuffled.slice(0, Math.min(n, shuffled.length));
  return picked.sort((a, b) => a.difficulty - b.difficulty);
}

/** Pick exactly one bonus question deterministically per day. */
export function pickDailyBonus(
  questions: Question[],
  bankKey: string,
  dateKey: string
): Question {
  const [q] = seededShuffle(questions, `bonus|${dateKey}|${bankKey}`);
  return q;
}
