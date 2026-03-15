import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { Webhook } from "svix"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  const body = await req.text()
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id!,
      "svix-timestamp": svix_timestamp!,
      "svix-signature": svix_signature!,
    }) as WebhookEvent
  } catch {
    return new Response("Invalid webhook", { status: 400 })
  }

  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name, public_metadata } = evt.data

    const name = `${first_name ?? ""} ${last_name ?? ""}`.trim() || "Unknown"
    const email = email_addresses[0]?.email_address

    try {
      await prisma.user.upsert({
        where: { clerkId: id },
        update: { email, name },
        create: {
          clerkId: id,
          email,
          name,
          role: (public_metadata?.role as "ADMIN" | "JUDGE") ?? "JUDGE",
        },
      })
    } catch (error) {
      console.error("[webhook] prisma.user.upsert FAILED:", error)
      return new Response("Database error", { status: 500 })
    }
  }

  return new Response("OK", { status: 200 })
}
