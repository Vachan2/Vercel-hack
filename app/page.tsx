"use client"

import { useState } from "react"
import { TopNav } from "@/components/icu/top-nav"
import { EmergencyForm, type FormData } from "@/components/icu/emergency-form"
import { HospitalCards, type Hospital } from "@/components/icu/hospital-cards"
import { AITimeline } from "@/components/icu/ai-timeline"
import { BottomStats } from "@/components/icu/bottom-stats"

// Simulated AI routing result generator
function generateHospitals(form: FormData): Hospital[] {
  const sev = parseInt(form.severity)

  const pool: Omit<Hospital, "rank" | "confidence" | "priority">[] = [
    {
      name: "Metro General ICU",
      icuBeds: 18,
      totalBeds: 24,
      eta: "6 min",
      specialty: "Cardiac",
      distance: "3.2 km",
    },
    {
      name: "St. Raphael Critical Care",
      icuBeds: 12,
      totalBeds: 20,
      eta: "9 min",
      specialty: "Trauma",
      distance: "5.1 km",
    },
    {
      name: "Northside Medical Center",
      icuBeds: 7,
      totalBeds: 14,
      eta: "11 min",
      specialty: "Neuro",
      distance: "7.8 km",
    },
    {
      name: "Eastbrook University Hospital",
      icuBeds: 22,
      totalBeds: 30,
      eta: "14 min",
      specialty: "Multi-organ",
      distance: "9.4 km",
    },
    {
      name: "Lakeview Trauma Center",
      icuBeds: 5,
      totalBeds: 10,
      eta: "17 min",
      specialty: "Burns",
      distance: "12.1 km",
    },
  ]

  const baseConfidences = [97, 88, 76, 64, 51]
  const sev_boost = (5 - sev) * 1.5

  const priorities: Hospital["priority"][] = ["critical", "high", "medium", "low", "low"]

  return pool.map((h, i) => ({
    ...h,
    rank: i + 1,
    confidence: Math.min(99, Math.round(baseConfidences[i] + sev_boost * (i === 0 ? 1 : 0.4))),
    priority: priorities[i],
  }))
}

export default function ICUDashboard() {
  const [loading, setLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [formData, setFormData] = useState<FormData | null>(null)

  const handleAnalyze = async (data: FormData) => {
    setFormData(data)
    setLoading(true)
    setAnalyzed(false)
    setHospitals([])

    // Simulate AI processing delay
    await new Promise((res) => setTimeout(res, 4200))

    setHospitals(generateHospitals(data))
    setLoading(false)
    setAnalyzed(true)
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "oklch(0.09 0.015 240)" }}
    >
      {/* Subtle scan-line overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 scan-line" style={{ height: "30%" }} />
        {/* Grid dot pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, oklch(0.55 0.12 210 / 0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Top navigation */}
      <div className="relative z-10 shrink-0">
        <TopNav />
      </div>

      {/* Main 3-column layout */}
      <main className="relative z-10 flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[320px_1fr_280px] xl:grid-cols-[340px_1fr_300px]">
        {/* Left — Emergency Form */}
        <div
          className="border-r overflow-hidden flex flex-col"
          style={{ borderColor: "oklch(0.55 0.14 210 / 0.15)" }}
        >
          <EmergencyForm onSubmit={handleAnalyze} loading={loading} />
        </div>

        {/* Center — Hospital Recommendations */}
        <div className="overflow-hidden flex flex-col">
          <HospitalCards hospitals={hospitals} loading={loading} analyzed={analyzed} />
        </div>

        {/* Right — AI Reasoning Timeline */}
        <div
          className="border-l overflow-hidden flex-col hidden lg:flex"
          style={{ borderColor: "oklch(0.55 0.14 210 / 0.15)" }}
        >
          <AITimeline
            loading={loading}
            analyzed={analyzed}
            severity={formData?.severity}
            emergencyType={formData?.emergencyType}
            location={formData?.location}
          />
        </div>
      </main>

      {/* Bottom stats */}
      <div className="relative z-10 shrink-0">
        <BottomStats />
      </div>
    </div>
  )
}
