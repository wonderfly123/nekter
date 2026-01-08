import { LayoutDashboard, ShieldAlert, TrendingUp, Sparkles } from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    title: 'See your entire portfolio at a glance',
    description:
      'Health scores combine engagement, sentiment, support metrics, and activity into one clear view. Know instantly which accounts are thriving and which need attention.',
  },
  {
    icon: ShieldAlert,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    title: 'Catch warning signs before it\'s too late',
    description:
      'AI analyzes call transcripts, emails, and tickets to surface churn signals—sentiment drops, competitor mentions, frustration patterns—so you can act fast.',
  },
  {
    icon: TrendingUp,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    title: 'Spot growth moments automatically',
    description:
      'Know when customers mention needing more seats, new features, or additional services. Never miss an upsell because it was buried in a call.',
  },
  {
    icon: Sparkles,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    title: 'Ask anything about any account',
    description:
      'Need to know what Acme said about pricing last month? Just ask Barry. Get instant, evidence-backed answers from all your customer interactions.',
  },
];

export function Features() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
          Everything you need to protect and grow your accounts
        </h2>
        <p className="text-lg text-gray-600 text-center mb-16 max-w-2xl mx-auto">
          One platform that brings together health monitoring, risk detection, and AI-powered insights.
        </p>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"
            >
              <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6`}>
                <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
