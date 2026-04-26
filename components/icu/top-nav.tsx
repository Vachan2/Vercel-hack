"use client"

import { Activity, Radio, Shield, Wifi } from "lucide-react"

export function TopNav() {
  const now = new Date()
  const timeStr = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })

  return (
    <header
      className="relative border-b"
      style={{
        background: "oklch(0.1 0.02 230 / 0.95)",
        borderColor: "oklch(0.55 0.14 210 / 0.3)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* subtle top glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, oklch(0.7 0.2 195 / 0.8), oklch(0.65 0.18 210 / 0.6), transparent)" }}
      />

      <div className="flex items-center justify-between px-6 py-3">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ background: "oklch(0.65 0.18 210 / 0.15)", border: "1px solid oklch(0.65 0.18 210 / 0.4)" }}
          >
            <Activity className="w-5 h-5" style={{ color: "oklch(0.78 0.18 195)" }} />
          </div>
          <div>
            <h1
              className="font-bold tracking-widest text-sm uppercase"
              style={{ fontFamily: "var(--font-space-grotesk)", letterSpacing: "0.2em" }}
            >
              <span className="text-cyan-glow">ICU</span>{" "}
              <span style={{ color: "oklch(0.85 0.04 220)" }}>Command Center</span>
            </h1>
            <p className="text-xs" style={{ color: "oklch(0.5 0.06 220)", letterSpacing: "0.08em" }}>
              AI Emergency Routing System v2.4.1
            </p>
          </div>
        </div>

        {/* Status indicators */}
        <div className="hidden md:flex items-center gap-6">
          <StatusBadge icon={<Wifi className="w-3 h-3" />} label="NETWORK" value="ONLINE" color="stable" />
          <StatusBadge icon={<Shield className="w-3 h-3" />} label="SECURITY" value="ACTIVE" color="stable" />
          <StatusBadge icon={<Radio className="w-3 h-3" />} label="AI ENGINE" value="READY" color="cyan" pulse />
        </div>

        {/* Clock */}
        <div className="text-right">
          <div
            className="text-lg font-mono font-bold tracking-widest"
            style={{ color: "oklch(0.78 0.18 195)", textShadow: "0 0 8px oklch(0.7 0.2 195 / 0.5)" }}
          >
            {timeStr}
          </div>
          <div className="text-xs" style={{ color: "oklch(0.5 0.06 220)" }}>{dateStr}</div>
        </div>
      </div>
    </header>
  )
}

function StatusBadge({
  icon,
  label,
  value,
  color,
  pulse,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: "stable" | "cyan" | "critical" | "warning"
  pulse?: boolean
}) {
  const colors = {
    stable: "oklch(0.65 0.18 160)",
    cyan: "oklch(0.78 0.18 195)",
    critical: "oklch(0.62 0.22 25)",
    warning: "oklch(0.75 0.18 60)",
  }
  const c = colors[color]
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-1.5 h-1.5 rounded-full ${pulse ? "animate-pulse-glow" : ""}`}
        style={{ background: c, boxShadow: `0 0 6px ${c}` }}
      />
      <div style={{ color: "oklch(0.5 0.06 220)" }} className="text-xs tracking-wider">
        {label}
      </div>
      <div className="text-xs font-semibold" style={{ color: c }}>{value}</div>
    </div>
  )
}
