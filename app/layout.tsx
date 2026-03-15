import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "YSK — Science Fair Judging",
  description: "Science fair congress judging system",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body
          className={`${dmSans.className} antialiased bg-[#F4F4F0]`}
      >
        {children}
          <Toaster richColors position="top-right" />
      </body>
    </html>
    </ClerkProvider>
  )
}
