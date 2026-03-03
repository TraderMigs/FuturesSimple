import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FuturesSimple • App",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gradient-to-b from-black via-[#05070b] to-black">{children}</div>;
}
