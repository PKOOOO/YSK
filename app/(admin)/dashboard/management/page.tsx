import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ManagementClient } from "@/components/management/ManagementClient"
import { Users } from "lucide-react"
import Link from "next/link"
import type { JudgeWithAssignments, ApprovedProject } from "@/lib/prisma-types"

export default async function ManagementPage() {
  await requireAdmin()

  const activeEvent = await prisma.event.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  })

  if (!activeEvent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-8">
        <div className="border border-black border-dashed flex items-center justify-center p-8 flex-col gap-y-4 bg-white w-full max-w-md rounded-lg">
          <Users className="size-12 text-muted-foreground" />
          <p className="text-base font-medium text-center">
            No active event found. Please create one to manage judges.
          </p>
          <Link href="/events">
            <button className="px-4 py-2 text-sm font-medium bg-black text-white border border-black rounded hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all">
              Go to Events
            </button>
          </Link>
        </div>
      </div>
    )
  }

  // Fetch ALL judges, including those with no assignments yet
  const judges = (await prisma.user.findMany({
    where: { role: "JUDGE" },
    include: {
      judgeAssignments: {
        where: { project: { eventId: activeEvent.id } },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              schoolName: true,
              approved: true,
              category: { select: { name: true, color: true } },
            },
          },
          score: { select: { id: true, status: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  })) as unknown as JudgeWithAssignments[]

  // Fetch all approved projects in this event for the assignment selector
  const allApprovedProjects = (await prisma.project.findMany({
    where: { eventId: activeEvent.id, approved: true },
    select: {
      id: true,
      title: true,
      schoolName: true,
      category: { select: { name: true, color: true } },
      assignments: { select: { judgeId: true } },
    },
    orderBy: { title: "asc" },
  })) as unknown as ApprovedProject[]

  return (
    <ManagementClient
      eventId={activeEvent.id}
      eventName={activeEvent.name}
      judges={judges.map((j) => ({
        id: j.id,
        name: j.name,
        email: j.email,
        assignments: j.judgeAssignments.map((a) => ({
          id: a.id,
          projectId: a.projectId,
          projectTitle: a.project.title,
          projectSchool: a.project.schoolName,
          categoryName: a.project.category.name,
          categoryColor: a.project.category.color,
          scored: a.score?.status === "SUBMITTED",
        })),
      }))}
      allApprovedProjects={allApprovedProjects.map((p) => ({
        id: p.id,
        title: p.title,
        schoolName: p.schoolName,
        categoryName: p.category.name,
        categoryColor: p.category.color,
        assignedJudgeIds: p.assignments.map((a) => a.judgeId),
      }))}
    />
  )
}
