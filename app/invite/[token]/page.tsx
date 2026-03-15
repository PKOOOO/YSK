import { prisma } from "@/lib/prisma"
import { InviteAcceptClient } from "@/components/invite/InviteAcceptClient"
import { XCircle } from "lucide-react"

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params

  const invite = await prisma.judgeInvite.findUnique({
    where: { token },
  })

  if (!invite) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center p-6">
        <div className="bg-white border border-black rounded-lg p-10 max-w-md w-full text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <XCircle className="size-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Invalid Invite Link</h1>
          <p className="text-sm text-muted-foreground">
            This invite link is invalid or does not exist. Please ask the organizer
            for a new invitation.
          </p>
        </div>
      </div>
    )
  }

  if (invite.used) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center p-6">
        <div className="bg-white border border-black rounded-lg p-10 max-w-md w-full text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <XCircle className="size-12 text-orange-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Invite Already Used</h1>
          <p className="text-sm text-muted-foreground">
            This invitation has already been accepted. If you have an account, please
            sign in to access the judging portal.
          </p>
          <a
            href="/sign-in"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-black text-white border border-black rounded hover:bg-pink-400 hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px] transition-all"
          >
            Sign In
          </a>
        </div>
      </div>
    )
  }

  if (invite.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center p-6">
        <div className="bg-white border border-black rounded-lg p-10 max-w-md w-full text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <XCircle className="size-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Invite Expired</h1>
          <p className="text-sm text-muted-foreground">
            This invitation expired on{" "}
            <strong>{invite.expiresAt.toLocaleDateString()}</strong>. Please ask
            the organizer to send a new invitation.
          </p>
        </div>
      </div>
    )
  }

  const event = await prisma.event.findUnique({
    where: { id: invite.eventId },
    select: { name: true, id: true },
  })

  return (
    <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center p-6">
      <InviteAcceptClient
        token={token}
        eventName={event?.name ?? "Science Fair"}
        eventId={invite.eventId}
        invitedEmail={invite.email}
      />
    </div>
  )
}
