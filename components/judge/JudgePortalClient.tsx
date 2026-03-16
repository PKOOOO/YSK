"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ClipboardList, Flag, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { flagConflict } from "@/app/actions/judges"

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectCard = {
  assignmentId: string
  projectId: string
  title: string
  schoolName: string
  teacherName: string
  projectCode: string | null
  schoolLevel: "JSS" | "SENIOR"
  aiSummary: string | null
  abstract: string | null
  categoryName: string
  categoryColor: string
  scored: boolean
}

type FilterTab = "all" | "pending" | "scored"

interface Props {
  judgeName: string
  projects: ProjectCard[]
  anonymousJudging: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

const SWATCH = [
  "#f472b6", "#3b82f6", "#10b981", "#f59e0b",
  "#8b5cf6", "#ef4444", "#0ea5e9", "#14b8a6",
]
function swatchFor(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return SWATCH[Math.abs(h) % SWATCH.length]
}

// ─── Single Project Card ──────────────────────────────────────────────────────

function ProjectCardItem({
  project,
  onClick,
  onFlagConflict,
  anonymousJudging,
}: {
  project: ProjectCard
  onClick: () => void
  onFlagConflict: () => void
  anonymousJudging: boolean
}) {
  const displayName = anonymousJudging
    ? project.projectCode ?? "Anonymous"
    : project.schoolName
  const initials = getInitials(displayName)
  const avatarColor = swatchFor(displayName)

  return (
    <div className="bg-white border border-black rounded-lg overflow-hidden flex flex-col w-full h-full hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all">
      {/* Color banner — clickable */}
      <button
        onClick={onClick}
        className="h-24 w-full flex items-center justify-center flex-shrink-0 text-left"
        style={{ backgroundColor: project.categoryColor }}
      >
        <span className="text-white font-bold text-sm px-4 text-center leading-tight drop-shadow-sm">
          {project.categoryName}
        </span>
      </button>

      {/* Content — clickable */}
      <button onClick={onClick} className="flex flex-col gap-3 p-4 flex-1 text-left w-full">
        <p className="text-base font-semibold leading-snug line-clamp-2">
          {project.title}
        </p>

        <div className="flex items-center gap-2">
          <div
            className="size-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 border border-black"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{displayName}</p>
            {!anonymousJudging && (
              <p className="text-xs text-muted-foreground truncate">{project.teacherName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-auto pt-1">
          <span
            className={cn(
              "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
              project.schoolLevel === "JSS"
                ? "border-blue-500 text-blue-700 bg-blue-50"
                : "border-purple-500 text-purple-700 bg-purple-50"
            )}
          >
            {project.schoolLevel}
          </span>

          {project.scored ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-green-600 text-green-700 bg-green-50">
              ✓ Scored
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-yellow-500 text-yellow-700 bg-yellow-50">
              Pending
            </span>
          )}
        </div>
      </button>

      {/* Card footer with Flag Conflict button — only for unscored projects */}
      {!project.scored && (
        <div className="px-4 pb-3 pt-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFlagConflict()
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-md bg-white text-muted-foreground hover:text-red-600 hover:border-red-400 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all"
          >
            <Flag className="size-3" />
            Flag Conflict
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function JudgePortalClient({ judgeName, projects, anonymousJudging }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<FilterTab>("all")
  const [conflictTarget, setConflictTarget] = useState<ProjectCard | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = projects.filter((p) => {
    if (tab === "pending") return !p.scored
    if (tab === "scored") return p.scored
    return true
  })

  const pendingCount = projects.filter((p) => !p.scored).length
  const scoredCount = projects.filter((p) => p.scored).length

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: projects.length },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "scored", label: "Scored", count: scoredCount },
  ]

  function handleFlagConflict() {
    if (!conflictTarget) return
    startTransition(async () => {
      const res = await flagConflict(conflictTarget.assignmentId)
      if (res.success) {
        toast.success("Conflict flagged — project has been unassigned from you.")
        setConflictTarget(null)
        router.refresh()
      } else {
        toast.error(res.error ?? "Failed to flag conflict")
      }
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Assigned Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, <span className="font-medium text-foreground">{judgeName}</span>
          </p>
        </div>

        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-sm font-bold rounded-full border border-black">
          <ClipboardList className="size-3.5" />
          {projects.length} project{projects.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-black rounded-full transition-all",
              tab === key
                ? "bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]"
                : "bg-white text-foreground hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px]"
            )}
          >
            {label}
            <span
              className={cn(
                "text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                tab === key ? "bg-white text-black" : "bg-[#F4F4F0] text-foreground"
              )}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Empty states ── */}
      {projects.length === 0 && (
        <div className="border border-black border-dashed rounded-xl p-16 flex flex-col items-center gap-4 bg-white text-center">
          <ClipboardList className="size-14 text-muted-foreground" />
          <div>
            <p className="font-bold text-base">No projects assigned yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back soon — the organizer will assign projects to you.
            </p>
          </div>
        </div>
      )}

      {projects.length > 0 && filtered.length === 0 && (
        <div className="border border-black border-dashed rounded-xl p-12 flex flex-col items-center gap-3 bg-white text-center">
          <p className="font-bold text-base">
            No {tab === "pending" ? "pending" : "scored"} projects
          </p>
          <p className="text-sm text-muted-foreground">
            {tab === "pending"
              ? "Great work — you've scored all your assigned projects!"
              : "You haven't scored any projects yet."}
          </p>
          <button
            onClick={() => setTab("all")}
            className="mt-1 px-4 py-2 text-sm font-semibold border border-black rounded bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all"
          >
            Show all
          </button>
        </div>
      )}

      {/* ── Project grid ── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project) => (
            <ProjectCardItem
              key={project.assignmentId}
              project={project}
              onClick={() => router.push(`/judge/score/${project.projectId}`)}
              onFlagConflict={() => setConflictTarget(project)}
              anonymousJudging={anonymousJudging}
            />
          ))}
        </div>
      )}

      {/* ── Conflict Confirmation Dialog ── */}
      <Dialog open={!!conflictTarget} onOpenChange={(open) => !open && setConflictTarget(null)}>
        <DialogContent className="max-w-sm border border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Flag Conflict of Interest?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This will permanently unassign{" "}
              <strong>{conflictTarget?.title}</strong> from you. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setConflictTarget(null)}
              disabled={isPending}
              className="px-4 py-2 text-sm font-semibold border border-black rounded bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleFlagConflict}
              disabled={isPending}
              className="px-5 py-2 text-sm font-bold bg-red-600 text-white border border-red-600 rounded hover:bg-red-700 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin inline mr-1.5" />
                  Flagging…
                </>
              ) : (
                "Flag & Unassign"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
