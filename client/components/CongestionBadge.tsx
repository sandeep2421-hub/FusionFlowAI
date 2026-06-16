"use client"

interface CongestionBadgeProps {
  level: "Low" | "Moderate" | "High" | "Critical"
}

export function CongestionBadge({ level }: CongestionBadgeProps) {
  let badgeClass = "congestion-low"
  let dotColor = "bg-emerald-400 text-emerald-400"

  switch (level) {
    case "Moderate":
      badgeClass = "congestion-moderate"
      dotColor = "bg-amber-400 text-amber-400"
      break
    case "High":
      badgeClass = "congestion-high"
      dotColor = "bg-orange-400 text-orange-400"
      break
    case "Critical":
      badgeClass = "congestion-critical"
      dotColor = "bg-rose-500 text-rose-500"
      break
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${badgeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotColor}`} style={{ boxShadow: "0 0 8px currentColor" }} />
      {level}
    </span>
  )
}
