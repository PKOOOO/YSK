"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Gavel, Loader2 } from "lucide-react"
import { acceptInvite } from "@/app/actions/judges"
import { toast } from "sonner"

interface Props {
  token: string
  eventName: string
  eventId: string
  invitedEmail: string
}

export function InviteAcceptClient({ token, eventName, invitedEmail }: Props) {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()
  const [status, setStatus] = useState<"idle" | "accepting" | "done" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  // Auto-accept once user is signed in
  useEffect(() => {
    if (!isLoaded || !isSignedIn || status !== "idle") return
    setStatus("accepting")

    acceptInvite(token).then((res) => {
      if (res.success) {
        setStatus("done")
        toast.success("Invitation accepted! Redirecting to judge portal…")
        setTimeout(() => router.push("/judge"), 1500)
      } else {
        setStatus("error")
        setErrorMsg(res.error ?? "Something went wrong")
        toast.error(res.error)
      }
    })
  }, [isLoaded, isSignedIn, status, token, router])

  return (
    <div className="bg-white border border-black rounded-lg p-10 max-w-md w-full text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      {/* Icon */}
      <div className="size-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
        <Gavel className="size-8 text-white" />
      </div>

      <h1 className="text-2xl font-bold mb-2">Judge Invitation</h1>
      <p className="text-muted-foreground text-sm mb-6">
        You&apos;ve been invited to judge at
      </p>
      <p className="text-lg font-bold border border-black rounded-lg px-4 py-3 bg-[#F4F4F0] mb-6">
        {eventName}
      </p>
      <p className="text-xs text-muted-foreground mb-8">
        Invited to: <span className="font-medium">{invitedEmail}</span>
      </p>

      {/* States */}
      {!isLoaded && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      )}

      {isLoaded && !isSignedIn && (
        <div className="flex flex-col gap-3">
          <a
            href={`/sign-up?redirect_url=${encodeURIComponent(`/invite/${token}`)}`}
            className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold bg-black text-white border border-black rounded hover:bg-pink-400 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
          >
            Accept Invitation &amp; Create Account
          </a>
          <a
            href={`/sign-in?redirect_url=${encodeURIComponent(`/invite/${token}`)}`}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold border border-black rounded bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
          >
            Already have an account? Sign In
          </a>
        </div>
      )}

      {isLoaded && isSignedIn && status === "accepting" && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Accepting invitation…
        </div>
      )}

      {status === "done" && (
        <div className="flex items-center justify-center gap-2 text-sm text-green-700 font-medium">
          <Loader2 className="size-4 animate-spin" />
          Redirecting to judge portal…
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
          <a
            href="/sign-in"
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold bg-black text-white border border-black rounded hover:bg-pink-400 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
          >
            Sign In
          </a>
        </div>
      )}
    </div>
  )
}
