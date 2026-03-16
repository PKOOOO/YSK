"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin, requireJudge } from "@/lib/auth"
import { auth } from "@clerk/nextjs/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Invite Judge ──────────────────────────────────────────────────────────────

const InviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  eventId: z.string().min(1),
})

export async function inviteJudge(input: unknown) {
  try {
    await requireAdmin()
    const { email, eventId } = InviteSchema.parse(input)

    const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invite = await prisma.judgeInvite.create({
      data: { email, eventId, expiresAt },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const inviteUrl = `${appUrl}/invite/${invite.token}`

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "noreply@resend.dev",
        to: email,
        subject: `You've been invited to judge at ${event.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
            <h2 style="margin-bottom: 8px;">Judge Invitation</h2>
            <p>You've been invited to serve as a judge for <strong>${event.name}</strong>.</p>
            <p>Click the link below to accept your invitation and create your account:</p>
            <a href="${inviteUrl}" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
              Accept Invitation
            </a>
            <p style="color: #666; font-size: 14px;">Or copy this link: ${inviteUrl}</p>
            <p style="color: #999; font-size: 12px;">This invitation expires in 7 days.</p>
          </div>
        `,
      })
    } catch {
      // Email failed, but invite is created — admin can share link manually
    }

    revalidatePath("/dashboard/management")
    return { success: true as const, data: { invite, inviteUrl } }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to invite judge",
    }
  }
}

// ─── Accept Invite ─────────────────────────────────────────────────────────────

export async function acceptInvite(token: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error("Not authenticated")

    const invite = await prisma.judgeInvite.findUnique({ where: { token } })
    if (!invite) throw new Error("Invalid invite link")
    if (invite.used) throw new Error("This invite has already been used")
    if (invite.expiresAt < new Date()) throw new Error("This invite has expired")

    await prisma.judgeInvite.update({ where: { token }, data: { used: true } })

    // Ensure the user record has JUDGE role (may have been created by webhook already)
    try {
      await prisma.user.update({
        where: { clerkId: userId },
        data: { role: "JUDGE" },
      })
    } catch {
      // User might not be in DB yet if webhook hasn't fired — that's OK
    }

    revalidatePath("/dashboard/management")
    return { success: true as const, eventId: invite.eventId }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to accept invite",
    }
  }
}

// ─── Assign Judge To Project ───────────────────────────────────────────────────

const AssignSchema = z.object({
  judgeId: z.string().min(1),
  projectId: z.string().min(1),
})

export async function assignJudgeToProject(input: unknown) {
  try {
    await requireAdmin()
    const { judgeId, projectId } = AssignSchema.parse(input)

    const assignment = await prisma.judgeAssignment.create({
      data: { judgeId, projectId },
    })

    revalidatePath("/dashboard/management")
    return { success: true as const, data: assignment }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to assign judge",
    }
  }
}

// ─── Remove Assignment ─────────────────────────────────────────────────────────

export async function removeAssignment(assignmentId: string) {
  try {
    await requireAdmin()
    await prisma.judgeAssignment.delete({ where: { id: assignmentId } })
    revalidatePath("/dashboard/management")
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to remove assignment",
    }
  }
}

// ─── Remove Judge From Event ───────────────────────────────────────────────────

const RemoveJudgeSchema = z.object({
  judgeId: z.string().min(1),
  eventId: z.string().min(1),
})

export async function removeJudgeFromEvent(input: unknown) {
  try {
    await requireAdmin()
    const { judgeId, eventId } = RemoveJudgeSchema.parse(input)

    await prisma.judgeAssignment.deleteMany({
      where: { judgeId, project: { eventId } },
    })

    revalidatePath("/dashboard/management")
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to remove judge",
    }
  }
}

// ─── Flag Conflict of Interest ─────────────────────────────────────────────────

export async function flagConflict(assignmentId: string) {
  try {
    const judge = await requireJudge()

    const assignment = await prisma.judgeAssignment.findUnique({
      where: { id: assignmentId },
    })

    if (!assignment || assignment.judgeId !== judge.id) {
      return { success: false as const, error: "Assignment not found or unauthorized" }
    }

    await prisma.judgeAssignment.update({
      where: { id: assignmentId },
      data: { conflicted: true },
    })

    await prisma.judgeAssignment.delete({
      where: { id: assignmentId },
    })

    revalidatePath("/judge")
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to flag conflict",
    }
  }
}
