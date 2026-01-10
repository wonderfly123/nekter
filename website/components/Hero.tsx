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

        {/* Dashboard Demo Video */}
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

            {/* Video */}
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full"
            >
              <source src="/demo.mp4" type="video/mp4" />
            </video>
          </div>

          {/* Description blurb */}
          <p className="text-center text-gray-500 text-sm mt-6 max-w-2xl mx-auto">
            Nekter is an AI-powered platform that analyzes customer interactions and usage data to detect churn risk, surface expansion opportunities, and help customer success and account management teams proactively save and grow accounts.
          </p>

          {/* Decorative gradients */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl -z-10" />
        </div>
      </div>
    </section>
  );
}
