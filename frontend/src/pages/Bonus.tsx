import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useRun,
  getBonusQuestion,
  computeBonusMultiplier,
  BONUS_TIME_LIMIT_MS,
  allActsComplete,
} from "../engine/run";
import { DecorativeDivider } from "../components/Ornaments";

export function Bonus() {
  const nav = useNavigate();
  const dateKey = useRun((s) => s.dateKey);
  const actProgress = useRun((s) => s.actProgress);
  const bonus = useRun((s) => s.bonus);
  const completeBonus = useRun((s) => s.completeBonus);

  useEffect(() => {
    if (!allActsComplete(actProgress)) nav("/", { replace: true });
    if (bonus?.taken) nav("/summary", { replace: true });
  }, [actProgress, bonus, nav]);

  const q = useMemo(() => getBonusQuestion(dateKey), [dateKey]);

  const [stage, setStage] = useState<"portal" | "asking">("portal");
  const [picked, setPicked] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);

  // timer while asking
  useEffect(() => {
    if (stage !== "asking") return;
    const iv = setInterval(() => {
      const e = Date.now() - startRef.current;
      setElapsed(e);
      if (e >= BONUS_TIME_LIMIT_MS && picked === null) {
        handlePick(-1);
      }
    }, 50);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, picked]);

  function openPortal() {
    startRef.current = Date.now();
    setStage("asking");
  }

  function handlePick(i: number) {
    if (picked !== null) return;
    const dur = Math.min(Date.now() - startRef.current, BONUS_TIME_LIMIT_MS);
    const correct = i === q.answerIndex;
    const mult = computeBonusMultiplier(correct, dur);
    setPicked(i);
    setElapsed(dur);
    completeBonus(correct, dur, mult);
  }

  if (stage === "portal") {
    return (
      <div className="relative paper-grain bg-vellum text-ink rounded-sm p-12 border border-gold/40 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] text-center ink-bleed">
        <div className="font-mono uppercase tracking-[0.4em] text-oxblood/70 text-xs">
          A red portal has opened
        </div>
        <DecorativeDivider />
        <div className="mx-auto my-2 w-40 h-40 relative">
          <div className="absolute inset-0 rounded-full bg-oxblood/50 blur-2xl animate-pulse" />
          <div className="absolute inset-2 rounded-full border-4 border-oxblood bg-oxblood/20" />
          <div className="absolute inset-0 flex items-center justify-center font-display italic text-4xl text-oxblood-deep">
            ✦
          </div>
        </div>
        <h1 className="font-display italic text-5xl text-ink">The Secret Cow Level</h1>
        <p className="font-body italic text-ink-faded mt-3 max-w-lg mx-auto">
          A single question awaits. Answer swiftly and the Cow King's hoard multiplies thy score;
          tarry, and the reward dwindles. At <span className="font-mono text-oxblood">≤5s</span> the
          bonus is <span className="font-mono text-oxblood">×3</span>. It fades to <span className="font-mono">×1</span> by
          <span className="font-mono"> 20s</span>. A wrong answer grants nothing.
        </p>
        <button
          onClick={openPortal}
          className="mt-8 bg-oxblood text-vellum-light hover:bg-oxblood-deep px-10 py-5 font-mono uppercase tracking-[0.3em] text-sm border border-gold/60"
        >
          Step Through →
        </button>
      </div>
    );
  }

  const timeLeft = Math.max(0, BONUS_TIME_LIMIT_MS - elapsed);
  const pct = (timeLeft / BONUS_TIME_LIMIT_MS) * 100;
  const liveMult = computeBonusMultiplier(true, elapsed);
  const isCorrect = picked !== null && picked === q.answerIndex;
  const isWrong = picked !== null && picked !== q.answerIndex && picked !== -1;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3 font-mono uppercase tracking-widest text-xs">
        <span className="text-oxblood/80">Cow Bonus · Sudden Death</span>
        <span className="text-gold-bright">
          live multiplier: <span className="font-display italic text-xl not-italic">×{liveMult.toFixed(2)}</span>
        </span>
      </div>
      <div className="h-1.5 bg-ink/40 rounded-sm overflow-hidden mb-4">
        <div
          className={`h-full transition-[width] duration-100 ${pct > 50 ? "bg-gold" : pct > 20 ? "bg-oxblood" : "bg-oxblood-deep"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div
        className={`relative paper-grain bg-vellum text-ink rounded-sm p-10 border-2 border-oxblood shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] ink-bleed ${isWrong ? "shake" : ""}`}
      >
        <div className="font-display text-3xl italic text-ink">{q.prompt}</div>
        <div className="rule-gold my-5 opacity-60" />
        <div className="grid md:grid-cols-2 gap-3">
          {q.choices.map((c, i) => {
            const chosen = picked === i;
            const revealCorrect = picked !== null && i === q.answerIndex;
            const revealWrong = chosen && i !== q.answerIndex;
            return (
              <button
                key={i}
                onClick={() => handlePick(i)}
                disabled={picked !== null}
                className={[
                  "text-left px-5 py-4 border font-body text-lg transition-all",
                  revealCorrect
                    ? "bg-gold/20 border-gold text-ink"
                    : revealWrong
                      ? "bg-oxblood/10 border-oxblood text-oxblood-deep line-through"
                      : "border-ink/30 hover:border-ink/70 hover:bg-ink/5",
                ].join(" ")}
              >
                <span className="font-mono text-xs text-ink/50 mr-3">
                  {String.fromCharCode(65 + i)}
                </span>
                {c}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div className="mt-8 pt-6 border-t border-ink/10 flex items-start gap-6">
            <div
              className={`seal-stamp shrink-0 w-24 h-24 rounded-full flex items-center justify-center font-display italic border-2 ${isCorrect ? "border-gold text-gold bg-gold/5" : "border-oxblood text-oxblood bg-oxblood/5"}`}
            >
              <div className="text-center leading-none">
                <div className="text-xl">{isCorrect ? "Veritas" : "Errare"}</div>
                <div className="text-sm font-mono mt-1">
                  ×{(bonus?.multiplier ?? 1).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="font-mono uppercase tracking-widest text-[10px] text-ink/50 mb-1">
                From the Fextralife Codex · answered in {Math.round(elapsed / 100) / 10}s
              </div>
              <p className="font-body text-ink-faded italic">{q.explanation}</p>
              <a
                href={q.source}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[10px] uppercase tracking-widest text-oxblood hover:underline"
              >
                source ↗
              </a>
            </div>
            <button
              onClick={() => nav("/summary")}
              className="self-end bg-ink text-vellum-light hover:bg-oxblood-deep px-6 py-3 font-mono uppercase tracking-widest text-xs border border-gold/40"
            >
              Tally →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
