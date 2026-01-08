import { Droplet } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 animate-gradient" />

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-amber-300/15 rounded-full blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-20">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Droplet className="w-8 h-8 text-white fill-white" />
          </div>
          <span className="text-3xl font-bold text-white">Nekter</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Customer Success That Actually Succeeds
        </h1>

        {/* Subheadline */}
        <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
          Stop guessing which accounts need attention. Nekter watches the signals you can't—sentiment shifts, engagement drops, expansion moments—and tells you exactly where to focus.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4">
          <a
            href="https://demo.nekter.io"
            className="px-8 py-4 bg-white text-orange-600 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl"
          >
            Try the Demo
          </a>
          <span className="text-white/70 text-sm">No credit card required</span>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent" />
    </section>
  );
}
