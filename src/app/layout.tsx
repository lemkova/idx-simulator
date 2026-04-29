import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "IDX Sim | Trading Terminal",
  description: "IDX trading simulator with Hawkes process-driven agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrainsMono.variable} ${plusJakartaSans.variable} font-sans bg-term-base text-slate-300 h-screen flex flex-col overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
