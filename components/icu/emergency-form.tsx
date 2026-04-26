"use client"

import { useState } from "react"
import { AlertTriangle, MapPin, User, Zap, FileText, ChevronDown } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

export type FormData = {
  age: string
  emergencyType: string
  severity: string
  location: string
  description: string
}

type Props = {
  onSubmit: (data: FormData) => void
  loading: boolean
}

const EMERGENCY_TYPES = [
  "Cardiac Arrest",
  "Stroke",
  "Respiratory Failure",
  "Trauma / Injury",
  "Sepsis",
  "Neurological Emergency",
  "Burns",
  "Multi-organ Failure",
  "Poisoning / Overdose",
  "Post-Surgical Complication",
]

const SEVERITY_LEVELS = [
  { value: "1", label: "Level 1 — Immediate (Life Threatening)" },
  { value: "2", label: "Level 2 — Emergent (High Risk)" },
  { value: "3", label: "Level 3 — Urgent (Stable but Serious)" },
  { value: "4", label: "Level 4 — Semi-Urgent (Non-Critical)" },
  { value: "5", label: "Level 5 — Non-Urgent (Routine)" },
]

const LOCATIONS = [
  "Downtown",
  "North District",
  "South District",
  "East Suburb",
  "West Suburb",
  "Central Medical Zone",
  "Airport Corridor",
  "Industrial Quarter",
]

export function EmergencyForm({ onSubmit, loading }: Props) {
  const [form, setForm] = useState<FormData>({
    age: "",
    emergencyType: "",
    severity: "",
    location: "",
    description: "",
  })

  const isValid = form.age && form.emergencyType && form.severity && form.location

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || loading) return
    onSubmit(form)
  }

  const severityColor = (v: string) => {
    if (v === "1") return "oklch(0.62 0.22 25)"
    if (v === "2") return "oklch(0.72 0.2 35)"
    if (v === "3") return "oklch(0.75 0.18 60)"
    if (v === "4") return "oklch(0.7 0.18 140)"
    if (v === "5") return "oklch(0.65 0.18 160)"
    return "oklch(0.55 0.06 220)"
  }

  return (
    <aside className="flex flex-col gap-0 h-full">
      {/* Header */}
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: "oklch(0.55 0.14 210 / 0.2)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4" style={{ color: "oklch(0.75 0.18 60)" }} />
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "oklch(0.75 0.18 60)", fontFamily: "var(--font-space-grotesk)" }}
          >
            Emergency Intake
          </span>
        </div>
        <p className="text-xs" style={{ color: "oklch(0.5 0.06 220)" }}>
          Enter patient details for AI routing analysis
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 flex-1 overflow-y-auto">
        {/* Age */}
        <FieldWrapper icon={<User className="w-3.5 h-3.5" />} label="Patient Age">
          <input
            type="number"
            min={0}
            max={120}
            placeholder="e.g. 58"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            style={{ color: "oklch(0.9 0.02 210)" }}
          />
        </FieldWrapper>

        {/* Emergency Type */}
        <FieldWrapper icon={<Zap className="w-3.5 h-3.5" />} label="Emergency Type">
          <div className="relative flex items-center">
            <select
              value={form.emergencyType}
              onChange={(e) => setForm({ ...form, emergencyType: e.target.value })}
              className="w-full bg-transparent text-sm outline-none appearance-none cursor-pointer"
              style={{ color: form.emergencyType ? "oklch(0.9 0.02 210)" : "oklch(0.45 0.04 220)" }}
            >
              <option value="" disabled style={{ background: "oklch(0.12 0.02 230)", color: "oklch(0.55 0.06 220)" }}>
                Select emergency type
              </option>
              {EMERGENCY_TYPES.map((t) => (
                <option key={t} value={t} style={{ background: "oklch(0.12 0.02 230)", color: "oklch(0.9 0.02 210)" }}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 pointer-events-none absolute right-0 shrink-0" style={{ color: "oklch(0.5 0.06 220)" }} />
          </div>
        </FieldWrapper>

        {/* Severity */}
        <div>
          <label className="text-xs font-medium mb-2 block" style={{ color: "oklch(0.55 0.06 220)", letterSpacing: "0.06em" }}>
            SEVERITY LEVEL
          </label>
          <div className="flex flex-col gap-1.5">
            {SEVERITY_LEVELS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setForm({ ...form, severity: s.value })}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-200"
                style={{
                  background:
                    form.severity === s.value
                      ? `${severityColor(s.value)}18`
                      : "oklch(0.14 0.02 230 / 0.5)",
                  border: `1px solid ${form.severity === s.value ? severityColor(s.value) + "55" : "oklch(0.22 0.03 230)"}`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: severityColor(s.value),
                    boxShadow: form.severity === s.value ? `0 0 6px ${severityColor(s.value)}` : "none",
                  }}
                />
                <span
                  className="text-xs leading-tight"
                  style={{ color: form.severity === s.value ? "oklch(0.9 0.02 210)" : "oklch(0.55 0.06 220)" }}
                >
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <FieldWrapper icon={<MapPin className="w-3.5 h-3.5" />} label="Patient Location">
          <div className="relative flex items-center">
            <select
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full bg-transparent text-sm outline-none appearance-none cursor-pointer"
              style={{ color: form.location ? "oklch(0.9 0.02 210)" : "oklch(0.45 0.04 220)" }}
            >
              <option value="" disabled style={{ background: "oklch(0.12 0.02 230)", color: "oklch(0.55 0.06 220)" }}>
                Select district
              </option>
              {LOCATIONS.map((l) => (
                <option key={l} value={l} style={{ background: "oklch(0.12 0.02 230)", color: "oklch(0.9 0.02 210)" }}>
                  {l}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 pointer-events-none absolute right-0 shrink-0" style={{ color: "oklch(0.5 0.06 220)" }} />
          </div>
        </FieldWrapper>

        {/* Condition Description */}
        <FieldWrapper icon={<FileText className="w-3.5 h-3.5" />} label="Condition Description (Optional)">
          <textarea
            rows={3}
            placeholder="Brief clinical notes…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground leading-relaxed"
            style={{ color: "oklch(0.9 0.02 210)" }}
          />
        </FieldWrapper>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || loading}
          className="relative w-full py-3 rounded-xl font-semibold text-sm tracking-wider uppercase transition-all duration-300 mt-2 overflow-hidden"
          style={{
            fontFamily: "var(--font-space-grotesk)",
            background:
              isValid && !loading
                ? "linear-gradient(135deg, oklch(0.55 0.18 210), oklch(0.58 0.2 195))"
                : "oklch(0.18 0.02 230)",
            color: isValid && !loading ? "oklch(0.97 0.005 210)" : "oklch(0.4 0.04 220)",
            boxShadow:
              isValid && !loading
                ? "0 0 24px oklch(0.65 0.18 210 / 0.4), 0 0 48px oklch(0.7 0.2 195 / 0.15)"
                : "none",
            border: `1px solid ${isValid && !loading ? "oklch(0.7 0.18 210 / 0.5)" : "oklch(0.25 0.03 230)"}`,
            cursor: !isValid || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner className="w-4 h-4" />
              AI Routing Emergency…
            </span>
          ) : (
            "Analyze Emergency"
          )}
        </button>
      </form>
    </aside>
  )
}

function FieldWrapper({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: "oklch(0.55 0.06 220)", letterSpacing: "0.06em" }}>
        <span style={{ color: "oklch(0.78 0.18 195)" }}>{icon}</span>
        {label.toUpperCase()}
      </label>
      <div
        className="px-3 py-2.5 rounded-lg"
        style={{
          background: "oklch(0.14 0.02 230 / 0.5)",
          border: "1px solid oklch(0.22 0.03 230)",
        }}
      >
        {children}
      </div>
    </div>
  )
}
