import { requireJudge } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ScoringClient } from "@/components/scoring/ScoringClient"

interface Props {
  params: Promise<{ projectId: string }>
}

export default async function ScoringPage({ params }: Props) {
  const judge = await requireJudge()
  const { projectId } = await params

  const assignment = await prisma.judgeAssignment.findUnique({
    where: {
      judgeId_projectId: { judgeId: judge.id, projectId },
    },
    include: {
      project: {
        include: {
          category: {
            include: {
              criteria: { orderBy: { order: "asc" } },
            },
          },
          event: {
            select: { anonymousJudging: true },
          },
          files: {
            select: { id: true, name: true, url: true, type: true, size: true },
          },
        },
      },
      score: {
        include: {
          items: true,
        },
      },
    },
  })

  if (!assignment) {
    redirect("/judge")
  }

  const project = assignment.project
  const criteria = project.category.criteria.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    maxScore: c.maxScore,
    order: c.order,
  }))

  const existingItems = assignment.score?.items ?? []
  const itemMap: Record<string, number> = {}
  for (const item of existingItems) {
    itemMap[item.criterionId] = item.value
  }

  const files = project.files.map((f) => ({
    id: f.id,
    name: f.name,
    url: f.url,
    type: f.type,
    size: f.size,
  }))

  return (
    <div className="min-h-screen bg-[#F4F4F0]">
      <ScoringClient
        assignmentId={assignment.id}
        projectId={project.id}
        projectTitle={project.title}
        schoolName={project.schoolName}
        teacherName={project.teacherName}
        projectCode={project.projectCode}
        schoolLevel={project.schoolLevel as "JSS" | "SENIOR"}
        categoryName={project.category.name}
        categoryColor={project.category.color}
        aiSummary={project.aiSummary}
        abstract={project.abstract}
        criteria={criteria}
        existingScoreValues={itemMap}
        existingNotes={assignment.score?.notes ?? ""}
        existingStatus={
          (assignment.score?.status as "DRAFT" | "SUBMITTED") ?? null
        }
        existingSession={
          (assignment.score?.session as "SESSION_ONE" | "SESSION_TWO") ?? null
        }
        files={files}
        anonymousJudging={project.event.anonymousJudging}
      />
    </div>
  )
}
