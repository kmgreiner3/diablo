import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAllLedgers } from "../engine/api";
import type { AggregatedLedgers, DayLedger } from "../engine/api";
import type { ScoreEntry } from "../engine/types";
import { useUser } from "../engine/store";
import { useRun } from "../engine/run";

export function Leaderboard() {
  const dateKey = useRun((s) => s.dateKey);
  const [data, setData] = useState<AggregatedLedgers | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const username = useUser((s) => s.username);

  useEffect(() => {
    fetchAllLedgers()
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : "unknown"));
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="font-mono uppercase tracking-[0.4em] text-oxblood/70 text-xs">
          Ledger of Bearers
        </div>
        <h1 className="font-display italic text-4xl md:text-5xl text-vellum-light mt-1">
          The Grand Tour of Sanctuary
        </h1>
        <div className="rule-gold mt-4 opacity-40" />
      </div>

      {err && (
        <div className="text-center font-display italic text-oxblood">
          Could not open the ledger. {err}
        </div>
      )}

      {!data && !err && (
        <div className="text-center font-display italic text-vellum/60">
          Opening the ledger...
        </div>
      )}

      {data && (
        <>
          <OverallCard entries={data.overall} username={username} />

          {data.days.length === 0 ? (
            <div className="text-center font-display italic text-vellum/60 py-8">
              No days yet inscribed. Be the first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.days.map((d) => (
                <DayCard
                  key={d.date}
                  day={d}
                  username={username}
                  isToday={d.date === dateKey}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="text-center pt-4">
        <Link
          to="/"
          className="inline-block border border-vellum/40 text-vellum hover:bg-vellum/10 px-6 py-3 font-mono uppercase tracking-widest text-xs"
        >
          ← Return to the Tome
        </Link>
      </div>
    </div>
  );
}

function OverallCard({
  entries,
  username,
}: {
  entries: ScoreEntry[];
  username: string;
}) {
  if (entries.length === 0) return null;
  return (
    <div className="relative paper-grain bg-vellum text-ink rounded-sm p-6 md:p-8 border-2 border-gold shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
      <div className="flex items-baseline justify-between mb-1">
        <div className="font-mono uppercase tracking-[0.4em] text-gold text-[10px]">
          Overall · Best Runs
        </div>
        <div className="font-mono text-[10px] text-ink/50">
          top {entries.length} · best single run per bearer
        </div>
      </div>
      <div className="rule-gold opacity-40 mb-4" />
      <LedgerTable entries={entries} username={username} showDate />
    </div>
  );
}

function DayCard({
  day,
  username,
  isToday,
}: {
  day: DayLedger;
  username: string;
  isToday: boolean;
}) {
  return (
    <div
      className={[
        "relative paper-grain bg-vellum text-ink rounded-sm p-6 border shadow-[0_20px_40px_-20px_rgba(0,0,0,0.7)]",
        isToday ? "border-oxblood ring-1 ring-oxblood/60" : "border-gold/40",
      ].join(" ")}
    >
      <div className="flex items-baseline justify-between mb-1">
        <div className="font-mono uppercase tracking-[0.3em] text-[10px] text-oxblood/80">
          {isToday ? "Today" : "Past Day"}
        </div>
        <div className="font-display italic text-xl text-ink">{day.date}</div>
      </div>
      <div className="rule-gold opacity-40 mb-3" />
      <LedgerTable entries={day.entries} username={username} compact />
    </div>
  );
}

function LedgerTable({
  entries,
  username,
  showDate = false,
  compact = false,
}: {
  entries: ScoreEntry[];
  username: string;
  showDate?: boolean;
  compact?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <div className="text-center font-display italic text-ink-faded py-4">
        No entries yet.
      </div>
    );
  }

  const cols = showDate
    ? "grid-cols-[28px_1fr_60px_56px_72px] md:grid-cols-[40px_1fr_80px_60px_92px]"
    : "grid-cols-[28px_1fr_60px_60px] md:grid-cols-[40px_1fr_80px_80px]";

  return (
    <div>
      <div
        className={`grid ${cols} gap-2 md:gap-4 font-mono uppercase tracking-widest text-[9px] md:text-[10px] text-ink/50 pb-2 border-b border-ink/20`}
      >
        <div>#</div>
        <div>bearer</div>
        <div className="text-right">score</div>
        <div className="text-right">{compact ? "time" : "time"}</div>
        {showDate && <div className="text-right">day</div>}
      </div>
      {entries.map((e, i) => {
        const mine = e.username === username;
        return (
          <div
            key={`${e.username}-${e.timestamp}`}
            className={`grid ${cols} gap-2 md:gap-4 py-2 border-b border-ink/10 items-baseline ${mine ? "bg-gold/10" : ""}`}
          >
            <div className="font-display italic text-lg md:text-2xl text-oxblood">{i + 1}</div>
            <div className="font-display text-base md:text-xl text-ink truncate">
              {e.username}
              {mine && (
                <span className="ml-2 font-mono text-[9px] uppercase tracking-widest text-oxblood">
                  thee
                </span>
              )}
            </div>
            <div className="text-right font-mono text-base md:text-lg text-ink">{e.score}</div>
            <div className="text-right font-mono text-xs md:text-sm text-ink/60">
              {Math.round(e.durationMs / 1000)}s
            </div>
            {showDate && (
              <div className="text-right font-mono text-[10px] md:text-xs text-ink/50">
                {e.quizId.replace(/^diablo2-/, "").slice(5) /* MM-DD */}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
