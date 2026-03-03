/* =========================
   File #1: src/app/auth/page.tsx
   ========================= */
import { Suspense } from "react";
import AuthClient from "./AuthClient";

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-black via-[#05070b] to-black px-4 py-10">
          <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-white/70">
            Loading...
          </div>
        </main>
      }
    >
      <AuthClient />
    </Suspense>
  );
}
