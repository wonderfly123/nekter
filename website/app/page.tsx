import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Logos } from '@/components/Logos';
import { Stats } from '@/components/Stats';
import { Features } from '@/components/Features';
import { Testimonials } from '@/components/Testimonials';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Logos />
        <Stats />
        <Features />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
