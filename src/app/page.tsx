import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function Landing() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#05070b] to-black" />
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="text-sm tracking-wide text-white/80">FuturesSimple</div>
        <div className="flex items-center gap-2">
          <Link href="/auth">
            <Button variant="ghost" small>Log In</Button>
          </Link>
          <Link href="/auth?mode=signup">
            <Button small>Sign Up</Button>
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-16 pt-8 md:grid-cols-2 md:pt-14">
        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
            5 Futures Setups. <span className="text-white/70">SMC logic.</span> <br />
            Elite + Newbie explanations.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70">
            Mobile-first. Dark. Fast. Built for execution: entry, stop, 3 targets, copy buttons, and a live risk/tick calculator.
          </p>
          <div className="mt-6 flex gap-2">
            <Link href="/auth?mode=signup">
              <Button>Start</Button>
            </Link>
            <Link href="/auth">
              <Button variant="ghost">Log In</Button>
            </Link>
          </div>
          <div className="mt-6 text-xs text-white/45">
            Risk Disclaimer: Futures trading involves substantial risk. This tool is informational only.
          </div>
        </div>

        <div className="relative">
          <Card className="relative mx-auto w-full max-w-md p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/70">Elite View</div>
              <div className="text-[10px] rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/60">
                Live UI Preview
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">ES</div>
                  <div className="text-xs text-white/60">1H • Long</div>
                </div>
                <div className="mt-2 text-xs text-white/60">
                  Confidence <span className="text-white">82%</span> • Entry 5021.25 • SL 5014.75 • TP1/2/3
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">NQ</div>
                  <div className="text-xs text-white/60">4H • Short</div>
                </div>
                <div className="mt-2 text-xs text-white/60">
                  Confidence <span className="text-white">76%</span> • Entry 17982.00 • SL 18044.00 • TP1/2/3
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">CL</div>
                  <div className="text-xs text-white/60">1D • Long</div>
                </div>
                <div className="mt-2 text-xs text-white/60">
                  Confidence <span className="text-white">71%</span> • Entry 77.42 • SL 76.88 • TP1/2/3
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
              Calculator synced to selected trade • Copy buttons • History tracking
            </div>
          </Card>

          <div className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-white/5 blur-2xl" />
        </div>
      </section>

      <footer className="relative z-10 mx-auto max-w-6xl px-4 pb-10 text-xs text-white/45">
        <div className="flex flex-wrap gap-4">
          <span>© {new Date().getFullYear()} FuturesSimple</span>
          <span>Terms</span>
          <span>Privacy</span>
          <span>Risk Disclosure</span>
        </div>
      </footer>
    </main>
  );
}
