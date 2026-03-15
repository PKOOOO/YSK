"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { EventType, JudgingMode } from "@prisma/client"

const CreateEventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(100),
  type: z.nativeEnum(EventType),
  judgingMode: z.nativeEnum(JudgingMode),
})

const UpdateEventSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  resultsPublic: z.boolean().optional(),
})

export async function createEvent(input: unknown) {
  try {
    await requireAdmin()
    const data = CreateEventSchema.parse(input)
    const event = await prisma.event.create({ data })
    revalidatePath("/events")
    return { success: true as const, data: event }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create event",
    }
  }
}

export async function updateEvent(id: string, input: unknown) {
  try {
    await requireAdmin()
    const data = UpdateEventSchema.parse(input)
    const event = await prisma.event.update({ where: { id }, data })
    revalidatePath("/events")
    return { success: true as const, data: event }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update event",
    }
  }
}

export async function deleteEvent(id: string) {
  try {
    await requireAdmin()
    await prisma.event.delete({ where: { id } })
    revalidatePath("/events")
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete event",
    }
  }
}

export async function cloneEvent(id: string) {
  try {
    await requireAdmin()
    const source = await prisma.event.findUniqueOrThrow({
      where: { id },
      include: { categories: { include: { criteria: true } } },
    })
    const clone = await prisma.event.create({
      data: {
        name: `${source.name} (Copy)`,
        type: source.type,
        judgingMode: source.judgingMode,
        categories: {
          create: source.categories.map((cat) => ({
            name: cat.name,
            color: cat.color,
            criteria: {
              create: cat.criteria.map((c) => ({
                name: c.name,
                description: c.description,
                maxScore: c.maxScore,
                weight: c.weight,
                order: c.order,
              })),
            },
          })),
        },
      },
    })
    revalidatePath("/events")
    return { success: true as const, data: clone }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to clone event",
    }
  }
}

export async function getEvents() {
  await requireAdmin()
  return prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { projects: true } },
      projects: { select: { schoolLevel: true } },
    },
  })
}

export async function getEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      categories: { include: { criteria: true } },
      _count: { select: { projects: true } },
    },
  })
}

export async function setEventStatus(id: string, status: "DRAFT" | "ACTIVE" | "CLOSED" | "ARCHIVED") {
  try {
    await requireAdmin()
    const event = await prisma.event.update({ where: { id }, data: { status } })
    revalidatePath("/events")
    return { success: true as const, data: event }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update status",
    }
  }
}

export async function toggleResultsPublic(id: string, isPublic: boolean) {
  try {
    await requireAdmin()
    const event = await prisma.event.update({ where: { id }, data: { resultsPublic: isPublic } })
    revalidatePath("/events")
    return { success: true as const, data: event }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to toggle results",
    }
  }
}
