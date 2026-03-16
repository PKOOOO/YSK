"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton, useUser } from "@clerk/nextjs"
import {
  LayoutDashboard,
  Trophy,
  FolderOpen,
  Users,
  Settings,
  Eye,
  Calendar,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { SidebarEventSwitcher } from "@/components/admin/SidebarEventSwitcher"
import { cn } from "@/lib/utils"

type Event = { id: string; name: string; status: string; type: string }

const MAIN_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard/class", label: "Categories", icon: FolderOpen },
  { href: "/dashboard/management", label: "Judge Management", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

const SECONDARY_NAV = [
  { href: "/judge", label: "View as Judge", icon: Eye },
  { href: "/events", label: "Back to Events", icon: Calendar },
]

export function AdminSidebar({
  events = [],
  activeEvent = null,
}: {
  events?: Event[]
  activeEvent?: Event | null
}) {
  const pathname = usePathname()
  const { user } = useUser()

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

  return (
    <Sidebar collapsible="icon">
      {/* ── Event Switcher (Logo area) ── */}
      <SidebarHeader className="border-b border-black/10">
        <SidebarEventSwitcher events={events} activeEvent={activeEvent} />
      </SidebarHeader>

      <SidebarContent>
        {/* ── Main Navigation ── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV.map(({ href, label, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={active}
                      tooltip={label}
                      className={cn(
                        "rounded-md border transition-all font-medium",
                        active
                          ? "bg-black text-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white"
                          : "border-transparent text-muted-foreground hover:bg-white hover:text-foreground hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px]"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ── Secondary Navigation ── */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
            Quick Links
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SECONDARY_NAV.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    tooltip={label}
                    className="rounded-md border border-transparent text-muted-foreground hover:bg-white hover:text-foreground hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all font-medium"
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── User Footer ── */}
      <SidebarFooter className="border-t border-black/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3 px-2 py-1.5">
              <UserButton />
              <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium truncate leading-tight">
                  {user?.fullName ?? user?.firstName ?? "Admin"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
