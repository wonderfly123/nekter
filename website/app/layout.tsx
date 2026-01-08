import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'Nekter - Customer Success That Actually Succeeds',
  description: 'Stop guessing which accounts need attention. Nekter watches the signals you can\'t—sentiment shifts, engagement drops, expansion moments—and tells you exactly where to focus.',
  keywords: ['customer success', 'churn prevention', 'account health', 'AI', 'SaaS'],
  openGraph: {
    title: 'Nekter - Customer Success That Actually Succeeds',
    description: 'Stop guessing which accounts need attention. Nekter watches the signals you can\'t.',
    type: 'website',
    url: 'https://nekter.io',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
