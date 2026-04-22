import type { ScoreEntry } from "./types";
import { todayKey } from "./daily";

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== "false";
const SCORE_API = import.meta.env.VITE_SCORE_API_URL ?? "";
const LEADERBOARD_API = import.meta.env.VITE_LEADERBOARD_API_URL ?? "";

const MOCK_KEY = "quiz.mock.scores.v2";

function mockRead(): ScoreEntry[] {
  try {
    return JSON.parse(localStorage.getItem(MOCK_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function mockWrite(entries: ScoreEntry[]) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(entries));
}

export async function submitScore(entry: ScoreEntry): Promise<void> {
  if (USE_MOCK) {
    const all = mockRead();
    all.push(entry);
    mockWrite(all);
    return;
  }
  await fetch(SCORE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
}

export async function fetchLeaderboard(quizId: string): Promise<ScoreEntry[]> {
  if (USE_MOCK) {
    return mockRead()
      .filter((e) => e.quizId === quizId)
      .sort((a, b) =>
        b.score !== a.score ? b.score - a.score : a.durationMs - b.durationMs
      );
  }
  const res = await fetch(`${LEADERBOARD_API}?quizId=${encodeURIComponent(quizId)}`);
  return res.json();
}

/** Seeds a few rivals on today's leaderboard so the Ledger isn't empty on first play. */
function seedMockIfEmpty() {
  if (!USE_MOCK) return;
  const all = mockRead();
  const today = todayKey();
  const quizId = `diablo2-${today}`;
  if (all.some((e) => e.quizId === quizId)) return;
  const now = Date.now();
  const rivals: ScoreEntry[] = [
    { username: "Deckard", score: 47, quizId, timestamp: now - 3_600_000, durationMs: 612_000 },
    { username: "Akara", score: 41, quizId, timestamp: now - 7_200_000, durationMs: 508_000 },
    { username: "Tyrael", score: 38, quizId, timestamp: now - 10_800_000, durationMs: 476_000 },
    { username: "Charsi", score: 29, quizId, timestamp: now - 14_400_000, durationMs: 704_000 },
  ];
  mockWrite([...all, ...rivals]);
}
seedMockIfEmpty();
