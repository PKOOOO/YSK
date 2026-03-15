import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) return null
  return prisma.user.findUnique({ where: { clerkId: userId } })
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized")
  return user
}

export async function requireJudge() {
  const user = await getCurrentUser()
  if (!user || user.role !== "JUDGE") throw new Error("Unauthorized")
  return user
}
