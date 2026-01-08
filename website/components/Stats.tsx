const stats = [
  {
    value: '7x',
    description: 'more expensive to acquire a new customer than to retain an existing one',
  },
  {
    value: '91%',
    description: 'of unhappy customers leave without complaining—they just churn silently',
  },
  {
    value: '3',
    description: 'new customers needed to make up for the loss of one existing customer',
  },
];

export function Stats() {
  return (
    <section className="py-24 px-6 bg-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
          Retention isn't just important. It's everything.
        </h2>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-12 text-center">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-4">
                {stat.value}
              </div>
              <p className="text-gray-400 text-lg leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
