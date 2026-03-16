import { JudgeHeader } from "@/components/judge/JudgeHeader"

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#F4F4F0]">
            <JudgeHeader />
            <div className="pt-14">{children}</div>
        </div>
    )
}
