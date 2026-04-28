"use client"

import { TrendingUp, TrendingDown, Activity, AlertOctagon, CheckCircle, Clock } from "lucide-react"

const STATS = [
  {
    label: "Active Emergencies",
    value: "23",
    sub: "+3 this hour",
    trend: "up",
    icon: AlertOctagon,
    color: "oklch(0.62 0.22 25)",
  },
  {
    label: "ICU Beds Available",
    value: "142",
    sub: "across 18 hospitals",
    trend: "neutral",
    icon: Activity,
    color: "oklch(0.78 0.18 195)",
  },
  {
    label: "Avg Response Time",
    value: "4.2 min",
    sub: "-0.8 vs yesterday",
    trend: "down",
    icon: Clock,
    color: "oklch(0.72 0.18 210)",
  },
  {
    label: "Routings Today",
    value: "187",
    sub: "96.3% accuracy",
    trend: "up",
    icon: TrendingUp,
    color: "oklch(0.7 0.18 160)",
  },
  {
    label: "Critical Resolved",
    value: "41",
    sub: "last 24 hours",
    trend: "neutral",
    icon: CheckCircle,
    color: "oklch(0.72 0.18 210)",
  },
  {
    label: "AI Confidence Avg",
    value: "91.4%",
    sub: "+2.1% this week",
    trend: "up",
    icon: Activity,
    color: "oklch(0.75 0.18 60)",
  },
]

export function BottomStats() {
  return (
    <footer
      className="border-t px-6 py-3"
      style={{
        background: "oklch(0.1 0.018 235 / 0.95)",
        borderColor: "oklch(0.55 0.14 210 / 0.2)",
      }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATS.map((s) => (
          <StatItem key={s.label} stat={s} />
        ))}
      </div>
    </footer>
  )
}

function StatItem({ stat }: { stat: (typeof STATS)[0] }) {
  const Icon = stat.icon
  const TrendIcon = stat.trend === "up" ? TrendingUp : stat.trend === "down" ? TrendingDown : null
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl px-3 py-2"
      style={{
        background: `${stat.color}09`,
        border: `1px solid ${stat.color}22`,
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${stat.color}18` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
      </div>
      <div className="min-w-0">
        <div
          className="text-sm font-bold leading-tight"
          style={{ color: stat.color, fontFamily: "var(--font-space-grotesk)" }}
        >
          {stat.value}
        </div>
        <div className="text-[10px] truncate" style={{ color: "oklch(0.60 0.06 220)" }}>
          {stat.label}
        </div>
        {stat.sub && (
          <div className="flex items-center gap-0.5 text-[10px]" style={{ color: "oklch(0.58 0.06 220)" }}>
            {TrendIcon && (
              <TrendIcon
                className="w-2.5 h-2.5"
                style={{ color: stat.trend === "up" && stat.label === "Active Emergencies" ? "oklch(0.62 0.22 25)" : stat.trend === "down" ? "oklch(0.7 0.18 160)" : "oklch(0.7 0.18 160)" }}
              />
            )}
            {stat.sub}
          </div>
        )}
      </div>
    </div>
  )
}
