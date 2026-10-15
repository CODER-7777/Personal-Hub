import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, UserPlus, Key, Mail, ArrowLeft, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import { ref, update } from "firebase/database";

export default function Auth() {
  const [mode, setMode] = useState<"select" | "login" | "signup" | "otp">("select");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOTP] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  
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
  const setupRecaptcha = () => {
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch {}
      (window as any).recaptchaVerifier = null;
    }
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      }
    });
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error("Please enter a valid phone number with country code (e.g. +91...)");
      return;
    }

    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber.trim(), appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      toast.success("OTP sent to your phone!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP.");
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch {}
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !confirmationResult) {
      toast.error("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      await confirmationResult.confirm(otp.trim());
      toast.success("Logged in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Invisible container for Firebase Phone Auth reCAPTCHA */}
      <div id="recaptcha-container"></div>

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
              <img src="/app-logo.png" alt="Personal Hub" className="w-14 h-14 object-contain rounded-xl" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tighter text-ink leading-none mb-3">
              Personal Hub
            </h1>
            <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-sub mb-8">
              Your ultimate productivity companion.
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setMode("signup")}
                className="w-full bg-ink text-bg py-4 rounded-xl font-extrabold uppercase tracking-widest text-sm hover:bg-sub hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
              >
                <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Create Account
              </button>
              <button 
                onClick={() => setMode("login")}
                className="w-full bg-bg text-ink border-2 border-ink py-4 rounded-xl font-extrabold uppercase tracking-widest text-sm hover:bg-highlight hover:shadow-[4px_4px_0px_var(--theme-ink)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
              >
                <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Sign In with Email
              </button>
              <button 
                onClick={() => setMode("otp")}
                className="w-full bg-bg text-ink border-2 border-ink py-4 rounded-xl font-extrabold uppercase tracking-widest text-sm hover:bg-highlight hover:shadow-[4px_4px_0px_var(--theme-ink)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
              >
                <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Sign In with Phone OTP
              </button>
            </div>
          </motion.div>
        ) : mode === "otp" ? (
          <motion.div
            key="otp"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
            className="w-full max-w-md bg-line border-2 border-ink rounded-3xl p-8 shadow-[8px_8px_0px_var(--theme-ink)] relative z-10"
          >
            <button
              onClick={() => {
                setMode("select");
                setOtpSent(false);
                setOTP("");
                setPhoneNumber("");
              }}
              className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sub hover:text-ink transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-extrabold uppercase tracking-tighter text-ink leading-none">
                {otpSent ? "Enter OTP" : "Phone Login"}
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-sub mt-2">
                {otpSent
                  ? `Enter the 6-digit code sent to ${phoneNumber}`
                  : "Enter your phone number to receive a verification code."}
              </p>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-sub" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full bg-bg border-2 border-ink p-4 rounded-xl font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ink transition-shadow"
                  />
                  <p className="text-[10px] text-sub font-bold uppercase tracking-wider">
                    Include country code (e.g. +91, +1)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-ink text-bg py-4 md:py-5 rounded-xl font-extrabold uppercase tracking-widest text-sm hover:bg-sub hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  <Phone className="w-4 h-4" />
                  {loading ? "Sending Code..." : "Send OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-sub" /> 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOTP(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full bg-bg border-2 border-ink p-4 rounded-xl font-extrabold text-2xl tracking-[0.3em] text-center text-ink focus:outline-none focus:ring-2 focus:ring-ink transition-shadow"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-ink text-bg py-4 md:py-5 rounded-xl font-extrabold uppercase tracking-widest text-sm hover:bg-sub hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </button>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOTP("");
                    }}
                    className="text-xs font-bold uppercase tracking-widest text-sub hover:text-ink transition-colors"
                  >
                    Change Number
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSendOtp}
                    className="text-xs font-bold uppercase tracking-widest text-ink hover:underline disabled:opacity-50"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
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
