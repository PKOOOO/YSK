import "dotenv/config"
import { neon } from "@neondatabase/serverless"
import { randomUUID } from "crypto"

const CATEGORIES = [
  { name: "Biology", color: "#10b981" },
  { name: "Engineering", color: "#3b82f6" },
  { name: "Chemistry", color: "#f59e0b" },
  { name: "Physics", color: "#8b5cf6" },
  { name: "Computer Science", color: "#ef4444" },
]

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL

  if (!connectionString) {
    console.error("❌ DATABASE_URL (or DIRECT_URL) is not set in .env")
    process.exit(1)
  }

  const sql = neon(connectionString)

  // Find the first event
  const events = await sql`SELECT id, name FROM "Event" LIMIT 1`

  if (events.length === 0) {
    console.error('❌ No events found. Create an event first at /events')
    process.exit(1)
  }

  const event = events[0] as { id: string; name: string }
  console.log(`✅ Found event: "${event.name}" (${event.id})`)

  // Remove existing categories for this event (idempotent re-runs)
  const deleted = await sql`DELETE FROM "Category" WHERE "eventId" = ${event.id}`
  const count = (deleted as unknown as { count?: number }).count ?? 0
  if (count > 0) console.log(`🗑  Removed ${count} existing categories`)

  // Insert new categories
  for (const cat of CATEGORIES) {
    await sql`
      INSERT INTO "Category" (id, name, color, "eventId")
      VALUES (${randomUUID()}, ${cat.name}, ${cat.color}, ${event.id})
    `
  }

  console.log(`\n🌱 Seeded ${CATEGORIES.length} categories into "${event.name}":`)
  CATEGORIES.forEach((cat) => console.log(`   • ${cat.name}  ${cat.color}`))
}

main().catch((e) => {
  console.error("❌ Seed failed:", e.message ?? e)
  process.exit(1)
})
