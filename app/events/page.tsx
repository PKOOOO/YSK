import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EventsClient } from "@/components/events/EventsClient"

export default async function EventsPage() {
  try {
    await requireAdmin()
  } catch {
    redirect("/sign-in")
  }

  const events = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { projects: true } },
      projects: { select: { schoolLevel: true } },
    },
  })

  return (
    <div className="min-h-screen bg-[#F4F4F0]">
      <div className="px-4 lg:px-12 py-8">
        <EventsClient events={events} />
      </div>
    </div>
  )
}
