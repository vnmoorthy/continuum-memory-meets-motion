import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://continuum-memory-meets-motion.vercel.app"),
  title: "Continuum — Open Loop OS",
  description:
    "Open Loop OS: measure unfinished work as Open Loop Debt, burn it with Cited Motion, write results back into memory.",
  openGraph: {
    title: "Continuum — Open Loop OS",
    description: "Memory Meets Motion: durable graphs + autonomous loop closure.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Continuum — Open Loop OS",
    description: "Memory that moves. Debt you can burn.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} ${jetbrains.variable} h-full`}
    >
      <body className="relative min-h-full flex flex-col antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <div className="atmosphere" aria-hidden />
        <div className="noise" aria-hidden />
        <div className="relative z-10 flex min-h-full flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
