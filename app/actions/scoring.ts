"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin, requireJudge } from "@/lib/auth"

const SaveScoreSchema = z.object({
  assignmentId: z.string().min(1),
  items: z.array(
    z.object({
      criterionId: z.string().min(1),
      value: z.number().min(0),
    })
  ),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED"]),
  session: z.enum(["SESSION_ONE", "SESSION_TWO"]),
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
            event: { select: { status: true } },
          },
        },
      },
    })

    if (!assignment || assignment.judgeId !== judge.id) {
      return { success: false as const, error: "Assignment not found or unauthorized" }
    }

    if (assignment.project.event.status === "CLOSED" && data.status === "SUBMITTED") {
      return { success: false as const, error: "This event is closed. Scores can no longer be submitted." }
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

    await prisma.auditLog.create({
      data: {
        userId: judge.id,
        action: data.status === "SUBMITTED" ? "SCORE_SUBMITTED" : "SCORE_DRAFT",
        entityId: score.id,
        entityType: "Score",
        meta: { projectId: assignment.projectId, totalScore, status: data.status },
      },
    })

    return { success: true as const, data: { scoreId: score.id, status: data.status } }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to save score",
    }
  }
}

export async function resetScore(assignmentId: string) {
  try {
    await requireAdmin()
    const assignment = await prisma.judgeAssignment.findUniqueOrThrow({
      where: { id: assignmentId },
      include: { score: true },
    })

    if (!assignment.score) {
      return { success: false as const, error: "No score found for this assignment" }
    }

    const score = await prisma.score.update({
      where: { id: assignment.score.id },
      data: { status: "DRAFT", submittedAt: null },
    })

    revalidatePath("/dashboard")
    revalidatePath("/judge")
    return { success: true as const, data: score }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to reset score",
    }
  }
}

export async function getScoreByAssignment(assignmentId: string) {
  return prisma.score.findUnique({
    where: { assignmentId },
    include: {
      items: { include: { criterion: true }, orderBy: { criterion: { order: "asc" } } },
      judge: { select: { id: true, name: true, email: true } },
    },
  })
}

export async function getLeaderboard(eventId: string, categoryId?: string) {
  const projects = (await prisma.project.findMany({
    where: {
      eventId,
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      category: { select: { id: true, name: true, color: true } },
      scores: {
        where: { status: "SUBMITTED" },
        select: {
          totalScore: true,
          partAScore: true,
          partBScore: true,
          partCScore: true,
        },
      },
    },
  })) as unknown as { id: string; title: string; schoolName: string; schoolLevel: string; category: { id: string; name: string; color: string }; scores: { totalScore: number; partAScore: number; partBScore: number; partCScore: number }[] }[]

  const scored = projects.filter((p) => p.scores.length > 0)

  const withAvg = scored.map((p) => {
    const count = p.scores.length
    const avg = (field: "totalScore" | "partAScore" | "partBScore" | "partCScore") =>
      p.scores.reduce((sum: number, s) => sum + s[field], 0) / count

    return {
      projectId: p.id,
      title: p.title,
      schoolName: p.schoolName,
      schoolLevel: p.schoolLevel,
      categoryId: p.category.id,
      categoryName: p.category.name,
      categoryColor: p.category.color,
      avgTotal: avg("totalScore"),
      avgPartA: avg("partAScore"),
      avgPartB: avg("partBScore"),
      avgPartC: avg("partCScore"),
      judgeCount: count,
      maxScore: p.schoolLevel === "JSS" ? 65 : 80,
    }
  })

  withAvg.sort((a, b) => b.avgTotal - a.avgTotal)

  const ranked = withAvg.map((row, idx) => ({ ...row, rank: idx + 1 }))

  return ranked
}
