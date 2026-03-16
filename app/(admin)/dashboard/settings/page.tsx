import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SettingsClient } from "@/components/settings/SettingsClient"
import { FileText } from "lucide-react"
import Link from "next/link"

export default async function SettingsPage() {
  await requireAdmin()

  const event = await prisma.event.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  })

  if (!event) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center px-4">
        <div className="border border-black border-dashed flex flex-col items-center justify-center p-10 gap-y-4 bg-white w-full max-w-md rounded-lg text-center">
          <FileText className="size-8" />
          <div>
            <h1 className="text-xl font-medium">No Active Event</h1>
            <p className="text-sm text-muted-foreground mt-2">
              There is no active event. Create or activate one to manage settings.
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
