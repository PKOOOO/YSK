import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F4F0]">
      <SignUp />
    </div>
  )
}
