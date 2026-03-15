import { prisma } from "@/lib/prisma"
import { SubmitForm } from "@/components/submit/SubmitForm"
import { CalendarX } from "lucide-react"

interface PageProps {
  params: Promise<{ eventId: string }>
}

export default async function SubmitPage({ params }: PageProps) {
  const { eventId } = await params

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      categories: {
        select: { id: true, name: true, color: true },
        orderBy: { name: "asc" },
      },
    },
  })

  if (!event || event.status !== "ACTIVE") {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center px-4">
        <div className="border border-black border-dashed flex items-center justify-center p-8 flex-col gap-y-4 bg-white w-full max-w-md rounded-lg">
          <CalendarX className="size-8" />
          <div className="text-center">
            <h1 className="text-xl font-medium">Submissions are closed</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {event
                ? "This event is not currently accepting submissions."
                : "This event does not exist or the link is incorrect."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F4F0] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <SubmitForm event={event} categories={event.categories} />
      </div>
    </div>
  )
}
