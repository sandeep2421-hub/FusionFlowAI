"use client"

import { motion } from "framer-motion"

interface HourlyCongestion {
  hour: number
  predicted_vehicles: number
  level: "Low" | "Moderate" | "High" | "Critical"
  color: string
  intensity: number
  period: string
}

interface HeatmapGridProps {
  hourlyData: HourlyCongestion[]
}

export function HeatmapGrid({ hourlyData }: HeatmapGridProps) {
  const formatHour = (h: number) => {
    const period = h >= 12 ? "PM" : "AM"
    const displayHour = h % 12 === 0 ? 12 : h % 12
    return `${displayHour}:00 ${period}`
  }

  const getIntensityStyles = (level: string) => {
    switch (level) {
      case "Low":
        return {
          bg: "bg-emerald-500/10 hover:bg-emerald-500/20",
          border: "border-emerald-500/30 hover:border-emerald-500/60",
          text: "text-emerald-400",
          glow: "shadow-[0_0_10px_rgba(16,185,129,0.1)]",
        }
      case "Moderate":
        return {
          bg: "bg-yellow-500/10 hover:bg-yellow-500/20",
          border: "border-yellow-500/30 hover:border-yellow-500/60",
          text: "text-amber-400",
          glow: "shadow-[0_0_10px_rgba(245,158,11,0.1)]",
        }
      case "High":
        return {
          bg: "bg-orange-500/10 hover:bg-orange-500/20",
          border: "border-orange-500/30 hover:border-orange-500/60",
          text: "text-orange-400",
          glow: "shadow-[0_0_10px_rgba(249,115,22,0.1)]",
        }
      case "Critical":
        return {
          bg: "bg-rose-500/15 hover:bg-rose-500/25",
          border: "border-rose-500/30 hover:border-rose-500/60",
          text: "text-rose-400",
          glow: "shadow-[0_0_12px_rgba(244,63,94,0.15)]",
        }
      default:
        return {
          bg: "bg-muted/10",
          border: "border-border/30",
          text: "text-muted-foreground",
          glow: "",
        }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/20">
        <span className="font-semibold">LEGEND & CONGESTION LEVELS:</span>
        <div className="flex gap-4 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40" /> Low (&lt;15 veh)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-yellow-500/20 border border-yellow-500/40" /> Moderate (15-30 veh)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-orange-500/20 border border-orange-500/40" /> High (30-45 veh)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500/40 animate-pulse" /> Critical (45+ veh)</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {hourlyData.map((item, idx) => {
          const styles = getIntensityStyles(item.level)
          return (
            <motion.div
              key={item.hour}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: idx * 0.02 }}
              className={`p-3 rounded-lg border flex flex-col justify-between transition-all duration-200 cursor-pointer ${styles.bg} ${styles.border} ${styles.glow}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold tracking-wider opacity-80 uppercase">{item.period}</span>
                <span className="text-xs font-mono font-semibold">{formatHour(item.hour)}</span>
              </div>
              
              <div className="my-2">
                <span className="text-xl font-bold tracking-tight text-foreground select-all">
                  {item.predicted_vehicles.toFixed(1)}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">veh/h</span>
              </div>

              <div className="flex justify-between items-center text-[10px] font-medium pt-1 border-t border-white/5">
                <span className="text-muted-foreground/80">Status</span>
                <span className={`font-semibold ${styles.text}`}>{item.level}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
