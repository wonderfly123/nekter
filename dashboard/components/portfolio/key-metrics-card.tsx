'use client';

interface KeyMetric {
  label: string;
  value: string;
  percentage: number;
  color: 'green' | 'amber' | 'red';
}

export function KeyMetricsCard() {
  // Mock data - in production, these would come from actual queries
  const metrics: KeyMetric[] = [
    {
      label: 'NPS Score',
      value: '42',
      percentage: 70,
      color: 'green',
    },
    {
      label: 'Expansion Rate',
      value: '18%',
      percentage: 18,
      color: 'amber',
    },
    {
      label: 'Response Time',
      value: '2.4h',
      percentage: 88,
      color: 'green',
    },
  ];

  const getColorClasses = (color: 'green' | 'amber' | 'red') => {
    switch (color) {
      case 'green':
        return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'amber':
        return 'bg-gradient-to-r from-amber-500 to-amber-600';
      case 'red':
        return 'bg-gradient-to-r from-red-500 to-red-600';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8">
      <div className="mb-6">
        <h3 className="text-[18px] font-bold text-gray-900">Key Metrics</h3>
      </div>
      <div className="space-y-6">
        {metrics.map((metric, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[15px] text-gray-600 font-semibold">{metric.label}</span>
              <span className="font-mono font-bold text-[15px] text-gray-900">{metric.value}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${getColorClasses(metric.color)}`}
                style={{ width: `${metric.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
