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
    await prisma.user.create({
      data: {
        clerkId: id,
        email: email_addresses[0].email_address,
        name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
        role: (public_metadata?.role as "ADMIN" | "JUDGE") ?? "JUDGE",
      },
    })
  }

  return new Response("OK", { status: 200 })
}
