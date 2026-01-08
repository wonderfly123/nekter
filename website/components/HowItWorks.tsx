import { Link, Cpu, Target } from 'lucide-react';

const steps = [
  {
    number: '1',
    icon: Link,
    title: 'Connect your tools',
    description:
      'Sync your CRM, call recordings, support tickets, and email. We pull in the data you already have.',
  },
  {
    number: '2',
    icon: Cpu,
    title: 'AI does the work',
    description:
      'Nekter analyzes every interaction, scores account health, and surfaces what matters—automatically.',
  },
  {
    number: '3',
    icon: Target,
    title: 'Focus where it counts',
    description:
      'Start each day knowing exactly which accounts need attention and why. No more guessing.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-16">
          Up and running in minutes
        </h2>

        {/* Steps */}
        <div className="relative">
          {/* Connecting Line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-orange-200" />

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                {/* Step Number */}
                <div className="relative z-10 w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-8 h-8 text-gray-700" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
