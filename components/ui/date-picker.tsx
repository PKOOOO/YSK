"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  clearable?: boolean
}

function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left font-medium md:text-base transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-[2px] hover:-translate-y-[2px]",
          !value && "text-muted-foreground",
          className
        )}
      >
        <span className="flex items-center gap-2">
          <CalendarIcon className="size-4 shrink-0" />
          {value ? format(value, "PPP") : placeholder}
        </span>
        {clearable && value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(undefined)
            }}
            className="p-0.5 rounded hover:bg-gray-100 transition-colors"
          >
            <X className="size-3.5 text-muted-foreground" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
