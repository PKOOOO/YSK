import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProjectsTable } from "@/components/dashboard/ProjectsTable"
import { ProgressChart } from "@/components/dashboard/ProgressChart"
import Link from "next/link"
import { FileText, Users, CheckCircle2, Clock } from "lucide-react"
import type { ProjectWithRelations } from "@/lib/prisma-types"

export default async function DashboardPage() {
  await requireAdmin()

  const event = await prisma.event.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: {
      projects: {
        include: {
          category: true,
          assignments: {
            include: { judge: true },
          },
          scores: {
            where: { status: "SUBMITTED" },
            take: 1,
          },
          files: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!event) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center px-4">
        <div className="border border-black border-dashed flex flex-col items-center justify-center p-10 gap-y-4 bg-white w-full max-w-md rounded-lg text-center">
          <FileText className="size-8" />
          <div>
            <h1 className="text-xl font-medium">No Active Event</h1>
            <p className="text-sm text-muted-foreground mt-2">
              There is no active event. Create or activate one to see the dashboard.
            </p>
          </div>
          <Link
            href="/events"
            className="px-4 py-2.5 bg-black text-white text-sm font-medium rounded hover:bg-pink-400 hover:text-primary transition-colors"
          >
            Go to Events
          </Link>
        </div>
      </div>
    )
  }

  const projects = event.projects as unknown as ProjectWithRelations[]

  // Compute stats
  const totalProjects = projects.length
  const judgeIds = new Set(projects.flatMap((p) => p.assignments.map((a) => a.judgeId)))
  const totalJudges = judgeIds.size
  const scored = projects.filter((p) => p.scores.length > 0).length
  const pending = totalProjects - scored

  // Max submitted score across all projects (for progress bar normalization)
  const maxScore = projects.reduce((max, p) => {
    const s = p.scores[0]?.totalScore ?? 0
    return Math.max(max, s)
  }, 0)

  // Format enum to readable label
  function fmtEnum(val: string) {
    return val.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
  }

  const stats = [
    {
      label: "Total Projects",
      value: totalProjects,
      sub: "submitted projects",
      Icon: FileText,
    },
    {
      label: "Judges Assigned",
      value: totalJudges,
      sub: "unique judges",
      Icon: Users,
    },
    {
      label: "Scored",
      value: scored,
      sub: "with submitted scores",
      Icon: CheckCircle2,
    },
    {
      label: "Pending",
      value: pending,
      sub: "awaiting scores",
      Icon: Clock,
    },
  ]

  // Serialise to plain objects for the client component
  const projectRows = projects.map((p) => ({
    id: p.id,
    title: p.title,
    abstract: p.abstract,
    aiSummary: p.aiSummary,
    schoolName: p.schoolName,
    teacherName: p.teacherName,
    teacherEmail: p.teacherEmail,
    schoolLevel: p.schoolLevel as "JSS" | "SENIOR",
    approved: p.approved,
    category: {
      id: p.category.id,
      name: p.category.name,
      color: p.category.color,
    },
    assignments: p.assignments.map((a) => ({
      id: a.id,
      judge: { id: a.judge.id, name: a.judge.name },
    })),
    scores: p.scores.map((s) => ({
      id: s.id,
      totalScore: s.totalScore,
      status: s.status,
    })),
    files: p.files.map((f) => ({
      id: f.id,
      name: f.name,
      url: f.url,
      size: f.size,
      type: f.type,
    })),
  }))

  return (
    <div className="min-h-screen bg-[#F4F4F0]">
      {/* Page header */}
      <div className="px-4 lg:px-12 py-7 border-b bg-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Admin Dashboard
            </p>
            <h1 className="text-2xl font-medium">{event.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {fmtEnum(event.type)} · {fmtEnum(event.judgingMode)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 border border-green-400 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              Active
            </span>
            <Link
              href="/events"
              className="text-sm font-medium underline text-muted-foreground hover:text-foreground transition-colors"
            >
              All Events
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-12 py-8 flex flex-col gap-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, sub, Icon }) => (
            <div
              key={label}
              className="bg-white rounded-md border p-4 flex flex-col gap-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <span className="text-3xl font-bold">{value}</span>
              <span className="text-xs text-muted-foreground">{sub}</span>
            </div>
          ))}
        </div>

        {/* Table + Chart */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          <div className="xl:col-span-3">
            <ProjectsTable projects={projectRows} maxScore={maxScore} />
          </div>
          <div className="xl:col-span-1">
            <ProgressChart scored={scored} pending={pending} />
          </div>
        </div>
      </div>
    </div>
  )
}
