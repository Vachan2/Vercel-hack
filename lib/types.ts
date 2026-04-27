export interface Hospital {
  id: string;
  name: string;
  location: string;
  icuBeds: number;
  occupancy: number;       // 0–100 percentage
  eta: number;             // base ETA in minutes from a central reference point
  specialties: string[];
  emergencySupportLevel: number; // 1 | 2 | 3
}

export interface PatientInput {
  age: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  emergencyType: string;
  location: string;
  symptoms: string[];
}

export interface ScoredHospital extends Hospital {
  score: number;
  adjustedETA: number;
  projectedOccupancy: number;
  riskScore: number;
  // Agentic enrichment (present when agentic pipeline ran)
  llmScore?: number;
  llmReasoning?: string;
  keyFactors?: string[];
  webContextUsed?: boolean;
  webSnippet?: string;
}

export interface RecommendationResponse {
  recommendation: ScoredHospital;
  rankedHospitals: ScoredHospital[];
  confidence: number;   // 0–100
  workflow: string[];
  explanation: string;
  // Agentic metadata
  agenticMode?: boolean;
  agentSteps?: AgentStep[];
}

export interface AgentStep {
  step: string;
  status: 'completed' | 'failed' | 'skipped';
  detail: string;
  durationMs?: number;
}
