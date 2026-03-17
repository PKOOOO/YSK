"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

export function CopyLinkButton({ url }: { url: string }) {
    const [copied, setCopied] = useState(false)

    function handleCopy() {
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex items-center gap-2 bg-white border border-black rounded-md px-3 py-2">
            <span className="text-xs font-mono text-muted-foreground truncate max-w-[260px] sm:max-w-[400px]">
                {url}
            </span>
            <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs font-bold border border-black rounded px-2.5 py-1 bg-white hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all flex-shrink-0"
            >
                {copied ? (
                    <>
                        <Check className="size-3 text-green-600" />
                        Copied
                    </>
                ) : (
                    <>
                        <Copy className="size-3" />
                        Copy
                    </>
                )}
            </button>
        </div>
    )
}
