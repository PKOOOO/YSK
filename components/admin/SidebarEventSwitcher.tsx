"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { setEventStatus } from "@/app/actions/events"
import { toast } from "sonner"
import { ChevronsUpDown, Check, Plus, Circle } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

type Event = {
    id: string
    name: string
    status: string
    type: string
}

const STATUS_COLOR: Record<string, string> = {
    ACTIVE: "text-green-500",
    DRAFT: "text-yellow-500",
    CLOSED: "text-red-400",
    ARCHIVED: "text-muted-foreground",
}

export function SidebarEventSwitcher({
    events,
    activeEvent,
}: {
    events: Event[]
    activeEvent: Event | null
}) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    function switchEvent(event: Event) {
        if (event.id === activeEvent?.id) return
        startTransition(async () => {
            const result = await setEventStatus(event.id, "ACTIVE")
            if (result.success) {
                toast.success(`Switched to "${event.name}"`)
                router.refresh()
            } else {
                toast.error(result.error ?? "Failed to switch event")
            }
        })
    }

    const display = activeEvent ?? events[0] ?? null

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className={cn(
                            "flex w-full items-center gap-3 rounded-md p-2 text-left transition-all outline-none",
                            "border border-transparent",
                            "hover:bg-white hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px]",
                            "data-open:bg-white data-open:border-black data-open:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] data-open:-translate-x-[2px] data-open:-translate-y-[2px]",
                            isPending && "opacity-60 pointer-events-none"
                        )}
                    >
                        {/* YSK badge */}
                        <div className="flex size-8 items-center justify-center rounded-md bg-black text-white shrink-0">
                            <span className="text-xs font-bold">YSK</span>
                        </div>

                        {/* Label + event name */}
                        <div className="flex flex-col leading-tight min-w-0 group-data-[collapsible=icon]:hidden">

                            <span className="text-[11px] text-muted-foreground truncate">
                                {display ? display.name : "No active event"}
                            </span>
                        </div>

                        <ChevronsUpDown className="ml-auto size-4 text-muted-foreground shrink-0 group-data-[collapsible=icon]:hidden" />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-64 border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-1"
                        align="start"
                        sideOffset={8}
                    >
                        <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium">
                            Switch Event
                        </div>
                        <hr className="-mx-1 my-1 border-black/10" />

                        {events.length === 0 && (
                            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                                No events yet
                            </div>
                        )}

                        {events.map((event) => {
                            const isActive = event.id === activeEvent?.id
                            return (
                                <DropdownMenuItem
                                    key={event.id}
                                    onClick={() => switchEvent(event)}
                                    className={cn(
                                        "flex items-center gap-2.5 cursor-pointer rounded-md",
                                        isActive && "bg-black text-white"
                                    )}
                                >
                                    <Circle
                                        className={cn(
                                            "size-2 shrink-0 fill-current",
                                            isActive ? "text-pink-400" : (STATUS_COLOR[event.status] ?? "text-muted-foreground")
                                        )}
                                    />
                                    <span className="flex-1 truncate text-sm font-medium">{event.name}</span>
                                    {isActive && <Check className="size-3.5 shrink-0" />}
                                </DropdownMenuItem>
                            )
                        })}

                        <hr className="-mx-1 my-1 border-black/10" />
                        <DropdownMenuItem
                            onClick={() => router.push("/events")}
                            className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                        >
                            <Plus className="size-4" />
                            Manage all events
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
