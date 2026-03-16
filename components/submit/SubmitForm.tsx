"use client"

import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import {
  Upload,
  X,
  FileText,
  ImageIcon,
  CheckCircle2,
  Check,
  School,
  FileEdit,
  Tags,
  Paperclip,
  ClipboardCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createProject } from "@/app/actions/projects"
import { generateAbstractSummary } from "@/app/actions/ai"
import { uploadFiles } from "@/lib/uploadthing"
import { CategorySuggester } from "@/components/ai/CategorySuggester"

interface Category {
  id: string
  name: string
  color: string
}

interface Event {
  id: string
  name: string
  type: string
}

interface SubmitFormProps {
  event: Event
  categories: Category[]
}

const SubmitSchema = z.object({
  schoolName: z.string().min(1, "School name is required"),
  teacherName: z.string().min(1, "Teacher name is required"),
  teacherEmail: z.string().email("Invalid email address"),
  title: z.string().min(1, "Project title is required").max(100),
  categoryId: z.string().min(1, "Please select a category"),
  schoolLevel: z.enum(["JSS", "SENIOR"]),
})

const Step1Schema = z.object({
  schoolName: z.string().min(1, "School name is required"),
  teacherName: z.string().min(1, "Teacher name is required"),
  teacherEmail: z.string().email("Invalid email address"),
})

const Step2Schema = z.object({
  title: z.string().min(1, "Project title is required").max(100),
})

const Step3Schema = z.object({
  categoryId: z.string().min(1, "Please select a category"),
  schoolLevel: z.enum(["JSS", "SENIOR"]),
})

const MAX_FILE_SIZE_PDF = 16 * 1024 * 1024
const MAX_FILE_SIZE_IMAGE = 8 * 1024 * 1024
const MAX_PDF_COUNT = 5
const MAX_IMAGE_COUNT = 10

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImageFile(file: File) {
  return file.type.startsWith("image/")
}

function isPdfFile(file: File) {
  return file.type === "application/pdf"
}

function isDocxFile(file: File) {
  return (
    file.type.includes("wordprocessingml") ||
    file.name.toLowerCase().endsWith(".docx")
  )
}

const STEPS = [
  { label: "School", icon: School },
  { label: "Project", icon: FileEdit },
  { label: "Category", icon: Tags },
  { label: "Files", icon: Paperclip },
  { label: "Review", icon: ClipboardCheck },
]

interface SuccessScreenProps {
  title: string
  schoolName: string
}

function SuccessScreen({ title, schoolName }: SuccessScreenProps) {
  return (
    <div className="min-h-[80vh] bg-[#F4F4F0] flex items-center justify-center px-4">
      <div className="bg-white rounded-md border p-8 sm:p-10 max-w-md w-full text-center flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-green-50 border border-green-300 flex items-center justify-center">
          <CheckCircle2 className="size-8 text-green-500" />
        </div>
        <div>
          <h1 className="text-2xl font-medium">Submitted!</h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            Your project has been submitted successfully. The organizers will
            review it shortly.
          </p>
        </div>
        <div className="w-full border rounded-md p-4 text-left flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Project
          </p>
          <p className="text-base font-medium">{title}</p>
          <p className="text-sm text-muted-foreground mt-1">{schoolName}</p>
        </div>
      </div>
    </div>
  )
}

export function SubmitForm({ event, categories }: SubmitFormProps) {
  const [step, setStep] = useState(1)
  const [schoolName, setSchoolName] = useState("")
  const [teacherName, setTeacherName] = useState("")
  const [teacherEmail, setTeacherEmail] = useState("")
  const [title, setTitle] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [schoolLevel, setSchoolLevel] = useState<"JSS" | "SENIOR">("SENIOR")
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<{
    title: string
    schoolName: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasDocument = files.some((f) => isPdfFile(f) || isDocxFile(f))

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming)
    setFiles((prev) => {
      const next = [...prev]

      for (const f of arr) {
        const currentImages = next.filter(isImageFile).length
        const isDupe = next.some((x) => x.name === f.name && x.size === f.size)
        if (isDupe) continue

        if (isPdfFile(f) || isDocxFile(f)) {
          const currentDocs = next.filter((x) => isPdfFile(x) || isDocxFile(x)).length
          if (currentDocs >= MAX_PDF_COUNT) {
            toast.error(`Max ${MAX_PDF_COUNT} documents allowed`)
            continue
          }
          if (f.size > MAX_FILE_SIZE_PDF) {
            toast.error(`${f.name} exceeds 16 MB limit`)
            continue
          }
          next.push(f)
        } else if (isImageFile(f)) {
          if (currentImages >= MAX_IMAGE_COUNT) {
            toast.error(`Max ${MAX_IMAGE_COUNT} image files allowed`)
            continue
          }
          if (f.size > MAX_FILE_SIZE_IMAGE) {
            toast.error(`${f.name} exceeds 8 MB limit`)
            continue
          }
          next.push(f)
        } else {
          toast.error(`${f.name} is not a supported file type`)
        }
      }
      return next
    })
  }, [])

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  function validateStep(): boolean {
    setErrors({})

    if (step === 1) {
      const result = Step1Schema.safeParse({ schoolName, teacherName, teacherEmail })
      if (!result.success) {
        const fieldErrors: Record<string, string> = {}
        result.error.issues.forEach((err) => {
          fieldErrors[err.path[0] as string] = err.message
        })
        setErrors(fieldErrors)
        return false
      }
    }

    if (step === 2) {
      const result = Step2Schema.safeParse({ title })
      if (!result.success) {
        const fieldErrors: Record<string, string> = {}
        result.error.issues.forEach((err) => {
          fieldErrors[err.path[0] as string] = err.message
        })
        setErrors(fieldErrors)
        return false
      }
    }

    if (step === 3) {
      const result = Step3Schema.safeParse({ categoryId, schoolLevel })
      if (!result.success) {
        const fieldErrors: Record<string, string> = {}
        result.error.issues.forEach((err) => {
          fieldErrors[err.path[0] as string] = err.message
        })
        setErrors(fieldErrors)
        return false
      }
    }

    if (step === 4) {
      if (!hasDocument) {
        setErrors({ files: "Please upload at least one PDF or Word document (.docx)" })
        return false
      }
    }

    return true
  }

  function handleNext() {
    if (!validateStep()) return
    if (step < 5) setStep(step + 1)
  }

  function handlePrev() {
    setErrors({})
    if (step > 1) setStep(step - 1)
  }

  async function handleSubmit() {
    const result = SubmitSchema.safeParse({
      schoolName,
      teacherName,
      teacherEmail,
      title,
      categoryId,
      schoolLevel,
    })

    if (!result.success) {
      toast.error("Please fix the errors before submitting")
      return
    }

    if (!hasDocument) {
      toast.error("Please upload at least one PDF or Word document (.docx)")
      return
    }

    setLoading(true)

    const createResult = await createProject({
      ...result.data,
      eventId: event.id,
    })

    if (!createResult.success) {
      toast.error("Submission failed", { description: createResult.error })
      setLoading(false)
      return
    }

    const projectId = createResult.data.id

    console.log("[submit] files.length:", files.length)
    if (files.length > 0) {
      try {
        await uploadFiles("projectFiles", {
          files,
          input: { projectId },
        })
      } catch (err) {
        console.error("[submit] upload error:", err)
        toast.error("Files could not be uploaded, but your project was saved.")
      }
    }

    // Generate AI summary from the uploaded PDF (fire and forget)
    void generateAbstractSummary(projectId)

    setSubmittedData({ title, schoolName })
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted && submittedData) {
    return (
      <SuccessScreen
        title={submittedData.title}
        schoolName={submittedData.schoolName}
      />
    )
  }

  const showAiSuggester =
    title.trim().length >= 10 &&
    categories.length > 0

  const selectedCategoryName = categories.find((c) => c.id === categoryId)?.name

  return (
    <div className="bg-white rounded-md border overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Project Submission
        </p>
        <h1 className="text-lg sm:text-xl font-medium">{event.name}</h1>
      </div>

      {/* Step Indicators */}
      <div className="px-4 sm:px-6 py-4 border-b bg-[#F4F4F0]/50">
        {/* Desktop step indicators */}
        <div className="hidden sm:flex items-center">
          {STEPS.map((s, i) => {
            const stepNum = i + 1
            const isActive = step === stepNum
            const isCompleted = step > stepNum

            return (
              <div key={s.label} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => {
                    // Only allow going back to completed steps
                    if (isCompleted) setStep(stepNum)
                  }}
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    isCompleted && "cursor-pointer",
                    !isCompleted && !isActive && "cursor-default"
                  )}
                >
                  <div
                    className={cn(
                      "size-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 transition-colors",
                      isCompleted
                        ? "bg-black text-white"
                        : isActive
                          ? "bg-pink-400 text-white"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? <Check className="size-4" /> : stepNum}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium hidden lg:block",
                      isActive ? "" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                </button>
                {stepNum < 5 && (
                  <div
                    className={cn(
                      "flex-1 h-px mx-3 transition-colors",
                      isCompleted ? "bg-black" : "bg-border/20"
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile step indicators */}
        <div className="flex sm:hidden items-center justify-between">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => {
              const stepNum = i + 1
              const isActive = step === stepNum
              const isCompleted = step > stepNum

              return (
                <div
                  key={s.label}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    isActive
                      ? "w-8 bg-pink-400"
                      : isCompleted
                        ? "w-6 bg-black"
                        : "w-6 bg-muted"
                  )}
                />
              )
            })}
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {step} of {STEPS.length}
          </span>
        </div>

        {/* Step title on mobile */}
        <div className="flex sm:hidden items-center gap-2 mt-3">
          {(() => {
            const StepIcon = STEPS[step - 1].icon
            return <StepIcon className="size-4 text-pink-400" />
          })()}
          <span className="text-sm font-medium">{STEPS[step - 1].label} Info</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="px-4 sm:px-6 py-5 sm:py-6 min-h-[280px]">
        {/* Step 1: School Information */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-medium">School Information</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tell us about your school and the supervising teacher.
              </p>
            </div>

            <Field label="School Name" error={errors.schoolName} required>
              <Input
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g. Lagoon Comprehensive School"
                className={cn(errors.schoolName && "border-red-400")}
                autoFocus
              />
            </Field>

            <Field label="Teacher Name" error={errors.teacherName} required>
              <Input
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="e.g. Mr. Adebayo Okafor"
                className={cn(errors.teacherName && "border-red-400")}
              />
            </Field>

            <Field label="Teacher Email" error={errors.teacherEmail} required>
              <Input
                type="email"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="teacher@school.edu"
                className={cn(errors.teacherEmail && "border-red-400")}
              />
            </Field>
          </div>
        )}

        {/* Step 2: Project Details */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-medium">Project Details</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Give your science project a clear, descriptive title.
              </p>
            </div>

            <Field label="Project Title" error={errors.title} required>
              <div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Effect of Saltwater on Plant Growth"
                  maxLength={100}
                  className={cn(errors.title && "border-red-400")}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {title.length}/100
                </p>
              </div>
            </Field>

            <div className="flex items-start gap-3 p-3 rounded-md border bg-blue-50 text-blue-800">
              <Sparkles className="size-4 shrink-0 mt-0.5" />
              <p className="text-sm">
                You don&apos;t need to write an abstract. Upload your research document (PDF) in the next steps and our AI will automatically generate a project summary for judges.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Category & Level */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-medium">Category & Level</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Classify your project for the judges.
              </p>
            </div>

            {/* AI Category Suggester */}
            {showAiSuggester && (
              <CategorySuggester
                title={title}
                categories={categories}
                onSelect={(id) => {
                  setCategoryId(id)
                  setErrors((prev) => ({ ...prev, categoryId: "" }))
                }}
              />
            )}

            <Field label="Category" error={errors.categoryId} required>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={cn(
                  "h-12 w-full rounded-lg border bg-white px-2.5 py-2 text-base font-medium transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  errors.categoryId && "border-red-400",
                  !categoryId && "text-muted-foreground"
                )}
              >
                <option value="" disabled>
                  Select a category…
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No categories have been set up for this event yet.
                </p>
              )}
            </Field>

            <Field label="School Level" error={errors.schoolLevel} required>
              <div className="flex flex-col sm:flex-row gap-3">
                {(["JSS", "SENIOR"] as const).map((level) => (
                  <label
                    key={level}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-md border cursor-pointer transition-all text-sm font-medium",
                      schoolLevel === level
                        ? "border-pink-400 bg-pink-50 text-pink-700"
                        : "bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px]"
                    )}
                  >
                    <input
                      type="radio"
                      name="schoolLevel"
                      value={level}
                      checked={schoolLevel === level}
                      onChange={() => setSchoolLevel(level)}
                      className="sr-only"
                    />
                    {level === "JSS"
                      ? "JSS (Junior Secondary)"
                      : "Senior Secondary"}
                  </label>
                ))}
              </div>
            </Field>
          </div>
        )}

        {/* Step 4: File Upload */}
        {step === 4 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-medium">Upload Files</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Upload your research document (PDF or Word .docx).
                Our AI will automatically generate a project summary for judges.
              </p>
            </div>

            <Field
              label="Research Document"
              error={errors.files}
              hint="PDF or DOCX (max 16 MB, up to 5) and images (max 8 MB, up to 10)"
              required
            >
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-dashed border-2 rounded-md p-6 sm:p-8 text-center cursor-pointer transition-all",
                  errors.files
                    ? "border-red-400 bg-red-50/30"
                    : dragging
                      ? "border-pink-400 bg-pink-50"
                      : "border-black hover:border-pink-400 hover:bg-pink-50/30"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
                <Upload className="size-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">
                  Drag & drop files here, or{" "}
                  <span className="text-pink-500 underline font-medium">
                    browse
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  At least one PDF or .docx research document is required
                </p>
              </div>

              {files.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                  {files.map((file, i) => (
                    <li
                      key={`${file.name}-${i}`}
                      className="flex items-center gap-2 sm:gap-3 px-3 py-2 bg-white rounded-md border"
                    >
                      {isPdfFile(file) ? (
                        <FileText className="size-4 text-red-400 shrink-0" />
                      ) : isDocxFile(file) ? (
                        <FileText className="size-4 text-blue-500 shrink-0" />
                      ) : (
                        <ImageIcon className="size-4 text-blue-400 shrink-0" />
                      )}
                      <span className="text-sm font-medium flex-1 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                        {formatBytes(file.size)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(i)
                        }}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!hasDocument && files.length > 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠ You have uploaded images but no research document. At least one PDF or .docx is required.
                </p>
              )}
            </Field>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-medium">Review & Submit</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Double-check everything before submitting your project.
              </p>
            </div>

            <div className="border rounded-md overflow-hidden bg-white divide-y">
              <ReviewRow label="School Name" value={schoolName} onEdit={() => setStep(1)} />
              <ReviewRow label="Teacher" value={`${teacherName} (${teacherEmail})`} onEdit={() => setStep(1)} />
              <ReviewRow label="Project Title" value={title} onEdit={() => setStep(2)} />
              <ReviewRow
                label="Category"
                value={selectedCategoryName ?? "—"}
                onEdit={() => setStep(3)}
              />
              <ReviewRow
                label="School Level"
                value={schoolLevel === "JSS" ? "JSS (Junior Secondary)" : "Senior Secondary"}
                onEdit={() => setStep(3)}
              />
              <ReviewRow
                label="Files"
                value={files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""} attached (${files.filter((f) => isPdfFile(f) || isDocxFile(f)).length} document)` : "No files"}
                onEdit={() => setStep(4)}
              />
            </div>

            <div className="flex items-start gap-3 p-3 rounded-md border bg-blue-50 text-blue-800">
              <Sparkles className="size-4 shrink-0 mt-0.5" />
              <p className="text-sm">
                After submission, our AI will read your research document (PDF or .docx) and generate a project summary for the judges automatically.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="px-4 sm:px-6 py-4 border-t flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={handlePrev}
          disabled={step === 1}
          className={cn(step === 1 && "invisible")}
        >
          Previous
        </Button>

        {step < 5 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="bg-black text-white hover:bg-pink-400 hover:text-primary gap-1"
          >
            Continue
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-black text-white hover:bg-pink-400 hover:text-primary"
          >
            {loading ? "Submitting…" : "Submit Project"}
          </Button>
        )}
      </div>
    </div>
  )
}

function ReviewRow({
  label,
  value,
  onEdit,
}: {
  label: string
  value: string
  onEdit: () => void
}) {
  return (
    <div className="p-3 sm:p-4 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm sm:text-base font-medium mt-0.5 break-words">
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-sm text-pink-500 underline font-medium shrink-0 mt-1"
      >
        Edit
      </button>
    </div>
  )
}

function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-base font-medium">
        {label}
        {required && <span className="text-pink-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
