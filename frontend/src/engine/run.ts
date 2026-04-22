import { create } from "zustand";
import { persist } from "zustand/middleware";
import { todayKey, pickDaily, pickDailyBonus } from "./daily";
import { actBanks, cowBonusBank } from "../content/diablo2";
import type { Question } from "./types";

export const QUESTIONS_PER_ACT = 10;
export const TOTAL_ACTS = 5;

export interface ActProgress {
  actId: number;
  correct: number;
  durationMs: number;
  completed: boolean;
}

interface RunState {
  dateKey: string;
  actProgress: ActProgress[];
  bonus: {
    taken: boolean;
    correct: boolean;
    durationMs: number;
    multiplier: number;
  } | null;
  submitted: boolean;
  reset: (dateKey: string) => void;
  setSubmitted: (v: boolean) => void;
  completeAct: (actId: number, correct: number, durationMs: number) => void;
  completeBonus: (correct: boolean, durationMs: number, multiplier: number) => void;
}

function emptyProgress(): ActProgress[] {
  return Array.from({ length: TOTAL_ACTS }, (_, i) => ({
    actId: i + 1,
    correct: 0,
    durationMs: 0,
    completed: false,
  }));
}

export const useRun = create<RunState>()(
  persist(
    (set, get) => ({
      dateKey: todayKey(),
      actProgress: emptyProgress(),
      bonus: null,
      submitted: false,
      reset: (dateKey: string) =>
        set({ dateKey, actProgress: emptyProgress(), bonus: null, submitted: false }),
      setSubmitted: (v) => set({ submitted: v }),
      completeAct: (actId, correct, durationMs) => {
        const next = get().actProgress.map((a) =>
          a.actId === actId ? { ...a, correct, durationMs, completed: true } : a
        );
        set({ actProgress: next });
      },
      completeBonus: (correct, durationMs, multiplier) =>
        set({ bonus: { taken: true, correct, durationMs, multiplier } }),
    }),
    { name: "quiz.run.v2" }
  )
);

/** If the persisted run is for an earlier date, reset it. Call on app boot. */
export function rollOverIfNewDay() {
  const today = todayKey();
  const { dateKey, reset } = useRun.getState();
  if (dateKey !== today) reset(today);
}

export function getActQuestions(actId: number, dateKey: string): Question[] {
  const bank = actBanks.find((b) => b.actId === actId);
  if (!bank) return [];
  return pickDaily(bank.questions, `act-${actId}`, dateKey, QUESTIONS_PER_ACT);
}

export function getBonusQuestion(dateKey: string): Question {
  return pickDailyBonus(cowBonusBank.questions, "cow", dateKey);
}

/** Base score: sum of correct across all acts (max = TOTAL_ACTS * QUESTIONS_PER_ACT). */
export function baseScore(p: ActProgress[]): number {
  return p.reduce((s, a) => s + a.correct, 0);
}

/** Total with bonus multiplier applied. Bonus applies only if all acts completed and bonus taken. */
export function totalScore(p: ActProgress[], bonus: RunState["bonus"]): number {
  const base = baseScore(p);
  if (!bonus?.taken || !bonus.correct) return base;
  return Math.round(base * bonus.multiplier);
}

export function allActsComplete(p: ActProgress[]): boolean {
  return p.every((a) => a.completed);
}

/** Speed multiplier curve for the Cow bonus.
 * Correct @ 0s  -> 3.0x
 * Correct @ 5s  -> 3.0x
 * Correct @ 20s -> 1.0x (linear between)
 * Correct > 20s -> 1.0x
 * Wrong         -> 1.0x (no bonus)
 */
export function computeBonusMultiplier(correct: boolean, durationMs: number): number {
  if (!correct) return 1;
  const sec = durationMs / 1000;
  if (sec <= 5) return 3;
  if (sec >= 20) return 1;
  return +(3 - ((sec - 5) / 15) * 2).toFixed(2);
}

export const BONUS_TIME_LIMIT_MS = 20_000;
