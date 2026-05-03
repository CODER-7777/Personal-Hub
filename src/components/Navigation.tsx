import { NavLink } from "react-router-dom";
import { LayoutDashboard, Calendar, FileText, PieChart, Code, Sun, Moon } from "lucide-react";
import { cn } from "../lib/utils";
import { useAppStore } from "../store";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Calendar, label: "Schedule", path: "/schedule" },
  { icon: FileText, label: "Resources", path: "/resources" },
  { icon: PieChart, label: "Finances", path: "/finances" },
  { icon: Code, label: "Contests", path: "/contests" },
];

export function Sidebar() {
  const { theme, toggleTheme } = useAppStore();
  
  return (
    <div className="w-64 flex-shrink-0 bg-bg h-screen flex flex-col hidden md:flex sticky top-0 print:hidden transition-colors">
      <div className="px-8 py-10 border-b-2 border-ink">
        <h1 className="text-4xl font-extrabold uppercase tracking-tighter leading-none">
          Personal<br />Hub
        </h1>
      </div>
      <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-4 px-5 py-3.5 font-bold uppercase tracking-widest text-[11px] transition-all border-2 rounded-xl",
                isActive
                  ? "bg-ink text-bg border-ink shadow-[4px_4px_0px_var(--theme-ink)]"
                  : "text-sub border-transparent hover:border-ink hover:text-ink hover:bg-line/50"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-6 border-t-2 border-ink flex justify-between items-center">
        <div className="text-[11px] font-bold uppercase tracking-widest text-sub">
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
  );
}

export function MobileHeader() {
  const { theme, toggleTheme } = useAppStore();
  
  return (
    <div className="md:hidden flex items-center justify-between p-4 border-b-2 border-ink bg-bg sticky top-0 z-40 print:hidden transition-colors">
      <h1 className="text-2xl font-extrabold uppercase tracking-tighter leading-none">
        Personal Hub
      </h1>
      <button 
        onClick={toggleTheme} 
        className="p-2 border-2 border-transparent rounded-lg hover:border-ink hover:bg-highlight transition-colors text-ink bg-bg"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </div>
  );
}

export function MobileNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-bg border-t-2 border-ink flex justify-around p-2 pb-safe z-50 print:hidden transition-colors">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center p-2 min-w-[56px] sm:min-w-[72px] border-2 rounded-xl transition-all",
              isActive ? "bg-ink border-ink text-bg shadow-[2px_2px_0px_var(--theme-ink)]" : "text-sub border-transparent hover:text-ink hover:border-ink"
            )
          }
        >
          <item.icon className="w-5 h-5 sm:w-6 sm:h-6 mb-1 block" />
          <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-center truncate w-full">{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}

