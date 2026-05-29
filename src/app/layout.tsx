import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono, Cinzel } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-brand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Infinity Reader — Deep Focus Reading",
  description:
    "A distraction-free PDF reader for deep focus. Built by Infinity Blocks.",
  keywords: ["pdf reader", "focus mode", "notion widget", "infinity blocks"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`min-h-screen bg-space-black ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${cinzel.variable}`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
