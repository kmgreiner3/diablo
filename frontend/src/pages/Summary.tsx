import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRun, baseScore, totalScore, QUESTIONS_PER_ACT, TOTAL_ACTS, allActsComplete } from "../engine/run";
import { useUser } from "../engine/store";
import { submitScore } from "../engine/api";
import { DecorativeDivider } from "../components/Ornaments";

export function Summary() {
  const nav = useNavigate();
  const username = useUser((s) => s.username);
  const { actProgress, bonus, dateKey, submitted, setSubmitted } = useRun();
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!allActsComplete(actProgress)) nav("/", { replace: true });
  }, [actProgress, nav]);

  const base = baseScore(actProgress);
  const total = totalScore(actProgress, bonus);
  const totalDuration = actProgress.reduce((s, a) => s + a.durationMs, 0) + (bonus?.durationMs ?? 0);

  const submittedRef = useRef(false);

  async function doSubmit() {
    setSubmitError(null);
    try {
      await submitScore({
        username,
        score: total,
        quizId: `diablo2-${dateKey}`,
        timestamp: Date.now(),
        durationMs: totalDuration,
      });
      setSubmitted(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "unknown error");
    }
  }

  useEffect(() => {
    if (submittedRef.current || submitted) return;
    if (!allActsComplete(actProgress)) return;
    submittedRef.current = true;
    void doSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actProgress, submitted]);

  const epithet =
    total >= 120 ? "Archon of the Horadrim" :
    total >= 90 ? "Bearer of the Black Soul" :
    total >= 60 ? "Seeker of Forgotten Lore" :
    total >= 35 ? "Wanderer of Sanctuary" :
    "Footman of the Fallen";

  return (
    <div className="relative paper-grain bg-vellum text-ink rounded-sm p-6 md:p-12 border border-gold/40 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] text-center ink-bleed">
      <div className="font-mono uppercase tracking-[0.4em] text-oxblood/70 text-xs">
        The Grand Tour · {dateKey}
      </div>
      <DecorativeDivider />
      <div className="font-display italic text-2xl text-ink-faded">
        {username}, the {epithet}
      </div>

      <div className="mt-6 md:mt-8 font-display text-6xl md:text-8xl text-oxblood leading-none">
        {total}
      </div>
      <div className="mt-2 font-mono uppercase tracking-widest text-xs text-ink/60">
        {bonus?.correct ? (
          <>base {base} × <span className="text-oxblood">{bonus.multiplier.toFixed(2)}</span> = {total}</>
        ) : (
          <>base {base} · no cow bonus</>
        )}
      </div>
      <div className="mt-1 font-mono text-xs text-ink/50">
        total time {Math.round(totalDuration / 1000)}s
      </div>

      <DecorativeDivider />

      <div className="grid grid-cols-5 gap-2 md:gap-3 max-w-2xl mx-auto">
        {actProgress.map((a) => (
          <div key={a.actId} className="border border-ink/20 p-2 md:p-3">
            <div className="font-mono uppercase tracking-widest text-[9px] md:text-[10px] text-ink/50">
              Act {toRoman(a.actId)}
            </div>
            <div className="font-display text-xl md:text-3xl italic text-ink mt-1">
              {a.correct}<span className="text-ink-faded/40 text-sm md:text-lg">/{QUESTIONS_PER_ACT}</span>
            </div>
            <div className="font-mono text-[9px] md:text-[10px] text-ink/40">
              {Math.round(a.durationMs / 1000)}s
            </div>
          </div>
        ))}
      </div>

      {bonus?.taken && (
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-oxblood text-oxblood font-mono uppercase tracking-widest text-xs">
          Cow Bonus · {bonus.correct ? `×${bonus.multiplier.toFixed(2)}` : "forfeit"}
          {bonus.correct && (
            <span className="text-ink/50">({Math.round(bonus.durationMs / 10) / 100}s)</span>
          )}
        </div>
      )}

      {submitError && (
        <div className="mt-6 inline-flex flex-col items-center gap-2 px-4 py-3 border border-oxblood bg-oxblood/5 text-oxblood-deep max-w-md mx-auto">
          <div className="font-mono uppercase tracking-widest text-[10px]">
            Score did not save
          </div>
          <div className="font-body italic text-sm">{submitError}</div>
          <button
            onClick={() => { submittedRef.current = true; void doSubmit(); }}
            className="mt-1 bg-oxblood text-vellum-light hover:bg-oxblood-deep px-4 py-2 font-mono uppercase tracking-widest text-[10px]"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mt-10 flex items-center justify-center gap-4">
        <button
          onClick={() => nav("/leaderboard")}
          className="bg-oxblood text-vellum-light hover:bg-oxblood-deep px-6 py-3 font-mono uppercase tracking-widest text-xs border border-gold/60"
        >
          View Ledger →
        </button>
        <button
          onClick={() => nav("/")}
          className="border border-ink/40 text-ink hover:bg-ink/5 px-6 py-3 font-mono uppercase tracking-widest text-xs"
        >
          ← Return
        </button>
      </div>

      <div className="mt-8 font-mono text-[10px] uppercase tracking-widest text-ink/40">
        the trial resets at midnight (new york)
      </div>
      <div className="text-ink/40 text-[10px]">
        {TOTAL_ACTS} acts · {TOTAL_ACTS * QUESTIONS_PER_ACT} questions · 1 bonus
      </div>
    </div>
  );
}

function toRoman(n: number): string {
  return ["I", "II", "III", "IV", "V"][n - 1] ?? String(n);
}
