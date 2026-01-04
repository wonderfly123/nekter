'use client';

import { FileText, Info, TrendingUp, Mail } from 'lucide-react';

interface QuickActionsSidebarProps {
  onQuickPrompt: (prompt: string) => void;
}

interface QuickAction {
  icon: typeof FileText;
  title: string;
  description: string;
  prompt: string;
}

const quickActions: QuickAction[] = [
  {
    icon: FileText,
    title: 'Create Account Plan',
    description: 'Generate a strategic account plan with goals, stakeholders, and success metrics',
    prompt:
      'Create a comprehensive account plan for [Account Name] including success criteria, key stakeholders, and quarterly objectives',
  },
  {
    icon: Info,
    title: 'Deep Interaction Analysis',
    description: 'Surface patterns, sentiment shifts, and hidden signals from all touchpoints',
    prompt:
      'Analyze all interactions with my critical accounts over the last 30 days. Identify sentiment trends, key concerns, and action items.',
  },
  {
    icon: TrendingUp,
    title: 'Expansion Analysis',
    description: 'Find upsell and cross-sell opportunities based on usage patterns',
    prompt:
      'Identify expansion opportunities in my portfolio based on product usage, engagement levels, and comparable accounts',
  },
  {
    icon: Mail,
    title: 'Draft Email',
    description: 'Generate personalized emails with account context and sentiment awareness',
    prompt:
      'Draft a follow-up email to [Account Name] addressing their recent concerns and proposing next steps',
  },
];

export function QuickActionsSidebar({ onQuickPrompt }: QuickActionsSidebarProps) {
  return (
    <div className="w-[320px] bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-4">
          Quick Actions
        </div>

        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => onQuickPrompt(action.prompt)}
              className="w-full text-left p-3.5 bg-gray-50 border border-gray-200 rounded-lg mb-3 hover:border-amber-500 hover:bg-amber-50 transition-all hover:translate-x-0.5 group"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-amber-600" />
                </div>
                <div className="font-semibold text-[15px] text-gray-900">
                  {action.title}
                </div>
              </div>
              <div className="text-[13px] text-gray-600 leading-relaxed pl-11">
                {action.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
