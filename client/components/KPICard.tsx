"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"

interface KPICardProps {
  title: string
  value: string | number
  subtext: string
  icon: ReactNode
  glowColor?: string
}

export function KPICard({ title, value, subtext, icon, glowColor = "var(--primary)" }: KPICardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="stat-card kpi-glow relative overflow-hidden flex flex-col justify-between h-full min-h-[140px]"
      style={{ "--primary": glowColor } as React.CSSProperties}
    >
      {/* Background radial accent glow */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-xl pointer-events-none"
        style={{ backgroundColor: glowColor }}
      />
      
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-foreground tracking-tight select-all">
            {value}
          </h3>
        </div>
        <div 
          className="p-2 rounded-lg bg-muted/40 text-foreground/80"
          style={{ border: `1px solid ${glowColor}25` }}
        >
          {icon}
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground/90 mt-4 font-medium flex items-center gap-1">
        {subtext}
      </p>
    </motion.div>
  )
}
