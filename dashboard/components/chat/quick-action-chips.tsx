'use client';

import { FileText, Info, TrendingUp, Mail } from 'lucide-react';

interface QuickActionChipsProps {
  onActionClick: (prompt: string) => void;
}

interface QuickAction {
  icon: typeof FileText;
  label: string;
  description: string;
  prompt: string;
}

const quickActions: QuickAction[] = [
  {
    icon: FileText,
    label: 'Create Account Plan',
    description: 'Generate a strategic account plan with goals, stakeholders, and success metrics',
    prompt:
      'Create a comprehensive account plan for [Account Name] including success criteria, key stakeholders, and quarterly objectives',
  },
  {
    icon: Info,
    label: 'Deep Interaction Analysis',
    description: 'Surface patterns, sentiment shifts, and hidden signals from all touchpoints',
    prompt:
      'Analyze all interactions with my critical accounts over the last 30 days. Identify sentiment trends, key concerns, and action items.',
  },
  {
    icon: TrendingUp,
    label: 'Expansion Analysis',
    description: 'Find upsell and cross-sell opportunities based on usage patterns',
    prompt:
      'Identify expansion opportunities in my portfolio based on product usage, engagement levels, and comparable accounts',
  },
  {
    icon: Mail,
    label: 'Draft Email',
    description: 'Generate personalized emails with account context and sentiment awareness',
    prompt:
      'Draft a follow-up email to [Account Name] addressing their recent concerns and proposing next steps',
  },
];

export function QuickActionChips({ onActionClick }: QuickActionChipsProps) {
  return (
    <div className="py-12 px-6">
      {/* Welcome Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3 tracking-tight bg-gradient-to-r from-orange-500 from-0% via-amber-200 via-50% to-orange-500 to-100% bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
          Welcome to Barry
        </h2>
        <p className="text-base text-gray-600">
          Your Smart Customer Success Assistant
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => onActionClick(action.prompt)}
              className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5 text-left transition-all duration-300 cursor-pointer hover:bg-white hover:border-amber-500 hover:shadow-lg hover:-translate-y-0.5"
            >

              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center mb-3.5">
                <Icon className="w-5 h-5 text-orange-600" />
              </div>

              {/* Content */}
              <div className="font-semibold text-[15px] text-gray-900 mb-1.5">
                {action.label}
              </div>
              <div className="text-[13px] text-gray-600 leading-relaxed">
                {action.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Shimmer Text */}
      <div className="text-center mt-8">
        <p className="text-lg font-semibold bg-gradient-to-r from-orange-500 from-0% via-amber-200 via-50% to-orange-500 to-100% bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
          Or just ask me anything
        </p>
      </div>
    </div>
  );
}
