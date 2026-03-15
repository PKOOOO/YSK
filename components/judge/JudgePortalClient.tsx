"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ClipboardList } from "lucide-react"
import { cn } from "@/lib/utils"

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

// Deterministic color from school name
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

function ProjectCardItem({ project, onClick }: { project: ProjectCard; onClick: () => void }) {
  const initials = getInitials(project.schoolName)
  const avatarColor = swatchFor(project.schoolName)

  return (
    <button
      onClick={onClick}
      className="bg-white border border-black rounded-lg overflow-hidden flex flex-col w-full text-left h-full hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
    >
      {/* Color banner */}
      <div
        className="h-24 w-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: project.categoryColor }}
      >
        <span className="text-white font-bold text-sm px-4 text-center leading-tight drop-shadow-sm">
          {project.categoryName}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Title */}
        <p className="text-base font-semibold leading-snug line-clamp-2">
          {project.title}
        </p>

        {/* School + teacher */}
        <div className="flex items-center gap-2">
          <div
            className="size-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 border border-black"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">{project.schoolName}</p>
            <p className="text-xs text-muted-foreground truncate">{project.teacherName}</p>
          </div>
        </div>

        {/* Badges row */}
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
      </div>
    </button>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function JudgePortalClient({ judgeName, projects }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<FilterTab>("all")

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

        {/* Count badge */}
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
