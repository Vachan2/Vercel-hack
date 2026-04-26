"use client"

import { MapPin, Clock, BedDouble, Award, Zap, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type Hospital = {
  rank: number
  name: string
  icuBeds: number
  totalBeds: number
  eta: string
  confidence: number
  specialty: string
  priority: "critical" | "high" | "medium" | "low"
  distance: string
}

type Props = {
  hospitals: Hospital[]
  loading: boolean
  analyzed: boolean
}

const PRIORITY_CONFIG = {
  critical: {
    label: "CRITICAL MATCH",
    color: "oklch(0.78 0.18 195)",
    glow: "oklch(0.7 0.2 195 / 0.35)",
    bg: "oklch(0.7 0.2 195 / 0.08)",
    border: "oklch(0.7 0.2 195 / 0.4)",
  },
  high: {
    label: "HIGH PRIORITY",
    color: "oklch(0.72 0.18 210)",
    glow: "oklch(0.65 0.18 210 / 0.3)",
    bg: "oklch(0.65 0.18 210 / 0.07)",
    border: "oklch(0.65 0.18 210 / 0.35)",
  },
  medium: {
    label: "MEDIUM PRIORITY",
    color: "oklch(0.75 0.18 60)",
    glow: "oklch(0.75 0.18 60 / 0.25)",
    bg: "oklch(0.75 0.18 60 / 0.06)",
    border: "oklch(0.75 0.18 60 / 0.3)",
  },
  low: {
    label: "STANDARD",
    color: "oklch(0.55 0.06 220)",
    glow: "none",
    bg: "oklch(0.14 0.02 230 / 0.5)",
    border: "oklch(0.22 0.03 230)",
  },
}

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" }

export function HospitalCards({ hospitals, loading, analyzed }: Props) {
  return (
    <section className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "oklch(0.55 0.14 210 / 0.2)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Award className="w-4 h-4" style={{ color: "oklch(0.78 0.18 195)" }} />
              <span
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "oklch(0.78 0.18 195)", fontFamily: "var(--font-space-grotesk)" }}
              >
                Hospital Recommendations
              </span>
            </div>
            <p className="text-xs" style={{ color: "oklch(0.5 0.06 220)" }}>
              AI-ranked by compatibility &amp; availability
            </p>
          </div>
          {analyzed && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium animate-slide-in-right"
              style={{
                background: "oklch(0.65 0.18 160 / 0.12)",
                border: "1px solid oklch(0.65 0.18 160 / 0.35)",
                color: "oklch(0.72 0.16 160)",
              }}
            >
              <CheckCircle2 className="w-3 h-3" />
              {hospitals.length} Matches
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {loading ? (
          <LoadingState />
        ) : !analyzed ? (
          <EmptyState />
        ) : (
          hospitals.map((h, i) => (
            <HospitalCard
              key={h.rank}
              hospital={h}
              animationDelay={i * 120}
            />
          ))
        )}
      </div>
    </section>
  )
}

function HospitalCard({ hospital: h, animationDelay }: { hospital: Hospital; animationDelay: number }) {
  const cfg = PRIORITY_CONFIG[h.priority]
  const bedPct = Math.round((h.icuBeds / h.totalBeds) * 100)

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-300 hover:scale-[1.01] animate-slide-in-up"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: cfg.glow !== "none" ? `0 0 24px ${cfg.glow}` : "none",
        animationDelay: `${animationDelay}ms`,
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-lg shrink-0"
            style={{ background: `${cfg.color}18`, border: `1px solid ${cfg.color}44` }}
          >
            <span className="text-base leading-none">{RANK_MEDALS[h.rank] ?? `#${h.rank}`}</span>
          </div>
          <div>
            <h3
              className="font-semibold text-sm leading-tight"
              style={{ color: "oklch(0.93 0.015 210)", fontFamily: "var(--font-space-grotesk)" }}
            >
              {h.name}
            </h3>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-2.5 h-2.5" style={{ color: "oklch(0.5 0.06 220)" }} />
              <span className="text-xs" style={{ color: "oklch(0.5 0.06 220)" }}>{h.distance}</span>
            </div>
          </div>
        </div>

        {/* Priority badge */}
        <span
          className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full uppercase shrink-0"
          style={{
            background: `${cfg.color}18`,
            border: `1px solid ${cfg.color}55`,
            color: cfg.color,
            fontFamily: "var(--font-space-grotesk)",
          }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Confidence bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: "oklch(0.5 0.06 220)" }}>Match Confidence</span>
          <span className="text-sm font-bold" style={{ color: cfg.color }}>
            {h.confidence}%
          </span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: "oklch(0.18 0.02 230)" }}>
          <div
            className="h-1.5 rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${h.confidence}%`,
              background: `linear-gradient(90deg, ${cfg.color}99, ${cfg.color})`,
              boxShadow: `0 0 6px ${cfg.color}`,
            }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox
          icon={<BedDouble className="w-3 h-3" />}
          label="ICU Beds"
          value={`${h.icuBeds} / ${h.totalBeds}`}
          accent={cfg.color}
          sub={`${bedPct}% available`}
        />
        <StatBox
          icon={<Clock className="w-3 h-3" />}
          label="ETA"
          value={h.eta}
          accent={cfg.color}
        />
        <StatBox
          icon={<Zap className="w-3 h-3" />}
          label="Specialty"
          value={h.specialty}
          accent={cfg.color}
          small
        />
      </div>
    </div>
  )
}

function StatBox({
  icon,
  label,
  value,
  accent,
  sub,
  small,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
  sub?: string
  small?: boolean
}) {
  return (
    <div
      className="rounded-lg p-2.5 flex flex-col gap-1"
      style={{ background: "oklch(0.1 0.015 240 / 0.7)", border: "1px solid oklch(0.2 0.025 230)" }}
    >
      <div className="flex items-center gap-1" style={{ color: "oklch(0.5 0.06 220)" }}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <span
        className={cn("font-semibold leading-tight", small ? "text-xs" : "text-sm")}
        style={{ color: accent }}
      >
        {value}
      </span>
      {sub && <span className="text-[10px]" style={{ color: "oklch(0.45 0.04 220)" }}>{sub}</span>}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-4 animate-pulse"
          style={{ background: "oklch(0.14 0.02 230 / 0.6)", border: "1px solid oklch(0.22 0.03 230)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl" style={{ background: "oklch(0.18 0.02 230)" }} />
            <div className="flex-1">
              <div className="h-3 rounded-full mb-1.5 w-3/4" style={{ background: "oklch(0.18 0.02 230)" }} />
              <div className="h-2.5 rounded-full w-1/2" style={{ background: "oklch(0.18 0.02 230)" }} />
            </div>
          </div>
          <div className="h-1.5 rounded-full mb-3" style={{ background: "oklch(0.18 0.02 230)" }} />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((j) => (
              <div key={j} className="rounded-lg p-2.5 h-14" style={{ background: "oklch(0.18 0.02 230)" }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "oklch(0.65 0.18 210 / 0.08)", border: "1px solid oklch(0.65 0.18 210 / 0.2)" }}
      >
        <Award className="w-8 h-8" style={{ color: "oklch(0.65 0.18 210 / 0.5)" }} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1" style={{ color: "oklch(0.6 0.06 220)" }}>
          Awaiting Patient Data
        </p>
        <p className="text-xs max-w-[200px]" style={{ color: "oklch(0.42 0.04 225)" }}>
          Fill the intake form and click &ldquo;Analyze Emergency&rdquo; to receive AI recommendations
        </p>
      </div>
    </div>
  )
}
