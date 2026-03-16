"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateEvent, deleteEvent, setEventStatus } from "@/app/actions/events"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, Copy, AlertTriangle, Trash2, Lock } from "lucide-react"

type EventData = {
  id: string
  name: string
  type: string
  judgingMode: string
  status: string
  resultsPublic: boolean
  anonymousJudging: boolean
  requireComments: boolean
  allowMultipleJudges: boolean
  allowSubmissions: boolean
  submissionDeadline: string | null
  showLiveScores: boolean
}

function fmtEnum(val: string) {
  return val.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function SectionCard({
  title,
  children,
  danger,
}: {
  title: string
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <div
      className={`bg-white rounded-md border overflow-hidden ${
        danger ? "border-red-600" : ""
      }`}
    >
      <div className={`p-4 border-b ${danger ? "border-red-600" : ""}`}>
        <h2 className="text-lg font-medium">{title}</h2>
      </div>
      <div className="p-4 flex flex-col gap-5">{children}</div>
    </div>
  )
}

function SaveButton({
  loading,
  onClick,
}: {
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-5 py-2.5 text-sm font-medium bg-black text-white rounded-md border border-black hover:bg-pink-400 hover:text-primary hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all disabled:opacity-50 self-start"
    >
      {loading ? "Saving…" : "Save Changes"}
    </button>
  )
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label htmlFor={id} className="text-base font-medium cursor-pointer">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function SettingsClient({ event }: { event: EventData }) {
  const router = useRouter()

  const [name, setName] = useState(event.name)
  const [status, setStatus] = useState(event.status)
  const [anonymousJudging, setAnonymousJudging] = useState(event.anonymousJudging)
  const [requireComments, setRequireComments] = useState(event.requireComments)
  const [allowMultipleJudges, setAllowMultipleJudges] = useState(event.allowMultipleJudges)
  const [allowSubmissions, setAllowSubmissions] = useState(event.allowSubmissions)
  const [submissionDeadline, setSubmissionDeadline] = useState<Date | undefined>(
    event.submissionDeadline ? new Date(event.submissionDeadline) : undefined
  )
  const [resultsPublic, setResultsPublic] = useState(event.resultsPublic)
  const [showLiveScores, setShowLiveScores] = useState(event.showLiveScores)

  const [savingInfo, setSavingInfo] = useState(false)
  const [savingJudging, setSavingJudging] = useState(false)
  const [savingSubmission, setSavingSubmission] = useState(false)
  const [savingLeaderboard, setSavingLeaderboard] = useState(false)
  const [closingEvent, setClosingEvent] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState("")
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  async function saveEventInfo() {
    setSavingInfo(true)
    const result = await updateEvent(event.id, { name, status })
    setSavingInfo(false)
    if (result.success) {
      toast.success("Event info updated")
    } else {
      toast.error(result.error)
    }
  }

  async function saveJudgingSettings() {
    setSavingJudging(true)
    const result = await updateEvent(event.id, {
      anonymousJudging,
      requireComments,
      allowMultipleJudges,
    })
    setSavingJudging(false)
    if (result.success) {
      toast.success("Judging settings updated")
    } else {
      toast.error(result.error)
    }
  }

  async function saveSubmissionSettings() {
    setSavingSubmission(true)
    const result = await updateEvent(event.id, {
      allowSubmissions,
      submissionDeadline: submissionDeadline ? submissionDeadline.toISOString() : null,
    })
    setSavingSubmission(false)
    if (result.success) {
      toast.success("Submission settings updated")
    } else {
      toast.error(result.error)
    }
  }

  async function saveLeaderboardSettings() {
    setSavingLeaderboard(true)
    const result = await updateEvent(event.id, {
      resultsPublic,
      showLiveScores,
    })
    setSavingLeaderboard(false)
    if (result.success) {
      toast.success("Leaderboard settings updated")
    } else {
      toast.error(result.error)
    }
  }

  async function handleCloseEvent() {
    setClosingEvent(true)
    const result = await setEventStatus(event.id, "CLOSED")
    setClosingEvent(false)
    if (result.success) {
      setStatus("CLOSED")
      setCloseDialogOpen(false)
      toast.success("Event closed — judges can no longer submit scores")
    } else {
      toast.error(result.error)
    }
  }

  async function handleDeleteEvent() {
    setDeletingEvent(true)
    const result = await deleteEvent(event.id)
    setDeletingEvent(false)
    if (result.success) {
      toast.success("Event deleted")
      router.push("/events")
    } else {
      toast.error(result.error)
    }
  }

  function copySubmissionLink() {
    const link = `${window.location.origin}/submit/${event.id}`
    navigator.clipboard.writeText(link)
    toast.success("Submission link copied to clipboard")
  }

  return (
    <div className="min-h-screen bg-[#F4F4F0]">
      <div className="px-4 lg:px-12 py-7 border-b bg-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Settings
            </p>
            <h1 className="text-2xl font-medium">{event.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage event configuration, judging rules, and submissions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Settings className="size-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-12 py-8 flex flex-col gap-6 max-w-3xl">
        {/* 1. EVENT INFO */}
        <SectionCard title="Event Info">
          <div className="flex flex-col gap-2">
            <Label htmlFor="event-name" className="text-base font-medium">
              Event Name
            </Label>
            <Input
              id="event-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 bg-white font-medium md:text-base"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Event Type</p>
              <Badge variant="outline" className="text-sm">
                {fmtEnum(event.type)}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Judging Mode</p>
              <Badge variant="outline" className="text-sm">
                {fmtEnum(event.judgingMode)}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-base font-medium">Event Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-12 bg-white font-medium md:text-base w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SaveButton loading={savingInfo} onClick={saveEventInfo} />
        </SectionCard>

        {/* 2. JUDGING SETTINGS */}
        <SectionCard title="Judging Settings">
          <ToggleRow
            id="anonymous-judging"
            label="Anonymous Judging"
            description="Judges see only project codes instead of school/teacher names"
            checked={anonymousJudging}
            onCheckedChange={setAnonymousJudging}
          />
          <ToggleRow
            id="require-comments"
            label="Require Comments"
            description="Judges must write evaluation notes before submitting a score"
            checked={requireComments}
            onCheckedChange={setRequireComments}
          />
          <ToggleRow
            id="allow-multiple-judges"
            label="Allow Multiple Judges per Project"
            description="Multiple judges can be assigned to score the same project"
            checked={allowMultipleJudges}
            onCheckedChange={setAllowMultipleJudges}
          />
          <SaveButton loading={savingJudging} onClick={saveJudgingSettings} />
        </SectionCard>

        {/* 3. SUBMISSION SETTINGS */}
        <SectionCard title="Submission Settings">
          <ToggleRow
            id="allow-submissions"
            label="Allow Public Submissions"
            description="Opens or closes the public project submission form"
            checked={allowSubmissions}
            onCheckedChange={setAllowSubmissions}
          />
          <div className="flex flex-col gap-2">
            <Label className="text-base font-medium">
              Submission Deadline
            </Label>
            <DatePicker
              value={submissionDeadline}
              onChange={setSubmissionDeadline}
              placeholder="Set a deadline"
              className="max-w-xs"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={copySubmissionLink}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border rounded-md bg-white text-muted-foreground hover:text-foreground hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all"
            >
              <Copy className="size-3.5" />
              Copy Submission Link
            </button>
          </div>
          <SaveButton loading={savingSubmission} onClick={saveSubmissionSettings} />
        </SectionCard>

        {/* 4. LEADERBOARD SETTINGS */}
        <SectionCard title="Leaderboard Settings">
          <ToggleRow
            id="results-public"
            label="Show Leaderboard to Public"
            description="Makes the results page visible at /results without login"
            checked={resultsPublic}
            onCheckedChange={setResultsPublic}
          />
          <ToggleRow
            id="show-live-scores"
            label="Show Live Scores"
            description="Scores update in real-time instead of only showing after the event closes"
            checked={showLiveScores}
            onCheckedChange={setShowLiveScores}
          />
          <SaveButton loading={savingLeaderboard} onClick={saveLeaderboardSettings} />
        </SectionCard>

        {/* 5. DANGER ZONE */}
        <div className="bg-white rounded-md border border-red-600 overflow-hidden">
          <div className="p-4 border-b border-red-600">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-600" />
              Danger Zone
            </h2>
          </div>
          <div className="p-4 flex flex-col gap-5">
            {/* Close Event */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-medium">Close Event</p>
                <p className="text-sm text-muted-foreground">
                  Judges will no longer be able to submit new scores
                </p>
              </div>
              <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md border border-red-600 hover:bg-red-700 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all">
                    <Lock className="size-3.5" />
                    Close Event
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Close this event?</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Once closed, judges will no longer be able to submit new scores.
                    You can reopen the event later by changing its status back to Active.
                  </p>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setCloseDialogOpen(false)}
                      className="px-4 py-2 text-sm font-medium border rounded-md bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCloseEvent}
                      disabled={closingEvent}
                      className="px-5 py-2 text-sm font-medium bg-red-600 text-white rounded-md border border-red-600 hover:bg-red-700 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all disabled:opacity-50"
                    >
                      {closingEvent ? "Closing…" : "Yes, Close Event"}
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="border-t border-red-200" />

            {/* Delete Event */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-medium">Delete Event</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this event and all associated data
                </p>
              </div>
              <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md border border-red-600 hover:bg-red-700 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all">
                    <Trash2 className="size-3.5" />
                    Delete Event
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete this event?</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    This action is permanent. All projects, scores, and judge assignments
                    will be deleted. Type <strong>{event.name}</strong> to confirm.
                  </p>
                  <Input
                    placeholder="Type event name to confirm"
                    value={deleteConfirmName}
                    onChange={(e) => setDeleteConfirmName(e.target.value)}
                    className="h-12 bg-white font-medium md:text-base"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setDeleteDialogOpen(false)
                        setDeleteConfirmName("")
                      }}
                      className="px-4 py-2 text-sm font-medium border rounded-md bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteEvent}
                      disabled={deleteConfirmName !== event.name || deletingEvent}
                      className="px-5 py-2 text-sm font-medium bg-red-600 text-white rounded-md border border-red-600 hover:bg-red-700 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all disabled:opacity-50"
                    >
                      {deletingEvent ? "Deleting…" : "Delete Permanently"}
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
