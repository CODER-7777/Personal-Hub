import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Trophy, Clock, Target, ExternalLink, Activity, Flame, CheckCircle, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface CFContest {
  id: number;
  name: string;
  type: string;
  phase: string;
  durationSeconds: number;
  startTimeSeconds: number;
}

interface CFUser {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
}

// Simple in-memory tracker for this session
let globalApiUsage = 0;

export default function Contests() {
  const [contests, setContests] = useState<CFContest[]>([]);
  const [loadingContests, setLoadingContests] = useState(true);
  
  const [userStats, setUserStats] = useState<CFUser | null>(null);
  const [problemsSolved, setProblemsSolved] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [ratingHistory, setRatingHistory] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  
  const [apiUsage, setApiUsage] = useState(globalApiUsage);
  const handle = "MadCoder_777_18"; // Hardcoded handle from user

  const trackApiCall = () => {
    globalApiUsage += 1;
    setApiUsage(globalApiUsage);
  };

  useEffect(() => {
    async function fetchContests() {
      try {
        trackApiCall();
        let res;
        try {
          res = await fetch("https://codeforces.com/api/contest.list");
          if (!res.ok) throw new Error("Primary API failed");
        } catch {
          console.log("CORS block or network error detected, using proxy fallback...");
          res = await fetch("https://api.allorigins.win/get?url=" + encodeURIComponent("https://codeforces.com/api/contest.list"));
          const proxyData = await res.json();
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
        setLoadingContests(false);
      }
    }
    fetchContests();
  }, []);

  useEffect(() => {
    async function fetchUserStats() {
      try {
        setLoadingStats(true);
        
        // 1. Fetch User Info
        trackApiCall();
        const infoRes = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
        const infoData = await infoRes.json();
        if (infoData.status === "OK") {
          setUserStats(infoData.result[0]);
        }

        // 2. Fetch User Status (Submissions)
        trackApiCall();
        const statusRes = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
        const statusData = await statusRes.json();
        
        if (statusData.status === "OK") {
          const subs = statusData.result;
          
          // Calculate Unique Problems Solved
          const solvedSet = new Set<string>();
          const okDays = new Set<number>();
          
          subs.forEach((s: any) => {
            if (s.verdict === "OK") {
              solvedSet.add(`${s.problem.contestId}-${s.problem.index}`);
              // Calculate day index (UTC)
              const dayIndex = Math.floor(s.creationTimeSeconds / 86400);
              okDays.add(dayIndex);
            }
          });
          
          setProblemsSolved(solvedSet.size);

          // Calculate Streak
          const todayIndex = Math.floor(Date.now() / 1000 / 86400);
          let currentStreak = 0;
          let checkDay = todayIndex;
          
          // If they haven't solved today, check if the streak was alive yesterday
          if (!okDays.has(checkDay)) {
            checkDay -= 1;
          }
          
          while (okDays.has(checkDay)) {
            currentStreak++;
            checkDay--;
          }
          setStreak(currentStreak);
        }

        // 3. Fetch Rating History
        trackApiCall();
        const ratingRes = await fetch(`https://codeforces.com/api/user.rating?handle=${handle}`);
        const ratingData = await ratingRes.json();
        if (ratingData.status === "OK") {
          const formattedHistory = ratingData.result.map((r: any) => ({
            name: new Date(r.ratingUpdateTimeSeconds * 1000).toLocaleDateString(),
            rating: r.newRating,
            oldRating: r.oldRating
          }));
          setRatingHistory(formattedHistory.slice(-20)); // Last 20 contests
        }

      } catch (err) {
        console.error("Failed to fetch user stats", err);
      } finally {
        setLoadingStats(false);
      }
    }
    
    if (handle) {
      fetchUserStats();
    }
  }, [handle]);

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
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tighter text-ink flex items-center gap-2 md:gap-3 mb-1">
            <Trophy className="w-8 h-8 md:w-10 md:h-10 text-ink flex-shrink-0" /> CONTESTS
          </h1>
          <p className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-sub">Your competitive programming hub.</p>
        </div>
        
        {/* API Usage Tracker */}
        <div className="bg-bg border-2 border-ink px-4 py-2 rounded-xl flex items-center gap-2 shadow-[2px_2px_0px_var(--theme-ink)]">
          <Activity className="w-4 h-4 text-ink" />
          <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">
            API Usage: {apiUsage} calls
          </span>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Profile Card */}
        <div className="bg-bg border-2 border-ink rounded-3xl p-6 shadow-[4px_4px_0px_var(--theme-ink)] md:col-span-1 flex flex-col justify-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-sub mb-4 border-b-2 border-line pb-2 flex justify-between items-center">
            User Profile
            {loadingStats && <div className="w-3 h-3 border-2 border-sub border-t-ink rounded-full animate-spin" />}
          </h2>
          
          {userStats ? (
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-sub">Handle</div>
                <div className="text-xl font-extrabold text-ink">{userStats.handle}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-sub">Rating</div>
                  <div className="text-2xl font-extrabold text-ink">{userStats.rating || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-sub">Max</div>
                  <div className="text-2xl font-extrabold text-ink">{userStats.maxRating || 'N/A'}</div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-sub">Rank</div>
                <div className="text-sm font-bold capitalize bg-line inline-block px-2 py-1 rounded-md border-2 border-ink mt-1">{userStats.rank || 'Unrated'}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm font-bold text-sub">Loading stats...</div>
          )}
        </div>

        {/* Activity & Streak */}
        <div className="bg-bg border-2 border-ink rounded-3xl p-6 shadow-[4px_4px_0px_var(--theme-ink)] md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-highlight rounded-2xl p-6 border-2 border-ink flex flex-col justify-center items-center text-center">
            <CheckCircle className="w-8 h-8 text-ink mb-3" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-sub mb-1">Problems Solved</div>
            <div className="text-4xl font-extrabold text-ink">{loadingStats ? '-' : problemsSolved}</div>
          </div>
          
          <div className="bg-highlight rounded-2xl p-6 border-2 border-ink flex flex-col justify-center items-center text-center">
            <Flame className="w-8 h-8 text-orange-500 mb-3" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-sub mb-1">Current Streak</div>
            <div className="text-4xl font-extrabold text-ink">{loadingStats ? '-' : `${streak} Days`}</div>
          </div>
        </div>
      </div>

      {/* Rating Chart */}
      {!loadingStats && ratingHistory.length > 0 && (
        <div className="bg-bg border-2 border-ink rounded-3xl p-6 shadow-[4px_4px_0px_var(--theme-ink)]">
          <h2 className="text-sm font-bold uppercase tracking-widest text-ink mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> Recent Rating History
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ratingHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="rating" stroke="var(--theme-ink)" strokeWidth={3} dot={{ stroke: 'var(--theme-ink)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                <XAxis dataKey="name" stroke="var(--theme-sub)" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <YAxis stroke="var(--theme-sub)" tick={{ fontSize: 10, fontWeight: 'bold' }} domain={['dataMin - 100', 'dataMax + 100']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--theme-bg)', border: '2px solid var(--theme-ink)', borderRadius: '12px', fontWeight: 'bold' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Upcoming Contests */}
      <div className="bg-bg border-2 border-ink rounded-2xl md:rounded-3xl overflow-hidden shadow-[4px_4px_0px_var(--theme-ink)]">
        <h2 className="text-sm font-bold uppercase tracking-widest text-bg bg-ink p-4 border-b-2 border-ink">Upcoming Contests</h2>
        {loadingContests ? (
          <div className="p-8 md:p-12 text-center text-ink flex flex-col items-center">
            <div className="w-6 h-6 md:w-8 md:h-8 border-4 border-sub border-t-ink rounded-full animate-spin mb-3 md:mb-4" />
            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Loading contests...</span>
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
