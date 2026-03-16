"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { SchoolLevel } from "@prisma/client"

const CreateProjectSchema = z.object({
  title: z.string().min(1, "Project title is required").max(100),
  abstract: z.string().max(1000).optional(),
  schoolName: z.string().min(1, "School name is required"),
  teacherName: z.string().min(1, "Teacher name is required"),
  teacherEmail: z.string().email("Invalid email address"),
  categoryId: z.string().min(1, "Category is required"),
  eventId: z.string().min(1),
  schoolLevel: z.nativeEnum(SchoolLevel),
})

export async function createProject(input: unknown) {
  try {
    const data = CreateProjectSchema.parse(input)
    const project = await prisma.project.create({ data })

    // Auto-generate projectCode: first 3 letters of category name + sequential number
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
    const prefix = (category?.name ?? "GEN").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "GEN"
    const count = await prisma.project.count({ where: { categoryId: data.categoryId } })
    const code = `${prefix}-${String(count).padStart(3, "0")}`
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { projectCode: code },
    })

    return { success: true as const, data: updated }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to submit project",
    }
  }
}

export async function approveProject(id: string) {
  try {
    const admin = await requireAdmin()
    const project = await prisma.project.update({ where: { id }, data: { approved: true } })
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "PROJECT_APPROVED",
        entityId: id,
        entityType: "Project",
        meta: { projectTitle: project.title },
      },
    })
    revalidatePath("/dashboard")
    return { success: true as const, data: project }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to approve project",
    }
  }
}

export async function rejectProject(id: string) {
  try {
    const admin = await requireAdmin()
    const project = await prisma.project.findUnique({ where: { id } })
    await prisma.project.delete({ where: { id } })
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "PROJECT_REJECTED",
        entityId: id,
        entityType: "Project",
        meta: { projectTitle: project?.title ?? "Unknown" },
      },
    })
    revalidatePath("/dashboard")
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to reject project",
    }
  }
}

export async function reassignCategory(id: string, categoryId: string) {
  try {
    await requireAdmin()
    const project = await prisma.project.update({ where: { id }, data: { categoryId } })
    revalidatePath("/dashboard")
    return { success: true as const, data: project }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to reassign category",
    }
  }
}

export async function getProjectsByEvent(eventId: string) {
  await requireAdmin()
  return prisma.project.findMany({
    where: { eventId },
    include: {
      category: true,
      files: true,
      _count: { select: { assignments: true, scores: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      category: { include: { criteria: true } },
      files: true,
      event: true,
      scores: {
        include: {
          items: { include: { criterion: true } },
          judge: true,
        },
      },
    },
  })
}

const SaveFilesSchema = z.object({
  projectId: z.string().min(1),
  files: z.array(
    z.object({
      name: z.string(),
      url: z.string().url(),
      key: z.string(),
      size: z.number(),
      type: z.string(),
    })
  ),
})

export async function saveProjectFiles(input: unknown) {
  try {
    const { projectId, files } = SaveFilesSchema.parse(input)

    if (files.length === 0) return { success: true as const, count: 0 }

    const result = await prisma.projectFile.createMany({
      data: files.map((f) => ({
        name: f.name,
        url: f.url,
        key: f.key,
        size: f.size,
        type: f.type,
        projectId,
      })),
      skipDuplicates: true,
    })

    console.log(`[saveProjectFiles] Saved ${result.count} files for project ${projectId}`)
    return { success: true as const, count: result.count }
  } catch (error) {
    console.error("[saveProjectFiles] Failed:", error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to save files",
    }
  }
}

export async function deleteProject(id: string) {
  try {
    await requireAdmin()

    const files = await prisma.projectFile.findMany({
      where: { projectId: id },
      select: { key: true },
    })

    if (files.length > 0) {
      const { UTApi } = await import("uploadthing/server")
      const utapi = new UTApi()
      await utapi.deleteFiles(files.map((f) => f.key))
    }

    await prisma.project.delete({ where: { id } })
    revalidatePath("/dashboard")
    return { success: true as const }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete project",
    }
  }
}
