"use client"

import { useMemo, useState } from "react"
import {
  Trophy,
  Medal,
  Award,
  ChevronDown,
  Inbox,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Row = {
  rank: number
  projectId: string
  title: string
  schoolName: string
  schoolLevel: "JSS" | "SENIOR"
  categoryId: string
  categoryName: string
  categoryColor: string
  finalScore: number
  partA: number
  partB: number
  partC: number
  maxScore: number
}

interface PublicResultsClientProps {
  eventName: string
  eventType: string
  rows: Row[]
  categories: { id: string; name: string }[]
}

function fmt(n: number) {
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)
}

function pct(score: number, max: number) {
  if (max === 0) return 0
  return Math.min(100, (score / max) * 100)
}

const PODIUM_COLORS = {
  1: {
    bg: "bg-amber-50",
    border: "border-amber-400",
    platform: "bg-amber-400",
    label: "🥇",
  },
  2: {
    bg: "bg-gray-50",
    border: "border-gray-400",
    platform: "bg-gray-400",
    label: "🥈",
  },
  3: {
    bg: "bg-orange-50",
    border: "border-orange-300",
    platform: "bg-orange-300",
    label: "🥉",
  },
} as const

const PLATFORM_HEIGHT = { 1: "h-28", 2: "h-20", 3: "h-12" } as const

// ─── Podium Card ──────────────────────────────────────────────────────────────

function PodiumCard({ row, onClick }: { row: Row; onClick: () => void }) {
  const c = PODIUM_COLORS[row.rank as 1 | 2 | 3]

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left border-2 rounded-t-md p-4 flex flex-col gap-2 transition-all",
        c.bg,
        c.border,
        "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-2xl leading-none">{c.label}</span>
        <span
          className="px-2 py-0.5 text-xs font-bold rounded-full shrink-0 text-white"
          style={{ backgroundColor: row.categoryColor }}
        >
          {row.categoryName}
        </span>
      </div>
      <p className="text-sm font-medium leading-snug line-clamp-2">{row.title}</p>
      <p className="text-xs text-muted-foreground">{row.schoolName}</p>
      <div className="flex items-baseline gap-1 mt-auto pt-1">
        <span className="text-3xl font-bold text-pink-500">{fmt(row.finalScore)}</span>
        <span className="text-xs text-muted-foreground">/ {row.maxScore}</span>
      </div>
    </button>
  )
}

// ─── Rank Badge ───────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="size-8 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
        <Trophy className="size-4 text-white" />
      </div>
    )
  if (rank === 2)
    return (
      <div className="size-8 rounded-full bg-gray-400 flex items-center justify-center shrink-0">
        <Medal className="size-4 text-white" />
      </div>
    )
  if (rank === 3)
    return (
      <div className="size-8 rounded-full bg-orange-400 flex items-center justify-center shrink-0">
        <Award className="size-4 text-white" />
      </div>
    )
  return (
    <div className="size-8 rounded-full bg-white border flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-muted-foreground">#{rank}</span>
    </div>
  )
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function DetailDialog({
  row,
  open,
  onClose,
}: {
  row: Row | null
  open: boolean
  onClose: () => void
}) {
  if (!row) return null
  const scoreColor =
    pct(row.finalScore, row.maxScore) >= 70
      ? "bg-green-400"
      : pct(row.finalScore, row.maxScore) >= 40
      ? "bg-amber-400"
      : "bg-pink-400"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-black bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium leading-snug">{row.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <span
              className="px-2.5 py-1 text-xs font-medium text-white rounded-full"
              style={{ backgroundColor: row.categoryColor }}
            >
              {row.categoryName}
            </span>
            <span
              className={cn(
                "px-2.5 py-1 text-xs font-medium text-white rounded-full",
                row.schoolLevel === "JSS" ? "bg-blue-500" : "bg-purple-500"
              )}
            >
              {row.schoolLevel}
            </span>
            <span className="px-2.5 py-1 text-xs font-medium border rounded-full">
              #{row.rank} Rank
            </span>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              School
            </p>
            <p className="font-medium mt-0.5">{row.schoolName}</p>
          </div>

          <div className="border rounded-md overflow-hidden divide-y">
            <div className="px-4 py-3 bg-[#F4F4F0] flex items-center justify-between">
              <span className="text-sm font-medium">Score Breakdown</span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Part A — Written</span>
              <span className="font-medium">{fmt(row.partA)}</span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Part B — Oral</span>
              <span className="font-medium">{fmt(row.partB)}</span>
            </div>
            <div className="px-4 py-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Part C — Scientific</span>
              <span className="font-medium">{fmt(row.partC)}</span>
            </div>
            <div className="px-4 py-3 flex justify-between items-center">
              <span className="font-medium">Final Score</span>
              <span className="text-2xl font-bold text-pink-500">
                {fmt(row.finalScore)}
                <span className="text-sm font-normal text-muted-foreground">
                  /{row.maxScore}
                </span>
              </span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn("h-2 rounded-full transition-all", scoreColor)}
              style={{ width: `${pct(row.finalScore, row.maxScore)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right -mt-2">
            {pct(row.finalScore, row.maxScore).toFixed(1)}% of max score
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PublicResultsClient({
  eventName,
  eventType,
  rows,
  categories,
}: PublicResultsClientProps) {
  const [levelFilter, setLevelFilter] = useState<"ALL" | "JSS" | "SENIOR">("ALL")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedRow, setSelectedRow] = useState<Row | null>(null)

  const filtered = useMemo(() => {
    return rows
      .filter((r) => {
        if (levelFilter !== "ALL" && r.schoolLevel !== levelFilter) return false
        if (categoryFilter !== "all" && r.categoryId !== categoryFilter) return false
        return true
      })
      .map((r, idx) => ({ ...r, rank: idx + 1 }))
  }, [rows, levelFilter, categoryFilter])

  const top3 = filtered.slice(0, 3)
  const podiumSlots = [top3[1] ?? null, top3[0] ?? null, top3[2] ?? null]

  return (
    <div className="min-h-screen bg-[#F4F4F0]">
      {/* ── Event Header ─────────────────────────────────────────────── */}
      <div className="px-4 lg:px-12 py-8 border-b bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="px-2 py-1 border bg-pink-400 w-fit">
                  <span className="text-sm font-medium">{eventType}</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-[40px] font-medium leading-tight">{eventName}</h1>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                <Trophy className="size-4" />
                Official Results
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-12 py-8 max-w-5xl mx-auto flex flex-col gap-6">
        {/* ── Filter Bar ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex items-center border rounded-md bg-white overflow-hidden shrink-0">
            {(["ALL", "JSS", "SENIOR"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-all",
                  levelFilter === level
                    ? "bg-black text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
                )}
              >
                {level === "ALL" ? "All Levels" : level}
              </button>
            ))}
          </div>

          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm font-medium border rounded-md bg-white cursor-pointer focus:outline-none hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="size-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          {filtered.length > 0 && (
            <span className="text-sm text-muted-foreground ml-auto">
              {filtered.length} project{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* ── Empty State ─────────────────────────────────────────────── */}
        {filtered.length === 0 && (
          <div className="border border-black border-dashed flex flex-col items-center justify-center p-14 gap-4 bg-white rounded-lg text-center">
            <Inbox className="size-10 text-muted-foreground" />
            <div>
              <p className="text-base font-medium">No results to show</p>
              <p className="text-sm text-muted-foreground mt-1">
                There are no scored projects matching the current filters.
              </p>
            </div>
          </div>
        )}

        {filtered.length > 0 && (
          <>
            {/* ── Podium ──────────────────────────────────────────────── */}
            {top3.length >= 1 && (
              <div>
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  Top {top3.length}
                </h2>

                <div className="flex items-end gap-3 justify-center sm:gap-4">
                  {podiumSlots.map((row, slotIdx) => {
                    if (!row) {
                      return <div key={`empty-${slotIdx}`} className="flex-1 max-w-[220px]" />
                    }
                    const platformH = PLATFORM_HEIGHT[row.rank as 1 | 2 | 3]
                    const platformColor = PODIUM_COLORS[row.rank as 1 | 2 | 3].platform

                    return (
                      <div
                        key={row.projectId}
                        className="flex-1 max-w-[220px] flex flex-col"
                      >
                        <PodiumCard row={row} onClick={() => setSelectedRow(row)} />
                        <div
                          className={cn(
                            "rounded-b-md flex items-center justify-center",
                            platformH,
                            platformColor
                          )}
                        >
                          <span className="text-white font-bold text-xl">
                            {row.rank}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Full Rankings ────────────────────────────────────────── */}
            <div>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Full Rankings
              </h2>

              <div className="bg-white border rounded-md overflow-hidden divide-y">
                {filtered.map((row) => {
                  const progress = pct(row.finalScore, row.maxScore)
                  const barColor =
                    progress >= 70
                      ? "bg-green-400"
                      : progress >= 40
                      ? "bg-amber-400"
                      : "bg-pink-400"

                  return (
                    <button
                      key={row.projectId}
                      onClick={() => setSelectedRow(row)}
                      className="w-full text-left px-4 py-4 flex items-center gap-4 hover:bg-[#F4F4F0] transition-colors group"
                    >
                      <RankBadge rank={row.rank} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 flex-wrap">
                          <p className="text-sm font-medium leading-snug line-clamp-1 flex-1">
                            {row.title}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                              style={{ backgroundColor: row.categoryColor }}
                            >
                              {row.categoryName}
                            </span>
                            <span
                              className={cn(
                                "px-2 py-0.5 text-xs font-medium rounded-full text-white",
                                row.schoolLevel === "JSS"
                                  ? "bg-blue-500"
                                  : "bg-purple-500"
                              )}
                            >
                              {row.schoolLevel}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                          {row.schoolName}
                        </p>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={cn("h-1.5 rounded-full", barColor)}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-pink-500">
                          {fmt(row.finalScore)}
                        </p>
                        <p className="text-xs text-muted-foreground">/ {row.maxScore}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer className="border-t pt-6 pb-4 mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by{" "}
            <span className="font-medium text-foreground">YSK Judging Platform</span>
          </p>
        </footer>
      </div>

      <DetailDialog
        row={selectedRow}
        open={selectedRow !== null}
        onClose={() => setSelectedRow(null)}
      />
    </div>
  )
}
