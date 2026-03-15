"use client"

import { useState } from "react"
import { InboxIcon, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EventWizard } from "./EventWizard"
import { EventsGrid } from "./EventsGrid"
import type { EventWithProjects } from "./EventCard"

interface EventsClientProps {
  events: EventWithProjects[]
}

export function EventsClient({ events }: EventsClientProps) {
  const [wizardOpen, setWizardOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-medium">Events</h1>
        <Button
          onClick={() => setWizardOpen(true)}
          variant="elevated"
          className="bg-black text-white hover:bg-pink-400 hover:text-primary"
        >
          <Plus className="size-4" />
          Create Event
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="border border-black border-dashed flex items-center justify-center p-8 flex-col gap-y-4 bg-white w-full rounded-lg">
          <InboxIcon />
          <p className="text-base font-medium">You haven&apos;t created any events yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first event to start managing projects and judges.
          </p>
          <Button
            onClick={() => setWizardOpen(true)}
            variant="elevated"
            className="bg-black text-white hover:bg-pink-400 hover:text-primary mt-2"
          >
            <Plus className="size-4" />
            Create Event
          </Button>
        </div>
      ) : (
        <EventsGrid events={events} />
      )}

      <EventWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </>
  )
}
