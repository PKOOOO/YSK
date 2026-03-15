"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Check,
  FlaskConical,
  Megaphone,
  LayoutGrid,
  BarChart3,
  ListChecks,
  Sparkles,
  Trophy,
  FileCheck2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createEvent } from "@/app/actions/events"

const EVENT_TYPES = [
  {
    value: "SCIENCE_CONTEST",
    label: "Science Contest",
    description: "Projects judged on scientific merit",
    icon: FlaskConical,
  },
  {
    value: "PITCH_FEST",
    label: "Pitch Fest",
    description: "Teams pitch ideas to a panel",
    icon: Megaphone,
  },
  {
    value: "EXHIBITION",
    label: "Exhibition",
    description: "Showcase projects to visitors",
    icon: LayoutGrid,
  },
  {
    value: "POPULARITY_POLL",
    label: "Popularity Poll",
    description: "Audience votes determine winners",
    icon: BarChart3,
  },
  {
    value: "NOMINATION_LIST",
    label: "Nomination List",
    description: "Projects nominated by category",
    icon: ListChecks,
  },
  {
    value: "CREATIVE_COMPETITION",
    label: "Creative Competition",
    description: "Judge creativity and originality",
    icon: Sparkles,
  },
  {
    value: "PERFORMANCE_CONTEST",
    label: "Performance Contest",
    description: "Live demos scored in real time",
    icon: Trophy,
  },
  {
    value: "APPLICATION_REVIEW",
    label: "Application Review",
    description: "Review and score applications",
    icon: FileCheck2,
  },
] as const

const JUDGING_MODES = [
  {
    value: "OFFICIAL_JUDGE",
    label: "Official Judge",
    description: "Formal judges review and score each project against defined criteria.",
    bestFor: "Science fairs, academic competitions",
    popular: true,
  },
  {
    value: "PUBLIC_VOTING",
    label: "Public Voting",
    description: "Anyone with the link can vote for their favourite project.",
    bestFor: "Creative showcases, popularity contests",
    popular: false,
  },
  {
    value: "GUEST_JUDGE",
    label: "Guest Judge",
    description: "Invited external experts score projects independently.",
    bestFor: "Industry events, sponsored competitions",
    popular: false,
  },
  {
    value: "OFFICIAL_AND_GUEST",
    label: "Official + Guest",
    description: "Both official and guest judges collaborate on scoring.",
    bestFor: "Large competitions requiring diverse perspectives",
    popular: true,
  },
  {
    value: "OFFICIAL_AND_PUBLIC",
    label: "Official + Public Voting",
    description: "Official judging combined with public audience engagement.",
    bestFor: "Events balancing competition and participation",
    popular: false,
  },
] as const

const STEP_TITLES = [
  "Name your event",
  "Choose event type",
  "Set judging mode",
  "Review & confirm",
]

interface EventWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventWizard({ open, onOpenChange }: EventWizardProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleOpenChange(value: boolean) {
    if (!value) {
      setStep(1)
      setName("")
      setNameError(false)
      setSelectedType(null)
      setSelectedMode(null)
      setLoading(false)
    }
    onOpenChange(value)
  }

  function handleNext() {
    if (step === 1) {
      if (!name.trim()) {
        setNameError(true)
        return
      }
      setNameError(false)
    }
    if (step < 4) setStep(step + 1)
  }

  function handlePrev() {
    if (step > 1) setStep(step - 1)
  }

  async function handleCreate() {
    if (!selectedType || !selectedMode) return
    setLoading(true)
    const result = await createEvent({
      name: name.trim(),
      type: selectedType,
      judgingMode: selectedMode,
    })
    setLoading(false)
    if (result.success) {
      toast.success("Event created!", {
        description: `"${name.trim()}" is ready to configure.`,
      })
      handleOpenChange(false)
    } else {
      toast.error("Failed to create event", { description: result.error })
    }
  }

  const canProceed =
    step === 1
      ? name.trim().length > 0
      : step === 2
      ? selectedType !== null
      : step === 3
      ? selectedMode !== null
      : true

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 flex flex-col max-h-[90vh]">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-5 border-b shrink-0">
          <DialogTitle className="text-lg font-medium mb-4">
            {STEP_TITLES[step - 1]}
          </DialogTitle>
          {/* Step indicators */}
          <div className="flex items-center">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div
                  className={cn(
                    "size-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors",
                    step > s
                      ? "bg-black text-white"
                      : step === s
                      ? "bg-pink-400 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > s ? <Check className="size-4" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={cn(
                      "flex-1 h-px mx-2 transition-colors",
                      step > s ? "bg-black" : "bg-border/20"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step 1: Event name */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Give your event a clear, descriptive name.
              </p>
              <div>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (e.target.value.trim()) setNameError(false)
                  }}
                  placeholder="e.g. KSEF 2026 Regional Science Fair"
                  maxLength={100}
                  className={cn(
                    "text-base",
                    nameError && "border-red-400 focus-visible:ring-red-400"
                  )}
                  autoFocus
                />
                <div className="flex items-center justify-between mt-1.5">
                  {nameError ? (
                    <p className="text-xs text-red-500">Event name is required</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-muted-foreground">{name.length}/100</span>
                </div>
              </div>

              <div className="border border-dashed border-black/30 rounded-md p-4 opacity-50 cursor-not-allowed select-none">
                <p className="text-sm font-medium">
                  Clone from existing event
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Copy categories, criteria, and settings from a previous event
                </p>
                <p className="text-xs text-muted-foreground mt-2 italic">Coming soon</p>
              </div>
            </div>
          )}

          {/* Step 2: Event type */}
          {step === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Select the format that best describes your event.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EVENT_TYPES.map((et) => (
                  <button
                    key={et.value}
                    onClick={() => setSelectedType(et.value)}
                    className={cn(
                      "flex flex-col items-center gap-2.5 p-4 rounded-md border text-center transition-all cursor-pointer",
                      selectedType === et.value
                        ? "border-pink-400 bg-pink-50 shadow-[2px_2px_0px_0px_rgba(244,114,182,0.3)]"
                        : "bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px]"
                    )}
                  >
                    <et.icon
                      className={cn(
                        "size-6",
                        selectedType === et.value ? "text-pink-500" : "text-muted-foreground"
                      )}
                    />
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium leading-tight",
                          selectedType === et.value ? "text-pink-700" : ""
                        )}
                      >
                        {et.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                        {et.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Judging mode */}
          {step === 3 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Choose how projects will be evaluated.
              </p>
              {JUDGING_MODES.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setSelectedMode(mode.value)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-md border text-left transition-all w-full cursor-pointer",
                    selectedMode === mode.value
                      ? "border-pink-400 bg-pink-50"
                      : "bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px]"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          selectedMode === mode.value ? "text-pink-700" : ""
                        )}
                      >
                        {mode.label}
                      </span>
                      {mode.popular && (
                        <span className="text-xs bg-pink-400 text-white px-1.5 py-0.5 rounded-sm font-medium leading-none">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{mode.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">Best for: </span>
                      {mode.bestFor}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      selectedMode === mode.value
                        ? "border-pink-400 bg-pink-400"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {selectedMode === mode.value && (
                      <Check className="size-3 text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Review your event details before creating.
              </p>
              <div className="border rounded-md overflow-hidden bg-white divide-y">
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Event Name
                  </span>
                  <span className="text-base font-medium">{name}</span>
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Event Type
                  </span>
                  <span className="text-base font-medium">
                    {EVENT_TYPES.find((t) => t.value === selectedType)?.label}
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Judging Mode
                  </span>
                  <span className="text-base font-medium">
                    {JUDGING_MODES.find((m) => m.value === selectedMode)?.label}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                You can configure categories, criteria, and judges after creating the event.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between shrink-0">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={step === 1}
          >
            Previous
          </Button>
          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="bg-black text-white hover:bg-pink-400 hover:text-primary"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={loading || !canProceed}
              className="bg-black text-white hover:bg-pink-400 hover:text-primary"
            >
              {loading ? "Creating…" : "Create Event"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
