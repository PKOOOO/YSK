"use client"

import { useEffect, useRef, useState } from "react"
import { Lightbulb, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Suggestion {
  suggestedCategory: string
  confidence: "high" | "medium" | "low"
  reason: string
}

interface CategorySuggesterProps {
  title: string
  categories: { id: string; name: string }[]
  onSelect: (categoryId: string) => void
  className?: string
}

export function CategorySuggester({
  title,
  categories,
  onSelect,
  className,
}: CategorySuggesterProps) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastFetchRef = useRef("")

  useEffect(() => {
    if (!title.trim() || title.trim().length < 10) {
      setSuggestion(null)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      if (lastFetchRef.current === title) {
        return
      }

      lastFetchRef.current = title
      setLoading(true)
      setSuggestion(null)

      try {
        const res = await fetch("/api/ai/suggest-category", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            categories: categories.map((c) => c.name),
          }),
        })

        if (!res.ok) return

        const data = await res.json()
        setSuggestion(data)
      } catch {
        // fail silently
      } finally {
        setLoading(false)
      }
    }, 800)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [title, categories])

  function handleUseThis() {
    if (!suggestion) return
    const match = categories.find(
      (c) => c.name.toLowerCase() === suggestion.suggestedCategory.toLowerCase()
    )
    if (match) onSelect(match.id)
  }

  if (!loading && !suggestion) return null

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-md border bg-pink-50",
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 text-pink-500 animate-spin shrink-0 mt-0.5" />
          <p className="text-sm font-medium">Suggesting a category…</p>
        </>
      ) : suggestion ? (
        <>
          <Lightbulb className="size-4 text-pink-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium">💡 Suggested: {suggestion.suggestedCategory}</span>
              {" — "}
              <span className="text-muted-foreground">{suggestion.reason}</span>
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleUseThis}
            className="shrink-0 text-xs h-7"
          >
            Use this
          </Button>
        </>
      ) : null}
    </div>
  )
}
