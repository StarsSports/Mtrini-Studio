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
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Editorial aesthetic organic background */}
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-neutral-900 rounded-full blur-[10rem] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-[#111111] rounded-full blur-[8rem] opacity-30 pointer-events-none" />

      {/* Main card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-8 z-10 shadow-2xl"
        id="login-main-card"
      >
        {/* Brand */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-display font-medium text-white tracking-tight">
            Mtrini Studio
          </h1>
          <p className="text-xs text-neutral-450 mt-1">
            Simple, Elegant AI Companion
          </p>
        </div>

        {/* Form controls */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="grid grid-cols-2 bg-neutral-950 p-1 rounded-xl border border-neutral-800 mb-2">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`py-1.5 text-xs font-medium rounded-lg transition-all ${!isSignUp ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700' : 'text-neutral-450 hover:text-neutral-300'}`}
              id="tab-signin"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`py-1.5 text-xs font-medium rounded-lg transition-all ${isSignUp ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700' : 'text-neutral-450 hover:text-neutral-300'}`}
              id="tab-signup"
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/55 border border-rose-800 rounded-xl text-rose-300 text-xs text-center leading-relaxed font-mono">
              {error}
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-neutral-700 focus:border-neutral-700 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-neutral-700 focus:border-neutral-700 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl py-2 pl-10 pr-4 text-xs focus:ring-1 focus:ring-neutral-700 focus:border-neutral-700 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-neutral-100 hover:bg-neutral-200 active:bg-white text-neutral-950 disabled:bg-neutral-800 disabled:text-neutral-500 font-sans font-medium py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all mt-2 cursor-pointer shadow-sm"
            id="auth-submit-btn"
          >
            {isLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="h-[1px] bg-neutral-800 flex-1" />
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-mono">or</span>
          <div className="h-[1px] bg-neutral-800 flex-1" />
        </div>

        {/* Alternative safe links */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 rounded-xl text-xs font-medium text-neutral-300 transition-all cursor-pointer"
            id="auth-google-btn"
          >
            <Cpu className="w-3.5 h-3.5 text-neutral-400" />
            Google
          </button>

          <button
            onClick={onGuestLogin}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2 px-4 bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 transition-all cursor-pointer"
            id="auth-guest-btn"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Guest Access
          </button>
        </div>
      </motion.div>
    </div>
  );
}
