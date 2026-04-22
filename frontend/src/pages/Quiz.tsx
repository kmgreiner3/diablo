import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Question } from "../engine/types";
import { useUser } from "../engine/store";
import {
  useRun,
  getActQuestions,
  TOTAL_ACTS,
  QUESTIONS_PER_ACT,
  allActsComplete,
} from "../engine/run";
import { actBanks } from "../content/diablo2";
import { DecorativeDivider, IlluminatedNumber } from "../components/Ornaments";

export function Quiz() {
  const { actId = "1" } = useParams();
  const nav = useNavigate();
  const actNum = Math.max(1, Math.min(TOTAL_ACTS, Number(actId) || 1));
  const username = useUser((s) => s.username);
  const dateKey = useRun((s) => s.dateKey);
  const actProgress = useRun((s) => s.actProgress);
  const completeAct = useRun((s) => s.completeAct);

  useEffect(() => {
    if (!username) nav("/");
  }, [username, nav]);

  // Enforce gated progression: must have completed prior acts
  useEffect(() => {
    const previousCompleted = actProgress
      .filter((a) => a.actId < actNum)
      .every((a) => a.completed);
    if (!previousCompleted) nav("/");
    if (actProgress.find((a) => a.actId === actNum)?.completed) nav("/");
  }, [actNum, actProgress, nav]);

  const bank = actBanks.find((b) => b.actId === actNum)!;
  const questions = useMemo(
    () => getActQuestions(actNum, dateKey),
    [actNum, dateKey]
  );

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const startRef = useRef(Date.now());

  const q: Question | undefined = questions[idx];
  const total = questions.length;
  const isLast = idx === total - 1;

  if (!q) return null;

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === q!.answerIndex) setCorrect((c) => c + 1);
  }

  function next() {
    if (picked === null) return;
    if (isLast) {
      const duration = Date.now() - startRef.current;
      const finalCorrect =
        correct + (picked === q!.answerIndex && idx === total - 1 ? 0 : 0);
      // `correct` already includes the last pick because setCorrect ran before next()
      completeAct(actNum, correct, duration);
      // Decide next destination
      const allDone = actProgress
        .filter((a) => a.actId !== actNum)
        .every((a) => a.completed);
      if (allDone && actNum === TOTAL_ACTS) {
        nav("/bonus");
      } else {
        nav(`/waypoint/${actNum}`);
      }
      void finalCorrect;
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
  }

  const isCorrect = picked !== null && picked === q.answerIndex;
  const isWrong = picked !== null && picked !== q.answerIndex;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4 font-mono uppercase tracking-widest text-xs text-vellum/60">
        <div>
          Act <span className="text-gold-bright">{toRoman(actNum)}</span>
          <span className="mx-2 text-vellum/30">·</span>
          {bank.title}
        </div>
        <div>
          Question <span className="text-gold-bright">{idx + 1}</span> of {total}
        </div>
      </div>

      <div className="flex items-center gap-1 mb-3 font-mono uppercase tracking-widest text-[10px] text-vellum/50">
        <span>peril</span>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`inline-block w-2 h-2 ${i < q.difficulty ? "bg-oxblood" : "border border-vellum/30"}`}
          />
        ))}
      </div>

      <div
        key={q.id}
        className={`relative paper-grain bg-vellum text-ink rounded-sm p-10 border border-gold/40 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] ink-bleed ${isWrong ? "shake" : ""}`}
      >
        <div className="grid md:grid-cols-[1fr_auto_1.2fr] gap-8 items-start">
          <div>
            <div className="flex items-baseline gap-3 mb-4">
              <IlluminatedNumber n={idx + 1} />
              <div className="font-mono uppercase text-[10px] tracking-[0.3em] text-oxblood/70">
                of {QUESTIONS_PER_ACT} trials
              </div>
            </div>
            <div className="rule-gold mb-5 opacity-60" />
            <p className="font-display text-3xl italic leading-snug text-ink">{q.prompt}</p>
          </div>

          <div className="hidden md:block w-px self-stretch bg-gold/40" />

          <div className="space-y-3">
            {q.choices.map((c, i) => {
              const chosen = picked === i;
              const revealCorrect = picked !== null && i === q.answerIndex;
              const revealWrong = chosen && i !== q.answerIndex;
              return (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  disabled={picked !== null}
                  className={[
                    "w-full text-left px-5 py-3 border transition-all font-body text-lg",
                    revealCorrect
                      ? "bg-gold/20 border-gold text-ink"
                      : revealWrong
                        ? "bg-oxblood/10 border-oxblood text-oxblood-deep line-through"
                        : chosen
                          ? "bg-ink/5 border-ink/40"
                          : "bg-transparent border-ink/20 hover:border-ink/60 hover:bg-ink/5",
                    picked !== null && !chosen && !revealCorrect ? "opacity-50" : "",
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
        </div>

        {picked !== null && (
          <div className="mt-8 pt-6 border-t border-ink/10 flex items-start gap-6">
            <div
              className={`seal-stamp shrink-0 w-20 h-20 rounded-full flex items-center justify-center font-display text-2xl italic border-2 ${isCorrect ? "border-gold text-gold bg-gold/5" : "border-oxblood text-oxblood bg-oxblood/5"}`}
            >
              {isCorrect ? "Veritas" : "Errare"}
            </div>
            <div className="flex-1">
              <div className="font-mono uppercase tracking-widest text-[10px] text-ink/50 mb-1">
                From the Fextralife Codex
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
              onClick={next}
              className="self-end bg-ink text-vellum-light hover:bg-oxblood-deep px-6 py-3 font-mono uppercase tracking-widest text-xs border border-gold/40"
            >
              {isLast ? "Conclude Act →" : "Next →"}
            </button>
          </div>
        )}
      </div>

      <DecorativeDivider />
    </div>
  );
}

function toRoman(n: number): string {
  return ["I", "II", "III", "IV", "V"][n - 1] ?? String(n);
}

// Re-export used symbols for consumers
export { allActsComplete };
