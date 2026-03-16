import Link from "next/link"
import { WifiOff } from "lucide-react"

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center px-4">
            <div className="border border-black border-dashed flex flex-col items-center justify-center p-10 gap-y-4 bg-white w-full max-w-md rounded-lg text-center">
                <div className="size-16 rounded-full bg-pink-50 flex items-center justify-center">
                    <WifiOff className="size-8 text-pink-400" />
                </div>
                <div>
                    <h1 className="text-xl font-medium">You&apos;re Offline</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        Please check your internet connection to continue judging.
                    </p>
                </div>
                <Link
                    href="/"
                    className="px-4 py-2.5 bg-black text-white text-sm font-medium rounded-md border border-black hover:bg-pink-400 hover:text-primary hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[4px] hover:-translate-y-[4px] transition-all"
                >
                    Try Again
                </Link>
            </div>
        </div>
    )
}
