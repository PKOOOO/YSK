"use server"

import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateText, FAST_MODEL, SMART_MODEL } from "@/lib/ai"
import { extractPdfText } from "@/lib/pdf"

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
    })

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
        // Fall through to title-only fallback
      }
    } else {
      console.log("[AI] No PDF file found in project files")
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
    })

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
    return { success: true as const, data: "" }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to generate report",
    }
  }
}
