import "dotenv/config"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DIRECT_URL ?? process.env.DATABASE_URL!)

async function main() {
    console.log("═══════════════════════════════════════════════")
    console.log("  Criteria Database Fix")
    console.log("═══════════════════════════════════════════════\n")

    // 1. Delete 3 junk categories + their criteria
    const junkCatIds = [
        "47183fae-d23d-4aba-9145-1c67c188a511",
        "5205f932-f309-4afc-b91c-b2d36d8b2a78",
        "7db2d4b3-eac9-4b31-af6c-08c76e381da7",
    ]
    for (const id of junkCatIds) {
        const cr = (await sql`DELETE FROM "Criterion" WHERE "categoryId" = ${id}`) as unknown as { count: number }
        const ca = (await sql`DELETE FROM "Category" WHERE "id" = ${id}`) as unknown as { count: number }
        console.log(`  ✓ Deleted junk category ${id} (${cr.count ?? 0} criteria, ${ca.count ?? 0} category)`)
    }

    // 2. Delete broken JSS category + criteria
    const brkId = "cmms78cpg0001u1mqun1zsjim"
    const cr2 = (await sql`DELETE FROM "Criterion" WHERE "categoryId" = ${brkId}`) as unknown as { count: number }
    const ca2 = (await sql`DELETE FROM "Category" WHERE "id" = ${brkId}`) as unknown as { count: number }
    console.log(`  ✓ Deleted broken JSS category ${brkId} (${cr2.count ?? 0} criteria, ${ca2.count ?? 0} category)`)

    // 3. Delete junk criterion from Senior category
    const seniorCatId = "cmms9x1f7001ju1mqiezhrp5x"
    const junk = (await sql`DELETE FROM "Criterion" WHERE "id" = 'cmmtliuzd0017jvjmgtloh1m0' OR ("categoryId" = ${seniorCatId} AND (LOWER("name") = 'ytryt' OR LOWER("description") = 'yyug'))`) as unknown as { count: number }
    console.log(`  ✓ Deleted ${junk.count ?? 0} junk criterion(s) from Senior category`)

    // 4. Verify good categories
    console.log("\n── Verification ──")
    const senior = await sql`SELECT COUNT(*) as count FROM "Criterion" WHERE "categoryId" = ${seniorCatId}`
    const jssCatId = "cmmtknlla0000jvjmjdjc4n2u"
    const jss = await sql`SELECT COUNT(*) as count FROM "Criterion" WHERE "categoryId" = ${jssCatId}`
    console.log(`  Senior (cmms9x1f7..): ${senior[0].count} criteria`)
    console.log(`  JSS    (cmmtknlla..): ${jss[0].count} criteria`)

    // List all remaining categories
    const cats = await sql`
    SELECT c.id, c.name, c."schoolLevel", COUNT(cr.id) as criteria_count 
    FROM "Category" c 
    LEFT JOIN "Criterion" cr ON cr."categoryId" = c.id 
    GROUP BY c.id 
    ORDER BY c.name
  `
    console.log("\n── All remaining categories ──")
    for (const cat of cats) {
        console.log(`  • ${cat.name} (${cat.schoolLevel}) — ${cat.criteria_count} criteria [${cat.id}]`)
    }
}

main().catch((e) => {
    console.error("❌ Failed:", e)
    process.exit(1)
})
