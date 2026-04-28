"use client"

import { useEffect, useState } from "react"
import {
  Brain,
  Search,
  BedDouble,
  Navigation,
  CheckCircle2,
  Loader2,
  Circle,
  BarChart2,
  ShieldCheck,
  Trophy,
} from "lucide-react"
// The fixed 6-step workflow from the API
const WORKFLOW_ICONS = [Brain, Search, BedDouble, Navigation, ShieldCheck, Trophy]

type StepStatus = "idle" | "running" | "done"

import type { AgentStep } from "@/lib/types"

type Props = {
  loading: boolean
  analyzed: boolean
  severity?: string
  emergencyType?: string
  location?: string
  workflow?: string[]
  agentSteps?: AgentStep[]
}

const DEFAULT_WORKFLOW = [
  "Emergency severity analyzed",
  "Hospital availability filtered",
  "Demand prediction calculated",
  "Traffic-adjusted ETA generated",
  "Risk analysis applied",
  "Final ranking completed",
]

const STEP_DETAILS: Record<string, string> = {
  "Emergency severity analyzed": "Evaluating triage level and clinical urgency score",
  "Hospital availability filtered": "Scanning network for ICU beds below 90% occupancy",
  "Demand prediction calculated": "Projecting future load per hospital using time & severity",
  "Traffic-adjusted ETA generated": "Computing traffic-corrected travel times per candidate",
  "Risk analysis applied": "Scoring hospital risk from occupancy and capacity factors",
  "Final ranking completed": "Composite score: availability × specialty × ETA × risk",
}

export function AITimeline({ loading, analyzed, severity, emergencyType, location, workflow, agentSteps }: Props) {
  const steps = workflow ?? DEFAULT_WORKFLOW
  const [stepStatus, setStepStatus] = useState<Record<number, StepStatus>>(
    Object.fromEntries(steps.map((_, i) => [i, "idle" as StepStatus]))
  )
  const [currentStep, setCurrentStep] = useState(-1)

  useEffect(() => {
    if (!loading) {
      if (analyzed) {
        setStepStatus(Object.fromEntries(steps.map((_, i) => [i, "done" as StepStatus])))
        setCurrentStep(steps.length)
      }
      return
    }
    setStepStatus(Object.fromEntries(steps.map((_, i) => [i, "idle" as StepStatus])))
    setCurrentStep(0)
  }, [loading, analyzed, steps.length])

  useEffect(() => {
    if (!loading || currentStep < 0 || currentStep >= steps.length) return

    setStepStatus((prev) => ({ ...prev, [currentStep]: "running" }))

    const timer = setTimeout(() => {
      setStepStatus((prev) => ({ ...prev, [currentStep]: "done" }))
      setCurrentStep((prev) => prev + 1)
    }, 600 + currentStep * 100)

    return () => clearTimeout(timer)
  }, [currentStep, loading, steps.length])

  const severityColor = (v?: string) => {
    if (v === "1") return "oklch(0.62 0.22 25)"
    if (v === "2") return "oklch(0.72 0.2 35)"
    if (v === "3") return "oklch(0.75 0.18 60)"
    if (v === "4") return "oklch(0.7 0.18 140)"
    if (v === "5") return "oklch(0.65 0.18 160)"
    return "oklch(0.78 0.18 195)"
  }

  const severityLabel: Record<string, string> = {
    "1": "CRITICAL",
    "2": "EMERGENT",
    "3": "URGENT",
    "4": "SEMI-URGENT",
    "5": "NON-URGENT",
  }

  return (
    <aside className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "oklch(0.55 0.14 210 / 0.2)" }}>
        <div className="flex items-center gap-2 mb-0.5">
          <Brain className="w-4 h-4" style={{ color: "oklch(0.78 0.18 195)" }} />
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "oklch(0.78 0.18 195)", fontFamily: "var(--font-space-grotesk)" }}
          >
            AI Reasoning
          </span>
        </div>
        <p className="text-xs" style={{ color: "oklch(0.65 0.08 220)" }}>
          Live decision workflow trace
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Patient summary */}
        {analyzed && severity && (
          <div
            className="rounded-xl p-3.5 animate-slide-in-up"
            style={{
              background: `${severityColor(severity)}10`,
              border: `1px solid ${severityColor(severity)}30`,
            }}
          >
            <div
              className="text-xs font-semibold mb-2"
              style={{ color: severityColor(severity), fontFamily: "var(--font-space-grotesk)", letterSpacing: "0.08em" }}
            >
              ACTIVE CASE
            </div>
            <div className="flex flex-col gap-1.5">
              <InfoRow label="Emergency" value={emergencyType ?? "—"} />
              <InfoRow label="Location" value={location ?? "—"} />
              <InfoRow
                label="Severity"
                value={severityLabel[severity] ?? severity}
                valueColor={severityColor(severity)}
              />
            </div>
          </div>
        )}

        {/* Workflow steps */}
        <div className="flex flex-col">
          {steps.map((label, i) => {
            const status = stepStatus[i]
            const isLast = i === steps.length - 1
            const Icon = WORKFLOW_ICONS[i] ?? BarChart2
            const detail = STEP_DETAILS[label] ?? "Processing…"

            return (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <StepIcon status={status} Icon={Icon} />
                  {!isLast && (
                    <div
                      className="w-px flex-1 mt-1 mb-1"
                      style={{
                        background:
                          status === "done"
                            ? "oklch(0.78 0.18 195 / 0.5)"
                            : "oklch(0.22 0.03 230)",
                        transition: "background 0.4s ease",
                      }}
                    />
                  )}
                </div>

                <div className="pb-4 flex-1 min-w-0">
                  <div
                    className="text-sm font-medium leading-tight"
                    style={{
                      color:
                        status === "done"
                          ? "oklch(0.98 0 0)"
                          : status === "running"
                            ? "oklch(0.78 0.18 195)"
                            : "oklch(0.4 0.04 225)",
                      transition: "color 0.3s ease",
                      fontFamily: "var(--font-space-grotesk)",
                    }}
                  >
                    {label}
                    {status === "running" && (
                      <span className="inline-flex items-center ml-2">
                        <Loader2
                          className="w-3 h-3 animate-spin"
                          style={{ color: "oklch(0.78 0.18 195)" }}
                        />
                      </span>
                    )}
                  </div>
                  <p
                    className="text-xs mt-0.5 leading-relaxed"
                    style={{
                      color: status === "idle" ? "oklch(0.3 0.03 230)" : "oklch(0.5 0.06 220)",
                      transition: "color 0.3s ease",
                    }}
                  >
                    {detail}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Final status */}
        {analyzed && (
          <div
            className="rounded-xl p-3.5 animate-slide-in-up"
            style={{
              background: "oklch(0.65 0.18 160 / 0.08)",
              border: "1px solid oklch(0.65 0.18 160 / 0.3)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4" style={{ color: "oklch(0.7 0.16 160)" }} />
              <span
                className="text-xs font-semibold"
                style={{ color: "oklch(0.7 0.16 160)", fontFamily: "var(--font-space-grotesk)" }}
              >
                ROUTING COMPLETE
              </span>
            </div>
            <p className="text-xs" style={{ color: "oklch(0.5 0.06 220)" }}>
              All {steps.length} analysis steps completed. Recommendations ranked by composite score.
            </p>
          </div>
        )}

        {/* Agent steps (agentic mode) */}
        {analyzed && agentSteps && agentSteps.length > 0 && (
          <div
            className="rounded-xl p-3.5 animate-slide-in-up"
            style={{
              background: "oklch(0.65 0.2 270 / 0.06)",
              border: "1px solid oklch(0.65 0.2 270 / 0.2)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-3.5 h-3.5" style={{ color: "oklch(0.65 0.2 270)" }} />
              <span
                className="text-xs font-semibold tracking-wider uppercase"
                style={{ color: "oklch(0.65 0.2 270)", fontFamily: "var(--font-space-grotesk)" }}
              >
                Agent Execution Log
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {agentSteps.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className="text-[10px] font-bold mt-0.5 shrink-0"
                    style={{
                      color: s.status === "completed"
                        ? "oklch(0.7 0.16 160)"
                        : s.status === "failed"
                          ? "oklch(0.62 0.22 25)"
                          : "oklch(0.55 0.06 220)",
                    }}
                  >
                    {s.status === "completed" ? "✓" : s.status === "failed" ? "✗" : "—"}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium" style={{ color: "oklch(0.75 0.04 220)" }}>
                      {s.step}
                      {s.durationMs != null && (
                        <span className="ml-1.5 text-[10px]" style={{ color: "oklch(0.45 0.04 225)" }}>
                          {s.durationMs}ms
                        </span>
                      )}
                    </div>
                    <div className="text-[10px]" style={{ color: "oklch(0.45 0.04 225)" }}>
                      {s.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!analyzed && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(0.65 0.18 210 / 0.07)", border: "1px solid oklch(0.65 0.18 210 / 0.18)" }}
            >
              <Brain className="w-6 h-6" style={{ color: "oklch(0.65 0.18 210 / 0.4)" }} />
            </div>
            <p className="text-xs max-w-[160px]" style={{ color: "oklch(0.4 0.04 225)" }}>
              AI reasoning steps will appear here during analysis
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}

function StepIcon({ status, Icon }: { status: StepStatus; Icon: React.ElementType }) {
  if (status === "idle") {
    return (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: "oklch(0.14 0.02 230)", border: "1px solid oklch(0.22 0.03 230)" }}
      >
        <Circle className="w-3 h-3" style={{ color: "oklch(0.35 0.03 230)" }} />
      </div>
    )
  }
  if (status === "running") {
    return (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 animate-pulse-glow"
        style={{
          background: "oklch(0.7 0.2 195 / 0.15)",
          border: "1px solid oklch(0.7 0.2 195 / 0.5)",
          boxShadow: "0 0 10px oklch(0.7 0.2 195 / 0.4)",
        }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: "oklch(0.78 0.18 195)" }} />
      </div>
    )
  }
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 animate-step-complete"
      style={{
        background: "oklch(0.65 0.18 160 / 0.15)",
        border: "1px solid oklch(0.65 0.18 160 / 0.5)",
      }}
    >
      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "oklch(0.7 0.16 160)" }} />
    </div>
  )
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs" style={{ color: "oklch(0.5 0.06 220)" }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: valueColor ?? "oklch(0.82 0.015 210)" }}>
        {value}
      </span>
    </div>
  )
}
