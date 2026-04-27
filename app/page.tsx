"use client"

import { useState } from "react"
import { TopNav } from "@/components/icu/top-nav"
import { EmergencyForm, type FormData, toEmergencyTypeSlug, toSeverityLevel } from "@/components/icu/emergency-form"
import { HospitalCards } from "@/components/icu/hospital-cards"
import { AITimeline } from "@/components/icu/ai-timeline"
import { BottomStats } from "@/components/icu/bottom-stats"
import type { ScoredHospital, RecommendationResponse, AgentStep } from "@/lib/types"
import { Brain, Zap } from "lucide-react"

export default function ICUDashboard() {
  const [loading, setLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [hospitals, setHospitals] = useState<ScoredHospital[]>([])
  const [formData, setFormData] = useState<FormData | null>(null)
  const [confidence, setConfidence] = useState<number | undefined>()
  const [workflow, setWorkflow] = useState<string[] | undefined>()
  const [explanation, setExplanation] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [agenticMode, setAgenticMode] = useState(true)
  const [agentSteps, setAgentSteps] = useState<AgentStep[] | undefined>()
  const [isAgenticResult, setIsAgenticResult] = useState(false)

  const handleAnalyze = async (data: FormData) => {
    setFormData(data)
    setLoading(true)
    setAnalyzed(false)
    setHospitals([])
    setError(null)
    setConfidence(undefined)
    setWorkflow(undefined)
    setExplanation(undefined)
    setAgentSteps(undefined)
    setIsAgenticResult(false)

    try {
      const body = {
        age: parseInt(data.age, 10),
        severity: toSeverityLevel(data.severity),
        emergencyType: toEmergencyTypeSlug(data.emergencyType),
        location: data.location,
        symptoms: data.description
          ? data.description.split(/[,.\n]+/).map((s) => s.trim()).filter(Boolean)
          : [data.emergencyType],
      }

      const endpoint = agenticMode ? "/api/recommend/agentic" : "/api/recommend"

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const json: RecommendationResponse | { error: string } = await res.json()

      if (!res.ok || "error" in json) {
        const msg = "error" in json ? json.error : `HTTP ${res.status}`
        setError(msg)
        setLoading(false)
        return
      }

      const result = json as RecommendationResponse
      setHospitals(result.rankedHospitals)
      setConfidence(result.confidence)
      setWorkflow(result.workflow)
      setExplanation(result.explanation)
      setAgentSteps(result.agentSteps)
      setIsAgenticResult(result.agenticMode ?? false)
      setAnalyzed(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unexpected error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: "oklch(0.09 0.015 240)" }}
    >
      {/* Subtle scan-line overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 scan-line" style={{ height: "30%" }} />
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

      {/* Agentic mode toggle bar */}
      <div
        className="relative z-10 flex items-center justify-between px-6 py-2 border-b"
        style={{
          background: "oklch(0.1 0.018 235 / 0.9)",
          borderColor: "oklch(0.55 0.14 210 / 0.15)",
        }}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5" style={{ color: "oklch(0.78 0.18 195)" }} />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "oklch(0.78 0.18 195)", fontFamily: "var(--font-space-grotesk)" }}>
            Agentic Mode
          </span>
          <span className="text-xs hidden sm:inline" style={{ color: "oklch(0.45 0.04 225)" }}>
            — Web scraping + Mistral LLM scoring
          </span>
        </div>
        <button
          onClick={() => setAgenticMode((v) => !v)}
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200"
          style={{
            background: agenticMode ? "oklch(0.65 0.18 210 / 0.15)" : "oklch(0.16 0.025 230)",
            border: `1px solid ${agenticMode ? "oklch(0.65 0.18 210 / 0.5)" : "oklch(0.25 0.03 230)"}`,
            color: agenticMode ? "oklch(0.78 0.18 195)" : "oklch(0.45 0.04 225)",
          }}
        >
          <Zap className="w-3 h-3" />
          {agenticMode ? "ON" : "OFF"}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="relative z-10 mx-6 mt-3 px-4 py-3 rounded-xl text-sm animate-slide-in-up"
          style={{
            background: "oklch(0.55 0.22 25 / 0.12)",
            border: "1px solid oklch(0.55 0.22 25 / 0.4)",
            color: "oklch(0.75 0.18 25)",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

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
          <HospitalCards
            hospitals={hospitals}
            loading={loading}
            analyzed={analyzed}
            confidence={confidence}
            explanation={explanation}
            agenticMode={isAgenticResult}
          />
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
            workflow={workflow}
            agentSteps={agentSteps}
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
