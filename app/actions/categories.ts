"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"


// ─── Criteria templates ────────────────────────────────────────────────────────

const JSS_CRITERIA = [
  // Part A — Written Communication (Session 1) — 20 marks
  { name: "Write-up neatly and logically organized (clearly labeled sections, plagiarism pledge)", description: "Part A — Written Communication", maxScore: 2, order: 1 },
  { name: "Evidence of background research in write-up", description: "Part A — Written Communication", maxScore: 1, order: 2 },
  { name: "Written language in write-up or display board (legible, correct fonts, no spelling mistakes)", description: "Part A — Written Communication", maxScore: 1, order: 3 },
  { name: "Objectives reflected in write-up and display board", description: "Part A — Written Communication", maxScore: 2, order: 4 },
  { name: "Methods and materials used in write-up and display board", description: "Part A — Written Communication", maxScore: 2, order: 5 },
  { name: "Results in write-up and display board (tabular + graphs)", description: "Part A — Written Communication", maxScore: 2, order: 6 },
  { name: "Analysis of results in write-up or display board", description: "Part A — Written Communication", maxScore: 1, order: 7 },
  { name: "Discussion of results (patterns, trends, anomalies, limitations)", description: "Part A — Written Communication", maxScore: 1, order: 8 },
  { name: "Future possibilities / recommendations", description: "Part A — Written Communication", maxScore: 1, order: 9 },
  { name: "Conclusions (valid, based on findings, linked to objectives)", description: "Part A — Written Communication", maxScore: 1, order: 10 },
  { name: "References (correct format)", description: "Part A — Written Communication", maxScore: 1, order: 11 },
  { name: "Acknowledgements", description: "Part A — Written Communication", maxScore: 1, order: 12 },
  { name: "Display board (correct size, logical flow, neatly organized)", description: "Part A — Written Communication", maxScore: 2, order: 13 },
  { name: "Project data file / Portfolio", description: "Part A — Written Communication", maxScore: 2, order: 14 },
  // Part B — Oral Communication (Session 2) — 10 marks
  { name: "Enthusiasm / effort", description: "Part B — Oral Communication", maxScore: 1, order: 15 },
  { name: "Voice / tone (audible, varying intonation)", description: "Part B — Oral Communication", maxScore: 1, order: 16 },
  { name: "Self-confidence", description: "Part B — Oral Communication", maxScore: 1, order: 17 },
  { name: "Scientific language", description: "Part B — Oral Communication", maxScore: 2, order: 18 },
  { name: "Response to questions", description: "Part B — Oral Communication", maxScore: 2, order: 19 },
  { name: "Limitations / weaknesses and gaps", description: "Part B — Oral Communication", maxScore: 1, order: 20 },
  { name: "Possible suggestions / recommendations", description: "Part B — Oral Communication", maxScore: 1, order: 21 },
  { name: "Authenticity (ownership of project)", description: "Part B — Oral Communication", maxScore: 1, order: 22 },
  // Part C — Scientific Thought, Method and Creativity (Session 2) — 35 marks
  { name: "Statement of the problem and objectives", description: "Part C — Scientific Thought", maxScore: 2, order: 23 },
  { name: "Introduction / Background information", description: "Part C — Scientific Thought", maxScore: 2, order: 24 },
  { name: "Application of scientific concepts to everyday life", description: "Part C — Scientific Thought", maxScore: 3, order: 25 },
  { name: "Subject mastery", description: "Part C — Scientific Thought", maxScore: 3, order: 26 },
  { name: "Literature review", description: "Part C — Scientific Thought", maxScore: 2, order: 27 },
  { name: "Data adequacy", description: "Part C — Scientific Thought", maxScore: 3, order: 28 },
  { name: "Variables defined and controlled", description: "Part C — Scientific Thought", maxScore: 2, order: 29 },
  { name: "Statement of originality", description: "Part C — Scientific Thought", maxScore: 2, order: 30 },
  { name: "Logical sequence: Apparatus (2) + Procedure (2) + Illustrations (3)", description: "Part C — Scientific Thought", maxScore: 7, order: 31 },
  { name: "Linkage to emerging issues", description: "Part C — Scientific Thought", maxScore: 2, order: 32 },
  { name: "Originality", description: "Part C — Scientific Thought", maxScore: 3, order: 33 },
  { name: "Creativity", description: "Part C — Scientific Thought", maxScore: 2, order: 34 },
  { name: "Skill / workmanship", description: "Part C — Scientific Thought", maxScore: 2, order: 35 },
]

const SENIOR_CRITERIA = [
  // Part A — Written Communication (Session 1) — 30 marks
  { name: "Write-up neatly and logically organized", description: "Part A — Written Communication", maxScore: 2, order: 1 },
  { name: "Evidence of background research + Introduction", description: "Part A — Written Communication", maxScore: 2, order: 2 },
  { name: "Written language in write-up and on poster", description: "Part A — Written Communication", maxScore: 2, order: 3 },
  { name: "Aim / hypothesis / objectives", description: "Part A — Written Communication", maxScore: 2, order: 4 },
  { name: "Methods and materials", description: "Part A — Written Communication", maxScore: 2, order: 5 },
  { name: "Variables identified (dependent and independent)", description: "Part A — Written Communication", maxScore: 2, order: 6 },
  { name: "Results (tabular + graphs in write-up, summary on poster)", description: "Part A — Written Communication", maxScore: 2, order: 7 },
  { name: "Analysis of results", description: "Part A — Written Communication", maxScore: 2, order: 8 },
  { name: "Discussion of results", description: "Part A — Written Communication", maxScore: 2, order: 9 },
  { name: "Future possibilities / recommendations", description: "Part A — Written Communication", maxScore: 2, order: 10 },
  { name: "Conclusions", description: "Part A — Written Communication", maxScore: 2, order: 11 },
  { name: "References (APA format)", description: "Part A — Written Communication", maxScore: 2, order: 12 },
  { name: "Acknowledgements", description: "Part A — Written Communication", maxScore: 2, order: 13 },
  { name: "Display board", description: "Part A — Written Communication", maxScore: 2, order: 14 },
  { name: "Project data file", description: "Part A — Written Communication", maxScore: 2, order: 15 },
  // Part B — Oral Communication (Session 2) — 15 marks
  { name: "Capture of interest", description: "Part B — Oral Communication", maxScore: 1, order: 16 },
  { name: "Enthusiasm / effort", description: "Part B — Oral Communication", maxScore: 1, order: 17 },
  { name: "Voice / tone", description: "Part B — Oral Communication", maxScore: 1, order: 18 },
  { name: "Self-confidence", description: "Part B — Oral Communication", maxScore: 1, order: 19 },
  { name: "Scientific language", description: "Part B — Oral Communication", maxScore: 1, order: 20 },
  { name: "Response to questions", description: "Part B — Oral Communication", maxScore: 2, order: 21 },
  { name: "Presentation of project (logical flow)", description: "Part B — Oral Communication", maxScore: 2, order: 22 },
  { name: "Limitations / weaknesses and gaps", description: "Part B — Oral Communication", maxScore: 2, order: 23 },
  { name: "Possible suggestions / recommendations", description: "Part B — Oral Communication", maxScore: 2, order: 24 },
  { name: "Authenticity", description: "Part B — Oral Communication", maxScore: 2, order: 25 },
  // Part C — Scientific Thought, Method and Creativity (Session 2) — 30 marks
  { name: "Statement of the problem", description: "Part C — Scientific Thought", maxScore: 2, order: 26 },
  { name: "Introduction / Background information", description: "Part C — Scientific Thought", maxScore: 2, order: 27 },
  { name: "Application of scientific concepts to everyday life", description: "Part C — Scientific Thought", maxScore: 3, order: 28 },
  { name: "Subject mastery", description: "Part C — Scientific Thought", maxScore: 3, order: 29 },
  { name: "Literature review", description: "Part C — Scientific Thought", maxScore: 2, order: 30 },
  { name: "Data adequacy", description: "Part C — Scientific Thought", maxScore: 3, order: 31 },
  { name: "Variables", description: "Part C — Scientific Thought", maxScore: 2, order: 32 },
  { name: "Statement of originality", description: "Part C — Scientific Thought", maxScore: 2, order: 33 },
  { name: "Logical sequence: Apparatus (2) + Procedure (2) + Illustrations (3)", description: "Part C — Scientific Thought", maxScore: 7, order: 34 },
  { name: "Linkage to emerging issues", description: "Part C — Scientific Thought", maxScore: 2, order: 35 },
  { name: "Originality", description: "Part C — Scientific Thought", maxScore: 3, order: 36 },
  { name: "Creativity", description: "Part C — Scientific Thought", maxScore: 2, order: 37 },
  { name: "Skill / workmanship", description: "Part C — Scientific Thought", maxScore: 2, order: 38 },
]

async function seedCriteria(categoryId: string, schoolLevel: "JSS" | "SENIOR") {
  const criteria = schoolLevel === "JSS" ? JSS_CRITERIA : SENIOR_CRITERIA
  await prisma.criterion.createMany({
    data: criteria.map((c) => ({ ...c, categoryId })),
  })
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CreateCategorySchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1, "Category name is required").max(100),
  color: z.string().min(1),
  schoolLevel: z.enum(["JSS", "SENIOR"]),
})

const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().min(1),
})

const AddCriterionSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1, "Criterion name is required"),
  description: z.string().optional(),
  maxScore: z.number().int().min(1).max(100),
  order: z.number().int().min(0),
})

const UpdateCriterionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  maxScore: z.number().int().min(1).max(100),
  order: z.number().int().min(0),
})

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createCategory(input: unknown) {
  try {
    await requireAdmin()
    const { eventId, name, color, schoolLevel } = CreateCategorySchema.parse(input)

    const category = await prisma.category.create({
      data: { eventId, name, color, schoolLevel },
    })

    await seedCriteria(category.id, schoolLevel)

    revalidatePath("/dashboard/class")
    return { success: true as const, data: category }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create category",
    }
  }
}

export async function updateCategory(id: string, input: unknown) {
  try {
    await requireAdmin()
    const data = UpdateCategorySchema.parse(input)
    const category = await prisma.category.update({ where: { id }, data })
    revalidatePath("/dashboard/class")
    return { success: true as const, data: category }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update category",
    }
  }
}

export async function deleteCategory(id: string) {
  try {
    await requireAdmin()
    await prisma.category.delete({ where: { id } })
    revalidatePath("/dashboard/class")
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete category",
    }
  }
}

export async function addCriterion(input: unknown) {
  try {
    await requireAdmin()
    const data = AddCriterionSchema.parse(input)
    const criterion = await prisma.criterion.create({ data })
    revalidatePath("/dashboard/class")
    return { success: true as const, data: criterion }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to add criterion",
    }
  }
}

export async function updateCriterion(id: string, input: unknown) {
  try {
    await requireAdmin()
    const data = UpdateCriterionSchema.parse(input)
    const criterion = await prisma.criterion.update({ where: { id }, data })
    revalidatePath("/dashboard/class")
    return { success: true as const, data: criterion }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update criterion",
    }
  }
}

export async function deleteCriterion(id: string) {
  try {
    await requireAdmin()
    await prisma.criterion.delete({ where: { id } })
    revalidatePath("/dashboard/class")
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete criterion",
    }
  }
}
