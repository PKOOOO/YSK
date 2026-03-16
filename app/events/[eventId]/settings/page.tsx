import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { SettingsClient } from "@/components/settings/SettingsClient"

interface Props {
  params: Promise<{ eventId: string }>
}

export default async function EventSettingsPage({ params }: Props) {
  await requireAdmin()
  const { eventId } = await params

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  })

  if (!event) {
    notFound()
  }

  const serializedEvent = {
    id: event.id,
    name: event.name,
    type: event.type,
    judgingMode: event.judgingMode,
    status: event.status,
    resultsPublic: event.resultsPublic,
    anonymousJudging: event.anonymousJudging,
    requireComments: event.requireComments,
    allowMultipleJudges: event.allowMultipleJudges,
    allowSubmissions: event.allowSubmissions,
    submissionDeadline: event.submissionDeadline?.toISOString() ?? null,
    showLiveScores: event.showLiveScores,
  }

  return <SettingsClient event={serializedEvent} />
}
