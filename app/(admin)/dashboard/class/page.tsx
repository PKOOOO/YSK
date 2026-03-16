import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CategoriesClient } from "@/components/categories/CategoriesClient"
import Link from "next/link"
import { PlusCircle } from "lucide-react"

export default async function CategoriesPage() {
  await requireAdmin()

  const activeEvent = await prisma.event.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      categories: {
        include: {
          criteria: { orderBy: { order: "asc" } },
          _count: { select: { projects: true } },
        },
        orderBy: { name: "asc" },
      },
    },
  })

  if (!activeEvent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-8">
        <div className="border border-black border-dashed flex items-center justify-center p-8 flex-col gap-y-4 bg-white w-full max-w-md rounded-lg">
          <PlusCircle className="size-12 text-muted-foreground" />
          <p className="text-base font-medium text-center">
            No active event found. Please create and activate an event first.
          </p>
          <Link href="/events">
            <button className="px-4 py-2 text-sm font-medium bg-black text-white rounded hover:bg-pink-400 hover:text-primary transition-colors">
              Go to Events
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const categories = activeEvent.categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    schoolLevel: c.schoolLevel as "JSS" | "SENIOR",
    projectCount: c._count.projects,
    criteria: c.criteria.map((cr) => ({
      id: cr.id,
      name: cr.name,
      description: cr.description,
      maxScore: cr.maxScore,
      order: cr.order,
    })),
  }))

  return (
    <CategoriesClient
      eventId={activeEvent.id}
      eventName={activeEvent.name}
      categories={categories}
    />
  )
}
