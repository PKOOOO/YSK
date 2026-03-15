"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { approveProject, rejectProject } from "@/app/actions/projects"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, Download, Sparkles, User, School } from "lucide-react"

export type ProjectFile = {
  id: string
  name: string
  url: string
  size: number
  type: string
}

export type ProjectRow = {
  id: string
  title: string
  abstract: string | null
  aiSummary: string | null
  schoolName: string
  teacherName: string
  teacherEmail: string | null
  schoolLevel: "JSS" | "SENIOR"
  approved: boolean
  category: { id: string; name: string; color: string }
  assignments: Array<{ id: string; judge: { id: string; name: string } }>
  scores: Array<{ id: string; totalScore: number; status: string }>
  files: ProjectFile[]
}

interface Props {
  projects: ProjectRow[]
  maxScore: number
}

export function ProjectsTable({ projects, maxScore }: Props) {
  return (
    <div className="bg-white rounded-md border overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium">Projects</h3>
          <p className="text-sm text-muted-foreground">{projects.length} total</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-sm text-muted-foreground">No projects submitted yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[#F4F4F0]">
                {[
                  "School Name",
                  "Teacher",
                  "Category",
                  "Level",
                  "Assigned Judge",
                  "Score",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap last:text-right"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((p) => (
                <ProjectTableRow key={p.id} project={p} maxScore={maxScore} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ProjectTableRow({
  project: p,
  maxScore,
}: {
  project: ProjectRow
  maxScore: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const submittedScore = p.scores[0]
  const scoreValue = submittedScore?.totalScore ?? null
  const assignedJudge = p.assignments[0]?.judge?.name ?? null

  const imageFiles = p.files.filter((f) => f.type.startsWith("image/"))
  const otherFiles = p.files.filter((f) => !f.type.startsWith("image/"))

  function handleApprove(e?: React.MouseEvent) {
    e?.stopPropagation()
    startTransition(async () => {
      const result = await approveProject(p.id)
      if (result.success) {
        toast.success(`"${p.title}" approved`)
        setOpen(false)
        router.refresh()
      } else {
        toast.error("Failed to approve", { description: result.error })
      }
    })
  }

  function handleReject(e?: React.MouseEvent) {
    e?.stopPropagation()
    startTransition(async () => {
      const result = await rejectProject(p.id)
      if (result.success) {
        toast.success(`"${p.title}" rejected and removed`)
        setOpen(false)
        router.refresh()
      } else {
        toast.error("Failed to reject", { description: result.error })
      }
    })
  }

  return (
    <>
      <tr
        onClick={() => setOpen(true)}
        className={cn(
          "cursor-pointer transition-colors hover:bg-[#F4F4F0]/60",
          isPending && "opacity-40 pointer-events-none"
        )}
      >
        {/* School Name */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-medium">{p.schoolName}</span>
        </td>

        {/* Teacher */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div>
            <p className="font-medium">{p.teacherName}</p>
            {p.teacherEmail && (
              <p className="text-xs text-muted-foreground">{p.teacherEmail}</p>
            )}
          </div>
        </td>

        {/* Category */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span
            className="px-2 py-1 rounded text-xs font-medium text-white"
            style={{ backgroundColor: p.category.color }}
          >
            {p.category.name}
          </span>
        </td>

        {/* School Level */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span
            className={cn(
              "px-2 py-1 border rounded-full text-xs font-medium",
              p.schoolLevel === "JSS"
                ? "border-blue-400 text-blue-700 bg-blue-50"
                : "border-purple-400 text-purple-700 bg-purple-50"
            )}
          >
            {p.schoolLevel === "JSS" ? "JSS" : "Senior"}
          </span>
        </td>

        {/* Assigned Judge */}
        <td className="px-4 py-3 whitespace-nowrap">
          {assignedJudge ? (
            <span className="font-medium">{assignedJudge}</span>
          ) : (
            <span className="text-xs text-muted-foreground italic">Unassigned</span>
          )}
        </td>

        {/* Score */}
        <td className="px-4 py-3 whitespace-nowrap min-w-[110px]">
          {scoreValue !== null ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold">{scoreValue.toFixed(1)} pts</span>
              <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden border">
                <div
                  className="h-full bg-black rounded-full"
                  style={{
                    width: `${maxScore > 0 ? Math.min((scoreValue / maxScore) * 100, 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground font-medium">—</span>
          )}
        </td>

        {/* Status */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span
            className={cn(
              "px-2 py-1 border rounded-full text-xs font-medium",
              p.approved
                ? "border-green-400 text-green-700 bg-green-50"
                : "border-yellow-400 text-yellow-700 bg-yellow-50"
            )}
          >
            {p.approved ? "Approved" : "Pending"}
          </span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3 whitespace-nowrap text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(true) }}
              className="px-2.5 py-1 text-xs font-medium underline text-muted-foreground hover:text-foreground transition-colors"
            >
              View
            </button>
            {!p.approved && (
              <button
                onClick={(e) => handleApprove(e)}
                disabled={isPending}
                className="px-2.5 py-1 text-xs font-medium bg-black text-white rounded hover:bg-pink-400 hover:text-primary transition-colors disabled:opacity-50"
              >
                Approve
              </button>
            )}
            <button
              onClick={(e) => handleReject(e)}
              disabled={isPending}
              className="px-2.5 py-1 text-xs font-medium border rounded hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </td>
      </tr>

      {/* Project Detail Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
          {/* Header — fixed */}
          <DialogHeader className="p-6 border-b shrink-0">
            <DialogTitle className="text-2xl font-medium leading-snug pr-6">
              {p.title}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span
                className="px-2 py-1 rounded text-xs font-medium text-white"
                style={{ backgroundColor: p.category.color }}
              >
                {p.category.name}
              </span>
              <span
                className={cn(
                  "px-2 py-1 border rounded-full text-xs font-medium",
                  p.schoolLevel === "JSS"
                    ? "border-blue-400 text-blue-700 bg-blue-50"
                    : "border-purple-400 text-purple-700 bg-purple-50"
                )}
              >
                {p.schoolLevel === "JSS" ? "JSS" : "Senior"}
              </span>
              <span
                className={cn(
                  "px-2 py-1 border rounded-full text-xs font-medium",
                  p.approved
                    ? "border-green-400 text-green-700 bg-green-50"
                    : "border-yellow-400 text-yellow-700 bg-yellow-50"
                )}
              >
                {p.approved ? "Approved" : "Pending"}
              </span>
            </div>
          </DialogHeader>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col divide-y">
              {/* School & Teacher */}
              <div className="p-6 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <School className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                      School
                    </p>
                    <p className="font-medium">{p.schoolName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                      Teacher
                    </p>
                    <p className="font-medium">{p.teacherName}</p>
                    {p.teacherEmail && (
                      <p className="text-sm text-muted-foreground">{p.teacherEmail}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Abstract */}
              {p.abstract && (
                <div className="p-6">
                  <p className="text-base font-medium mb-2">Abstract</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {p.abstract}
                  </p>
                </div>
              )}

              {/* AI Summary */}
              {p.aiSummary && (
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="size-4 text-pink-500" />
                    <p className="text-base font-medium">AI Summary</p>
                  </div>
                  <div className="bg-pink-50 border border-pink-400 rounded-md p-4">
                    <p className="text-sm text-pink-900 leading-relaxed">{p.aiSummary}</p>
                  </div>
                </div>
              )}

              {/* Uploaded Files */}
              {p.files.length > 0 && (
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="size-4 text-muted-foreground" />
                    <p className="text-base font-medium">
                      Uploaded Files
                      <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                        ({p.files.length})
                      </span>
                    </p>
                  </div>

                  {/* Image thumbnails */}
                  {imageFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {imageFiles.map((f) => (
                        <a
                          key={f.id}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-square rounded-md border overflow-hidden block hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={f.url}
                            alt={f.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Other files (PDFs, etc.) */}
                  {otherFiles.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {otherFiles.map((f) => (
                        <a
                          key={f.id}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-3 p-3 border rounded-md hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all group"
                        >
                          <div className="size-9 rounded border bg-[#F4F4F0] flex items-center justify-center shrink-0">
                            <FileText className="size-4 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{f.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {f.type} · {formatBytes(f.size)}
                            </p>
                          </div>
                          <Download className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {p.files.length === 0 && (
                <div className="p-6">
                  <p className="text-base font-medium mb-2">Files</p>
                  <p className="text-sm text-muted-foreground italic">No files uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Sticky footer — always visible */}
          <div className="border-t p-4 shrink-0 flex items-center justify-end gap-3 bg-white">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-medium border rounded hover:bg-[#F4F4F0] transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => handleReject()}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium border rounded hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
            {!p.approved && (
              <button
                onClick={() => handleApprove()}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium bg-black text-white rounded hover:bg-pink-400 hover:text-primary transition-colors disabled:opacity-50"
              >
                Approve
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
