import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  LogOut,
  Sparkles,
  KeyRound,
  CheckCircle2,
  HelpCircle,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { UserAccount } from './AuthModal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: UserAccount) => void;
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onSwitchToSignup,
  onForgotPassword,
}) => {
  const [emailOrUsername, setEmailOrUsername] = useState('rinkudebbarma2016@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim()) {
      setErrorMessage('Please enter your email or username');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const isEmail = emailOrUsername.includes('@');
      const account: UserAccount = {
        loginId: isEmail ? emailOrUsername.split('@')[0] : emailOrUsername,
        email: isEmail ? emailOrUsername : `${emailOrUsername}@gmail.com`,
        name: isEmail ? 'Rinku Debbarma' : emailOrUsername,
        isLoggedIn: true,
        tier: 'Pro',
        cloudStorageUsedGb: 0,
        cloudStorageTotalGb: 0,
        joinedDate: 'October 2026',
        isGoogleAccount: isEmail && emailOrUsername.includes('gmail'),
      };
      onLoginSuccess(account);
      onClose();
    }, 600);
  };

  const handleSocialLogin = (provider: 'Google' | 'Apple' | 'GitHub') => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const account: UserAccount = {
        loginId: provider.toLowerCase() + '_user',
        email: `rinkudebbarma2016@${provider.toLowerCase()}.com`,
        name: `Rinku Debbarma (${provider})`,
        isLoggedIn: true,
        tier: 'Pro',
        cloudStorageUsedGb: 0,
        cloudStorageTotalGb: 0,
        joinedDate: 'November 2026',
        isGoogleAccount: provider === 'Google',
      };
      onLoginSuccess(account);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-5">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-zinc-950 font-bold shadow-md shadow-emerald-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Log In to Your Account</h2>
              <p className="text-xs text-zinc-400">Welcome back! Please enter your details.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Social Logins */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleSocialLogin('Google')}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 font-medium transition cursor-pointer"
          >
            <span className="font-bold text-sm">G</span>
            <span>Google</span>
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin('Apple')}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 font-medium transition cursor-pointer"
          >
            <span className="font-bold text-sm"></span>
            <span>Apple</span>
          </button>
          <button
            type="button"
            onClick={() => handleSocialLogin('GitHub')}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 font-medium transition cursor-pointer"
          >
            <span className="font-mono text-xs">git</span>
            <span>GitHub</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-[1px] bg-zinc-800 flex-1" />
          <span className="text-[11px] text-zinc-500 uppercase font-mono">or log in with email</span>
          <div className="h-[1px] bg-zinc-800 flex-1" />
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block text-zinc-300 font-semibold">Email or Username</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-emerald-500 text-white placeholder-zinc-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-zinc-300 font-semibold">Password</label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-emerald-500 text-white placeholder-zinc-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-zinc-400 hover:text-white absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-zinc-400">Remember me for 30 days</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch to Create Account */}
        <div className="text-center pt-2 border-t border-zinc-800 text-xs text-zinc-400">
          <span>Don't have an account yet? </span>
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-bold text-emerald-400 hover:underline cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupSuccess: (account: UserAccount) => void;
  onSwitchToLogin: () => void;
}

export const CreateAccountModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  onSignupSuccess,
  onSwitchToLogin,
}) => {
  const [fullName, setFullName] = useState('Rinku Debbarma');
  const [email, setEmail] = useState('rinkudebbarma2016@gmail.com');
  const [username, setUsername] = useState('rinku_creator');
  const [password, setPassword] = useState('SecurePass2026!');
  const [confirmPassword, setConfirmPassword] = useState('SecurePass2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [receiveUpdates, setReceiveUpdates] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time password strength
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  let strengthScore = 0;
  if (hasMinLength) strengthScore++;
  if (hasNumber) strengthScore++;
  if (hasSpecial) strengthScore++;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setErrorMessage('Please fill in all required fields');
      return;
    }
    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match');
      return;
    }
    if (!agreedTerms) {
      setErrorMessage('You must agree to the Terms of Service & Privacy Policy');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const account: UserAccount = {
        loginId: username.trim() || email.split('@')[0],
        email: email.trim(),
        name: fullName.trim(),
        isLoggedIn: true,
        tier: 'Pro',
        cloudStorageUsedGb: 0,
        cloudStorageTotalGb: 0,
        joinedDate: 'November 2026',
        isGoogleAccount: email.includes('gmail'),
      };
      onSignupSuccess(account);
      onClose();
    }, 700);
  };

  const handleSocialSignup = (provider: 'Google' | 'Apple' | 'GitHub') => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const account: UserAccount = {
        loginId: `${provider.toLowerCase()}_creator`,
        email: `rinkudebbarma2016@${provider.toLowerCase()}.com`,
        name: `Rinku Debbarma`,
        isLoggedIn: true,
        tier: 'Pro',
        cloudStorageUsedGb: 0,
        cloudStorageTotalGb: 0,
        joinedDate: 'November 2026',
        isGoogleAccount: provider === 'Google',
      };
      onSignupSuccess(account);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Create Your Account</h2>
              <p className="text-xs text-zinc-400">Join over 100,000+ creators worldwide.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Social Registration */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleSocialSignup('Google')}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 font-medium transition cursor-pointer"
          >
            <span className="font-bold text-sm">G</span>
            <span>Google</span>
          </button>
          <button
            type="button"
            onClick={() => handleSocialSignup('Apple')}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 font-medium transition cursor-pointer"
          >
            <span className="font-bold text-sm"></span>
            <span>Apple</span>
          </button>
          <button
            type="button"
            onClick={() => handleSocialSignup('GitHub')}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 font-medium transition cursor-pointer"
          >
            <span className="font-mono text-xs">git</span>
            <span>GitHub</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-[1px] bg-zinc-800 flex-1" />
          <span className="text-[11px] text-zinc-500 uppercase font-mono">or register with email</span>
          <div className="h-[1px] bg-zinc-800 flex-1" />
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-zinc-300 font-semibold">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rinku Debbarma"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-blue-500 text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-zinc-300 font-semibold">Username *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="rinku_creator"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-blue-500 text-white font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-zinc-300 font-semibold">Email Address *</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rinkudebbarma2016@gmail.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-blue-500 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-zinc-300 font-semibold">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars"
                  className="w-full px-3 pr-8 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-blue-500 text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-zinc-400 hover:text-white absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-300 font-semibold">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-blue-500 text-white"
                />
                {passwordsMatch && (
                  <Check className="w-3.5 h-3.5 text-emerald-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>
          </div>

          {/* Password Strength Indicator */}
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Password Security:</span>
              <span className={`font-bold ${strengthScore === 3 ? 'text-emerald-400' : strengthScore === 2 ? 'text-amber-400' : 'text-zinc-500'}`}>
                {strengthScore === 3 ? 'Strong' : strengthScore === 2 ? 'Good' : 'Weak'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className={`h-1.5 rounded-full ${strengthScore >= 1 ? 'bg-amber-500' : 'bg-zinc-800'}`} />
              <div className={`h-1.5 rounded-full ${strengthScore >= 2 ? 'bg-amber-400' : 'bg-zinc-800'}`} />
              <div className={`h-1.5 rounded-full ${strengthScore === 3 ? 'bg-emerald-400' : 'bg-zinc-800'}`} />
            </div>
            <div className="flex items-center gap-3 text-[10px] text-zinc-500 pt-0.5">
              <span className={hasMinLength ? 'text-emerald-400' : ''}>• 8+ characters</span>
              <span className={hasNumber ? 'text-emerald-400' : ''}>• Number</span>
              <span className={hasSpecial ? 'text-emerald-400' : ''}>• Symbol</span>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2 pt-1 text-[11px]">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-zinc-400 leading-snug">
                I agree to the <span className="text-blue-400 underline">Terms of Service</span> and{' '}
                <span className="text-blue-400 underline">Privacy Policy</span>.
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={receiveUpdates}
                onChange={(e) => setReceiveUpdates(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-zinc-500 leading-snug">
                Send me weekly updates about AI audio, video tools & feature releases.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch to Login */}
        <div className="text-center pt-2 border-t border-zinc-800 text-xs text-zinc-400">
          <span>Already have an account? </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold text-blue-400 hover:underline cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onBackToLogin,
}) => {
  const [email, setEmail] = useState('rinkudebbarma2016@gmail.com');
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Reset Password</h3>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {sent ? (
          <div className="space-y-3 text-center py-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <div className="text-xs text-zinc-200 font-bold">Password Reset Link Sent!</div>
            <p className="text-[11px] text-zinc-400">
              We sent a secure password reset link to <span className="text-white">{email}</span>. Please check your inbox.
            </p>
            <button
              onClick={onBackToLogin}
              className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white transition cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-3 text-xs">
            <p className="text-zinc-400 text-[11px]">
              Enter the email address associated with your studio account to receive a reset link.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-amber-400 text-white"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition cursor-pointer"
            >
              Send Reset Instructions
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
