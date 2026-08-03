import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${ibmMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <div className="noise" aria-hidden />
        {children}
      </body>
    </html>
  );
}
