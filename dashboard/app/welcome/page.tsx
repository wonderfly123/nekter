'use client';

import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { PageContainer } from '@/components/layout/page-container';
import { useAuth } from '@/lib/auth/use-auth';
import {
  LayoutDashboard,
  Bell,
  TrendingUp,
  Shield,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Target,
  Users,
  BarChart3
} from 'lucide-react';

export default function WelcomePage() {
  return (
    <AuthGuard>
      <WelcomeContent />
    </AuthGuard>
  );
}

function WelcomeContent() {
  const router = useRouter();
  const { user } = useAuth();
  const firstName = user?.user_metadata?.first_name || 'there';

  return (
    <PageContainer>
      {/* Hero Section */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Your Customer Success Command Center
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to Nekter, {firstName}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
          Acquiring a customer is expensive. Losing one you could've saved? That's just painful.
          Our intelligent system watches the signals you can't: sentiment shifts, engagement drops, expansion moments.
          It tells you exactly which accounts need attention and why. Be the team that saw it coming.
        </p>
      </div>

      {/* Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <ValueCard
          icon={<Target className="w-6 h-6" />}
          title="See Everything"
          description="Portfolio health, interactions, support tickets, and opportunities unified in one intelligent dashboard."
          gradient="from-blue-500 to-cyan-500"
        />
        <ValueCard
          icon={<TrendingUp className="w-6 h-6" />}
          title="Know What Matters"
          description="AI-powered prioritization surfaces high-risk accounts and expansion signals so you focus on what moves the needle."
          gradient="from-purple-500 to-pink-500"
        />
        <ValueCard
          icon={<Sparkles className="w-6 h-6" />}
          title="Act Smarter"
          description="Ask Barry anything about your accounts. Get evidence-backed answers from call transcripts, emails, and tickets."
          gradient="from-amber-500 to-orange-500"
        />
      </div>

      {/* Quick Start Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <QuickStartCard
            icon={<LayoutDashboard className="w-5 h-5" />}
            title="Portfolio"
            description="See your portfolio health at a glance"
            onClick={() => router.push('/portfolio')}
            highlight
          />
          <QuickStartCard
            icon={<ShieldAlert className="w-5 h-5" />}
            title="Save"
            description="At-risk accounts that need attention"
            onClick={() => router.push('/save')}
            highlight
          />
          <QuickStartCard
            icon={<TrendingUp className="w-5 h-5" />}
            title="Grow"
            description="Expansion opportunities to pursue"
            onClick={() => router.push('/grow')}
            highlight
          />
          <QuickStartCard
            icon={<Users className="w-5 h-5" />}
            title="Accounts"
            description="Browse and search your full portfolio"
            onClick={() => router.push('/all-accounts')}
            highlight
          />
          <QuickStartCard
            icon={<Sparkles className="w-5 h-5" />}
            title="Barry"
            description="Get instant answers about any account"
            onClick={() => router.push('/chat')}
            highlight
          />
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">What Nekter Does For You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureRow
            icon={<Shield className="w-5 h-5 text-status-error-text" />}
            title="Churn Risk Detection"
            description="Automatically flags accounts showing churn signals from sentiment analysis, engagement patterns, and explicit mentions."
          />
          <FeatureRow
            icon={<TrendingUp className="w-5 h-5 text-status-success-text" />}
            title="Expansion Opportunities"
            description="Surfaces growth signals when customers mention needs for additional features, seats, or services."
          />
          <FeatureRow
            icon={<Bell className="w-5 h-5 text-status-warning-text" />}
            title="Smart Alerts"
            description="Get notified via email, Slack, or in-app when health drops, bad interactions occur, or opportunities arise."
          />
          <FeatureRow
            icon={<BarChart3 className="w-5 h-5 text-status-info-text" />}
            title="Health Scoring"
            description="Composite health scores combine engagement, sentiment, support metrics, and activity to show true account health."
          />
        </div>
      </div>

      {/* Pro Tips */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pro Tips</h2>
        <div className="space-y-3">
          <ProTip text="Start each day on the Save page to see which accounts need immediate attention." />
          <ProTip text="Check Grow regularly to identify upsell and expansion opportunities." />
          <ProTip text="Ask Barry questions like 'What did Acme say about pricing?' to find key moments fast." />
          <ProTip text="Set up Slack notifications to get real-time alerts without checking the dashboard." />
        </div>
      </div>
    </PageContainer>
  );
}

function ValueCard({
  icon,
  title,
  description,
  gradient
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function QuickStartCard({
  icon,
  title,
  description,
  onClick,
  highlight
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-all group ${
        highlight
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md'
          : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
          highlight ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}>
          {icon}
        </div>
        <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
          highlight ? 'text-amber-400' : 'text-gray-400'
        }`} />
      </div>
      <h4 className="font-medium text-gray-900 dark:text-white mb-1">{title}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </button>
  );
}

function FeatureRow({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex-shrink-0 w-10 h-10 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{title}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
}

function ProTip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>
    </div>
  );
}
