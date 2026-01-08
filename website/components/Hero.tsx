import { Sparkles, ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Content */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm mb-8">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-600">
              Now with AI-powered insights
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
            Customer success that
            <br />
            <span className="text-gradient">actually scales</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
            Acquiring a customer is expensive. Losing one you could've saved? That's just painful. Our intelligent system watches the signals you can't. Sentiment shifts, engagement drops, expansion moments.
          </p>
          <p className="text-2xl font-semibold text-gray-900 mb-10">
            Be the team that saw it coming.
          </p>

          {/* CTA */}
          <div className="flex justify-center mb-6">
            <a
              href="https://demo.nekter.io"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-orange-500/25"
            >
              Try the Demo
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>

        {/* Dashboard Mockup */}
        <div className="mt-16 relative">
          <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-200 overflow-hidden">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs text-gray-400">login.nekter.io</span>
              </div>
            </div>

            {/* Dashboard Content Mockup */}
            <div className="p-8 bg-gradient-to-b from-gray-50 to-white min-h-[400px]">
              {/* Top Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
                    <div className="h-6 w-12 bg-gradient-to-r from-amber-200 to-orange-200 rounded" />
                  </div>
                ))}
              </div>

              {/* Main Content Area */}
              <div className="grid grid-cols-3 gap-4">
                {/* Left Panel - Account List */}
                <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-4">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-100 to-orange-100" />
                      <div className="flex-1">
                        <div className="h-3 w-24 bg-gray-200 rounded mb-1" />
                        <div className="h-2 w-16 bg-gray-100 rounded" />
                      </div>
                      <div className={`h-6 w-16 rounded-full ${i <= 2 ? 'bg-green-100' : i === 3 ? 'bg-yellow-100' : 'bg-red-100'}`} />
                    </div>
                  ))}
                </div>

                {/* Right Panel - Health Score */}
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mb-4">
                    <div className="w-20 h-20 rounded-full border-4 border-amber-400 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-400">78</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-gray-100 rounded" />
                    <div className="h-2 w-3/4 bg-gray-100 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative gradients */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl -z-10" />
        </div>
      </div>
    </section>
  );
}
