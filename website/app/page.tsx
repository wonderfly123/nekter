import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Problem } from '@/components/Problem';
import { Features } from '@/components/Features';
import { HowItWorks } from '@/components/HowItWorks';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <Features />
        <HowItWorks />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
