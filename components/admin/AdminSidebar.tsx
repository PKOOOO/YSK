"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Trophy,
  Layers,
  Users,
  Settings,
  ClipboardList,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard/class", label: "Categories", icon: Layers },
  { href: "/dashboard/management", label: "Management", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white border border-black rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all"
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-black flex flex-col transition-transform duration-200 ease-in-out",
          "lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo area */}
        <div className="h-16 flex items-center px-5 border-b border-black shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="size-7 rounded bg-black flex items-center justify-center">
              <span className="text-white text-xs font-bold">YSK</span>
            </div>
            <span className="font-bold text-sm tracking-tight">Admin Panel</span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all",
                isActive(href)
                  ? "bg-black text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-[#F4F4F0]"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer — Judge Portal preview link */}
        <div className="px-3 pb-4 mt-auto">
          <div className="border-t border-black/10 pt-3">
            <Link
              href="/judge"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-[#F4F4F0] rounded-md transition-all"
            >
              <ClipboardList className="size-4 shrink-0" />
              Judge Portal
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                Preview
              </span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  )
}
