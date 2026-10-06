import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, UserPlus, Key, Mail, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, update } from "firebase/database";

export default function Auth() {
  const [mode, setMode] = useState<"select" | "login" | "signup">("select");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    
    if (mode === "signup" && !name.trim()) {
      toast.error("Please enter a profile name.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast.success("Welcome back!");
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        try {
          await Promise.all([
            updateProfile(userCred.user, { displayName: name.trim() }),
            update(ref(db, `user_data/${userCred.user.uid}/profile`), { profileName: name.trim() }),
          ]);
          toast.success("Account created successfully!");
        } catch {
          toast.error("Account created, but your name could not be saved. Update it in Settings when online.");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-highlight rounded-full blur-[100px] opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sub rounded-full blur-[100px] opacity-20 pointer-events-none" />

      <AnimatePresence mode="wait">
        {mode === "select" ? (
          <motion.div 
            key="select"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
            className="w-full max-w-md bg-line border-2 border-ink rounded-3xl p-8 md:p-10 shadow-[8px_8px_0px_var(--theme-ink)] relative z-10 text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-bg rounded-2xl border-2 border-ink mb-6 rotate-3 shadow-[4px_4px_0px_var(--theme-sub)]">
              <Sparkles className="w-10 h-10 text-ink" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tighter text-ink leading-none mb-3">
              Personal Hub
            </h1>
            <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-sub mb-10">
              Your ultimate productivity companion.
            </p>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setMode("signup")}
                className="w-full bg-ink text-bg py-4 md:py-5 rounded-xl font-extrabold uppercase tracking-widest text-sm hover:bg-sub hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
              >
                <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Create Account
              </button>
              <button 
                onClick={() => setMode("login")}
                className="w-full bg-bg text-ink border-2 border-ink py-4 md:py-5 rounded-xl font-extrabold uppercase tracking-widest text-sm hover:bg-highlight hover:shadow-[4px_4px_0px_var(--theme-ink)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
              >
                <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Sign In
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
            className="w-full max-w-md bg-line border-2 border-ink rounded-3xl p-8 shadow-[8px_8px_0px_var(--theme-ink)] relative z-10"
          >
            <button 
              onClick={() => { setMode("select"); setEmail(""); setPassword(""); }}
              className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sub hover:text-ink transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-extrabold uppercase tracking-tighter text-ink leading-none">
                {mode === "login" ? "Welcome Back" : "Join Hub"}
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-sub mt-2">
                {mode === "login" ? "Enter your details to sign in." : "Create your new account below."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                      <UserPlus className="w-3.5 h-3.5 text-sub" /> Your Name
                    </label>
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      maxLength={80}
                      placeholder="John Doe"
                      required
                      className="w-full bg-bg border-2 border-ink p-4 rounded-xl font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ink transition-shadow"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-sub" /> Email Address
                </label>
                <input 
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-bg border-2 border-ink p-4 rounded-xl font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ink transition-shadow"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-sub" /> Password
                </label>
                <input 
                  type="password"
                  minLength={mode === "signup" ? 6 : undefined}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-bg border-2 border-ink p-4 rounded-xl font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ink transition-shadow"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-ink text-bg py-4 md:py-5 rounded-xl font-extrabold uppercase tracking-widest text-sm hover:bg-sub hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {mode === "login" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {loading ? "Processing..." : mode === "login" ? "Sign In" : "Sign Up"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
