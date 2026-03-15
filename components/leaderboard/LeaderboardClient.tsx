"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import {
  Trophy,
  Medal,
  Award,
  Download,
  Globe,
  Lock,
  Copy,
  Users,
  ChevronDown,
  Inbox,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toggleResultsPublic } from "@/app/actions/events"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// ─── Types ────────────────────────────────────────────────────────────────────

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
  judgeCount: number
}

interface LeaderboardClientProps {
  eventId: string
  eventName: string
  resultsPublic: boolean
  rows: Row[]
  categories: { id: string; name: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    icon: "text-amber-500",
    badge: "bg-amber-400 text-white",
    label: "🥇",
  },
  2: {
    bg: "bg-gray-50",
    border: "border-gray-400",
    platform: "bg-gray-400",
    icon: "text-gray-500",
    badge: "bg-gray-400 text-white",
    label: "🥈",
  },
  3: {
    bg: "bg-orange-50",
    border: "border-orange-300",
    platform: "bg-orange-300",
    icon: "text-orange-400",
    badge: "bg-orange-300 text-white",
    label: "🥉",
  },
} as const

const PLATFORM_HEIGHT = { 1: "h-28", 2: "h-20", 3: "h-12" } as const

// ─── Podium Card ──────────────────────────────────────────────────────────────

function PodiumCard({
  row,
  onClick,
}: {
  row: Row
  onClick: () => void
}) {
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
          className="px-2 py-0.5 text-xs font-bold rounded-full shrink-0"
          style={{ backgroundColor: row.categoryColor, color: "#fff" }}
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
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Users className="size-3" />
        {row.judgeCount} judge{row.judgeCount !== 1 ? "s" : ""}
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

// ─── Project Detail Dialog ────────────────────────────────────────────────────

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
          {/* Meta */}
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

          {/* Score breakdown */}
          <div className="border rounded-md overflow-hidden divide-y">
            <div className="px-4 py-3 bg-[#F4F4F0] flex items-center justify-between">
              <span className="text-sm font-medium">Score Breakdown</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="size-3" />
                {row.judgeCount} judge{row.judgeCount !== 1 ? "s" : ""} averaged
              </span>
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

          {/* Progress bar */}
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

export function LeaderboardClient({
  eventId,
  eventName,
  resultsPublic,
  rows,
  categories,
}: LeaderboardClientProps) {
  const [levelFilter, setLevelFilter] = useState<"ALL" | "JSS" | "SENIOR">("ALL")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isPublic, setIsPublic] = useState(resultsPublic)
  const [isPending, startTransition] = useTransition()
  const [selectedRow, setSelectedRow] = useState<Row | null>(null)

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/results/${eventId}`
      : `/results/${eventId}`

  // Filtered + re-ranked rows
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
  const rest = filtered.slice(3)

  // Podium order: 2nd left, 1st center, 3rd right
  const podiumSlots = [
    top3[1] ?? null,
    top3[0] ?? null,
    top3[2] ?? null,
  ]

  function handleTogglePublic() {
    startTransition(async () => {
      const result = await toggleResultsPublic(eventId, !isPublic)
      if (result.success) {
        setIsPublic(!isPublic)
        toast.success(isPublic ? "Leaderboard set to private" : "Leaderboard is now public")
      } else {
        toast.error(result.error ?? "Failed to toggle")
      }
    })
  }

  function handleExportCsv() {
    const headers = [
      "Rank",
      "Project Title",
      "School Name",
      "Category",
      "Level",
      "Final Score",
      "Max Score",
      "Number of Judges",
    ]
    const csvRows = filtered.map((r) =>
      [
        r.rank,
        `"${r.title.replace(/"/g, '""')}"`,
        `"${r.schoolName.replace(/"/g, '""')}"`,
        `"${r.categoryName.replace(/"/g, '""')}"`,
        r.schoolLevel,
        r.finalScore.toFixed(2),
        r.maxScore,
        r.judgeCount,
      ].join(",")
    )
    const csv = [headers.join(","), ...csvRows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${eventName.replace(/\s+/g, "_")}_leaderboard.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV downloaded")
  }

  function handleCopyUrl() {
    navigator.clipboard.writeText(publicUrl)
    toast.success("URL copied to clipboard")
  }

  return (
    <div className="min-h-screen bg-[#F4F4F0]">
      {/* Page Header */}
      <div className="px-4 lg:px-12 py-7 border-b bg-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Admin Dashboard
            </p>
            <h1 className="text-2xl font-medium flex items-center gap-2">
              <Trophy className="size-5" />
              Leaderboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{eventName}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-md bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <Download className="size-4" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-12 py-8 flex flex-col gap-6">
        {/* Admin Controls */}
        <div className="bg-white border rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Public Leaderboard</p>
            <p className="text-xs text-muted-foreground">
              Allow anyone with the link to see the results
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {isPublic && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                <Globe className="size-3.5 shrink-0 text-green-500" />
                <span className="truncate max-w-[180px] sm:max-w-[240px]">{publicUrl}</span>
                <button
                  onClick={handleCopyUrl}
                  className="p-1 rounded border bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all shrink-0"
                  title="Copy URL"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={handleTogglePublic}
              disabled={isPending}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px]",
                isPublic
                  ? "bg-white text-foreground"
                  : "bg-black text-white hover:bg-pink-400 hover:text-primary border-black"
              )}
            >
              {isPublic ? (
                <>
                  <Lock className="size-4" /> Make Private
                </>
              ) : (
                <>
                  <Globe className="size-4" /> Make Public
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Level tabs */}
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

          {/* Category dropdown */}
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

          {/* Count */}
          {filtered.length > 0 && (
            <span className="text-sm text-muted-foreground ml-auto">
              {filtered.length} project{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="border border-black border-dashed flex flex-col items-center justify-center p-14 gap-4 bg-white rounded-lg text-center">
            <Inbox className="size-10 text-muted-foreground" />
            <div>
              <p className="text-base font-medium">No scores submitted yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                The leaderboard will appear once judges submit their scores.
              </p>
            </div>
          </div>
        )}

        {filtered.length > 0 && (
          <>
            {/* ── Podium ────────────────────────────────────────────────── */}
            {top3.length >= 1 && (
              <div>
                <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  Top {top3.length}
                </h2>

                <div className="flex items-end gap-3 justify-center sm:gap-4">
                  {podiumSlots.map((row, slotIdx) => {
                    if (!row) {
                      // Render empty slot placeholder to keep layout
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
                        {/* Platform step */}
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

            {/* ── Full Ranked List ──────────────────────────────────────── */}
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
                      {/* Rank */}
                      <RankBadge rank={row.rank} />

                      {/* Info */}
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
                          {row.schoolName} &middot;{" "}
                          <span className="inline-flex items-center gap-0.5">
                            <Users className="size-3" />
                            {row.judgeCount} judge{row.judgeCount !== 1 ? "s" : ""}
                          </span>
                        </p>

                        {/* Progress bar */}
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

                      {/* Score */}
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
      </div>

      {/* Detail Dialog */}
      <DetailDialog
        row={selectedRow}
        open={selectedRow !== null}
        onClose={() => setSelectedRow(null)}
      />
    </div>
  )
}
