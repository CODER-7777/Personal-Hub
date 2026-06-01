import React, { useState } from "react";
import { motion } from "motion/react";
import { LogIn, UserPlus, Key, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("Welcome back!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("Account created successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        className="w-full max-w-md bg-line border-2 border-ink rounded-3xl p-8 shadow-[8px_8px_0px_var(--theme-ink)]"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-highlight rounded-full border-2 border-ink mb-4">
            <Sparkles className="w-8 h-8 text-ink" />
          </div>
          <h1 className="text-3xl font-extrabold uppercase tracking-tighter text-ink leading-none">
            Personal Hub
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-sub mt-2">
            {isLogin ? "Welcome back, log in to continue." : "Create a new account."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
              <Mail className="w-3 h-3 text-sub" /> Email Address
            </label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-bg border-2 border-ink p-3 rounded-xl font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
              <Key className="w-3 h-3 text-sub" /> Password
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-bg border-2 border-ink p-3 rounded-xl font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-bg py-4 rounded-xl font-extrabold uppercase tracking-widest text-sm hover:bg-sub hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center border-t-2 border-ink border-dashed pt-6">
          <p className="text-xs font-bold text-sub">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-ink uppercase tracking-widest hover:underline"
            >
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
