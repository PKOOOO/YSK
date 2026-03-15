import { EventCard, type EventWithProjects } from "./EventCard"

interface EventsGridProps {
  events: EventWithProjects[]
}

export function EventsGrid({ events }: EventsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}
