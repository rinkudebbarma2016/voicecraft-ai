import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Zap,
  ShieldCheck,
  Star,
  Clock,
  Mic,
  Film,
  Layers,
  Bot,
  Tag,
  CreditCard,
  X,
  HelpCircle,
  Award,
} from 'lucide-react';
import { PlanTier, SubscriptionPlan, UserSubscription } from '../types/tts';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: UserSubscription;
  onUpdateSubscription: (newSub: UserSubscription) => void;
}

const PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Starter Free',
    tagline: 'Forever free basic text-to-speech for personal use',
    monthlyPrice: 0,
    annualPrice: 0,
    highlightPerk: 'Unlimited Basic Words',
    features: [
      'Unlimited words text-to-speech',
      'Standard Gemini voice synthesis (24kHz)',
      'Local Web Speech instant preview',
      'Audio player with real-time waveform',
      'Single file export',
      'Community support',
    ],
  },
  {
    id: 'creator',
    name: 'Creator Pro',
    tagline: 'Full power for creators, narrators, podcasters & YouTubers',
    monthlyPrice: 19,
    annualPrice: 15,
    popular: true,
    badge: 'Most Popular',
    highlightPerk: '7-Day Free Trial Available',
    features: [
      'All 25+ Neural Voice Artists & Clones',
      'Authentic Indian English voice suite (Ashish, Vikrant, Monika, Priya, Aarav)',
      'AI Voice Director Chat Assistant (Gemini 3.8 Flash)',
      'Post-Processing: Auto -1dB Peak Audio Normalization (Broadcast standard)',
      'Exact time duration pacing controller',
      'ID3 metadata tag editor & ZIP archive export',
      'Batch queue processing (up to 50 clips at once)',
      'Commercial usage license',
      'Lossless 24kHz broadcast WAV audio',
    ],
  },
  {
    id: 'studio',
    name: 'Studio Team',
    tagline: 'Pro video creators, media agencies & audiobook studios',
    monthlyPrice: 49,
    annualPrice: 39,
    badge: 'Best for Video',
    highlightPerk: 'CineStudio Pro Multi-Track AI Video Included',
    features: [
      'Everything in Creator Pro',
      'CineStudio Pro AI Video Suite with multi-track timeline',
      'AI cinematic text-to-video scenes generator',
      'Synchronized subtitles & dynamic captions',
      'Multi-speaker dialogue editor with dual voice actor tuning',
      'Priority GPU synthesis queue (3x faster)',
      'Custom EQ acoustic filter presets',
      'Team shared workspace (up to 5 seats)',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise VIP',
    tagline: 'High-volume production, dedicated bandwidth & SLA',
    monthlyPrice: 149,
    annualPrice: 119,
    badge: 'Custom Power',
    highlightPerk: 'Unlimited Quota & API',
    features: [
      'Everything in Studio Team',
      'Dedicated high-throughput Gemini 3.8 Flash pipeline',
      'REST API access for automated text-to-speech pipelines',
      'Custom voice clone training & bespoke accents',
      '99.99% uptime SLA & dedicated sound engineer support',
      'Custom contract & tax invoicing',
    ],
  },
];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onUpdateSubscription,
}) => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>(
    subscription.billingInterval || 'annual'
  );
  const [selectedTier, setSelectedTier] = useState<PlanTier>(subscription.tier || 'creator');
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [celebrationMsg, setCelebrationMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleStartFreeTrial = (tier: PlanTier = 'creator') => {
    const newSub: UserSubscription = {
      tier,
      isTrialActive: true,
      trialStartDate: Date.now(),
      trialDaysTotal: 7,
      trialDaysRemaining: 7,
      billingInterval,
      status: 'trialing',
      unlockedFeatures: [
        'neural-voices',
        'indian-english',
        'ai-chat-director',
        'id3-metadata',
        'batch-queue',
        'cine-video-studio',
        'lossless-wav',
      ],
    };
    onUpdateSubscription(newSub);
    setCelebrationMsg(`🎉 7-Day Free Trial activated on ${PLANS.find((p) => p.id === tier)?.name || 'Creator Pro'}! No credit card required.`);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      onClose();
    }, 2200);
  };

  const handleSelectPlan = (tier: PlanTier) => {
    setSelectedTier(tier);
    if (tier === 'free') {
      const newSub: UserSubscription = {
        tier: 'free',
        isTrialActive: false,
        trialStartDate: 0,
        trialDaysTotal: 0,
        trialDaysRemaining: 0,
        billingInterval,
        status: 'free',
        unlockedFeatures: ['basic-tts'],
      };
      onUpdateSubscription(newSub);
      setCelebrationMsg('Switched to Starter Free plan.');
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        onClose();
      }, 1600);
      return;
    }

    if (!subscription.isTrialActive && subscription.tier === 'free') {
      handleStartFreeTrial(tier);
    } else {
      const newSub: UserSubscription = {
        ...subscription,
        tier,
        billingInterval,
        status: 'active',
      };
      onUpdateSubscription(newSub);
      setCelebrationMsg(`🚀 Plan updated to ${PLANS.find((p) => p.id === tier)?.name}!`);
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        onClose();
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="relative px-4 py-4 sm:px-8 sm:py-6 border-b border-zinc-800/80 bg-gradient-to-r from-purple-950/40 via-zinc-900/60 to-emerald-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                7-DAY FREE TRIAL • NO CREDIT CARD REQUIRED
              </span>
              {subscription.isTrialActive && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {subscription.trialDaysRemaining} Days Left in Trial
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Unlock the Full Power of VoiceCraft AI
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Get unlimited words, 25+ neural voice artists, authentic Indian English, CineStudio Pro AI Video & AI Director Chat.
            </p>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verified Plan Status Confirmation Card */}
        {subscription.tier !== 'free' ? (
          <div className="mx-3.5 sm:mx-8 mt-4 sm:mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-purple-950/50 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-zinc-950 font-black text-xl shadow-lg shadow-emerald-500/20 shrink-0">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-white text-base">
                    Plan Verified: {subscription.tier === 'creator' ? 'Creator Pro' : subscription.tier === 'studio' ? 'Studio Team Pro' : 'Enterprise VIP'} (Active)
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Pro Unlocked ✓
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Your account has full Pro features: 25+ neural voice artists, authentic Indian English accents, CineStudio 16 Pro AI Video Editor, and -1dB peak audio normalization post-processing.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                PRO ACTIVE
              </span>
            </div>
          </div>
        ) : (
          /* 7-Day Free Trial Hero Banner */
          <div className="mx-3.5 sm:mx-8 mt-4 sm:mt-6 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-emerald-900/30 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-inner">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-zinc-950 font-black text-lg sm:text-xl shadow-lg shadow-orange-500/20 shrink-0">
                7D
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm sm:text-base">Start Your 7-Day Free Trial Today</h3>
                  <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Instant Access
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-300 mt-0.5">
                  Enjoy complete access to Creator Pro for 7 full days. Cancel anytime with a single click. Zero commitment.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleStartFreeTrial('creator')}
              disabled={subscription.isTrialActive}
              className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shrink-0 transition-all shadow-md cursor-pointer ${
                subscription.isTrialActive
                  ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'
                  : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-zinc-950 shadow-orange-500/20 hover:scale-105 active:scale-95'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{subscription.isTrialActive ? 'Trial Currently Active' : 'Claim 7 Days Free Trial'}</span>
            </button>
          </div>
        )}

        {/* Celebration Toast */}
        {showCelebration && (
          <div className="mx-3.5 sm:mx-8 mt-3 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-medium flex items-center gap-2 animate-bounce">
            <Award className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{celebrationMsg}</span>
          </div>
        )}

        {/* Billing Interval Toggle */}
        <div className="flex items-center justify-center gap-3 mt-4 sm:mt-6 px-3">
          <span className={`text-xs font-medium ${billingInterval === 'monthly' ? 'text-white' : 'text-zinc-500'}`}>
            Monthly Billing
          </span>
          <button
            onClick={() => setBillingInterval((prev) => (prev === 'monthly' ? 'annual' : 'monthly'))}
            className="w-12 h-6 rounded-full bg-zinc-800 p-1 flex items-center transition-colors relative border border-zinc-700 cursor-pointer"
          >
            <div
              className={`w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-transform ${
                billingInterval === 'annual' ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-medium ${billingInterval === 'annual' ? 'text-white' : 'text-zinc-500'}`}>
              Annual Billing
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Save 25% (2 Months Free)
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="overflow-y-auto px-3.5 sm:px-8 py-4 sm:py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const price = billingInterval === 'annual' ? plan.annualPrice : plan.monthlyPrice;
            const isCurrent = subscription.tier === plan.id;
            const isPro = plan.id === 'creator';
            const isStudio = plan.id === 'studio';

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all border ${
                  plan.popular
                    ? 'bg-zinc-900/90 border-purple-500/50 shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/30'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Popular or Highlight Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-lg text-white">{plan.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 min-h-[32px]">{plan.tagline}</p>

                  {/* Price */}
                  <div className="mt-4 mb-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">${price}</span>
                    <span className="text-xs text-zinc-400">/ month</span>
                    {billingInterval === 'annual' && price > 0 && (
                      <span className="text-[10px] text-zinc-500 ml-1">billed annually</span>
                    )}
                  </div>

                  <div className="p-2 rounded-lg bg-zinc-800/40 border border-zinc-800 text-[11px] font-semibold text-purple-300 mb-4 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{plan.highlightPerk}</span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2 text-xs text-zinc-300 mb-6">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Plan Action CTA */}
                <div>
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl text-xs font-semibold bg-zinc-800/80 text-zinc-400 border border-zinc-700 cursor-default flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Current Plan
                    </button>
                  ) : plan.id === 'creator' && !subscription.isTrialActive ? (
                    <button
                      onClick={() => handleStartFreeTrial('creator')}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-zinc-950 shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Start 7-Day Free Trial
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                        plan.popular
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      {plan.id === 'free' ? 'Downgrade to Free' : `Upgrade to ${plan.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Matrix Summary */}
        <div className="border-t border-zinc-800 px-6 sm:px-10 py-5 bg-zinc-900/40">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Cancel Anytime with 1 Click</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span>No Credit Card for 7-Day Trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-purple-400" />
              <span>25+ Neural Voices Included</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-orange-400" />
              <span>ID3 Tags & Lossless WAV</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
