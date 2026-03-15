import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EventStatus, ScoreStatus } from "@prisma/client"
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient"
import Link from "next/link"
import { Trophy } from "lucide-react"

export default async function LeaderboardPage() {
  await requireAdmin()

  const event = await prisma.event.findFirst({
    where: { status: EventStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
  })

  if (!event) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center px-4">
        <div className="border border-black border-dashed flex flex-col items-center justify-center p-10 gap-y-4 bg-white w-full max-w-md rounded-lg text-center">
          <Trophy className="size-8" />
          <div>
            <h1 className="text-xl font-medium">No Active Event</h1>
            <p className="text-sm text-muted-foreground mt-2">
              There is no active event to show a leaderboard for.
            </p>
          </div>
          <Link
            href="/events"
            className="px-4 py-2.5 bg-black text-white text-sm font-medium rounded hover:bg-pink-400 hover:text-primary transition-colors"
          >
            Go to Events
          </Link>
        </div>
      </div>
    )
  }

  // Fetch all approved projects with their SUBMITTED scores
  const projects = await prisma.project.findMany({
    where: { eventId: event.id },
    include: {
      category: { select: { id: true, name: true, color: true } },
      scores: {
        where: { status: ScoreStatus.SUBMITTED },
        select: {
          totalScore: true,
          partAScore: true,
          partBScore: true,
          partCScore: true,
        },
      },
    },
    orderBy: { title: "asc" },
  })

  // Only projects with at least one submitted score
  const scoredProjects = projects.filter((p) => p.scores.length > 0)

  // Calculate final score per project = average of all submitted judge totals
  const rows = scoredProjects
    .map((p) => {
      const judgeCount = p.scores.length
      const avg = (field: keyof (typeof p.scores)[0]) =>
        p.scores.reduce((sum, s) => sum + (s[field] as number), 0) / judgeCount

      const finalScore = avg("totalScore")
      const partA = avg("partAScore")
      const partB = avg("partBScore")
      const partC = avg("partCScore")
      const maxScore = p.schoolLevel === "JSS" ? 65 : 75

      return {
        projectId: p.id,
        title: p.title,
        schoolName: p.schoolName,
        schoolLevel: p.schoolLevel as "JSS" | "SENIOR",
        categoryId: p.category.id,
        categoryName: p.category.name,
        categoryColor: p.category.color,
        finalScore,
        partA,
        partB,
        partC,
        maxScore,
        judgeCount,
      }
    })
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((row, idx) => ({ ...row, rank: idx + 1 }))

  // Unique categories for filter
  const categories = Array.from(
    new Map(rows.map((r) => [r.categoryId, { id: r.categoryId, name: r.categoryName }])).values()
  )

  return (
    <LeaderboardClient
      eventId={event.id}
      eventName={event.name}
      resultsPublic={event.resultsPublic}
      rows={rows}
      categories={categories}
    />
  )
}
