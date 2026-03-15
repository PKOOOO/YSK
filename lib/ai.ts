export { generateText, generateObject, streamText } from "ai"

// Vercel AI Gateway model identifiers
// Requires AI_GATEWAY_API_KEY in .env (your vck_... key)
export const FAST_MODEL = "anthropic/claude-sonnet-4-5"
export const SMART_MODEL = "anthropic/claude-opus-4-5"
