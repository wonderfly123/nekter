import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppLayout } from "@/components/layout/app-layout";
import { SpeedInsights } from "@vercel/speed-insights/next";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "nekter.io - Admin Panel",
  description: "Customer Success dashboard for monitoring account health and prioritizing at-risk accounts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
