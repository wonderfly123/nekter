'use client';

import { useState, useEffect } from 'react';
import { Droplet } from 'lucide-react';

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-sm shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Droplet className="w-5 h-5 text-white fill-white" />
          </div>
          <span className={`text-xl font-bold transition-colors ${
            scrolled ? 'text-gray-900' : 'text-white'
          }`}>
            Nekter
          </span>
        </a>

        {/* CTA Button */}
        <a
          href="https://demo.nekter.io"
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            scrolled
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
          }`}
        >
          Try Demo
        </a>
      </div>
    </header>
  );
}
