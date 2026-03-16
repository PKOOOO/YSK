import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#F4F4F0]">
      <AdminSidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
