import { extractText } from "unpdf"

const MAX_TEXT_LENGTH = 8000

/**
 * Fetches a PDF from a URL and extracts its text content.
 * Returns the extracted text, truncated to 8000 chars max.
 */
export async function extractPdfText(url: string): Promise<string> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { text } = await extractText(buffer, { mergePages: true })

  const trimmed = (text ?? "").trim()

  if (trimmed.length === 0) {
    throw new Error("PDF contained no extractable text")
  }

  return trimmed.length > MAX_TEXT_LENGTH ? trimmed.slice(0, MAX_TEXT_LENGTH) : trimmed
}
