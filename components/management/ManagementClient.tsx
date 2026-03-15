"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Users,
  UserPlus,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  Copy,
  Check,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  inviteJudge,
  assignJudgeToProject,
  removeAssignment,
  removeJudgeFromEvent,
} from "@/app/actions/judges"

// ─── Types ────────────────────────────────────────────────────────────────────

type Assignment = {
  id: string
  projectId: string
  projectTitle: string
  projectSchool: string
  categoryName: string
  categoryColor: string
  scored: boolean
}

type JudgeData = {
  id: string
  name: string
  email: string
  assignments: Assignment[]
}

type ApprovedProject = {
  id: string
  title: string
  schoolName: string
  categoryName: string
  categoryColor: string
  assignedJudgeIds: string[]
}

interface Props {
  eventId: string
  eventName: string
  judges: JudgeData[]
  allApprovedProjects: ApprovedProject[]
}

// ─── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#f472b6", "#3b82f6", "#10b981", "#f59e0b",
  "#8b5cf6", "#ef4444", "#0ea5e9", "#14b8a6",
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

// ─── JudgeCard ────────────────────────────────────────────────────────────────

function JudgeCard({
  judge,
  allApprovedProjects,
  eventId,
  onViewAssignments,
  onRemove,
}: {
  judge: JudgeData
  allApprovedProjects: ApprovedProject[]
  eventId: string
  onViewAssignments: () => void
  onRemove: () => void
}) {
  const assigned = judge.assignments.length
  const scored = judge.assignments.filter((a) => a.scored).length
  const pct = assigned > 0 ? Math.round((scored / assigned) * 100) : 0
  const avatarColor = getAvatarColor(judge.name)

  return (
    <div className="bg-white border border-black rounded-lg p-5 flex flex-col gap-4 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="size-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 border border-black"
          style={{ backgroundColor: avatarColor }}
        >
          {getInitials(judge.name)}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{judge.name}</p>
          <p className="text-xs text-muted-foreground truncate">{judge.email}</p>
        </div>
        <span className="ml-auto text-[11px] font-medium border border-black px-2 py-0.5 rounded-full bg-[#F4F4F0] flex-shrink-0">
          Judge
        </span>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span>{scored} of {assigned} scored</span>
          <span className="text-muted-foreground">{pct}%</span>
        </div>
        <div className="h-2 bg-[#F4F4F0] border border-black rounded-full overflow-hidden">
          <div
            className="h-full bg-pink-400 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onViewAssignments}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium border border-black rounded px-3 py-2 bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
        >
          <Eye className="size-3.5" />
          View Assignments
        </button>
        <button
          onClick={onRemove}
          title="Remove judge"
          className="flex items-center justify-center border border-black rounded px-3 py-2 bg-white text-red-500 hover:shadow-[3px_3px_0px_0px_rgba(220,38,38,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ManagementClient({
  eventId,
  eventName,
  judges,
  allApprovedProjects,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteResult, setInviteResult] = useState<{ url: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Assignments dialog
  const [selectedJudge, setSelectedJudge] = useState<JudgeData | null>(null)
  const [assignmentsOpen, setAssignmentsOpen] = useState(false)
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set())

  // Remove confirm dialog
  const [removeJudge, setRemoveJudge] = useState<JudgeData | null>(null)
  const [removeOpen, setRemoveOpen] = useState(false)

  // ─── Invite submit ───────────────────────────────────────────────────────────

  function handleInviteSubmit() {
    if (!inviteEmail.trim()) {
      toast.error("Email is required")
      return
    }
    startTransition(async () => {
      const res = await inviteJudge({ email: inviteEmail.trim(), eventId })
      if (res.success) {
        setInviteResult({ url: res.data.inviteUrl })
        toast.success("Invite sent! Share the link below.")
      } else {
        toast.error(res.error)
      }
    })
  }

  function handleInviteClose() {
    setInviteOpen(false)
    setInviteEmail("")
    setInviteResult(null)
    setCopied(false)
    if (inviteResult) router.refresh()
  }

  function handleCopyLink() {
    if (!inviteResult) return
    navigator.clipboard.writeText(inviteResult.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ─── View assignments ────────────────────────────────────────────────────────

  function openAssignments(judge: JudgeData) {
    setSelectedJudge(judge)
    setSelectedProjectIds(new Set())
    setAssignmentsOpen(true)
  }

  function toggleProject(projectId: string) {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev)
      if (next.has(projectId)) next.delete(projectId)
      else next.add(projectId)
      return next
    })
  }

  function handleAssignProjects() {
    if (!selectedJudge || selectedProjectIds.size === 0) return
    startTransition(async () => {
      const results = await Promise.all(
        [...selectedProjectIds].map((projectId) =>
          assignJudgeToProject({ judgeId: selectedJudge.id, projectId })
        )
      )
      const failed = results.filter((r) => !r.success)
      if (failed.length === 0) {
        toast.success(`Assigned ${selectedProjectIds.size} project(s)`)
        setSelectedProjectIds(new Set())
        setAssignmentsOpen(false)
        router.refresh()
      } else {
        toast.error(failed[0].error ?? "Some assignments failed")
      }
    })
  }

  function handleRemoveAssignment(assignmentId: string) {
    startTransition(async () => {
      const res = await removeAssignment(assignmentId)
      if (res.success) {
        toast.success("Assignment removed")
        router.refresh()
        // Refresh selectedJudge to reflect new state
        setAssignmentsOpen(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  // ─── Remove judge ────────────────────────────────────────────────────────────

  function openRemoveConfirm(judge: JudgeData) {
    setRemoveJudge(judge)
    setRemoveOpen(true)
  }

  function handleConfirmRemove() {
    if (!removeJudge) return
    startTransition(async () => {
      const res = await removeJudgeFromEvent({ judgeId: removeJudge.id, eventId })
      if (res.success) {
        toast.success(`${removeJudge.name} removed from this event`)
        setRemoveOpen(false)
        setRemoveJudge(null)
        router.refresh()
      } else {
        toast.error(res.error)
      }
    })
  }

  // ─── Projects available for assignment ───────────────────────────────────────

  const assignableProjects = selectedJudge
    ? allApprovedProjects.filter(
        (p) => !p.assignedJudgeIds.includes(selectedJudge.id)
      )
    : []

  const alreadyAssigned = selectedJudge
    ? allApprovedProjects.filter((p) => p.assignedJudgeIds.includes(selectedJudge.id))
    : []

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Judge Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{eventName}</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-black text-white border border-black rounded hover:bg-pink-400 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
        >
          <UserPlus className="size-4" />
          Invite Judge
        </button>
      </div>

      {/* Empty state */}
      {judges.length === 0 && (
        <div className="border border-black border-dashed rounded-lg p-12 flex flex-col items-center gap-4 bg-white">
          <Users className="size-14 text-muted-foreground" />
          <div className="text-center">
            <p className="font-bold text-base">No judges yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Invite judges to start assigning projects.
            </p>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold bg-black text-white border border-black rounded hover:bg-pink-400 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
          >
            <UserPlus className="size-4" />
            Invite Judge
          </button>
        </div>
      )}

      {/* Judge grid */}
      {judges.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {judges.map((judge) => (
            <JudgeCard
              key={judge.id}
              judge={judge}
              allApprovedProjects={allApprovedProjects}
              eventId={eventId}
              onViewAssignments={() => openAssignments(judge)}
              onRemove={() => openRemoveConfirm(judge)}
            />
          ))}
        </div>
      )}

      {/* ── Invite Dialog ── */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { if (!o) handleInviteClose() }}>
        <DialogContent className="max-w-md border border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Invite a Judge</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Send an invitation link to add a judge to <strong>{eventName}</strong>.
            </DialogDescription>
          </DialogHeader>

          {!inviteResult ? (
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold">Email address *</label>
                <input
                  type="email"
                  placeholder="judge@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInviteSubmit()}
                  className="border border-black rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={handleInviteClose}
                  className="px-4 py-2 text-sm font-semibold border border-black rounded bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteSubmit}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-bold bg-black text-white border border-black rounded hover:bg-pink-400 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isPending ? "Sending…" : "Send Invite"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pt-2">
              <div className="bg-green-50 border border-green-600 rounded-lg p-4 text-sm">
                <p className="font-bold text-green-700 mb-2">✓ Invite created!</p>
                <p className="text-green-700">
                  An email was sent to <strong>{inviteEmail}</strong>. You can also
                  share this link directly:
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteResult.url}
                  className="flex-1 border border-black rounded px-3 py-2 text-xs bg-[#F4F4F0] font-mono overflow-hidden text-ellipsis"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold border border-black rounded bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all"
                >
                  {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <button
                onClick={handleInviteClose}
                className="self-end px-4 py-2 text-sm font-bold bg-black text-white border border-black rounded hover:bg-pink-400 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
              >
                Done
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Assignments Dialog ── */}
      <Dialog open={assignmentsOpen} onOpenChange={(o) => {
        if (!o) { setAssignmentsOpen(false); setSelectedProjectIds(new Set()) }
      }}>
        <DialogContent className="max-w-2xl border border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg font-bold">
              {selectedJudge?.name} — Assignments
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Manage project assignments for this judge.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto flex flex-col gap-6 pr-1">
            {/* Current assignments */}
            <div>
              <p className="text-sm font-bold mb-2">
                Current Assignments ({selectedJudge?.assignments.length ?? 0})
              </p>
              {selectedJudge && selectedJudge.assignments.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No projects assigned yet.</p>
              )}
              <div className="flex flex-col gap-2">
                {selectedJudge?.assignments.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 border border-black rounded px-3 py-2.5 bg-white"
                  >
                    <div
                      className="size-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: a.categoryColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.projectTitle}</p>
                      <p className="text-xs text-muted-foreground">{a.projectSchool} · {a.categoryName}</p>
                    </div>
                    {a.scored ? (
                      <span className="text-[11px] font-medium text-green-700 bg-green-50 border border-green-600 px-2 py-0.5 rounded-full flex-shrink-0">
                        Scored
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-yellow-700 bg-yellow-50 border border-yellow-500 px-2 py-0.5 rounded-full flex-shrink-0">
                        Pending
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveAssignment(a.id)}
                      disabled={isPending}
                      title="Remove assignment"
                      className="flex-shrink-0 text-red-500 hover:text-red-700 disabled:opacity-40 p-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Assign more */}
            <div>
              <p className="text-sm font-bold mb-2">
                Assign More Projects ({assignableProjects.length} available)
              </p>
              {assignableProjects.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  All approved projects have been assigned to this judge.
                </p>
              )}
              <div className="flex flex-col gap-2">
                {assignableProjects.map((p) => {
                  const isSelected = selectedProjectIds.has(p.id)
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProject(p.id)}
                      className={cn(
                        "flex items-center gap-3 border rounded px-3 py-2.5 text-left w-full transition-all",
                        isSelected
                          ? "border-pink-400 bg-pink-50 shadow-[2px_2px_0px_0px_rgba(244,114,182,1)]"
                          : "border-black bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px]"
                      )}
                    >
                      {isSelected ? (
                        <CheckSquare className="size-4 text-pink-500 flex-shrink-0" />
                      ) : (
                        <Square className="size-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div
                        className="size-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: p.categoryColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.schoolName} · {p.categoryName}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground flex-shrink-0">
                        {p.assignedJudgeIds.length} judge{p.assignedJudgeIds.length !== 1 ? "s" : ""}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 pt-4 border-t border-black flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {selectedProjectIds.size > 0
                ? `${selectedProjectIds.size} project(s) selected`
                : "Select projects to assign"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => { setAssignmentsOpen(false); setSelectedProjectIds(new Set()) }}
                className="px-4 py-2 text-sm font-semibold border border-black rounded bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
              >
                Close
              </button>
              {selectedProjectIds.size > 0 && (
                <button
                  onClick={handleAssignProjects}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-bold bg-black text-white border border-black rounded hover:bg-pink-400 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isPending ? "Assigning…" : `Assign ${selectedProjectIds.size}`}
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Remove Confirm Dialog ── */}
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent className="max-w-sm border border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Remove Judge?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This will remove <strong>{removeJudge?.name}</strong> and all their
              project assignments from this event. Their account will not be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setRemoveOpen(false)}
              className="px-4 py-2 text-sm font-semibold border border-black rounded bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRemove}
              disabled={isPending}
              className="px-4 py-2 text-sm font-bold bg-red-600 text-white border border-red-700 rounded hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isPending ? "Removing…" : "Remove Judge"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
