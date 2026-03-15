"use client"

import { PieChart, Pie, Cell } from "recharts"

interface Props {
  scored: number
  pending: number
}

export function ProgressChart({ scored, pending }: Props) {
  const total = scored + pending
  const pct = total > 0 ? Math.round((scored / total) * 100) : 0

  const chartData =
    total === 0
      ? [{ name: "No projects", value: 1, color: "#e5e7eb" }]
      : [
          ...(scored > 0 ? [{ name: "Scored", value: scored, color: "#000000" }] : []),
          ...(pending > 0 ? [{ name: "Pending", value: pending, color: "#e5e7eb" }] : []),
        ]

  return (
    <div className="bg-white rounded-md border flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-base font-medium">Scoring Progress</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {scored} of {total} projects scored
        </p>
      </div>

      <div className="p-6 flex flex-col items-center gap-6 flex-1">
        <div className="relative">
          <PieChart width={160} height={160}>
            <Pie
              data={chartData}
              cx={80}
              cy={80}
              innerRadius={52}
              outerRadius={72}
              dataKey="value"
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold">{pct}%</span>
            <span className="text-xs text-muted-foreground">scored</span>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-sm bg-black shrink-0" />
              <span className="text-sm font-medium">Scored</span>
            </div>
            <span className="text-sm font-bold">{scored}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-sm bg-gray-200 border shrink-0" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <span className="text-sm font-bold">{pending}</span>
          </div>
          {total > 0 && (
            <div className="mt-1 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-black rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
