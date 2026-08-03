import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

function Auth() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const signIn = useAuthStore(s => s.signIn);
  const signUp = useAuthStore(s => s.signUp);
  const error = useAuthStore(s => s.error);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);
    if (!email.trim() || password.length < 6) {
      setNotice({ type: 'error', text: 'Enter a valid email and a password of at least 6 characters.' });
      return;
    }
    setBusy(true);
    const fn = mode === 'login' ? signIn : signUp;
    const result = await fn(email.trim(), password);
    setBusy(false);
    if (result.ok && result.confirmEmail) {
      setNotice({ type: 'success', text: 'Account created! Check your email for a confirmation link before signing in.' });
      setMode('login');
    } else if (!result.ok) {
      setNotice({ type: 'error', text: result.error });
    }
  };

  const switchMode = (next) => {
    setMode(next);
    setNotice(null);
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-slate-900 text-slate-100 overflow-hidden font-sans">
      <div className="bg-mesh -top-40 -left-40"></div>
      <div className="bg-mesh -bottom-40 -right-40"></div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="rounded-3xl bg-slate-950/70 backdrop-blur-xl border border-slate-800/80 p-8 shadow-2xl shadow-indigo-950/40">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-brand-500/30 flex items-center justify-center shadow-lg shadow-indigo-950/30 mb-4">
              <Sparkles className="w-7 h-7 text-brand-400" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">SmartAssociate</h1>
            <p className="text-xs text-slate-400 mt-1">Your AI Virtual Sales Associate</p>
          </div>

          {/* Mode tabs */}
          <div className="flex rounded-xl bg-slate-900 border border-slate-800/80 p-1 mb-6">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mode === m
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                autoComplete="email"
                className="w-full rounded-xl bg-slate-900 border border-slate-800 py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30"
              />
            </div>

            {notice && (
              <div className={`flex items-start gap-2 p-3 rounded-xl text-xs border ${
                notice.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
              }`}>
                {notice.type === 'success'
                  ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{notice.text}</span>
              </div>
            )}
            {!notice && error && (
              <div className="flex items-start gap-2 p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/25 text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-950/40 border border-brand-400/20 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-[10px] text-slate-600 text-center mt-6 leading-relaxed">
            Your chats and cart are private to your account.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Auth;
