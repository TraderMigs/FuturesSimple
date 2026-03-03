import "./globals.css";
import type { Metadata } from "next";
import { GeistMono } from "next/font/google";

const mono = GeistMono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FuturesSimple",
  description: "SMC-based futures trade ideas + risk calculator",
  manifest: "/manifest.webmanifest",
  themeColor: "#05070b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={mono.className + " bg-black text-white"}>{children}</body>
    </html>
  );
}
