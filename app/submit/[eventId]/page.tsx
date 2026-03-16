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

  const isClosed =
    !event ||
    event.status !== "ACTIVE" ||
    !event.allowSubmissions ||
    (event.submissionDeadline && new Date(event.submissionDeadline) < new Date())

  if (isClosed) {
    let message = "This event does not exist or the link is incorrect."
    if (event && !event.allowSubmissions) {
      message = "Submissions have been disabled by the organizer."
    } else if (event?.submissionDeadline && new Date(event.submissionDeadline) < new Date()) {
      message = "The submission deadline has passed."
    } else if (event) {
      message = "This event is not currently accepting submissions."
    }

    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center px-4">
        <div className="border border-black border-dashed flex items-center justify-center p-8 flex-col gap-y-4 bg-white w-full max-w-md rounded-lg">
          <CalendarX className="size-8" />
          <div className="text-center">
            <h1 className="text-xl font-medium">Submissions are closed</h1>
            <p className="text-sm text-muted-foreground mt-2">{message}</p>
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
