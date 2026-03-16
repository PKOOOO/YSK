/**
 * Explicit types for Prisma query results.
 *
 * The PrismaNeon adapter changes the PrismaClient generic signature,
 * causing `next build` to lose type inference on query results.
 * These types are used as explicit annotations on .map() / .filter()
 * callbacks in server components.
 */

// ─── Category with criteria and project count ────────────────────────────────

export interface CategoryWithCriteria {
    id: string
    name: string
    color: string
    schoolLevel: string
    criteria: CriterionRow[]
    _count: { projects: number }
}

export interface CriterionRow {
    id: string
    name: string
    description: string | null
    maxScore: number
    weight: number
    order: number
    categoryId: string
}

// ─── Project with scores, category, assignments, files ───────────────────────

export interface ProjectWithRelations {
    id: string
    title: string
    abstract: string | null
    aiSummary: string | null
    aiFeedback: string | null
    aiCategorySuggestion: string | null
    schoolName: string
    teacherName: string
    teacherEmail: string | null
    projectCode: string | null
    schoolLevel: string
    eventId: string
    categoryId: string
    approved: boolean
    createdAt: Date
    updatedAt: Date
    category: { id: string; name: string; color: string }
    assignments: AssignmentRow[]
    scores: ScoreRow[]
    files: FileRow[]
}

export interface AssignmentRow {
    id: string
    judgeId: string
    projectId: string
    judge: { id: string; name: string }
}

export interface ScoreRow {
    id: string
    totalScore: number
    status: string
}

export interface FileRow {
    id: string
    name: string
    url: string
    size: number
    type: string
}

// ─── Leaderboard project (scores only) ───────────────────────────────────────

export interface LeaderboardProject {
    id: string
    title: string
    schoolName: string
    schoolLevel: string
    category: { id: string; name: string; color: string }
    scores: { totalScore: number; partAScore: number; partBScore: number; partCScore: number }[]
}

// ─── Judge with assignments ──────────────────────────────────────────────────

export interface JudgeWithAssignments {
    id: string
    name: string
    email: string
    judgeAssignments: {
        id: string
        projectId: string
        project: {
            id: string
            title: string
            schoolName: string
            approved: boolean
            category: { name: string; color: string }
        }
        score: { id: string; status: string } | null
    }[]
}

export interface ApprovedProject {
    id: string
    title: string
    schoolName: string
    category: { name: string; color: string }
    assignments: { judgeId: string }[]
}

// ─── Judge portal assignment ─────────────────────────────────────────────────

export interface JudgeAssignmentWithProject {
    id: string
    project: {
        id: string
        title: string
        schoolName: string
        teacherName: string
        projectCode: string | null
        schoolLevel: string
        aiSummary: string | null
        abstract: string | null
        eventId: string
        category: { name: string; color: string }
    }
    score: { status: string } | null
}

// ─── Scoring page ────────────────────────────────────────────────────────────

export interface ScoringCriterion {
    id: string
    name: string
    description: string | null
    maxScore: number
    order: number
}

export interface ScoringFile {
    id: string
    name: string
    url: string
    type: string
    size: number
}
