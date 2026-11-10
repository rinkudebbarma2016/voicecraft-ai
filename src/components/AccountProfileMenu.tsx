import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  UserPlus,
  LogIn,
  Check,
  Shield,
  Sparkles,
  ChevronDown,
  Layers,
  ExternalLink,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { UserAccount } from './AuthModal';

interface AccountProfileMenuProps {
  currentUser?: UserAccount;
  accounts?: UserAccount[];
  onSwitchAccount?: (account: UserAccount) => void;
  onAddAccount?: (newAccount: UserAccount) => void;
  onOpenAuthModal?: (tab?: 'login' | 'signup') => void;
  onSignOut?: () => void;
}

export const AccountProfileMenu: React.FC<AccountProfileMenuProps> = ({
  currentUser,
  accounts = [],
  onSwitchAccount = () => {},
  onOpenAuthModal = () => {},
  onSignOut = () => {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const activeUser = currentUser || {
    loginId: 'rinku_creator',
    email: 'rinkudebbarma2016@gmail.com',
    name: 'Rinku Debbarma',
    isLoggedIn: true,
    tier: 'Pro' as const,
    cloudStorageUsedGb: 0.5,
    cloudStorageTotalGb: 5,
    joinedDate: 'October 2026',
    avatarBg: 'from-emerald-500 to-teal-400',
  };

  const getInitials = (name?: string) => {
    if (!name) return 'RD';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Profile Avatar Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition shadow-sm cursor-pointer select-none group"
        title="Account Access - Login or Create Account"
      >
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-zinc-950 text-[10px] sm:text-xs shadow-xs">
          {getInitials(activeUser.name)}
        </div>
        <span className="text-xs font-semibold text-zinc-200 group-hover:text-white hidden md:inline truncate max-w-[120px]">
          {activeUser.name || 'Account'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform" />
      </button>

      {/* Dropdown Menu matching screenshot styling with Create Account & Developer Studio Login */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-3xl bg-[#18181b]/98 border border-zinc-800 shadow-2xl p-4 z-50 animate-fadeIn backdrop-blur-2xl space-y-3.5">
          
          {/* Active Profile Header Card (Exact styling from user screenshot) */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#222226] border border-zinc-700/60 shadow-sm">
            <div className="w-10 h-10 rounded-2xl bg-emerald-400 flex items-center justify-center font-extrabold text-zinc-950 text-sm shadow-md shrink-0">
              {getInitials(activeUser.name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate">
                {activeUser.name || 'Rinku Debbarma'}
              </div>
              <div className="text-xs text-zinc-400 font-mono truncate">
                {activeUser.email || 'rinkudebbarma2016@gmail.com'}
              </div>
            </div>
          </div>

          {/* TWO SEPARATE PROMINENT ACTION CARDS: Create Account & Developer Studio Login */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Create Account (Removed 'Box') */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAuthModal('signup');
              }}
              className="p-3 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-teal-950/30 border border-emerald-500/35 hover:border-emerald-400 hover:bg-emerald-950/60 transition flex flex-col items-start gap-1 text-left cursor-pointer group shadow-sm"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-0.5 group-hover:scale-110 transition-transform">
                <UserPlus className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                Create Account
              </span>
              <span className="text-[10px] text-zinc-400 leading-tight">
                New studio ID & profile
              </span>
            </button>

            {/* Developer Studio Login */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAuthModal('login');
              }}
              className="p-3 rounded-2xl bg-[#222226] border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 transition flex flex-col items-start gap-1 text-left cursor-pointer group shadow-sm"
            >
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-0.5 group-hover:scale-110 transition-transform">
                <LogIn className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white group-hover:text-cyan-200">
                Developer Studio Login
              </span>
              <span className="text-[10px] text-zinc-400 leading-tight">
                Studio ID & password
              </span>
            </button>
          </div>

          {/* SWITCH ACCOUNT SECTION (Matching Screenshot) */}
          <div className="space-y-1.5 pt-1 border-t border-zinc-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-1 font-bold">
              SWITCH ACCOUNT
            </span>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-0.5">
              {accounts.map((acc) => {
                const isCurrent = acc.email === activeUser.email;
                return (
                  <button
                    key={acc.loginId || acc.email}
                    type="button"
                    onClick={() => {
                      onSwitchAccount(acc);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-2xl text-left flex items-center justify-between gap-2.5 transition cursor-pointer ${
                      isCurrent
                        ? 'bg-[#27272a] text-white shadow-inner'
                        : 'text-zinc-300 hover:bg-[#222226]'
                    }`}
                  >
                    <div className="truncate min-w-0">
                      <div className="font-bold text-xs text-white truncate">{acc.name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate">{acc.email}</div>
                    </div>
                    {isCurrent && (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Add / Switch Account Button (Matching screenshot icon and text) */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAuthModal('login');
              }}
              className="w-full mt-1.5 p-2.5 rounded-2xl text-left text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-[#222226] transition flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Add / Switch Account</span>
            </button>
          </div>

          {/* Sign Out / Log Out Action */}
          <div className="border-t border-zinc-800 pt-2">
            {activeUser.isLoggedIn && activeUser.loginId !== 'guest_user' ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onSignOut();
                }}
                className="w-full p-2.5 rounded-2xl text-left text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/30 transition flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Log Out</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider group-hover:text-rose-300">
                  Disconnect ID
                </span>
              </button>
            ) : (
              <div className="text-center py-1">
                <span className="text-[11px] text-zinc-500">Currently logged out as Guest</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
