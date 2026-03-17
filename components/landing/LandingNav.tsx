"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"

interface LandingNavProps {
    role?: "ADMIN" | "JUDGE" | null
}

export function LandingNav({ role }: LandingNavProps) {
    const [mobileOpen, setMobileOpen] = useState(false)

    const dashboardLink =
        role === "ADMIN"
            ? { href: "/dashboard", label: "Dashboard" }
            : role === "JUDGE"
                ? { href: "/judge", label: "My Projects" }
                : null

    const isSignedIn = !!role

    const RightLinks = () => (
        <>
            {dashboardLink ? (
                <Link
                    href={dashboardLink.href}
                    className="px-5 py-2.5 text-sm font-medium hover:bg-[#F4F4F0] transition-colors"
                    onClick={() => setMobileOpen(false)}
                >
                    {dashboardLink.label}
                </Link>
            ) : (
                <Link
                    href="/submit"
                    className="px-5 py-2.5 text-sm font-medium hover:bg-[#F4F4F0] transition-colors"
                    onClick={() => setMobileOpen(false)}
                >
                    Submit Project
                </Link>
            )}
            <Link
                href={isSignedIn ? "/sign-out" : "/sign-in"}
                className="px-6 py-2.5 text-sm font-semibold bg-black text-white hover:bg-pink-400 hover:text-black transition-colors"
                onClick={() => setMobileOpen(false)}
            >
                {isSignedIn ? "Sign Out" : "Sign In"}
            </Link>
        </>
    )

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-black/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                {/* Left — Logo */}
                <Link href="/" className="flex items-center gap-3 shrink-0">
                    <Image
                        src="/ysk.png"
                        alt="YSK"
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-auto"
                    />
                    <span className="font-semibold text-sm hidden sm:block">Young Scientists Kenya</span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center divide-x divide-black/10 border border-black/10 rounded-md overflow-hidden">
                    <RightLinks />
                </nav>

                {/* Mobile hamburger */}
                <button
                    className="md:hidden p-2 rounded border border-black/10 hover:bg-[#F4F4F0] transition-colors"
                    onClick={() => setMobileOpen((v) => !v)}
                    aria-label="Toggle menu"
                >
                    {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden bg-white border-t border-black/10">
                    <div className="flex flex-col divide-y divide-black/10">
                        <RightLinks />
                    </div>
                </div>
            )}
        </header>
    )
}
