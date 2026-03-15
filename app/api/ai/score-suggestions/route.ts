import { NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { FAST_MODEL } from "@/lib/ai"
import { z } from "zod"

const RequestSchema = z.object({
  title: z.string(),
  abstract: z.string().optional(),
  aiSummary: z.string().optional(),
  criteria: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      maxScore: z.number(),
    })
  ),
})

const SuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      criterionId: z.string(),
      suggestedScore: z.number(),
      justification: z.string(),
    })
  ),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = RequestSchema.parse(body)

    const criteriaList = data.criteria
      .map((c) => `- "${c.name}" (max ${c.maxScore}, id: ${c.id})`)
      .join("\n")

    const { object } = await generateObject({
      model: FAST_MODEL,
      schema: SuggestionSchema,
      prompt: `You are a science fair judge assistant. Based on the project information below, suggest scores for each criterion. Be conservative — when unsure, suggest a middle score. Provide a brief justification for each suggestion.

PROJECT TITLE: ${data.title}

ABSTRACT: ${data.abstract ?? "Not provided"}

AI SUMMARY: ${data.aiSummary ?? "Not available"}

CRITERIA TO SCORE:
${criteriaList}

For each criterion, return:
- criterionId (must match the id provided)
- suggestedScore (number from 0 to the max for that criterion, in increments of 0.5)
- justification (1-2 sentences explaining why)

Important: These are just suggestions to help the judge. The judge makes the final decision. Only score based on what is evident from the abstract. If there is insufficient information, suggest a lower score.`,
    })

    return NextResponse.json(object)
  } catch {
    return NextResponse.json(
      { error: "Failed to generate score suggestions" },
      { status: 500 }
    )
  }
}
