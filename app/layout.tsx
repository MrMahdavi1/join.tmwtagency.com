import type { Metadata } from "next";
import { PT_Serif, Quattrocento_Sans } from "next/font/google";
import "./globals.css";

const serif = PT_Serif({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Quattrocento_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Join Talk Money With Tish & Associates",
  description:
    "A few quick questions to find the right next step for you — a group presentation, a 1:1 interview, or a conversation with Tish.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Join Talk Money With Tish & Associates",
    description: "Find your right next step in under two minutes.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
