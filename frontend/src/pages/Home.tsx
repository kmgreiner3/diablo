import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../engine/store";
import { actBanks } from "../content/diablo2";
import { useRun, TOTAL_ACTS, QUESTIONS_PER_ACT, allActsComplete, baseScore, totalScore } from "../engine/run";
import { CornerFlourish, DecorativeDivider } from "../components/Ornaments";

export function Home() {
  const { username, setUsername } = useUser();
  const [draft, setDraft] = useState(username);
  const nav = useNavigate();
  const { actProgress, bonus, dateKey, submitted } = useRun();

  const allDone = allActsComplete(actProgress);
  const nextActId = actProgress.find((a) => !a.completed)?.actId ?? null;

  function start(actId: number) {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setUsername(trimmed);
    nav(`/act/${actId}`);
  }

  function resume() {
    if (!username) return;
    if (allDone && !bonus?.taken) nav("/bonus");
    else if (allDone) nav("/summary");
    else if (nextActId) nav(`/act/${nextActId}`);
  }

  return (
    <div className="space-y-10">
      <section className="relative paper-grain bg-vellum text-ink rounded-sm px-10 py-10 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] border border-gold/40">
        <CornerFlourish className="absolute top-3 left-3 w-10 h-10 text-oxblood" />
        <CornerFlourish className="absolute top-3 right-3 w-10 h-10 text-oxblood scale-x-[-1]" />
        <CornerFlourish className="absolute bottom-3 left-3 w-10 h-10 text-oxblood scale-y-[-1]" />
        <CornerFlourish className="absolute bottom-3 right-3 w-10 h-10 text-oxblood scale-x-[-1] scale-y-[-1]" />

        <div className="text-center">
          <div className="font-mono uppercase tracking-[0.4em] text-oxblood/70 text-xs mb-3">
            Codex Horadricus · {dateKey}
          </div>
          <h1 className="font-display italic text-5xl md:text-6xl text-ink leading-tight">
            Trials of the <span className="text-oxblood">Worldstone</span>
          </h1>
          <DecorativeDivider />
          <p className="font-body text-lg text-ink-faded max-w-2xl mx-auto">
            Five acts. Ten trials each. At the end, a red portal opens to the Cow King;
            answer his riddle swiftly and thy hoard is multiplied. The trials rotate at
            midnight; return each day for a fresh descent.
          </p>
        </div>

        <div className="mt-8 max-w-md mx-auto">
          <label className="block font-mono uppercase tracking-widest text-xs text-oxblood/80 mb-2">
            Bearer's Name
          </label>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g., Deckard"
            maxLength={20}
            className="w-full bg-transparent border-b-2 border-ink/40 focus:border-oxblood outline-none font-display text-2xl italic text-ink py-2 placeholder:text-ink/30"
            onKeyDown={(e) => e.key === "Enter" && !nextActId && start(1)}
          />
        </div>

        {(nextActId || allDone) && username && (
          <div className="mt-6 text-center">
            <button
              onClick={resume}
              className="bg-ink text-vellum-light hover:bg-oxblood-deep px-8 py-3 font-mono uppercase tracking-widest text-xs border border-gold/40"
            >
              {allDone && !bonus?.taken
                ? "Approach the Cow Portal →"
                : allDone
                  ? "View Today's Tally →"
                  : `Continue Act ${toRoman(nextActId!)} →`}
            </button>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-display italic text-3xl text-vellum-light">The Five Trials</h2>
          <div className="font-mono uppercase tracking-widest text-[10px] text-vellum/50">
            base {baseScore(actProgress)} · total {totalScore(actProgress, bonus)}
          </div>
        </div>
        <div className="rule-gold mb-6 opacity-40" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {actBanks.map((bank) => {
            const prog = actProgress.find((a) => a.actId === bank.actId)!;
            const locked =
              bank.actId > 1 &&
              !actProgress.find((a) => a.actId === bank.actId - 1)?.completed;
            const done = prog.completed;
            const current = !done && !locked;
            return (
              <button
                key={bank.actId}
                disabled={locked || done || !draft.trim()}
                onClick={() => start(bank.actId)}
                className={[
                  "relative text-left p-5 border transition-all aspect-[3/4] flex flex-col justify-between group",
                  locked
                    ? "border-vellum/20 bg-ink/30 text-vellum/30 cursor-not-allowed"
                    : done
                      ? "border-gold/50 bg-gold/5 text-vellum-light"
                      : "border-oxblood bg-oxblood/10 text-vellum-light hover:bg-oxblood/25 cursor-pointer",
                  current ? "ring-1 ring-gold/60" : "",
                ].join(" ")}
              >
                <div>
                  <div className="font-mono uppercase tracking-[0.3em] text-[10px] opacity-70">
                    Act {toRoman(bank.actId)}
                  </div>
                  <div className="font-display italic text-xl mt-1 leading-tight">
                    {bank.title}
                  </div>
                  <div className="font-body italic text-xs opacity-60 mt-1">
                    {bank.subtitle}
                  </div>
                </div>

                <div>
                  {done ? (
                    <div className="font-display italic text-3xl text-gold-bright">
                      {prog.correct}
                      <span className="opacity-50 text-xl">/{QUESTIONS_PER_ACT}</span>
                    </div>
                  ) : locked ? (
                    <div className="font-mono uppercase text-[10px] tracking-widest opacity-70">
                      ⚿ sealed
                    </div>
                  ) : (
                    <div className="font-mono uppercase text-[10px] tracking-widest text-gold-bright">
                      {current ? "begin →" : "unlocked"}
                    </div>
                  )}
                </div>

                {done && (
                  <div className="absolute top-3 right-3 font-display italic text-gold text-sm">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div
          className={[
            "mt-3 p-5 border text-center transition-all",
            allDone && bonus?.taken
              ? "border-gold/50 bg-gold/5 text-vellum-light"
              : allDone
                ? "border-oxblood bg-oxblood/10 text-vellum-light ring-1 ring-oxblood animate-pulse"
                : "border-vellum/20 bg-ink/30 text-vellum/40",
          ].join(" ")}
        >
          <div className="font-mono uppercase tracking-[0.3em] text-[10px] opacity-70">
            Bonus
          </div>
          <div className="font-display italic text-2xl mt-1">
            The Secret Cow Level
          </div>
          <div className="font-body italic text-sm opacity-70 mt-1">
            {allDone && !bonus?.taken
              ? "A red portal has opened. Moo."
              : allDone && bonus?.taken
                ? `Taken · ${bonus.correct ? `×${bonus.multiplier.toFixed(2)}` : "forfeit"}`
                : `Finish all ${TOTAL_ACTS} acts to open the portal`}
          </div>
        </div>
      </section>

      {submitted && (
        <div className="text-center text-xs font-mono uppercase tracking-widest text-gold-bright">
          ✓ Scored and sealed in today's ledger
        </div>
      )}
    </div>
  );
}

function toRoman(n: number): string {
  return ["I", "II", "III", "IV", "V"][n - 1] ?? String(n);
}
