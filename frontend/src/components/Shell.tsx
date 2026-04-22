import { Link, useLocation } from "react-router-dom";
import { HoradricBackdrop } from "./HoradricBackdrop";
import { useUser } from "../engine/store";

export function Shell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const username = useUser((s) => s.username);
  return (
    <div className="relative min-h-screen text-vellum">
      <HoradricBackdrop />
      <header className="relative z-10 border-b border-gold/20 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
          <Link to="/" className="font-display text-xl md:text-2xl text-vellum-light tracking-wide shrink-0">
            <span className="italic text-gold-bright">Quiz</span>
            <span className="text-vellum/50 mx-2 hidden sm:inline">·</span>
            <span className="hidden sm:inline text-sm font-mono uppercase tracking-[0.3em] text-vellum/70">Sanctuary</span>
          </Link>
          <nav className="flex items-center gap-3 md:gap-6 text-xs md:text-sm font-mono uppercase tracking-widest">
            <Link
              to="/"
              className={`hover:text-gold-bright transition-colors ${loc.pathname === "/" ? "text-gold-bright" : "text-vellum/70"}`}
            >
              Tome
            </Link>
            <Link
              to="/leaderboard"
              className={`hover:text-gold-bright transition-colors ${loc.pathname.startsWith("/leaderboard") ? "text-gold-bright" : "text-vellum/70"}`}
            >
              Ledger
            </Link>
            {username && (
              <span className="hidden md:inline text-gold/70 text-xs">
                bearer: <span className="text-vellum">{username}</span>
              </span>
            )}
          </nav>
        </div>
      </header>
      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">{children}</main>
      <footer className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-6 text-center text-[10px] md:text-xs font-mono uppercase tracking-widest text-vellum/30">
        <div className="rule-gold mb-4 opacity-30" />
        scribed at diablo.slvsansend.com
      </footer>
    </div>
  );
}
