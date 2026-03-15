"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Layers } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  createCategory,
  updateCategory,
  deleteCategory,
  addCriterion,
  deleteCriterion,
} from "@/app/actions/categories"

// ─── Types ────────────────────────────────────────────────────────────────────

type CriterionRow = {
  id: string
  name: string
  description: string | null
  maxScore: number
  order: number
}

type CategoryRow = {
  id: string
  name: string
  color: string
  schoolLevel: "JSS" | "SENIOR"
  projectCount: number
  criteria: CriterionRow[]
}

interface Props {
  eventId: string
  eventName: string
  categories: CategoryRow[]
}

// ─── Preset colors ────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  "#f472b6", // pink
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // purple
  "#ef4444", // red
  "#0ea5e9", // sky
  "#14b8a6", // teal
]

// ─── Part label helper ─────────────────────────────────────────────────────────

function getPartBadgeColor(description: string | null) {
  if (!description) return "bg-gray-100 text-gray-700"
  if (description.includes("Part A")) return "bg-blue-50 text-blue-700"
  if (description.includes("Part B")) return "bg-purple-50 text-purple-700"
  if (description.includes("Part C")) return "bg-green-50 text-green-700"
  return "bg-gray-100 text-gray-700"
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CategoriesClient({ eventId, eventName, categories }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // ── Add Category modal ──
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState("")
  const [addColor, setAddColor] = useState(PRESET_COLORS[0])
  const [addLevel, setAddLevel] = useState<"JSS" | "SENIOR">("SENIOR")

  // ── Edit Category modal ──
  const [editTarget, setEditTarget] = useState<CategoryRow | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")

  // ── Delete Category confirm ──
  const [deleteTarget, setDeleteTarget] = useState<CategoryRow | null>(null)

  // ── Add Criterion modal ──
  const [criterionTarget, setCriterionTarget] = useState<CategoryRow | null>(null)
  const [criterionName, setCriterionName] = useState("")
  const [criterionDesc, setCriterionDesc] = useState("")
  const [criterionMax, setCriterionMax] = useState(2)
  const [criterionOrder, setCriterionOrder] = useState(0)

  // ── Expanded criteria ──
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Handlers ──

  function handleAddOpen() {
    setAddName("")
    setAddColor(PRESET_COLORS[0])
    setAddLevel("SENIOR")
    setAddOpen(true)
  }

  function handleAdd() {
    if (!addName.trim()) return
    startTransition(async () => {
      const result = await createCategory({
        eventId,
        name: addName.trim(),
        color: addColor,
        schoolLevel: addLevel,
      })
      if (result.success) {
        toast.success(`Category "${addName}" created with criteria auto-seeded`)
        setAddOpen(false)
        router.refresh()
      } else {
        toast.error("Failed to create category", { description: result.error })
      }
    })
  }

  function handleEditOpen(cat: CategoryRow) {
    setEditTarget(cat)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  function handleEdit() {
    if (!editTarget || !editName.trim()) return
    startTransition(async () => {
      const result = await updateCategory(editTarget.id, {
        name: editName.trim(),
        color: editColor,
      })
      if (result.success) {
        toast.success("Category updated")
        setEditTarget(null)
        router.refresh()
      } else {
        toast.error("Failed to update category", { description: result.error })
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteCategory(deleteTarget.id)
      if (result.success) {
        toast.success(`"${deleteTarget.name}" deleted`)
        setDeleteTarget(null)
        router.refresh()
      } else {
        toast.error("Failed to delete category", { description: result.error })
      }
    })
  }

  function handleAddCriterionOpen(cat: CategoryRow) {
    setCriterionTarget(cat)
    setCriterionName("")
    setCriterionDesc("")
    setCriterionMax(2)
    setCriterionOrder(cat.criteria.length + 1)
  }

  function handleAddCriterion() {
    if (!criterionTarget || !criterionName.trim()) return
    startTransition(async () => {
      const result = await addCriterion({
        categoryId: criterionTarget.id,
        name: criterionName.trim(),
        description: criterionDesc.trim() || undefined,
        maxScore: criterionMax,
        order: criterionOrder,
      })
      if (result.success) {
        toast.success("Criterion added")
        setCriterionTarget(null)
        router.refresh()
      } else {
        toast.error("Failed to add criterion", { description: result.error })
      }
    })
  }

  function handleDeleteCriterion(id: string, name: string) {
    startTransition(async () => {
      const result = await deleteCriterion(id)
      if (result.success) {
        toast.success(`"${name}" removed`)
        router.refresh()
      } else {
        toast.error("Failed to remove criterion", { description: result.error })
      }
    })
  }

  // ─── Tabs: JSS / Senior ────────────────────────────────────────────────────
  const [tab, setTab] = useState<"SENIOR" | "JSS">("SENIOR")
  const filtered = categories.filter((c) => c.schoolLevel === tab)

  return (
    <div className="px-4 lg:px-12 py-8 bg-background min-h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{eventName}</p>
        </div>
        <button
          onClick={handleAddOpen}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-black text-white rounded-md border border-black hover:bg-pink-400 hover:text-primary hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all"
        >
          <Plus className="size-4" />
          Add Category
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border rounded-md overflow-hidden w-fit">
        {(["SENIOR", "JSS"] as const).map((level) => {
          const count = categories.filter((c) => c.schoolLevel === level).length
          return (
            <button
              key={level}
              onClick={() => setTab(level)}
              className={cn(
                "px-5 py-2 text-sm font-medium transition-colors",
                tab === level
                  ? "bg-black text-white"
                  : "bg-white text-muted-foreground hover:bg-[#F4F4F0]"
              )}
            >
              {level === "SENIOR" ? "Senior" : "JSS"}{" "}
              <span className={cn("ml-1.5 text-xs", tab === level ? "opacity-70" : "opacity-60")}>
                ({count})
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border border-black border-dashed rounded-lg bg-white">
          <Layers className="size-10 text-muted-foreground mb-3" />
          <p className="text-base font-medium">No {tab === "JSS" ? "JSS" : "Senior"} categories yet</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Add a category to auto-seed all KSEF criteria
          </p>
          <button
            onClick={handleAddOpen}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-black text-white rounded-md border border-black hover:bg-pink-400 hover:text-primary hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all"
          >
            <Plus className="size-4" />
            Add Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              expanded={expandedIds.has(cat.id)}
              onToggleExpand={() => toggleExpand(cat.id)}
              onEdit={() => handleEditOpen(cat)}
              onDelete={() => setDeleteTarget(cat)}
              onAddCriterion={() => handleAddCriterionOpen(cat)}
              onDeleteCriterion={handleDeleteCriterion}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* ── Add Category Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              KSEF criteria will be auto-seeded based on the school level.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Category Name</label>
              <input
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Biology"
                className="h-10 px-3 border rounded-md text-sm outline-none focus:ring-1 focus:ring-black bg-white"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>

            {/* School Level */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">School Level</label>
              <div className="flex gap-2">
                {(["SENIOR", "JSS"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setAddLevel(level)}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-medium border rounded-md transition-all",
                      addLevel === level
                        ? "bg-black text-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                        : "bg-white text-muted-foreground hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px]"
                    )}
                  >
                    {level === "SENIOR" ? "Senior (75 marks)" : "JSS (65 marks)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Color</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAddColor(c)}
                    className={cn(
                      "size-8 rounded-full border-2 transition-transform hover:scale-110",
                      addColor === c ? "border-black scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="size-5 rounded-full border" style={{ backgroundColor: addColor }} />
                <span className="text-xs text-muted-foreground font-mono">{addColor}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setAddOpen(false)}
              className="px-4 py-2 text-sm font-medium border rounded-md bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!addName.trim() || isPending}
              className="px-5 py-2 text-sm font-medium bg-black text-white rounded-md border border-black hover:bg-pink-400 hover:text-primary hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create Category"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Category Dialog ── */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Category Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-10 px-3 border rounded-md text-sm outline-none focus:ring-1 focus:ring-black bg-white"
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Color</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    className={cn(
                      "size-8 rounded-full border-2 transition-transform hover:scale-110",
                      editColor === c ? "border-black scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="size-5 rounded-full border" style={{ backgroundColor: editColor }} />
                <span className="text-xs text-muted-foreground font-mono">{editColor}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setEditTarget(null)}
              className="px-4 py-2 text-sm font-medium border rounded-md bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleEdit}
              disabled={!editName.trim() || isPending}
              className="px-5 py-2 text-sm font-medium bg-black text-white rounded-md border border-black hover:bg-pink-400 hover:text-primary hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold">&ldquo;{deleteTarget?.name}&rdquo;</span> and all its
              criteria. Projects assigned to this category will lose their category link.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-sm font-medium border rounded-md bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-5 py-2 text-sm font-medium bg-red-600 text-white rounded-md border border-red-600 hover:bg-red-700 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all disabled:opacity-50"
            >
              {isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Criterion Dialog ── */}
      <Dialog open={!!criterionTarget} onOpenChange={(o) => !o && setCriterionTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Criterion</DialogTitle>
            <DialogDescription>
              Adding to <span className="font-semibold">{criterionTarget?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Criterion Name</label>
              <input
                value={criterionName}
                onChange={(e) => setCriterionName(e.target.value)}
                placeholder="e.g. Written language in write-up"
                className="h-10 px-3 border rounded-md text-sm outline-none focus:ring-1 focus:ring-black bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea
                value={criterionDesc}
                onChange={(e) => setCriterionDesc(e.target.value)}
                placeholder="e.g. Part A — Written Communication"
                rows={2}
                className="px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-black bg-white resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Max Score</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={criterionMax}
                  onChange={(e) => setCriterionMax(Number(e.target.value))}
                  className="h-10 px-3 border rounded-md text-sm outline-none focus:ring-1 focus:ring-black bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Order</label>
                <input
                  type="number"
                  min={0}
                  value={criterionOrder}
                  onChange={(e) => setCriterionOrder(Number(e.target.value))}
                  className="h-10 px-3 border rounded-md text-sm outline-none focus:ring-1 focus:ring-black bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setCriterionTarget(null)}
              className="px-4 py-2 text-sm font-medium border rounded-md bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCriterion}
              disabled={!criterionName.trim() || isPending}
              className="px-5 py-2 text-sm font-medium bg-black text-white rounded-md border border-black hover:bg-pink-400 hover:text-primary hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all disabled:opacity-50"
            >
              {isPending ? "Adding…" : "Add Criterion"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Category Card ─────────────────────────────────────────────────────────────

function CategoryCard({
  category,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddCriterion,
  onDeleteCriterion,
  isPending,
}: {
  category: CategoryRow
  expanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onAddCriterion: () => void
  onDeleteCriterion: (id: string, name: string) => void
  isPending: boolean
}) {
  const totalMaxScore = category.criteria.reduce((sum, c) => sum + c.maxScore, 0)

  return (
    <div className="bg-white rounded-md border flex flex-col overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
      {/* Colored stripe */}
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: category.color }} />

      {/* Card body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
            <h3 className="font-semibold text-base leading-tight truncate">{category.name}</h3>
          </div>
          <span
            className={cn(
              "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border",
              category.schoolLevel === "JSS"
                ? "border-blue-400 text-blue-700 bg-blue-50"
                : "border-purple-400 text-purple-700 bg-purple-50"
            )}
          >
            {category.schoolLevel === "JSS" ? "JSS" : "Senior"}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{category.projectCount} {category.projectCount === 1 ? "project" : "projects"}</span>
          <span>·</span>
          <span>{category.criteria.length} criteria</span>
          <span>·</span>
          <span className="font-medium text-foreground">{totalMaxScore} max pts</span>
        </div>

        {/* Criteria preview / expanded list */}
        {category.criteria.length > 0 && (
          <div>
            {!expanded ? (
              <div className="flex flex-wrap gap-1.5">
                {category.criteria.slice(0, 4).map((cr) => (
                  <span
                    key={cr.id}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      getPartBadgeColor(cr.description)
                    )}
                    title={cr.name}
                  >
                    {cr.name.length > 28 ? cr.name.slice(0, 28) + "…" : cr.name} ({cr.maxScore})
                  </span>
                ))}
                {category.criteria.length > 4 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                    +{category.criteria.length - 4} more
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
                {category.criteria.map((cr) => (
                  <div key={cr.id} className="flex items-start justify-between gap-2 group py-1 border-b border-dashed last:border-0">
                    <div className="flex items-start gap-2 min-w-0">
                      <span
                        className={cn(
                          "shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium mt-0.5",
                          getPartBadgeColor(cr.description)
                        )}
                      >
                        {cr.description?.replace("Part ", "P") ?? "—"}
                      </span>
                      <span className="text-xs leading-snug">{cr.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-muted-foreground">{cr.maxScore}pt</span>
                      <button
                        onClick={() => onDeleteCriterion(cr.id, cr.name)}
                        disabled={isPending}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition-all"
                        title="Remove criterion"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onToggleExpand}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
            >
              {expanded ? (
                <><ChevronUp className="size-3" /> Collapse</>
              ) : (
                <><ChevronDown className="size-3" /> Show all {category.criteria.length} criteria</>
              )}
            </button>
          </div>
        )}

        {category.criteria.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No criteria yet</p>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t px-4 py-2.5 flex items-center justify-between bg-[#F4F4F0]/50">
        <button
          onClick={onAddCriterion}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded-md bg-white text-muted-foreground hover:text-foreground hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
        >
          <Plus className="size-3.5" />
          Add Criterion
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-md border bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
            title="Edit category"
          >
            <Pencil className="size-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md border bg-white hover:border-red-400 hover:bg-red-50 hover:shadow-[4px_4px_0px_0px_rgba(239,68,68,0.4)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
            title="Delete category"
          >
            <Trash2 className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}
