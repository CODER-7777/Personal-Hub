import { useState, useEffect, useRef, useCallback } from "react";
import { useAppStore, PomodoroSession } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, RotateCcw, Coffee, Brain, Flame, Timer, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const PRESETS = {
  focus: { label: "FOCUS", duration: 25, icon: Brain },
  shortBreak: { label: "SHORT BREAK", duration: 5, icon: Coffee },
  longBreak: { label: "LONG BREAK", duration: 15, icon: Coffee },
};

export default function Focus() {
  const { pomodoroSessions, addPomodoroSession } = useAppStore();
  
  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [customMinutes, setCustomMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0); // total seconds elapsed in this session
  const startTimeRef = useRef<number>(0);
  const audioRef = useRef<AudioContext | null>(null);

  const totalSeconds = customMinutes * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  
  // Beep sound using Web Audio API
  const playBeep = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
      
      // Second beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1100;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 1);
      }, 300);
    } catch {}
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            // Session complete!
            const session: PomodoroSession = {
              id: crypto.randomUUID(),
              date: new Date().toISOString().split('T')[0],
              duration: customMinutes,
              type: mode === 'focus' ? 'focus' : 'break',
              completedAt: new Date().toISOString(),
            };
            addPomodoroSession(session);
            playBeep();
            toast.success(
              mode === 'focus' 
                ? `🎯 ${customMinutes}min focus session complete!` 
                : `☕ Break's over! Time to focus!`,
              { duration: 8000 }
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, customMinutes, addPomodoroSession, playBeep]);

  const handleModeChange = (newMode: 'focus' | 'shortBreak' | 'longBreak') => {
    setMode(newMode);
    const duration = PRESETS[newMode].duration;
    setCustomMinutes(duration);
    setTimeLeft(duration * 60);
    setIsRunning(false);
  };

  const handleReset = () => {
    setTimeLeft(customMinutes * 60);
    setIsRunning(false);
  };

  const handleCustomDurationChange = (mins: number) => {
    setCustomMinutes(mins);
    setTimeLeft(mins * 60);
    setIsRunning(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Stats
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = pomodoroSessions.filter(s => s.date === today && s.type === 'focus');
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const totalFocusSessions = pomodoroSessions.filter(s => s.type === 'focus');
  const totalFocusMinutes = totalFocusSessions.reduce((sum, s) => sum + s.duration, 0);
  
  // Current streak (consecutive days with at least one focus session)
  const getStreak = () => {
    const uniqueDays = [...new Set(totalFocusSessions.map(s => s.date))].sort().reverse();
    let streak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (uniqueDays.includes(dateStr)) {
        streak++;
      } else if (i > 0) { // allow today to not have a session yet
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  };
  const streak = getStreak();

  // SVG circle
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6 md:space-y-8">
      <div className="mb-4 md:mb-6">
        <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tighter text-ink flex items-center gap-2 md:gap-3">
          <Brain className="w-8 h-8 md:w-10 md:h-10 text-ink flex-shrink-0" /> FOCUS TIMER
        </h1>
        <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub mt-1 md:mt-2">Pomodoro-style deep work sessions. Stay locked in.</p>
      </div>

      {/* Mode Selector */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((key) => {
          const preset = PRESETS[key];
          const Icon = preset.icon;
          return (
            <button
              key={key}
              onClick={() => handleModeChange(key)}
              className={`flex items-center gap-2 px-4 md:px-5 py-3 font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-all border-2 rounded-xl flex-1 md:flex-none justify-center ${
                mode === key
                  ? 'border-ink text-ink bg-highlight shadow-[2px_2px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)]'
                  : 'border-transparent text-sub hover:text-ink hover:border-ink hover:bg-line/50'
              }`}
            >
              <Icon className="w-3 h-3 md:w-4 md:h-4" /> {preset.label} ({preset.duration}m)
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Display */}
        <div className="lg:col-span-2 bg-bg border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)] p-6 md:p-10 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Pulsing background when running */}
          {isRunning && (
            <motion.div
              className="absolute inset-0 bg-highlight/20 rounded-3xl"
              animate={{ opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* Custom Duration Adjuster */}
          <div className="flex items-center gap-3 mb-6 md:mb-8 relative z-10">
            <button 
              onClick={() => handleCustomDurationChange(Math.max(1, customMinutes - 5))}
              disabled={isRunning}
              className="w-10 h-10 flex items-center justify-center border-2 border-ink rounded-xl font-bold text-ink hover:bg-highlight disabled:opacity-30 transition-all"
            >-5</button>
            <div className="text-[10px] font-bold uppercase tracking-widest text-sub px-3 py-1 bg-line border-2 border-ink rounded-lg">
              {customMinutes} min session
            </div>
            <button 
              onClick={() => handleCustomDurationChange(Math.min(120, customMinutes + 5))}
              disabled={isRunning}
              className="w-10 h-10 flex items-center justify-center border-2 border-ink rounded-xl font-bold text-ink hover:bg-highlight disabled:opacity-30 transition-all"
            >+5</button>
          </div>

          {/* Circular Timer */}
          <div className="relative w-64 h-64 md:w-72 md:h-72 mb-8 z-10">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
              {/* Background Circle */}
              <circle
                cx="140" cy="140" r={radius}
                fill="none"
                stroke="var(--theme-line)"
                strokeWidth="8"
              />
              {/* Progress Circle */}
              <motion.circle
                cx="140" cy="140" r={radius}
                fill="none"
                stroke={mode === 'focus' ? "var(--theme-ink)" : "var(--color-safe-green)"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                initial={false}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div 
                className="text-6xl md:text-7xl font-extrabold tracking-tighter text-ink tabular-nums"
                key={timeLeft}
                initial={{ scale: 1.02 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </motion.div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-sub mt-2">
                {isRunning ? (mode === 'focus' ? 'DEEP WORK' : 'RESTING') : timeLeft === 0 ? 'COMPLETE!' : 'PAUSED'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 z-10">
            <button
              onClick={handleReset}
              className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center border-2 border-ink rounded-xl text-ink hover:bg-highlight transition-all hover:shadow-[3px_3px_0px_var(--theme-ink)]"
            >
              <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center border-2 border-ink rounded-2xl transition-all hover:shadow-[4px_4px_0px_var(--theme-ink)] hover:-translate-y-1 ${
                isRunning 
                  ? 'bg-highlight text-ink' 
                  : 'bg-ink text-bg'
              }`}
            >
              {isRunning 
                ? <Pause className="w-7 h-7 md:w-8 md:h-8" /> 
                : <Play className="w-7 h-7 md:w-8 md:h-8 ml-1" />
              }
            </button>
            <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center border-2 border-ink rounded-xl text-ink">
              <div className="text-center">
                <div className="text-lg font-extrabold tracking-tighter leading-none">{todaySessions.length}</div>
                <div className="text-[7px] font-bold uppercase tracking-widest text-sub">today</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="space-y-4">
          {[
            { label: "Today's Focus", value: `${todayMinutes}m`, sub: `${todaySessions.length} sessions`, icon: Timer, color: "" },
            { label: "Current Streak", value: `${streak}d`, sub: streak > 0 ? "Keep going!" : "Start today!", icon: Flame, color: streak > 0 ? "text-orange-500" : "" },
            { label: "All-Time Focus", value: `${Math.floor(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`, sub: `${totalFocusSessions.length} sessions total`, icon: TrendingUp, color: "" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-bg p-5 md:p-6 flex items-start gap-4 border-2 border-ink rounded-2xl md:rounded-3xl shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)] hover:bg-highlight hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_var(--theme-ink)] transition-all group"
            >
              <div className={`p-2 md:p-3 border-2 border-ink rounded-lg md:rounded-xl bg-bg ${stat.color}`}>
                <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sub group-hover:text-ink">{stat.label}</p>
                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tighter mt-1 text-ink">{stat.value}</h3>
                <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-sub mt-1">{stat.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      {pomodoroSessions.length > 0 && (
        <div className="bg-bg border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)] overflow-hidden">
          <div className="p-5 md:p-6 border-b-2 border-ink bg-line">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-ink">RECENT SESSIONS</h2>
          </div>
          <div className="divide-y-2 divide-ink max-h-64 overflow-y-auto">
            {[...pomodoroSessions].reverse().slice(0, 10).map((s) => (
              <div key={s.id} className="p-4 md:p-5 flex items-center justify-between hover:bg-highlight transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center border-2 border-ink rounded-lg ${s.type === 'focus' ? 'bg-ink text-bg' : 'bg-bg text-ink'}`}>
                    {s.type === 'focus' ? <Brain className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">{s.type === 'focus' ? 'Focus Session' : 'Break'}</h4>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-sub">{s.duration}min • {new Date(s.completedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
