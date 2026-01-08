import { AlertTriangle, Search, Clock } from 'lucide-react';

const painPoints = [
  {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50',
    text: 'You find out a customer is unhappy... after they\'ve already churned.',
  },
  {
    icon: Search,
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-100',
    text: 'You\'re buried in dashboards but still don\'t know which accounts actually need you.',
  },
  {
    icon: Clock,
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-100',
    text: 'By the time you spot a problem, it\'s too late to fix it.',
  },
];

export function Problem() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">
          Sound familiar?
        </h2>

        {/* Pain Points */}
        <div className="space-y-6 mb-16">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-200 shadow-sm"
            >
              <div className={`p-3 rounded-lg ${point.bgColor}`}>
                <point.icon className={`w-6 h-6 ${point.iconColor}`} />
              </div>
              <p className="text-lg text-gray-700 leading-relaxed pt-2">
                {point.text}
              </p>
            </div>
          ))}
        </div>

        {/* Transition */}
        <p className="text-2xl md:text-3xl font-semibold text-center text-gray-900">
          What if you could see it coming?
        </p>
      </div>
    </section>
  );
}
