import { MessageSquare, Zap, BarChart3, Users, Shield, Globe } from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'Unified Inbox',
    description:
      'All your customer interactions in one place. Calls, emails, tickets, and more. Never miss a signal.',
  },
  {
    icon: Zap,
    title: 'AI-Powered Detection',
    description:
      'Smart analysis of sentiment, churn signals, and expansion opportunities. Let AI handle the pattern recognition.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description:
      'Track health scores, engagement trends, and team performance with beautiful, actionable dashboards.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Internal notes, task assignments, and alerts. Work together seamlessly on complex accounts.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'SOC 2 compliant with SSO support and granular permissions. Your data is protected at every level.',
  },
  {
    icon: Globe,
    title: 'Integrations',
    description:
      'Connect Salesforce, call recording platforms, and support tools. We pull in the data you already have.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything you need to deliver
            <br />
            <span className="text-gradient">exceptional results</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features designed for modern CS teams. Scale from startup to enterprise without switching tools.
          </p>
        </div>

        {/* Feature Grid - 3x2 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-200"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
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
