import { NavLink } from "react-router-dom";
import { LayoutDashboard, Calendar, FileText, PieChart, Code, Sun, Moon, Brain, Target, StickyNote, Wifi, WifiOff, RefreshCw, Settings, Flame } from "lucide-react";
import { cn } from "../lib/utils";
import { useAppStore } from "../store";
import { motion } from "motion/react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Calendar, label: "Schedule", path: "/schedule" },
  { icon: StickyNote, label: "Notes", path: "/notes" },
  { icon: FileText, label: "Resources", path: "/resources" },
  { icon: PieChart, label: "Finances", path: "/finances" },
  { icon: Code, label: "Contests", path: "/contests" },
  { icon: Flame, label: "Habits", path: "/habits" },
  { icon: Target, label: "Goals", path: "/goals" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

function SyncIndicator({ compact = false }: { compact?: boolean }) {
  const { syncStatus, lastSyncTime, forceSync } = useAppStore();

  const statusConfig = {
    connected: { icon: Wifi, label: "Synced", color: "text-[var(--color-safe-green)]", bg: "bg-[var(--color-safe-green-bg)]", border: "border-[var(--color-safe-green)]" },
    disconnected: { icon: WifiOff, label: "Offline", color: "text-[var(--color-safe-red)]", bg: "bg-[var(--color-safe-red-bg)]", border: "border-[var(--color-safe-red)]" },
    syncing: { icon: RefreshCw, label: "Syncing...", color: "text-ink", bg: "bg-line", border: "border-ink" },
  };

  const config = statusConfig[syncStatus];
  const Icon = config.icon;

  return (
    <button
      onClick={forceSync}
      className={cn(
        "flex items-center gap-2 transition-all rounded-lg border-2",
        config.border, config.bg,
        compact ? "p-1.5" : "px-3 py-1.5",
        "hover:opacity-80"
      )}
      title={`Status: ${config.label}${lastSyncTime ? ` • Last sync: ${new Date(lastSyncTime).toLocaleTimeString()}` : ''}\nClick to force sync`}
    >
      <Icon className={cn("w-3.5 h-3.5", config.color, syncStatus === 'syncing' && 'animate-spin')} />
      {!compact && (
        <span className={cn("text-[8px] font-bold uppercase tracking-widest", config.color)}>
          {config.label}
        </span>
      )}
    </button>
  );
}

export function Sidebar() {
  const { theme, toggleTheme } = useAppStore();
  
  return (
    <div className="w-64 flex-shrink-0 bg-bg h-screen flex flex-col hidden md:flex sticky top-0 print:hidden transition-colors">
      <div className="px-8 py-10 border-b-2 border-ink">
        <h1 className="text-3xl font-extrabold uppercase tracking-tighter leading-none">
          Personal<br />Hub
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-2.5 font-bold uppercase tracking-widest text-[10px] transition-all border-2 rounded-xl",
                isActive
                  ? "bg-ink text-bg border-ink shadow-[3px_3px_0px_var(--theme-ink)]"
                  : "text-sub border-transparent hover:border-ink hover:text-ink hover:bg-line/50"
              )
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t-2 border-ink space-y-3">
        <SyncIndicator />
        <div className="flex justify-between items-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-sub">
            Make it a great day.
          </div>
          <button 
            onClick={toggleTheme} 
            className="p-2 border-2 border-transparent rounded-xl hover:border-ink hover:bg-highlight transition-colors text-ink bg-bg"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MobileHeader() {
  const { theme, toggleTheme } = useAppStore();
  
  return (
    <div className="md:hidden flex items-center justify-between p-4 border-b-2 border-ink bg-bg sticky top-0 z-40 print:hidden transition-colors">
      <h1 className="text-2xl font-extrabold uppercase tracking-tighter leading-none">
        Personal Hub
      </h1>
      <div className="flex items-center gap-2">
        <SyncIndicator compact />
        <button 
          onClick={toggleTheme} 
          className="p-2 border-2 border-transparent rounded-lg hover:border-ink hover:bg-highlight transition-colors text-ink bg-bg"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}

export function MobileNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-bg border-t-2 border-ink flex justify-around p-1.5 pb-safe z-50 print:hidden transition-colors overflow-x-auto">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center p-1.5 min-w-[48px] border-2 rounded-lg transition-all",
              isActive ? "bg-ink border-ink text-bg shadow-[2px_2px_0px_var(--theme-ink)]" : "text-sub border-transparent hover:text-ink hover:border-ink"
            )
          }
        >
          <item.icon className="w-4 h-4 sm:w-5 sm:h-5 mb-0.5 block" />
          <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider text-center truncate w-full">{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
