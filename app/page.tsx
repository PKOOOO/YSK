import Image from "next/image"
import Link from "next/link"
import {
  Upload,
  ClipboardCheck,
  Trophy,
} from "lucide-react"
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards"
import { LandingNav } from "@/components/landing/LandingNav"
import { getCurrentUser } from "@/lib/auth"

// ─── Data ──────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "The AI summaries saved hours of reading time. Judging has never been this efficient.",
    name: "Dr. Kamau",
    title: "Physics Judge, KSEF 2025",
  },
  {
    quote: "Finally a platform that follows the official KSEF criteria properly. Very impressed.",
    name: "Prof. Akinyi",
    title: "Biology Judge, KSEF 2025",
  },
  {
    quote: "I judged 15 projects in one afternoon using my phone. The mobile experience is excellent.",
    name: "Eng. Wanjiru",
    title: "Engineering Judge, KSEF 2025",
  },
  {
    quote: "The anonymous mode ensures completely unbiased evaluation. This is how it should be.",
    name: "Dr. Odhiambo",
    title: "Chemistry Judge, KSEF 2025",
  },
  {
    quote: "Submitting our school's projects took less than 5 minutes. Very straightforward.",
    name: "Teacher, Nairobi Academy",
    title: "Science Fair Participant",
  },
]

const STEPS = [
  {
    num: "01",
    Icon: Upload,
    title: "Teachers Submit",
    description:
      "Upload research documents (PDF or Word). AI reads and summarizes automatically.",
  },
  {
    num: "02",
    Icon: ClipboardCheck,
    title: "Judges Evaluate",
    description:
      "Score projects using official KSEF Part A, B, C criteria on any device.",
  },
  {
    num: "03",
    Icon: Trophy,
    title: "Results Published",
    description:
      "Live leaderboard and public results page with final school rankings.",
  },
]

const FEATURES = [
  {
    icon: "🤖",
    title: "AI Document Analysis",
    description: "Automatically generates project summaries from uploaded PDFs and Word documents.",
  },
  {
    icon: "📊",
    title: "Official KSEF Criteria",
    description: "Follows the exact Part A, B, C marking scheme for JSS (65 marks) and Senior (80 marks).",
  },
  {
    icon: "🔒",
    title: "Anonymous Judging",
    description: "Optional anonymous mode shows only project codes, ensuring fully unbiased evaluation.",
  },
  {
    icon: "📱",
    title: "Mobile + PWA",
    description: "Installable Progressive Web App — works on any phone, tablet, or laptop.",
  },
  {
    icon: "🏆",
    title: "Live Leaderboard",
    description: "Real-time ranked results across categories with podium display for top projects.",
  },
  {
    icon: "📄",
    title: "Export Results",
    description: "Download full results as CSV for reporting, analysis, and school feedback letters.",
  },
]

// ─── Score Card Mockup ──────────────────────────────────────────────────────────

function ScoreCardMockup() {
  return (
    <div className="border border-black rounded-xl overflow-hidden bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-200 w-full max-w-sm mx-auto">
      {/* Pink banner */}
      <div className="bg-pink-400 px-5 py-3 flex items-center justify-between">
        <span className="text-white font-bold text-sm tracking-wide">Engineering</span>
        <span className="text-white/80 text-xs font-mono">PRJ-042</span>
      </div>

      {/* Card body */}
      <div className="p-5 flex flex-col gap-4">
        <div>
          <h3 className="font-bold text-lg leading-snug">Solar Water Purifier</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="size-6 rounded-full bg-pink-100 border border-pink-300 flex items-center justify-center text-xs font-bold text-pink-600">M</div>
            <span className="text-sm text-muted-foreground">Makande Girls School</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { label: "Part A — Written", pct: 85, value: "25", max: "30" },
            { label: "Part B — Oral", pct: 67, value: "10", max: "15" },
            { label: "Part C — Scientific", pct: 80, value: "28", max: "35" },
          ].map(({ label, pct, value, max }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-semibold">{value}/{max}</span>
              </div>
              <div className="h-2 bg-[#F4F4F0] border border-black/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-black/10 pt-3 flex items-center justify-between">
          <span className="text-sm font-semibold">Grand Total</span>
          <span className="text-2xl font-bold text-pink-500">
            63<span className="text-sm font-normal text-muted-foreground">/80</span>
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const user = await getCurrentUser().catch(() => null)
  const role = user?.role as "ADMIN" | "JUDGE" | null | undefined

  return (
    <div className="bg-[#F4F4F0] min-h-screen">
      {/* ── Navbar ── */}
      <LandingNav role={role} />

      {/* ── Hero ── */}
      <section className="min-h-screen flex items-center border-b border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="flex flex-col gap-7">
              <span className="border border-black rounded-full px-3 py-1 text-sm w-fit bg-white">
                🔬 Official KSEF Judging Platform
              </span>

              <h1 className="text-5xl lg:text-6xl font-medium leading-tight tracking-tight">
                Science Fair Judging,{" "}
                <span className="text-pink-500">Reimagined.</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                AI-powered evaluation platform for Kenya&apos;s Young Scientists. Fair, transparent,
                and built for the modern science fair.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/submit"
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold bg-black text-white rounded-md border border-black hover:bg-pink-400 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
                >
                  Submit Your Project
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold bg-white text-black rounded-md border border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
                >
                  Judge Sign In
                </Link>
              </div>

              {/* Trust pills */}
              <div className="flex items-center gap-3 flex-wrap">
                {["✓ KSEF Official", "✓ AI-Powered", "✓ Mobile PWA"].map((pill, i) => (
                  <span key={pill} className="flex items-center gap-3 text-sm text-muted-foreground">
                    {i > 0 && <span className="text-black/20">·</span>}
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — Score card mockup */}
            <div className="flex items-center justify-center lg:justify-end">
              <ScoreCardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Partners Strip ── */}
      <section className="border-y border-black/10 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Trusted by
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            <Image
              src="/ysk.png"
              alt="Young Scientists Kenya"
              width={120}
              height={48}
              className="h-12 w-auto object-contain"
            />
            <Image
              src="/tka.png"
              alt="TechKidz Africa"
              width={120}
              height={48}
              className="h-12 w-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
              Process
            </p>
            <h2 className="text-3xl font-medium">Three simple steps</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map(({ num, Icon, title, description }) => (
              <div
                key={num}
                className="bg-white border border-black rounded-xl p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-pink-400">{num}</span>
                  <Icon className="size-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials / Infinite Moving Cards ── */}
      <section className="py-16 bg-white border-y border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
            What Judges Say
          </p>
          <h2 className="text-3xl font-medium">From the field</h2>
        </div>
        <InfiniteMovingCards
          items={TESTIMONIALS}
          direction="left"
          speed="slow"
        />
      </section>

      {/* ── Features ── */}
      <section className="py-24 bg-[#F4F4F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">
              Features
            </p>
            <h2 className="text-3xl font-medium">Everything you need</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon, title, description }) => (
              <div
                key={title}
                className="bg-white border border-black rounded-xl p-6 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all flex flex-col gap-3"
              >
                <span className="text-2xl">{icon}</span>
                <h3 className="font-medium text-base">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


    </div>
  )
}
