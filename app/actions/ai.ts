"use server"

import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateText, FAST_MODEL, SMART_MODEL } from "@/lib/ai"
import { extractPdfText } from "@/lib/pdf"
import { extractDocxText } from "@/lib/docx"

export async function generateAbstractSummary(projectId: string) {
  console.log("[AI] generateAbstractSummary called for projectId:", projectId)

  try {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: {
        title: true,
        abstract: true,
        aiSummary: true,
        files: {
          select: { url: true, type: true, name: true },
        },
      },
    }) as { title: string; abstract: string | null; aiSummary: string | null; files: { url: string; type: string; name: string }[] }

    console.log("[AI] project fetched:", project.title)

    if (project.aiSummary) {
      console.log("[AI] aiSummary already exists, skipping generation")
      return project.aiSummary
    }

    // Try to extract text from the first PDF file
    const pdfFile = project.files.find(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    )

    let documentContent: string | null = null

    if (pdfFile) {
      console.log("[AI] Found PDF file:", pdfFile.name, "- extracting text...")
      try {
        documentContent = await extractPdfText(pdfFile.url)
        console.log("[AI] PDF text extracted, length:", documentContent.length)
      } catch (pdfError) {
        console.error("[AI] PDF extraction failed:", pdfError)
        // Fall through to docx fallback
      }
    }

    // DOCX fallback if no PDF or PDF extraction failed
    if (!documentContent) {
      const docxFile = project.files.find(
        (f) =>
          f.type.includes("wordprocessingml") ||
          f.name.toLowerCase().endsWith(".docx")
      )
      if (docxFile) {
        console.log("[AI] Found DOCX file:", docxFile.name, "- extracting text...")
        try {
          documentContent = await extractDocxText(docxFile.url)
          console.log("[AI] DOCX text extracted, length:", documentContent.length)
        } catch (docxError) {
          console.error("[AI] DOCX extraction failed:", docxError)
        }
      } else {
        console.log("[AI] No PDF or DOCX file found in project files")
      }
    }

    let prompt: string

    if (documentContent) {
      prompt = `You are analyzing a science fair project. Based on the research document below, write a clear 3-4 sentence summary of: what the project is about, what method was used, and what the key findings or expected outcomes are. Be concise and suitable for a judge to read quickly.

Project Title: ${project.title}
Document Content: ${documentContent}`
    } else if (project.abstract) {
      // Fallback to abstract if it exists (legacy projects)
      prompt = `Summarize this science fair project abstract in 2-3 clear sentences for a judge who needs a quick overview. Be factual and concise.

Title: ${project.title}
Abstract: ${project.abstract}`
    } else {
      // Last resort: title-only summary
      prompt = `Based solely on the title of this science fair project, write a brief 1-2 sentence description of what the project is likely about. Be factual and concise. Note that no detailed document was available.

Project Title: ${project.title}`
    }

    console.log("[AI] calling generateText with model:", FAST_MODEL)

    const { text } = await generateText({
      model: FAST_MODEL,
      prompt,
    })

    console.log("[AI] generated text:", text)

    await prisma.project.update({
      where: { id: projectId },
      data: { aiSummary: text },
    })

    console.log("[AI] aiSummary saved to DB for projectId:", projectId)

    return text
  } catch (error) {
    console.error("[AI] generateAbstractSummary FAILED for projectId:", projectId)
    console.error("[AI] error:", error)
    return null
  }
}

export async function generateSchoolFeedback(projectId: string) {
  try {
    await requireAdmin()

    const project = await prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: {
        scores: { include: { items: { include: { criterion: true } } } },
        category: { include: { criteria: true } },
      },
    }) as { title: string; schoolName: string; teacherName: string; scores: { items: { criterion: { name: string; maxScore: number }; value: number }[]; notes: string | null }[]; category: { criteria: { name: string; maxScore: number }[] } }

    const scoreBreakdown = project.scores
      .flatMap((s) => s.items.map((item) => `${item.criterion.name}: ${item.value}/${item.criterion.maxScore}`))
      .join("\n")

    const judgeNotes = project.scores
      .map((s) => s.notes)
      .filter(Boolean)
      .join("\n")

    const { text } = await generateText({
      model: SMART_MODEL,
      prompt: `Write constructive, encouraging feedback for a school that participated in a science fair.

School: ${project.schoolName}
Project: ${project.title}
Teacher: ${project.teacherName}

Score Breakdown:
${scoreBreakdown}

Judge Notes:
${judgeNotes || "No additional notes provided."}

Write 3-4 paragraphs: acknowledge their work, highlight strengths based on high scores, give constructive suggestions for lower-scored criteria, and close with encouragement. Tone: warm, professional, helpful.`,
    })

    await prisma.project.update({
      where: { id: projectId },
      data: { aiFeedback: text },
    })

    return { success: true as const, data: text }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to generate feedback",
    }
  }
}

export async function generateResultsReport(eventId: string) {
  try {
    await requireAdmin()

    const event = await prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      include: {
        projects: {
          include: {
            category: { select: { name: true } },
            scores: {
              where: { status: "SUBMITTED" },
              select: {
                totalScore: true,
                partAScore: true,
                partBScore: true,
                partCScore: true,
              },
            },
          },
        },
      },
    }) as { name: string; projects: { title: string; schoolName: string; schoolLevel: string; category: { name: string }; scores: { totalScore: number; partAScore: number; partBScore: number; partCScore: number }[] }[] }

    const scoredProjects = event.projects
      .filter((p) => p.scores.length > 0)
      .map((p) => {
        const count = p.scores.length
        const avg = (field: "totalScore" | "partAScore" | "partBScore" | "partCScore") =>
          p.scores.reduce((sum: number, s) => sum + s[field], 0) / count
        return {
          title: p.title,
          schoolName: p.schoolName,
          schoolLevel: p.schoolLevel,
          category: p.category.name,
          avgTotal: avg("totalScore"),
          avgPartA: avg("partAScore"),
          avgPartB: avg("partBScore"),
          avgPartC: avg("partCScore"),
          judgeCount: count,
          maxScore: p.schoolLevel === "JSS" ? 65 : 80,
        }
      })
      .sort((a, b) => b.avgTotal - a.avgTotal)

    const top3 = scoredProjects.slice(0, 3)
    const categories = [...new Set(scoredProjects.map((p) => p.category))]

    const categoryBreakdown = categories.map((cat) => {
      const catProjects = scoredProjects.filter((p) => p.category === cat)
      const topProject = catProjects[0]
      return `- ${cat}: ${catProjects.length} projects. Top: "${topProject?.title}" from ${topProject?.schoolName} (${topProject?.avgTotal.toFixed(1)} pts)`
    }).join("\n")

    const topPerformers = top3.map((p, i) =>
      `${i + 1}. "${p.title}" from ${p.schoolName} — ${p.avgTotal.toFixed(1)}/${p.maxScore} (${p.category}, ${p.schoolLevel})`
    ).join("\n")

    const { text } = await generateText({
      model: SMART_MODEL,
      prompt: `Write a professional narrative report for a science fair event. Cover: event summary, category highlights, top performers, and overall observations.

Event: ${event.name}
Total Projects: ${event.projects.length}
Scored Projects: ${scoredProjects.length}

Category Breakdown:
${categoryBreakdown}

Top 3 Overall:
${topPerformers}

Write 4-6 paragraphs. Tone: formal but warm, suitable for sharing with schools and stakeholders. Mention specific projects and schools by name. Include observations about scoring patterns across categories.`,
    })

    await prisma.event.update({
      where: { id: eventId },
      data: { aiReport: text },
    })

    return { success: true as const, data: text }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to generate report",
    }
  }
}
