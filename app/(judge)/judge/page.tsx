import { requireJudge } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { JudgePortalClient } from "@/components/judge/JudgePortalClient"

export default async function JudgePage() {
  const judge = await requireJudge()

  const assignments = await prisma.judgeAssignment.findMany({
    where: { judgeId: judge.id },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          schoolName: true,
          teacherName: true,
          projectCode: true,
          schoolLevel: true,
          aiSummary: true,
          abstract: true,
          eventId: true,
          category: {
            select: { name: true, color: true },
          },
        },
      },
      score: {
        select: { status: true },
      },
    },
    orderBy: { assignedAt: "asc" },
  })

  // Fetch event settings for anonymous mode (use first project's eventId)
  let anonymousJudging = false
  if (assignments.length > 0) {
    const event = await prisma.event.findUnique({
      where: { id: assignments[0].project.eventId },
      select: { anonymousJudging: true },
    })
    anonymousJudging = event?.anonymousJudging ?? false
  }

  const projects = assignments.map((a) => ({
    assignmentId: a.id,
    projectId: a.project.id,
    title: a.project.title,
    schoolName: a.project.schoolName,
    teacherName: a.project.teacherName,
    projectCode: a.project.projectCode,
    schoolLevel: a.project.schoolLevel as "JSS" | "SENIOR",
    aiSummary: a.project.aiSummary,
    abstract: a.project.abstract,
    categoryName: a.project.category.name,
    categoryColor: a.project.category.color,
    scored: a.score?.status === "SUBMITTED",
  }))

  return (
    <div className="min-h-screen bg-[#F4F4F0]">
      <JudgePortalClient
        judgeName={judge.name}
        projects={projects}
        anonymousJudging={anonymousJudging}
      />
    </div>
  )
}
