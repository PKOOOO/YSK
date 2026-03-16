import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { prisma } from "@/lib/prisma"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [events, activeEvent] = await Promise.all([
    prisma.event.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, status: true, type: true } }),
    prisma.event.findFirst({ where: { status: "ACTIVE" }, select: { id: true, name: true, status: true, type: true } }),
  ])

  return (
    <SidebarProvider>
      <AdminSidebar events={events} activeEvent={activeEvent} />
      <div className="flex flex-col flex-1 min-w-0 min-h-screen">
        {/* Mobile topbar — the trigger is shown on all sizes but is only
            visually meaningful (sidebar hidden) on small screens */}
        <header className="flex items-center gap-3 h-12 px-4 border-b border-black/10 bg-white md:hidden">
          <SidebarTrigger className="p-1.5 rounded-md border border-black/20 hover:bg-[#F4F4F0] hover:border-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all" />
          {/* <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-black flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">YSK</span>
            </div>

          </div> */}
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </SidebarProvider>
  )
}
