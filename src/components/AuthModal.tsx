import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  X,
  LogOut,
  Sparkles,
  Eye,
  EyeOff,
  KeyRound,
  UserPlus,
  LogIn,
  Check,
  AlertCircle,
  ArrowRight,
  Shield,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

export interface UserAccount {
  loginId: string;
  email: string;
  name: string;
  isLoggedIn: boolean;
  tier: 'Free' | 'Pro' | 'Enterprise';
  cloudStorageUsedGb: number;
  cloudStorageTotalGb: number;
  avatarUrl?: string;
  avatarBg?: string;
  isGoogleAccount?: boolean;
  joinedDate: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUpdateUser: (user: UserAccount) => void;
  initialTab?: 'login' | 'signup' | 'profile';
}

const AVATAR_PALETTES = [
  { id: 'emerald', label: 'Emerald Mint', class: 'from-emerald-500 to-teal-400' },
  { id: 'cyan', label: 'Cyan Ocean', class: 'from-cyan-500 to-blue-500' },
  { id: 'purple', label: 'Neon Violet', class: 'from-purple-500 to-indigo-500' },
  { id: 'amber', label: 'Sunset Amber', class: 'from-amber-500 to-orange-500' },
  { id: 'rose', label: 'Rose Gold', class: 'from-rose-500 to-pink-500' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  initialTab,
}) => {
  // Tab can be 'login', 'signup', or 'forgot'
  const [activeBox, setActiveBox] = useState<'login' | 'signup'>(
    initialTab === 'signup' ? 'signup' : 'login'
  );

  useEffect(() => {
    if (initialTab === 'signup' || initialTab === 'login') {
      setActiveBox(initialTab);
    }
  }, [initialTab, isOpen]);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState(currentUser.email || 'rinkudebbarma2016@gmail.com');
  const [loginPassword, setLoginPassword] = useState('Password@2026');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Signup Form States
  const [signupFullName, setSignupFullName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [selectedAvatarBg, setSelectedAvatarBg] = useState(AVATAR_PALETTES[0].class);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  // Forgot Password flow
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Status & Validation
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const signupStrength = getPasswordStrength(signupPassword);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your email or username.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const userName = loginEmail.includes('@')
        ? loginEmail.split('@')[0].replace(/[\._]/g, ' ')
        : loginEmail;
      
      const capitalized = userName
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const updated: UserAccount = {
        ...currentUser,
        loginId: loginEmail.toLowerCase().trim(),
        email: loginEmail.includes('@') ? loginEmail.trim() : `${loginEmail.trim()}@studio.com`,
        name: capitalized || 'Studio Creator',
        isLoggedIn: true,
        tier: 'Pro',
      };

      onUpdateUser(updated);
      setSuccessMsg(`Welcome back, ${updated.name}!`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 800);
    }, 450);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!signupFullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    if (signupPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMsg('Please agree to the Terms of Service to continue.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const newAccount: UserAccount = {
        loginId: (signupUsername || signupFullName).toLowerCase().replace(/\s+/g, '_'),
        email: signupEmail.trim(),
        name: signupFullName.trim(),
        isLoggedIn: true,
        tier: 'Pro',
        cloudStorageUsedGb: 0.1,
        cloudStorageTotalGb: 5,
        avatarBg: selectedAvatarBg,
        joinedDate: 'November 2026',
      };

      onUpdateUser(newAccount);
      setSuccessMsg(`Account created successfully for ${newAccount.name}!`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 900);
    }, 500);
  };

  const handleSocialAuth = (provider: 'Google' | 'GitHub' | 'Apple') => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const email = provider === 'Google' ? 'rinkudebbarma2016@gmail.com' : `user@${provider.toLowerCase()}.com`;
      const socialUser: UserAccount = {
        ...currentUser,
        loginId: `user_${provider.toLowerCase()}`,
        email,
        name: provider === 'Google' ? 'Rinku Debbarma' : `${provider} User`,
        isLoggedIn: true,
        tier: 'Pro',
        isGoogleAccount: provider === 'Google',
      };
      onUpdateUser(socialUser);
      setSuccessMsg(`Signed in with ${provider} securely!`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 700);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-zinc-950 text-xs shadow-md">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Apps Developer Studio Editor</h2>
              <p className="text-[11px] text-zinc-400">Developer Studio Login ID & Password Authentication</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Two Prominent Switchable Boxes Selector */}
        <div className="p-6 pb-2">
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setActiveBox('login');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                activeBox === 'login'
                  ? 'bg-zinc-800 text-white shadow-md border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              <span>Developer Studio Login</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveBox('signup');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                activeBox === 'signup'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* =============================================================== */}
        {/* BOX 1: DEVELOPER STUDIO LOGIN */}
        {/* =============================================================== */}
        {activeBox === 'login' && (
          <div className="p-6 pt-3 space-y-4 animate-fadeIn">
            <div className="text-left">
              <h3 className="text-base font-bold text-white">Sign In to Apps Developer Studio Editor</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Access your projects, AI voice synthesis, CineCraft Pro timeline, and developer workspace.
              </p>
            </div>

            {/* Quick 1-Click Social Sign-In Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSocialAuth('Google')}
                disabled={isSubmitting}
                className="py-2 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialAuth('GitHub')}
                disabled={isSubmitting}
                className="py-2 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialAuth('Apple')}
                disabled={isSubmitting}
                className="py-2 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.78 1.06-1.85.94-2.94-.92.04-2.02.61-2.67 1.39-.56.67-1.05 1.76-.92 2.82 1.03.08 2.02-.49 2.65-1.27z"/>
                </svg>
                <span>Apple</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800"></div>
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">or developer studio login id & password</span>
              <div className="flex-1 h-px bg-zinc-800"></div>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1 block">
                  Developer Studio Login ID <span className="text-zinc-500 font-normal">(or Email)</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. dev_rinku or rinku_creator"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter developer password"
                    required
                    className="w-full pl-9 pr-10 py-2 bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-zinc-900 border-zinc-700 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Keep Developer Studio Session Active</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-600/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Developer Studio Editor</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-zinc-900 text-xs text-zinc-400">
              Need a developer account?{' '}
              <button
                type="button"
                onClick={() => setActiveBox('signup')}
                className="text-emerald-400 font-bold hover:underline cursor-pointer ml-1"
              >
                Create Account now →
              </button>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* BOX 2: CREATE DEVELOPER STUDIO ACCOUNT */}
        {/* =============================================================== */}
        {activeBox === 'signup' && (
          <div className="p-6 pt-3 space-y-3.5 animate-fadeIn">
            <div className="text-left">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Create Apps Developer Studio Account</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  DEVELOPER ACCESS
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Register your Developer Studio Login ID and workspace credentials for Apps Developer Studio Editor.
              </p>
            </div>

            {/* Quick 1-Click Social Sign-Up */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSocialAuth('Google')}
                disabled={isSubmitting}
                className="py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialAuth('GitHub')}
                disabled={isSubmitting}
                className="py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialAuth('Apple')}
                disabled={isSubmitting}
                className="py-1.5 px-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.78 1.06-1.85.94-2.94-.92.04-2.02.61-2.67 1.39-.56.67-1.05 1.76-.92 2.82 1.03.08 2.02-.49 2.65-1.27z"/>
                </svg>
                <span>Apple</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800"></div>
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">or register developer studio login id</span>
              <div className="flex-1 h-px bg-zinc-800"></div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Developer Full Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      placeholder="e.g. Rinku Debbarma"
                      required
                      className="w-full pl-8 pr-2 py-1.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Developer Studio Login ID</label>
                  <input
                    type="text"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    placeholder="e.g. dev_rinku"
                    required
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Developer Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="rinkudebbarma2016@gmail.com"
                    required
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Developer Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      required
                      className="w-full pl-8 pr-8 py-1.5 bg-zinc-900 border border-zinc-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      required
                      className={`w-full pl-8 pr-3 py-1.5 bg-zinc-900 border rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition ${
                        signupConfirmPassword && signupPassword === signupConfirmPassword
                          ? 'border-emerald-500/70 focus:border-emerald-500'
                          : signupConfirmPassword
                          ? 'border-red-500/70 focus:border-red-500'
                          : 'border-zinc-800 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {signupPassword && (
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-zinc-500 font-mono">Strength:</span>
                  <div className="flex-1 grid grid-cols-4 gap-1 h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div className={`h-full ${signupStrength >= 1 ? 'bg-red-500' : 'bg-transparent'}`} />
                    <div className={`h-full ${signupStrength >= 2 ? 'bg-amber-500' : 'bg-transparent'}`} />
                    <div className={`h-full ${signupStrength >= 3 ? 'bg-teal-500' : 'bg-transparent'}`} />
                    <div className={`h-full ${signupStrength >= 4 ? 'bg-emerald-500' : 'bg-transparent'}`} />
                  </div>
                  <span className="text-zinc-400 font-mono text-[9px]">
                    {signupStrength <= 1 ? 'Weak' : signupStrength <= 3 ? 'Medium' : 'Strong'}
                  </span>
                </div>
              )}

              {/* Avatar Theme Color Selection */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-300 mb-1.5 block">Choose Developer Theme</label>
                <div className="flex items-center gap-2">
                  {AVATAR_PALETTES.map((pal) => (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setSelectedAvatarBg(pal.class)}
                      className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${pal.class} flex items-center justify-center cursor-pointer transition transform ${
                        selectedAvatarBg === pal.class
                          ? 'ring-2 ring-white scale-110 shadow-md'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      title={pal.label}
                    >
                      {selectedAvatarBg === pal.class && <Check className="w-3.5 h-3.5 text-zinc-950 font-bold" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="space-y-1 pt-1 text-xs">
                <label className="flex items-start gap-2 text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px] leading-snug">
                    I agree to the <span className="text-zinc-200 underline">Terms of Service</span> and{' '}
                    <span className="text-zinc-200 underline">Privacy Policy</span> for Apps Developer Studio Editor.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Developer Studio Account</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-zinc-900 text-xs text-zinc-400">
              Already have a developer account?{' '}
              <button
                type="button"
                onClick={() => setActiveBox('login')}
                className="text-cyan-400 font-bold hover:underline cursor-pointer ml-1"
              >
                Developer Studio Login →
              </button>
            </div>
          </div>
        )}

        {/* Forgot Password Sub-Modal */}
        {showForgotModal && (
          <div className="absolute inset-0 bg-zinc-950/98 backdrop-blur-md p-6 flex flex-col justify-center animate-fadeIn z-20">
            <div className="max-w-md mx-auto w-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Reset Account Password</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSent(false);
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {forgotSent ? (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="text-xs font-bold text-white">Recovery link dispatched!</div>
                  <p className="text-[11px] text-zinc-300">
                    We sent password reset instructions to <span className="font-mono text-emerald-300">{forgotEmail}</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotSent(false);
                    }}
                    className="mt-2 py-1.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white"
                  >
                    Back to Log In
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-400">
                    Enter the email address associated with your studio account and we'll send you a secure one-time link.
                  </p>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (forgotEmail.trim()) {
                          setForgotSent(true);
                        }
                      }}
                      className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
