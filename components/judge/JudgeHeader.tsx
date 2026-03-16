"use client"

import { UserButton } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function JudgeHeader() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    return (
        <header
            className={cn(
                "fixed top-0 inset-x-0 z-50 h-14 flex items-center px-4 md:px-8 transition-all duration-300",
                scrolled
                    ? "bg-white/70 backdrop-blur-md border-b border-black/10 shadow-sm"
                    : "bg-transparent"
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-2">
                <div className="size-7 rounded bg-black flex items-center justify-center">
                    <span className="text-white text-xs font-bold">YSK</span>
                </div>
                <span className="font-bold text-sm tracking-tight">Judge Portal</span>
            </div>

            {/* Right — UserButton */}
            <div className="ml-auto">
                <UserButton />
            </div>
        </header>
    )
}
