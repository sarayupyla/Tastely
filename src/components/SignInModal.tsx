import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, CheckCircle2, KeyRound, Shield, Store, HeartHandshake, User as UserIcon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
}

export const SignInModal: React.FC<Props> = ({ isOpen, onClose, onOpenRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await login({ email: email.trim(), password });
      setSuccessMsg('Successfully signed in! Welcome back.');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-orange-100 text-orange-700">
              <LogIn className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-stone-900 tracking-tight">
                Sign In to Tastely
              </h3>
              <p className="text-xs text-stone-500">
                Access your profile, orders & dashboards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Backend Persistence Note */}
        <div className="mb-4 p-3 rounded-2xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 flex items-start gap-2">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-stone-800">Persistent Backend Connected:</strong> Passwords are authenticated against cryptographic salted SHA-256 hashes on the Node.js Express server with atomic disk storage.
          </div>
        </div>

        {/* Error / Success Notices */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. marco@fornodinapoli.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-stone-700">
                Password
              </label>
              <span className="text-[10px] text-stone-400 font-mono">min 6 chars</span>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-stone-900 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* 1-Click Fast Fill Test Accounts */}
        <div className="mt-5 pt-4 border-t border-stone-100">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 text-center">
            Or Click to Autofill Test Credentials (Pass: password123)
          </div>
          <div className="grid grid-cols-2 gap-2 text-left">
            <button
              type="button"
              onClick={() => fillQuickDemo('marco@forno.local', 'password123')}
              className="p-2 rounded-xl bg-orange-50/80 border border-orange-200/60 hover:bg-orange-100/70 text-orange-950 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span className="truncate">Vendor (Marco)</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('alex@tastely.local', 'password123')}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-800 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5 text-stone-600 shrink-0" />
              <span className="truncate">Customer (Alex)</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('sarah@foodrescue.local', 'password123')}
              className="p-2 rounded-xl bg-rose-50/80 border border-rose-200/60 hover:bg-rose-100/70 text-rose-950 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="truncate">NGO (Sarah)</span>
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('admin@tastely.local', 'password123')}
              className="p-2 rounded-xl bg-blue-50/80 border border-blue-200/60 hover:bg-blue-100/70 text-blue-950 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">Admin (System)</span>
            </button>
          </div>
        </div>

        {/* Switch to Register */}
        <div className="mt-5 text-center text-xs text-stone-500">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenRegister();
            }}
            className="font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer ml-1"
          >
            Create Account
          </button>
        </div>

      </div>
    </div>
  );
};
