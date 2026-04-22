import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchLeaderboard } from "../engine/api";
import type { ScoreEntry } from "../engine/types";
import { useUser } from "../engine/store";
import { useRun } from "../engine/run";
import { DecorativeDivider } from "../components/Ornaments";

export function Leaderboard() {
  const dateKey = useRun((s) => s.dateKey);
  const [entries, setEntries] = useState<ScoreEntry[] | null>(null);
  const username = useUser((s) => s.username);
  const quizId = `diablo2-${dateKey}`;

  useEffect(() => {
    fetchLeaderboard(quizId).then(setEntries);
  }, [quizId]);

  return (
    <div className="relative paper-grain bg-vellum text-ink rounded-sm p-10 border border-gold/40 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
      <div className="text-center">
        <div className="font-mono uppercase tracking-[0.4em] text-oxblood/70 text-xs">
          Ledger of Bearers
        </div>
        <h2 className="font-display italic text-5xl text-ink mt-1">
          {dateKey}
        </h2>
        <div className="font-body italic text-ink-faded mt-1">
          the Grand Tour of Sanctuary
        </div>
        <DecorativeDivider />
      </div>

      {!entries ? (
        <div className="text-center font-display italic text-ink-faded">Opening the ledger...</div>
      ) : entries.length === 0 ? (
        <div className="text-center font-display italic text-ink-faded py-8">
          No names yet inscribed today. Be the first.
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-[40px_1fr_80px_100px] gap-4 font-mono uppercase tracking-widest text-[10px] text-ink/50 pb-2 border-b border-ink/20">
            <div>#</div>
            <div>bearer</div>
            <div className="text-right">score</div>
            <div className="text-right">time</div>
          </div>
          {entries.map((e, i) => {
            const mine = e.username === username;
            return (
              <div
                key={`${e.username}-${e.timestamp}`}
                className={`grid grid-cols-[40px_1fr_80px_100px] gap-4 py-3 border-b border-ink/10 items-baseline ${mine ? "bg-gold/10" : ""}`}
              >
                <div className="font-display italic text-2xl text-oxblood">
                  {i + 1}
                </div>
                <div className="font-display text-xl text-ink">
                  {e.username}
                  {mine && (
                    <span className="ml-2 font-mono text-[9px] uppercase tracking-widest text-oxblood">
                      thee
                    </span>
                  )}
                </div>
                <div className="text-right font-mono text-lg text-ink">
                  {e.score}
                </div>
                <div className="text-right font-mono text-sm text-ink/60">
                  {Math.round(e.durationMs / 1000)}s
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center mt-10">
        <Link
          to="/"
          className="inline-block border border-ink/40 text-ink hover:bg-ink/5 px-6 py-3 font-mono uppercase tracking-widest text-xs"
        >
          ← Return to the Tome
        </Link>
      </div>
    </div>
  );
}
