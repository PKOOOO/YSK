"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireJudge } from "@/lib/auth"
import { ScoreStatus, JudgingSession } from "@prisma/client"

const SaveScoreSchema = z.object({
  assignmentId: z.string().min(1),
  items: z.array(
    z.object({
      criterionId: z.string().min(1),
      value: z.number().min(0),
    })
  ),
  notes: z.string().optional(),
  status: z.nativeEnum(ScoreStatus),
  session: z.nativeEnum(JudgingSession),
})

export async function saveScore(input: unknown) {
  try {
    const judge = await requireJudge()
    const data = SaveScoreSchema.parse(input)

    const assignment = await prisma.judgeAssignment.findUnique({
      where: { id: data.assignmentId },
      include: {
        project: {
          include: {
            category: { include: { criteria: { orderBy: { order: "asc" } } } },
          },
        },
      },
    })

    if (!assignment || assignment.judgeId !== judge.id) {
      return { success: false as const, error: "Assignment not found or unauthorized" }
    }

    // Build a map of criterionId -> value for quick lookup
    const valueMap = new Map(data.items.map((i) => [i.criterionId, i.value]))

    // Calculate part scores
    const criteria = assignment.project.category.criteria
    let partAScore = 0
    let partBScore = 0
    let partCScore = 0

    for (const c of criteria) {
      const val = valueMap.get(c.id) ?? 0
      if (c.description?.startsWith("Part A")) partAScore += val
      else if (c.description?.startsWith("Part B")) partBScore += val
      else if (c.description?.startsWith("Part C")) partCScore += val
    }

    const totalScore = partAScore + partBScore + partCScore

    // Upsert Score record
    const score = await prisma.score.upsert({
      where: {
        judgeId_projectId: {
          judgeId: judge.id,
          projectId: assignment.projectId,
        },
      },
      create: {
        judgeId: judge.id,
        projectId: assignment.projectId,
        assignmentId: assignment.id,
        session: data.session,
        partAScore,
        partBScore,
        partCScore,
        totalScore,
        notes: data.notes ?? null,
        status: data.status,
        submittedAt: data.status === "SUBMITTED" ? new Date() : null,
      },
      update: {
        partAScore,
        partBScore,
        partCScore,
        totalScore,
        notes: data.notes ?? null,
        status: data.status,
        session: data.session,
        submittedAt: data.status === "SUBMITTED" ? new Date() : undefined,
      },
    })

    // Upsert each ScoreItem
    for (const item of data.items) {
      await prisma.scoreItem.upsert({
        where: {
          scoreId_criterionId: {
            scoreId: score.id,
            criterionId: item.criterionId,
          },
        },
        create: {
          scoreId: score.id,
          criterionId: item.criterionId,
          value: item.value,
        },
        update: { value: item.value },
      })
    }

    revalidatePath("/judge")
    revalidatePath(`/judge/score/${assignment.projectId}`)
    return { success: true as const, data: { scoreId: score.id, status: data.status } }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to save score",
    }
  }
}
