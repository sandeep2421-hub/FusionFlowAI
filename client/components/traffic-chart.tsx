"use client"

import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface TrafficChartProps {
  historicalData: number
  fusedData: number
}

export function TrafficChart({ historicalData, fusedData }: TrafficChartProps) {
  const data = [
    { name: "historical", value: historicalData, fill: "hsl(var(--primary))" },
    { name: "fused", value: fusedData, fill: "hsl(var(--secondary))" },
  ]

  return (
    <ChartContainer
      config={{
        historical: {
          label: "Historical Prediction",
        },
        fused: {
          label: "Fused Prediction",
        },
      }}
      className="h-[200px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => (value === "historical" ? "Historical" : "Fused")}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} className="glow-primary" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
