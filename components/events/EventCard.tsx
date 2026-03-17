import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Event } from "@prisma/client"

export type EventWithProjects = Event & {
  _count: { projects: number }
  projects: { schoolLevel: "JSS" | "SENIOR" }[]
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-amber-400",
  ACTIVE: "bg-green-400",
  CLOSED: "bg-gray-400",
  ARCHIVED: "bg-gray-300",
}

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

const JUDGING_MODE_LABELS: Record<string, string> = {
  OFFICIAL_JUDGE: "Official Judge",
  PUBLIC_VOTING: "Public Voting",
  GUEST_JUDGE: "Guest Judge",
  OFFICIAL_AND_GUEST: "Official + Guest",
  OFFICIAL_AND_PUBLIC: "Official + Public Voting",
}

interface EventCardProps {
  event: EventWithProjects
}

export function EventCard({ event }: EventCardProps) {
  const schoolLevels = new Set(event.projects.map((p) => p.schoolLevel))
  const schoolLevelBadge =
    schoolLevels.size === 0
      ? null
      : schoolLevels.size > 1
        ? "Mixed"
        : Array.from(schoolLevels)[0] === "JSS"
          ? "JSS"
          : "Senior"

  const statusLabel = event.status.charAt(0) + event.status.slice(1).toLowerCase()

  return (
    <div className="bg-white rounded-md border overflow-hidden flex flex-col hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
      <div className="p-4 border-b flex flex-col gap-3 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium px-2 py-0.5 border rounded-full truncate">
            {EVENT_TYPE_LABELS[event.type] ?? event.type}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={cn("size-2 rounded-full", STATUS_COLORS[event.status] ?? "bg-gray-300")} />
            <span className="text-xs font-medium text-muted-foreground">{statusLabel}</span>
          </div>
        </div>

        <h3 className="text-lg font-medium line-clamp-2">{event.name}</h3>

        {schoolLevelBadge && (
          <div className="px-2 py-1 border bg-pink-400 w-fit">
            <span className="text-sm font-medium">{schoolLevelBadge}</span>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-1 text-sm text-muted-foreground">
          <span className="font-medium">
            {event._count.projects} project{event._count.projects !== 1 ? "s" : ""}
          </span>
          <span>{JUDGING_MODE_LABELS[event.judgingMode] ?? event.judgingMode}</span>
        </div>
      </div>

      <div className="p-4 flex gap-2">
        <Link
          href="/dashboard"
          className="flex-1 text-center text-base font-medium bg-black text-white py-2.5 rounded-md hover:bg-pink-400 hover:text-primary transition-all border"
        >
          Open Dashboard
        </Link>
        <Link
          href={`/events/${event.id}/settings`}
          className="px-4 text-base font-medium border bg-white py-2.5 rounded-md hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all"
        >
          Settings
        </Link>
      </div>
    </div>
  )
}
