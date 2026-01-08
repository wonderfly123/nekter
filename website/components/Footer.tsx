import { Droplet } from 'lucide-react';

export function Footer() {
  return (
    <>
      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to stop guessing?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            See which accounts need you—before it's too late.
          </p>
          <a
            href="https://demo.nekter.io"
            className="inline-block px-8 py-4 bg-white text-orange-600 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl"
          >
            Try the Demo
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Droplet className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-white font-semibold">Nekter</span>
            <span className="text-gray-500 text-sm ml-2">© 2025</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="https://demo.nekter.io"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Try Demo
            </a>
            <a
              href="mailto:hello@nekter.io"
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
