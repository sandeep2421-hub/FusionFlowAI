"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface WeeklyChartProps {
  data: Array<{
    date: string
    day: string
    avg_traffic: number
    peak_traffic: number
    peak_hour: number
  }>
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <div className="w-full h-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
          <XAxis 
            dataKey="day" 
            stroke="var(--muted-foreground)" 
            fontSize={11}
            tickLine={false}
          />
          <YAxis 
            stroke="var(--muted-foreground)" 
            fontSize={11}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload
                return (
                  <div className="glass p-3 rounded-lg border border-border/80 text-xs space-y-1">
                    <p className="font-bold text-foreground">{item.date} ({item.day})</p>
                    <p className="text-primary">Average Traffic: <span className="font-semibold">{item.avg_traffic} veh/h</span></p>
                    <p className="text-accent">Peak Traffic: <span className="font-semibold">{item.peak_traffic} veh/h</span></p>
                    <p className="text-muted-foreground text-[10px]">Peak Congestion Hour: {item.peak_hour}:00</p>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
          />
          <Area
            type="monotone"
            dataKey="avg_traffic"
            name="Avg Volume"
            stroke="var(--primary)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAvg)"
          />
          <Area
            type="monotone"
            dataKey="peak_traffic"
            name="Peak Volume"
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#colorPeak)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
