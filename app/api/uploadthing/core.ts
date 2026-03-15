import { createUploadthing, type FileRouter } from "uploadthing/next"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const f = createUploadthing()

export const ourFileRouter = {
  projectFiles: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    image: { maxFileSize: "8MB", maxFileCount: 10 },
  })
    .input(z.object({ projectId: z.string() }))
    .middleware(async ({ input }) => {
      return { projectId: input.projectId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[uploadthing] onUploadComplete fired:", {
        projectId: metadata.projectId,
        fileName: file.name,
        fileKey: file.key,
      })

      // Production backup — on Vercel, UploadThing can reach the callback.
      // On localhost this never fires, so files are saved client-side instead.
      try {
        const existing = await prisma.projectFile.findFirst({
          where: { key: file.key },
        })
        if (!existing) {
          await prisma.projectFile.create({
            data: {
              name: file.name,
              url: file.ufsUrl ?? file.url,
              key: file.key,
              size: file.size,
              type: file.type ?? "application/octet-stream",
              projectId: metadata.projectId,
            },
          })
          console.log("[uploadthing] ProjectFile saved (callback):", file.key)
        } else {
          console.log("[uploadthing] ProjectFile already exists (saved client-side):", file.key)
        }
      } catch (error) {
        console.error("[uploadthing] Failed to save ProjectFile:", error)
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
