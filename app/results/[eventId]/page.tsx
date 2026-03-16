import { prisma } from "@/lib/prisma"
import { PublicResultsClient } from "@/components/results/PublicResultsClient"
import { Trophy, Clock } from "lucide-react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"

const EVENT_TYPE_LABELS: Record<string, string> = {
  SCIENCE_CONTEST: "Science Contest",
  PITCH_FEST: "Pitch Fest",
  EXHIBITION: "Exhibition",
  POPULARITY_POLL: "Popularity Poll",
  NOMINATION_LIST: "Nomination List",
  CREATIVE_COMPETITION: "Creative Competition",
  PERFORMANCE_CONTEST: "Performance Contest",
  APPLICATION_REVIEW: "Application Review",
}

interface PageProps {
  params: Promise<{ eventId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventId } = await params
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { name: true, type: true },
  })

  if (!event) {
    return { title: "Results Not Found — YSK" }
  }

  return {
    title: `Results — ${event.name}`,
    description: `Official results for ${event.name} (${EVENT_TYPE_LABELS[event.type] ?? event.type}). View rankings, scores, and winners.`,
    openGraph: {
      title: `Results — ${event.name}`,
      description: `Official results for ${event.name}. View rankings, scores, and winners.`,
    },
  }
}

export default async function PublicResultsPage({ params }: PageProps) {
  const { eventId } = await params

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      type: true,
      resultsPublic: true,
    },
  })

  if (!event) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center px-4">
        <div className="border border-black border-dashed flex flex-col items-center justify-center p-10 gap-y-4 bg-white w-full max-w-md rounded-lg text-center">
          <Trophy className="size-8 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-medium">Event Not Found</h1>
            <p className="text-sm text-muted-foreground mt-2">
              The event you are looking for does not exist or has been removed.
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2.5 bg-black text-white text-sm font-medium rounded-md border border-black hover:bg-pink-400 hover:text-primary hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  if (!event.resultsPublic) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center px-4">
        <div className="border rounded-md bg-white p-10 w-full max-w-md text-center flex flex-col items-center gap-4">
          <div className="size-14 rounded-full bg-pink-50 flex items-center justify-center">
            <Clock className="size-7 text-pink-400" />
          </div>
          <div>
            <h1 className="text-xl font-medium">{event.name}</h1>
            <div className="mt-2 px-2 py-1 border bg-pink-400 w-fit mx-auto">
              <span className="text-sm font-medium">
                {EVENT_TYPE_LABELS[event.type] ?? event.type}
              </span>
            </div>
          </div>
          <div className="border-t pt-4 w-full">
            <p className="text-base font-medium">Results not yet published</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back soon — results will be available here once the organizers publish them.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const projects = await prisma.project.findMany({
    where: { eventId: event.id },
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
    orderBy: { title: "asc" },
  })

  const scoredProjects = projects.filter((p) => p.scores.length > 0)

  const rows = scoredProjects
    .map((p) => {
      const judgeCount = p.scores.length
      const avg = (field: "totalScore" | "partAScore" | "partBScore" | "partCScore") =>
        p.scores.reduce((sum, s) => sum + s[field], 0) / judgeCount

      const finalScore = avg("totalScore")
      const partA = avg("partAScore")
      const partB = avg("partBScore")
      const partC = avg("partCScore")
      const maxScore = p.schoolLevel === "JSS" ? 65 : 80

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
      }
    })
    .sort((a, b) => b.finalScore - a.finalScore)
    .map((row, idx) => ({ ...row, rank: idx + 1 }))

  const categories = Array.from(
    new Map(rows.map((r) => [r.categoryId, { id: r.categoryId, name: r.categoryName }])).values()
  )

  return (
    <PublicResultsClient
      eventName={event.name}
      eventType={EVENT_TYPE_LABELS[event.type] ?? event.type}
      rows={rows}
      categories={categories}
    />
  )
}
