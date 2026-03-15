"use client"

import { useState, useTransition, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Sparkles,
  Save,
  Send,
  Loader2,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { saveScore } from "@/app/actions/scoring"

// ─── Types ────────────────────────────────────────────────────────────────────

type CriterionData = {
  id: string
  name: string
  description: string | null
  maxScore: number
  order: number
}

type AISuggestion = {
  criterionId: string
  suggestedScore: number
  justification: string
}

interface Props {
  assignmentId: string
  projectId: string
  projectTitle: string
  schoolName: string
  teacherName: string
  schoolLevel: "JSS" | "SENIOR"
  categoryName: string
  categoryColor: string
  aiSummary: string | null
  abstract: string | null
  criteria: CriterionData[]
  existingScoreValues: Record<string, number>
  existingNotes: string
  existingStatus: "DRAFT" | "SUBMITTED" | null
  existingSession: "SESSION_ONE" | "SESSION_TWO" | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPartLabel(desc: string | null): "A" | "B" | "C" | null {
  if (!desc) return null
  if (desc.startsWith("Part A")) return "A"
  if (desc.startsWith("Part B")) return "B"
  if (desc.startsWith("Part C")) return "C"
  return null
}

const PART_HEADERS: Record<string, { label: string; sub: string }> = {
  A: { label: "Part A", sub: "Written Communication" },
  B: { label: "Part B", sub: "Oral Communication" },
  C: { label: "Part C", sub: "Scientific Thought & Creativity" },
}

function scoringGuide(maxScore: number): string | null {
  if (maxScore === 2)
    return "0 = Not done · 0.5 = Poor · 1.0 = Satisfactory · 1.5 = Good · 2.0 = Excellent"
  if (maxScore === 3)
    return "0 = Not done · 1 = Satisfactory · 2 = Good · 3 = Excellent"
  if (maxScore === 1)
    return "0 = Not done · 0.25 = Poor · 0.5 = Satisfactory · 0.75 = Good · 1.0 = Excellent"
  return null
}

// ─── CriterionSlider ──────────────────────────────────────────────────────────

function CriterionSlider({
  criterion,
  value,
  onChange,
  locked,
  disabled,
  suggestion,
  onApplySuggestion,
  indexInPart,
}: {
  criterion: CriterionData
  value: number
  onChange: (val: number) => void
  locked: boolean
  disabled: boolean
  suggestion?: AISuggestion
  onApplySuggestion?: () => void
  indexInPart: number
}) {
  const guide = scoringGuide(criterion.maxScore)
  const isDisabled = locked || disabled

  return (
    <div
      className={cn(
        "border border-black rounded-lg p-4 bg-white transition-all",
        locked && "opacity-60 bg-gray-50"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">
            <span className="text-muted-foreground mr-1.5">{indexInPart}.</span>
            {criterion.name}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {locked && <Lock className="size-3.5 text-muted-foreground" />}
          <span
            className={cn(
              "text-sm font-bold px-2.5 py-1 rounded-md border min-w-[48px] text-center",
              value > 0
                ? "bg-pink-400 text-black border-pink-500"
                : "bg-[#F4F4F0] text-muted-foreground border-black"
            )}
          >
            {value}
          </span>
          <span className="text-xs text-muted-foreground">/ {criterion.maxScore}</span>
        </div>
      </div>

      {/* Slider */}
      <div className="px-1">
        <input
          type="range"
          min={0}
          max={criterion.maxScore}
          step={0.5}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={isDisabled}
          className={cn(
            "w-full h-3 rounded-full appearance-none cursor-pointer",
            "bg-[#F4F4F0] border border-black",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:bg-pink-400 [&::-webkit-slider-thumb]:transition-colors",
            "[&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-black [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:hover:bg-pink-400",
            isDisabled && "opacity-50 cursor-not-allowed [&::-webkit-slider-thumb]:cursor-not-allowed [&::-moz-range-thumb]:cursor-not-allowed"
          )}
        />
      </div>

      {/* Guide */}
      {guide && (
        <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">{guide}</p>
      )}

      {/* AI Suggestion */}
      {suggestion && !isDisabled && (
        <div className="mt-3 flex items-center gap-2 p-2.5 rounded-md bg-purple-50 border border-purple-200 text-xs">
          <Sparkles className="size-3.5 text-purple-500 flex-shrink-0" />
          <span className="flex-1 text-purple-700">
            AI suggests <strong>{suggestion.suggestedScore}</strong> — {suggestion.justification}
          </span>
          <button
            onClick={onApplySuggestion}
            className="px-2 py-1 text-[11px] font-bold bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex-shrink-0"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ScoringClient({
  assignmentId,
  projectId,
  projectTitle,
  schoolName,
  teacherName,
  schoolLevel,
  categoryName,
  categoryColor,
  aiSummary,
  abstract,
  criteria,
  existingScoreValues,
  existingNotes,
  existingStatus,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isSubmitted = existingStatus === "SUBMITTED"

  // Score values state
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    for (const c of criteria) {
      init[c.id] = existingScoreValues[c.id] ?? 0
    }
    return init
  })

  const [notes, setNotes] = useState(existingNotes)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // AI suggestions
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiLoaded, setAiLoaded] = useState(false)

  // ── Group criteria by part ─────────────────────────────────────────────────

  const { partA, partB, partC } = useMemo(() => {
    const a: CriterionData[] = []
    const b: CriterionData[] = []
    const c: CriterionData[] = []
    for (const cr of criteria) {
      const part = getPartLabel(cr.description)
      if (part === "A") a.push(cr)
      else if (part === "B") b.push(cr)
      else if (part === "C") c.push(cr)
      else a.push(cr) // fallback
    }
    return { partA: a, partB: b, partC: c }
  }, [criteria])

  // ── Dependent scoring: Methods = 0 logic ───────────────────────────────────
  // Part A criterion #5 (index 4) = Methods
  // If 0 → lock Part A #7, #8, #9 (indices 6,7,8) AND Part C #6, #9 (indices 5,8) to 0

  const methodsCriterion = partA[4] // 5th criterion (0-indexed = 4)
  const methodsIsZero = methodsCriterion ? values[methodsCriterion.id] === 0 : false

  const lockedIds = useMemo(() => {
    if (!methodsIsZero || !methodsCriterion) return new Set<string>()
    const locked = new Set<string>()
    // Part A positions 7, 8, 9 → indices 6, 7, 8
    if (partA[6]) locked.add(partA[6].id)
    if (partA[7]) locked.add(partA[7].id)
    if (partA[8]) locked.add(partA[8].id)
    // Part C positions 6, 9 → indices 5, 8
    if (partC[5]) locked.add(partC[5].id)
    if (partC[8]) locked.add(partC[8].id)
    return locked
  }, [methodsIsZero, methodsCriterion, partA, partC])

  // When locked criteria change, zero them out
  const updateValue = useCallback(
    (id: string, val: number) => {
      if (isSubmitted) return
      setValues((prev) => {
        const next = { ...prev, [id]: val }
        // If changing Methods (Part A #5) to 0, zero locked criteria
        if (id === methodsCriterion?.id && val === 0) {
          if (partA[6]) next[partA[6].id] = 0
          if (partA[7]) next[partA[7].id] = 0
          if (partA[8]) next[partA[8].id] = 0
          if (partC[5]) next[partC[5].id] = 0
          if (partC[8]) next[partC[8].id] = 0
        }
        return next
      })
    },
    [isSubmitted, methodsCriterion, partA, partC]
  )

  // ── Score calculations ────────────────────────────────────────────────────

  const partAScore = partA.reduce((s, c) => s + (values[c.id] ?? 0), 0)
  const partBScore = partB.reduce((s, c) => s + (values[c.id] ?? 0), 0)
  const partCScore = partC.reduce((s, c) => s + (values[c.id] ?? 0), 0)
  const grandTotal = partAScore + partBScore + partCScore

  const partAMax = partA.reduce((s, c) => s + c.maxScore, 0)
  const partBMax = partB.reduce((s, c) => s + c.maxScore, 0)
  const partCMax = partC.reduce((s, c) => s + c.maxScore, 0)
  const grandMax = partAMax + partBMax + partCMax
  const grandPct = grandMax > 0 ? Math.round((grandTotal / grandMax) * 100) : 0

  // ── AI suggestions ────────────────────────────────────────────────────────

  async function fetchAISuggestions() {
    if (aiLoading) return
    setAiLoading(true)
    try {
      const res = await fetch("/api/ai/score-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: projectTitle,
          abstract: abstract ?? "",
          aiSummary: aiSummary ?? "",
          criteria: criteria.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            maxScore: c.maxScore,
          })),
        }),
      })
      if (!res.ok) throw new Error("AI request failed")
      const data = await res.json()
      setSuggestions(data.suggestions ?? [])
      setAiLoaded(true)
    } catch {
      // Fail silently as specified
    } finally {
      setAiLoading(false)
    }
  }

  function applySuggestion(criterionId: string) {
    const s = suggestions.find((x) => x.criterionId === criterionId)
    if (!s || lockedIds.has(criterionId)) return
    updateValue(criterionId, Math.min(s.suggestedScore, criteria.find((c) => c.id === criterionId)?.maxScore ?? 0))
  }

  // ── Save / Submit ─────────────────────────────────────────────────────────

  function handleSave(status: "DRAFT" | "SUBMITTED") {
    startTransition(async () => {
      const items = criteria.map((c) => ({
        criterionId: c.id,
        value: values[c.id] ?? 0,
      }))
      const res = await saveScore({
        assignmentId,
        items,
        notes,
        status,
        session: "SESSION_ONE",
      })
      if (res.success) {
        if (status === "SUBMITTED") {
          toast.success("Score submitted successfully!")
          router.refresh()
        } else {
          toast.success("Draft saved")
        }
      } else {
        toast.error(res.error)
      }
    })
  }

  // ── Suggestion map for quick lookup ───────────────────────────────────────

  const suggestionMap = useMemo(() => {
    const map = new Map<string, AISuggestion>()
    for (const s of suggestions) map.set(s.criterionId, s)
    return map
  }, [suggestions])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back link */}
      <button
        onClick={() => router.push("/judge")}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to projects
      </button>

      {/* Submitted banner */}
      {isSubmitted && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-lg border border-green-600 bg-green-50 text-green-800">
          <CheckCircle2 className="size-5 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">Score Submitted</p>
            <p className="text-xs">This score has been finalized. Scores are read-only after submission.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── LEFT COLUMN ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Project header */}
          <div className="bg-white border border-black rounded-lg overflow-hidden">
            <div
              className="h-20 flex items-center justify-center"
              style={{ backgroundColor: categoryColor }}
            >
              <span className="text-white font-bold text-sm drop-shadow-sm">{categoryName}</span>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <h1 className="text-xl font-bold leading-tight">{projectTitle}</h1>
              <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                <span>{schoolName}</span>
                <span>·</span>
                <span>{teacherName}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                    schoolLevel === "JSS"
                      ? "border-blue-500 text-blue-700 bg-blue-50"
                      : "border-purple-500 text-purple-700 bg-purple-50"
                  )}
                >
                  {schoolLevel}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-black bg-[#F4F4F0]">
                  Max: {grandMax} marks
                </span>
              </div>
            </div>
          </div>

          {/* AI Summary */}
          {aiSummary && (
            <div className="border border-pink-300 bg-pink-50 rounded-lg p-4 flex gap-3">
              <Sparkles className="size-5 text-pink-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-pink-700 mb-1">AI Summary</p>
                <p className="text-sm text-pink-900 leading-relaxed">{aiSummary}</p>
              </div>
            </div>
          )}

          {/* Methods = 0 warning */}
          {methodsIsZero && !isSubmitted && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-yellow-500 bg-yellow-50 text-yellow-800">
              <AlertTriangle className="size-4 flex-shrink-0" />
              <p className="text-xs">
                <strong>Methods scored 0</strong> — Results, Analysis, Discussion (Part A) and
                Data adequacy, Logical sequence (Part C) are automatically locked to 0.
              </p>
            </div>
          )}

          {/* ── Scoring sections ── */}
          {[
            { part: "A" as const, items: partA, score: partAScore, max: partAMax },
            { part: "B" as const, items: partB, score: partBScore, max: partBMax },
            { part: "C" as const, items: partC, score: partCScore, max: partCMax },
          ].map(({ part, items, score, max }) => (
            <div key={part}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-bold">
                    {PART_HEADERS[part].label}{" "}
                    <span className="font-normal text-muted-foreground">
                      — {PART_HEADERS[part].sub}
                    </span>
                  </h2>
                </div>
                <div className="text-sm font-bold px-3 py-1 rounded-md border border-black bg-[#F4F4F0]">
                  {score} / {max}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {items.map((c, i) => (
                  <CriterionSlider
                    key={c.id}
                    criterion={c}
                    value={values[c.id] ?? 0}
                    onChange={(v) => updateValue(c.id, v)}
                    locked={lockedIds.has(c.id)}
                    disabled={isSubmitted}
                    suggestion={suggestionMap.get(c.id)}
                    onApplySuggestion={() => applySuggestion(c.id)}
                    indexInPart={i + 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── RIGHT COLUMN (sticky sidebar) ── */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="lg:sticky lg:top-6 flex flex-col gap-4">
            {/* Score summary */}
            <div className="bg-white border border-black rounded-lg p-5">
              <h3 className="text-sm font-bold mb-4">Score Summary</h3>

              <div className="flex flex-col gap-2.5 text-sm">
                {[
                  { label: "Part A", score: partAScore, max: partAMax },
                  { label: "Part B", score: partBScore, max: partBMax },
                  { label: "Part C", score: partCScore, max: partCMax },
                ].map(({ label, score, max }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{score} / {max}</span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-black my-4" />

              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-base">Grand Total</span>
                <span className="text-xl font-bold text-pink-500">{grandTotal}</span>
              </div>
              <p className="text-xs text-muted-foreground text-right mb-3">out of {grandMax}</p>

              {/* Progress bar */}
              <div className="h-3 bg-[#F4F4F0] border border-black rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-400 rounded-full transition-all"
                  style={{ width: `${grandPct}%` }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground mt-1.5">{grandPct}%</p>
            </div>

            {/* AI Suggestions panel */}
            {!isSubmitted && (
              <div className="bg-white border border-black rounded-lg p-5">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-purple-500" />
                  AI Suggestions
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Get AI-generated score suggestions based on the project abstract.
                  These are not final — you make the decision.
                </p>
                {!aiLoaded && (
                  <button
                    onClick={fetchAISuggestions}
                    disabled={aiLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold border border-black rounded bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        Get AI Suggestions
                      </>
                    )}
                  </button>
                )}
                {aiLoaded && suggestions.length > 0 && (
                  <div className="text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded p-2 mt-1">
                    ✓ Suggestions loaded — see them inline on each criterion above.
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="bg-white border border-black rounded-lg p-5">
              <label className="text-sm font-bold block mb-2">Evaluation Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitted}
                placeholder="Add any additional notes about this project…"
                rows={4}
                className="w-full border border-black rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-400 disabled:opacity-60 disabled:bg-gray-50"
              />
            </div>

            {/* Action buttons */}
            {!isSubmitted && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSave("DRAFT")}
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold border border-black rounded bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save Draft
                </button>
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={isPending}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold bg-black text-white border border-black rounded hover:bg-pink-400 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Send className="size-4" />
                  Submit Score
                </button>
              </div>
            )}

            {isSubmitted && (
              <button
                onClick={() => router.push("/judge")}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold bg-black text-white border border-black rounded hover:bg-pink-400 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
              >
                <ArrowLeft className="size-4" />
                Back to Projects
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Submit Confirmation Dialog ── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm border border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Submit Score?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Once submitted, your score for <strong>{projectTitle}</strong> cannot
              be changed. Please review your scores before confirming.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-[#F4F4F0] border border-black rounded-lg p-4 text-sm">
            <div className="flex justify-between mb-1">
              <span>Part A</span>
              <span className="font-semibold">{partAScore}/{partAMax}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Part B</span>
              <span className="font-semibold">{partBScore}/{partBMax}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Part C</span>
              <span className="font-semibold">{partCScore}/{partCMax}</span>
            </div>
            <div className="h-px bg-black my-2" />
            <div className="flex justify-between">
              <span className="font-bold">Total</span>
              <span className="font-bold text-pink-500">{grandTotal}/{grandMax}</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 text-sm font-semibold border border-black rounded bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmOpen(false)
                handleSave("SUBMITTED")
              }}
              disabled={isPending}
              className="px-5 py-2 text-sm font-bold bg-black text-white border border-black rounded hover:bg-pink-400 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isPending ? "Submitting…" : "Confirm & Submit"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
