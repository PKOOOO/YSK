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
      await prisma.projectFile.create({
        data: {
          name: file.name,
          url: file.ufsUrl,
          key: file.key,
          size: file.size,
          type: file.type,
          projectId: metadata.projectId,
        },
      })
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
