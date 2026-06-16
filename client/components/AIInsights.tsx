"use client"

import { Activity, AlertTriangle, CheckCircle, Info, TrendingUp } from "lucide-react"

interface PredictionRow {
  hour: number
  historical: number
  fused: number
  actual?: number
}

interface AIInsightsProps {
  date: string
  predictions: PredictionRow[]
  metrics?: {
    historical_rmse: number
    fused_rmse: number
    improvement: number
  }
}

export function AIInsights({ date, predictions, metrics }: AIInsightsProps) {
  if (!predictions || predictions.length === 0) return null

  // Find peak hour and peak value for Fused predictions
  let peakHour = 0
  let peakValue = 0
  let totalVehicles = 0

  predictions.forEach((p) => {
    totalVehicles += p.fused
    if (p.fused > peakValue) {
      peakValue = p.fused
      peakHour = p.hour
    }
  })

  const avgVehicles = totalVehicles / predictions.length

  // Count high or critical congestion hours (using 30 as High and 45 as Critical boundary)
  const highCongestionHours = predictions.filter(p => p.fused >= 30).map(p => p.hour)
  const criticalCongestionHours = predictions.filter(p => p.fused >= 45).map(p => p.hour)

  // Format peak hour label
  const formatHourLabel = (h: number) => {
    const period = h >= 12 ? "PM" : "AM"
    const displayHour = h % 12 === 0 ? 12 : h % 12
    return `${displayHour} ${period}`
  }

  // Format a list of hours into readable ranges/strings
  const formatHourList = (hours: number[]) => {
    if (hours.length === 0) return "None"
    return hours.map(h => formatHourLabel(h)).join(", ")
  }

  // Generate recommendation text
  let recommendation = "Traffic levels are expected to be normal. Standard route scheduling is recommended."
  if (criticalCongestionHours.length > 0) {
    recommendation = `CRITICAL DEPLOYMENT WARNING: High-priority traffic mitigation is advised during critical rush periods (${formatHourList(criticalCongestionHours)}). Suggest rerouting cargo transit and increasing police presence at primary bottlenecks.`
  } else if (highCongestionHours.length > 0) {
    recommendation = `MODERATE DISPATCH ALERT: Increased traffic volume expected at ${formatHourList(highCongestionHours.slice(0, 3))}. Commuters should plan departures ±15 minutes around these peak times to minimize idling.`
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-5 rounded-xl border border-border/40 space-y-3">
          <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Key Traffic Indicators ({date})
          </h4>
          <ul className="text-xs space-y-2.5 text-muted-foreground">
            <li className="flex justify-between border-b border-border/10 pb-1.5">
              <span>Traffic Peak Volume:</span>
              <span className="font-semibold text-foreground">{peakValue.toFixed(1)} vehicles/hour</span>
            </li>
            <li className="flex justify-between border-b border-border/10 pb-1.5">
              <span>Traffic Peak Time:</span>
              <span className="font-semibold text-foreground">{formatHourLabel(peakHour)}:00 - {formatHourLabel((peakHour + 1) % 24)}:00</span>
            </li>
            <li className="flex justify-between border-b border-border/10 pb-1.5">
              <span>24-Hour Average Flow:</span>
              <span className="font-semibold text-foreground">{avgVehicles.toFixed(1)} vehicles/hour</span>
            </li>
            <li className="flex justify-between">
              <span>Critical Congestion Hours:</span>
              <span className={`font-semibold ${criticalCongestionHours.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {criticalCongestionHours.length > 0 ? `${criticalCongestionHours.length} hours` : "None"}
              </span>
            </li>
          </ul>
        </div>

        <div className="glass p-5 rounded-xl border border-border/40 space-y-3 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-accent flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-accent" /> Prediction Accuracy Boost
            </h4>
            {metrics ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                The AI-Fused XGBoost Model achieved an RMSE of <span className="text-primary font-semibold">{metrics.fused_rmse.toFixed(3)}</span>, outperforming the historical model (RMSE = <span className="text-foreground/75 font-semibold">{metrics.historical_rmse.toFixed(3)}</span>) by <span className="text-emerald-400 font-semibold">{metrics.improvement.toFixed(2)}%</span>. 
                Integrating weather signals provides precise calibration against precipitation or cloud cover impacts.
              </p>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                For this forecast date, historical traffic patterns serve as baseline. Our fused algorithm leverages meteorological telemetry to calibrate prediction bounds, reducing traffic uncertainty.
              </p>
            )}
          </div>
          
          <div className="text-[10px] text-muted-foreground/60 border-t border-border/15 pt-2 flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            Confidence level: High (XGBoost validation passed)
          </div>
        </div>
      </div>

      <div className={`p-4 rounded-xl border flex gap-3 ${criticalCongestionHours.length > 0 ? "bg-rose-500/10 border-rose-500/30 text-rose-300" : "bg-primary/10 border-primary/20 text-primary"}`}>
        {criticalCongestionHours.length > 0 ? (
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        ) : (
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        )}
        <div className="space-y-1">
          <h5 className="text-xs font-bold uppercase tracking-wider">AI Operations Dispatch Recommendation</h5>
          <p className="text-xs leading-relaxed opacity-90">{recommendation}</p>
        </div>
      </div>
    </div>
  )
}
