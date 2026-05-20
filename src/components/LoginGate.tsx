import React, { useState } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Shield, Key, Mail, User, Radio, Cpu, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginGateProps {
  onGuestLogin: () => void;
}

export default function LoginGate({ onGuestLogin }: LoginGateProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!displayName) {
          throw new Error('Please enter a display name');
        }
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, {
          displayName: displayName
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('auth/operation-not-allowed'))) {
        setError(
          'Email & Password login is disabled in your Firebase console. Go to: Firebase Console > Authentication > Sign-in Method, click "Email/Password" and enable it. In the meantime, use "Google Cloud" or "Local Tunnel" to enter!'
        );
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed' || (err.message && err.message.includes('auth/operation-not-allowed'))) {
        setError(
          'Google Sign-In is disabled in your Firebase project. Go to: Firebase Console > Authentication > Sign-in Method, and enable the "Google" provider. Or bypass with "Local Tunnel"!'
        );
      } else {
        setError(
          'Google login failed. This usually occurs if the popup is blocked. Try using the Email tab or entering via Guest Bypass mode!'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F6] text-neutral-800 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Editorial aesthetic organic background */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-[#EBE7DF] rounded-full blur-[10rem] opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-[#F2ECE4] rounded-full blur-[8rem] opacity-40 pointer-events-none" />

      {/* Main card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white border border-[#E2E2D5] rounded-2xl p-8 z-10 shadow-xl shadow-neutral-200/50"
        id="login-main-card"
      >
        {/* Moroccan Heritage Simple Decent Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EFECE3] border border-[#DDD9CE] text-neutral-600 font-sans text-[11px] font-medium uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            The First Ever 100% Moroccan AI
          </div>
        </div>

        {/* Brand */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-display font-bold text-neutral-900 tracking-tight">
            Mtrini 1.0
          </h1>
          <p className="text-[10px] text-neutral-500 font-mono mt-1.5 tracking-widest uppercase">
            Creative Development Workspace
          </p>
          <div className="mt-2 text-xs text-[#a16207] italic font-serif">
            "Mtrini: Made By Nova AI (a Ayham Projects group)"
          </div>
        </div>

        {/* Form controls */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="grid grid-cols-2 bg-[#F4F4F0] p-1 rounded-xl border border-[#E2E2D5] mb-2">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`py-1.5 text-xs font-medium rounded-lg transition-all ${!isSignUp ? 'bg-white text-neutral-900 shadow-sm border border-[#E2E2D5]/70' : 'text-neutral-500 hover:text-neutral-800'}`}
              id="tab-signin"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`py-1.5 text-xs font-medium rounded-lg transition-all ${isSignUp ? 'bg-white text-neutral-900 shadow-sm border border-[#E2E2D5]/70' : 'text-neutral-500 hover:text-neutral-800'}`}
              id="tab-signup"
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs text-center leading-relaxed">
              {error}
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Display Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Ayham Projects Dev"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#FCFCFA] border border-[#DCDCD2] rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                placeholder="developer@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#FCFCFA] border border-[#DCDCD2] rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Key Phrase / Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                placeholder="••••••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FCFCFA] border border-[#DCDCD2] rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#191919] hover:bg-[#2c2c2c] active:bg-black text-white disabled:bg-neutral-300 font-sans font-medium py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all mt-2 cursor-pointer shadow-sm"
            id="auth-submit-btn"
          >
            {isLoading ? 'Decrypting Connection...' : isSignUp ? 'Generate Agent Credentials' : 'Initialize Terminal Link'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="h-[1px] bg-[#E2E2D5] flex-1" />
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Alternative</span>
          <div className="h-[1px] bg-[#E2E2D5] flex-1" />
        </div>

        {/* Alternative safe links */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-[#F5F5F0] hover:bg-[#EFECE3] border border-[#DCDCD2] rounded-xl text-xs font-medium text-neutral-700 transition-all cursor-pointer"
            id="auth-google-btn"
          >
            <Cpu className="w-3.5 h-3.5 text-neutral-500" />
            Google
          </button>

          <button
            onClick={onGuestLogin}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-[#F2ECD9] hover:bg-[#EBE3C8] border border-[#DDD6BA] rounded-xl text-xs font-semibold text-amber-900 transition-all cursor-pointer"
            id="auth-guest-btn"
          >
            <Radio className="w-3.5 h-3.5 text-amber-700" />
            Local Bypass
          </button>
        </div>

        <p className="text-[10px] text-center text-neutral-400 font-mono mt-8 leading-relaxed uppercase tracking-wide">
          Secured Workspace Environment.<br />
          Compatible with cross-platform clients.
        </p>
      </motion.div>
    </div>
  );
}
