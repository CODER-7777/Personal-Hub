import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Trophy, Clock, Target, ExternalLink } from "lucide-react";

interface CFContest {
  id: number;
  name: string;
  type: string;
  phase: string;
  durationSeconds: number;
  startTimeSeconds: number;
}

export default function Contests() {
  const [contests, setContests] = useState<CFContest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContests() {
      try {
        //const res = await fetch("https://codeforces.com/api/contest.list");
        let res;
        try {
          res = await fetch("https://codeforces.com/api/contest.list");
          if (!res.ok) throw new Error("Primary API failed");
        } catch {
          console.log("CORS block or network error detected, using proxy fallback...");
          res = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent("https://codeforces.com/api/contest.list"));
          const proxyData = await res.json();
          // allorigins returns the actual response in a 'contents' field as a string
          return handleData(JSON.parse(proxyData.contents));
        }
        const data = await res.json();
        handleData(data);

        function handleData(data: any) {
          if (data.status === "OK") {
            const upcoming = data.result
              .filter((c: CFContest) => c.phase === "BEFORE")
              .sort((a: CFContest, b: CFContest) => a.startTimeSeconds - b.startTimeSeconds);
            setContests(upcoming.slice(0, 10));
          }
        }
      } catch (err) {
        console.error("Failed to fetch contests", err);
      } finally {
        setLoading(false);
      }
    }
    fetchContests();
  }, []);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const getRelativeTime = (startSec: number) => {
    const diff = startSec - Math.floor(Date.now() / 1000);
    const d = Math.floor(diff / 86400);
    if (d > 0) return `In ${d} day${d > 1 ? 's' : ''}`;
    const h = Math.floor(diff / 3600);
    if (h > 0) return `In ${h} hour${h > 1 ? 's' : ''}`;
    return "Very soon!";
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-4 md:space-y-8">
      <div className="mb-4 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tighter text-ink flex items-center gap-2 md:gap-3">
          <Trophy className="w-8 h-8 md:w-10 md:h-10 text-ink flex-shrink-0" /> CODEFORCES CONTESTS
        </h1>
        <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub mt-1 md:mt-2">Track upcoming contests right from your hub.</p>
      </div>

      <div className="bg-bg border-2 border-ink rounded-2xl md:rounded-3xl overflow-hidden shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)]">
        {loading ? (
          <div className="p-8 md:p-12 text-center text-ink flex flex-col items-center">
            <div className="w-6 h-6 md:w-8 md:h-8 border-4 border-sub border-t-ink rounded-full animate-spin mb-3 md:mb-4" />
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Loading upcoming contests...</span>
          </div>
        ) : contests.length > 0 ? (
          <div className="divide-y-2 divide-ink">
            {contests.map((c, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.05 }}
                key={c.id} 
                className="p-4 md:p-6 hover:bg-highlight transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 group bg-bg"
              >
                <div className="space-y-2 w-full md:w-auto">
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-ink text-bg rounded-lg whitespace-nowrap">
                      CF {c.id}
                    </span>
                    <h3 className="font-bold text-ink text-sm md:text-lg tracking-tight leading-none line-clamp-1">{c.name}</h3>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sub group-hover:text-ink">
                    <span className="flex items-center gap-1.5 whitespace-nowrap"><Clock className="w-3 h-3" /> {new Date(c.startTimeSeconds * 1000).toLocaleString()}</span>
                    <span className="flex items-center gap-1.5 whitespace-nowrap"><Target className="w-3 h-3" /> {formatDuration(c.durationSeconds)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 mt-1 md:mt-0 md:flex-col items-center w-full md:w-auto">
                  <span className="text-[9px] md:text-[11px] font-bold uppercase tracking-widest border-2 border-ink rounded-lg px-2 md:px-3 py-1 bg-bg shrink-0 group-hover:bg-line group-hover:text-ink">
                    {getRelativeTime(c.startTimeSeconds)}
                  </span>
                  <a 
                    href={`https://codeforces.com/contest/${c.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-[9px] md:text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 bg-ink text-bg rounded-lg px-3 py-1.5 md:py-1 shrink-0 hover:bg-sub"
                  >
                    Register <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-[11px] font-bold uppercase tracking-widest text-sub">
            No upcoming contests found.
          </div>
        )}
      </div>
    </div>
  );
}
