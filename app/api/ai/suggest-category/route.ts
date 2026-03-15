import { z } from "zod"
import { generateObject, FAST_MODEL } from "@/lib/ai"

const RequestSchema = z.object({
  title: z.string().min(1),
  categories: z.array(z.string()).min(1),
})

const ResponseSchema = z.object({
  suggestedCategory: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  reason: z.string(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, categories } = RequestSchema.parse(body)

    const { object } = await generateObject({
      model: FAST_MODEL,
      schema: ResponseSchema,
      prompt: `Given this science fair project title, suggest the most appropriate category from the list provided.

Project Title: ${title}

Available categories: ${categories.join(", ")}

Return the best matching category name exactly as listed. Provide a brief reason for the suggestion.`,
    })

    return Response.json(object)
  } catch {
    return Response.json({ error: "Failed to suggest category" }, { status: 500 })
  }
}
