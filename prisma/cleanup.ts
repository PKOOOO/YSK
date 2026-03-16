import "dotenv/config"
import { neon } from "@neondatabase/serverless"
import { UTApi } from "uploadthing/server"

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
if (!connectionString) {
    console.error("❌ DATABASE_URL (or DIRECT_URL) is not set in .env")
    process.exit(1)
}

const sql = neon(connectionString)
const utapi = new UTApi()

type Row = Record<string, unknown>

async function main() {
    console.log("═══════════════════════════════════════════════")
    console.log("  YSK Database Cleanup — Full Wipe")
    console.log("═══════════════════════════════════════════════")
    console.log("  Keeping: Events, Categories, Criteria, Admins")
    console.log("═══════════════════════════════════════════════\n")

    // 1. Delete ALL ScoreItems
    const si = await sql`DELETE FROM "ScoreItem"` as unknown as { count: number }
    const scoreItemsDeleted = si.count ?? 0
    console.log(`  ✓ ScoreItems deleted: ${scoreItemsDeleted}`)

    // 2. Delete ALL Scores
    const sc = await sql`DELETE FROM "Score"` as unknown as { count: number }
    const scoresDeleted = sc.count ?? 0
    console.log(`  ✓ Scores deleted: ${scoresDeleted}`)

    // 3. Delete ALL JudgeAssignments
    const ja = await sql`DELETE FROM "JudgeAssignment"` as unknown as { count: number }
    const assignmentsDeleted = ja.count ?? 0
    console.log(`  ✓ JudgeAssignments deleted: ${assignmentsDeleted}`)

    // 4. Fetch ProjectFile keys → delete from UploadThing → delete rows
    const files = (await sql`SELECT key FROM "ProjectFile" WHERE key IS NOT NULL AND key != ''`) as Row[]
    const fileKeys = files.map((f) => f.key as string).filter(Boolean)
    let utFilesDeleted = 0
    if (fileKeys.length > 0) {
        try {
            // UploadThing accepts batches of up to 100 keys
            for (let i = 0; i < fileKeys.length; i += 100) {
                const batch = fileKeys.slice(i, i + 100)
                await utapi.deleteFiles(batch)
                utFilesDeleted += batch.length
            }
            console.log(`  ✓ Files deleted from UploadThing: ${utFilesDeleted}`)
        } catch (err) {
            console.error(`  ✗ UploadThing delete failed:`, err)
        }
    } else {
        console.log(`  ✓ Files deleted from UploadThing: 0`)
    }
    const pf = await sql`DELETE FROM "ProjectFile"` as unknown as { count: number }
    const projectFilesDeleted = pf.count ?? 0
    console.log(`  ✓ ProjectFiles deleted: ${projectFilesDeleted}`)

    // 5. Delete ALL Projects
    const pr = await sql`DELETE FROM "Project"` as unknown as { count: number }
    const projectsDeleted = pr.count ?? 0
    console.log(`  ✓ Projects deleted: ${projectsDeleted}`)

    // 6. Delete ALL JudgeInvites
    const ji = await sql`DELETE FROM "JudgeInvite"` as unknown as { count: number }
    const invitesDeleted = ji.count ?? 0
    console.log(`  ✓ JudgeInvites deleted: ${invitesDeleted}`)

    // 7. Delete ALL AuditLog records (if table exists)
    let auditDeleted = 0
    try {
        const al = await sql`DELETE FROM "AuditLog"` as unknown as { count: number }
        auditDeleted = al.count ?? 0
    } catch {
        // Table may not exist
    }
    console.log(`  ✓ AuditLogs deleted: ${auditDeleted}`)

    // 8. Delete ALL Users where role = JUDGE (keep ADMINs)
    const us = await sql`DELETE FROM "User" WHERE "role" = 'JUDGE'` as unknown as { count: number }
    const usersDeleted = us.count ?? 0
    console.log(`  ✓ Users deleted (JUDGE only): ${usersDeleted}`)

    console.log("\n═══════════════════════════════════════════════")
    console.log("  Summary")
    console.log("═══════════════════════════════════════════════")
    console.log(`  ScoreItems deleted:          ${scoreItemsDeleted}`)
    console.log(`  Scores deleted:              ${scoresDeleted}`)
    console.log(`  JudgeAssignments deleted:    ${assignmentsDeleted}`)
    console.log(`  ProjectFiles deleted:        ${projectFilesDeleted}`)
    console.log(`  Files from UploadThing:      ${utFilesDeleted}`)
    console.log(`  Projects deleted:            ${projectsDeleted}`)
    console.log(`  JudgeInvites deleted:        ${invitesDeleted}`)
    console.log(`  AuditLogs deleted:           ${auditDeleted}`)
    console.log(`  Users deleted (judges):      ${usersDeleted}`)
    console.log("═══════════════════════════════════════════════\n")
}

main().catch((e) => {
    console.error("❌ Cleanup failed:", e)
    process.exit(1)
})
