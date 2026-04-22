import { Link, useNavigate, useParams } from "react-router-dom";
import { useRun, TOTAL_ACTS, QUESTIONS_PER_ACT, allActsComplete } from "../engine/run";
import { actBanks } from "../content/diablo2";
import { DecorativeDivider } from "../components/Ornaments";
import { useEffect } from "react";

export function Waypoint() {
  const { fromActId = "1" } = useParams();
  const fromNum = Number(fromActId);
  const nextNum = fromNum + 1;
  const nav = useNavigate();
  const actProgress = useRun((s) => s.actProgress);

  const just = actProgress.find((a) => a.actId === fromNum);
  const nextBank = actBanks.find((b) => b.actId === nextNum);
  const allDone = allActsComplete(actProgress);

  useEffect(() => {
    if (allDone) nav("/bonus", { replace: true });
  }, [allDone, nav]);

  return (
    <div className="relative paper-grain bg-vellum text-ink rounded-sm p-6 md:p-12 border border-gold/40 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] ink-bleed text-center">
      <div className="font-mono uppercase tracking-[0.4em] text-oxblood/70 text-xs">
        Waypoint Activated
      </div>
      <DecorativeDivider />
      <div className="font-display italic text-3xl text-ink-faded">
        Act {toRoman(fromNum)} concluded
      </div>
      <div className="mt-4 font-display text-5xl md:text-7xl text-oxblood leading-none">
        {just?.correct ?? 0}
        <span className="text-ink-faded/40">/{QUESTIONS_PER_ACT}</span>
      </div>
      <div className="mt-2 font-mono uppercase tracking-widest text-xs text-ink/60">
        {Math.round((just?.durationMs ?? 0) / 1000)}s
      </div>

      <DecorativeDivider />

      {nextBank ? (
        <>
          <div className="font-mono uppercase tracking-[0.3em] text-[10px] text-ink/50">
            Teleporting to
          </div>
          <div className="font-display italic text-2xl md:text-4xl text-ink mt-2">
            Act {toRoman(nextNum)} · {nextBank.title}
          </div>
          <div className="font-body text-ink-faded italic mt-1">{nextBank.subtitle}</div>
          <div className="mt-8">
            <Link
              to={`/act/${nextNum}`}
              className="inline-block bg-oxblood text-vellum-light hover:bg-oxblood-deep px-8 py-4 font-mono uppercase tracking-widest text-xs border border-gold/60"
            >
              Enter Act {toRoman(nextNum)} →
            </Link>
          </div>
        </>
      ) : (
        <div className="mt-8">
          <div className="font-display italic text-2xl text-ink">
            All {TOTAL_ACTS} acts complete. The Cow portal stirs…
          </div>
          <Link
            to="/bonus"
            className="inline-block mt-4 bg-oxblood text-vellum-light hover:bg-oxblood-deep px-8 py-4 font-mono uppercase tracking-widest text-xs border border-gold/60"
          >
            Approach the Portal →
          </Link>
        </div>
      )}
    </div>
  );
}

function toRoman(n: number): string {
  return ["I", "II", "III", "IV", "V"][n - 1] ?? String(n);
}
