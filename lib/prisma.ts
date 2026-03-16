import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function makePrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Check your .env file.")
  }
  const adapter = new PrismaNeon({ connectionString })
  return new PrismaClient({ adapter })
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = makePrismaClient()
}

export const prisma = globalForPrisma.prisma
