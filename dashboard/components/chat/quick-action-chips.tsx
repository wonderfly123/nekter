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
    <div className="flex flex-wrap gap-2 mt-4">
      {quickActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <div key={index} className="relative group">
            <button
              onClick={() => onActionClick(action.prompt)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-700 transition-colors"
            >
              <Icon className="w-4 h-4" />
              <span>{action.label}</span>
            </button>

            {/* Tooltip */}
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
              <div className="text-gray-300">{action.description}</div>
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
