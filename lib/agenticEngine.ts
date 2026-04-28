/**
 * Agentic Recommendation Engine
 *
 * Extends the deterministic engine with two autonomous agents:
 *   1. Web Scraper Agent  — fetches live public context per hospital
 *   2. LLM Scoring Agent  — uses Mistral to produce enriched scores + reasoning
 *
 * Falls back gracefully to deterministic scores if either agent fails.
 */

import { hospitals } from './hospitalData';
import { filterAvailableHospitals, calculateHospitalRisk, Hospital as AnalyticsHospital } from './analytics';
import { predictHospitalLoad } from './prediction';
import { estimateTrafficDelay } from './trafficEstimator';
import { scoreHospital, rankHospitals } from './scoring';
import { scrapeHospitalContext } from './webScraper';
import { llmScoreAllHospitals } from './llmScorer';
import { ETA_MATRIX } from './distanceCalculator';
import type { Hospital, PatientInput, RecommendationResponse, ScoredHospital, AgentStep } from './types';

export async function generateAgenticRecommendation(
  input: PatientInput,
): Promise<RecommendationResponse> {
  const agentSteps: AgentStep[] = [];

  // ── Step 1: Filter available hospitals ──────────────────────────────
  const t0 = Date.now();
  let candidates = filterAvailableHospitals(hospitals as AnalyticsHospital[], 90) as Hospital[];

  if (candidates.length < 1) {
    throw new Error('No available ICU beds found in the hospital network');
  }

  // Step 1.5 — Prioritize same-location hospitals
  const sameLocationHospitals = candidates.filter(h => h.location === input.location);
  const otherLocationHospitals = candidates.filter(h => h.location !== input.location);
  
  // If we have hospitals in the same location, prioritize them but keep others as backup
  if (sameLocationHospitals.length > 0) {
    candidates = [...sameLocationHospitals, ...otherLocationHospitals];
  }

  // OPTIMIZATION: Limit to top 15 candidates to reduce API calls and processing time
  // This prevents 4+ minute response times when processing 100 hospitals
  candidates = candidates.slice(0, 15);

  agentSteps.push({
    step: 'Hospital availability filtered',
    status: 'completed',
    detail: `${candidates.length} hospitals below 90% occupancy`,
    durationMs: Date.now() - t0,
  });

  // ── Step 2: Deterministic enrichment (predict, ETA, risk, score) ────
  const t1 = Date.now();
  const deterministicScored: ScoredHospital[] = candidates.map((hospital) => {
    // Calculate realistic ETA based on patient location
    const patientLocation = input.location;
    const hospitalLocation = hospital.location;
    const baseETA = ETA_MATRIX[patientLocation]?.[hospitalLocation] || 30;

    const { projectedOccupancy } = predictHospitalLoad({
      currentOccupancy: hospital.occupancy,
      timeOfDay: new Date().getUTCHours(),
      severityTrend: input.severity,
      emergencyCount: 1,
    });

    const { adjustedETA } = estimateTrafficDelay({
      distance: baseETA / 2, // Rough conversion: ETA in min to distance in km
      cityTrafficMultiplier: 1.3,
      emergencyUrgency: input.severity,
    });

    const riskScore = calculateHospitalRisk(hospital as AnalyticsHospital);

    return scoreHospital(hospital, input, adjustedETA, projectedOccupancy, riskScore, candidates);
  });

  agentSteps.push({
    step: 'Deterministic scoring completed',
    status: 'completed',
    detail: `Scored ${deterministicScored.length} hospitals using availability, ETA, risk, and specialty`,
    durationMs: Date.now() - t1,
  });

  // ── Step 3: Web Scraper Agent ────────────────────────────────────────
  const t2 = Date.now();
  let webContexts;
  try {
    webContexts = await Promise.all(
      candidates.map((h) => scrapeHospitalContext(h.name, h.location)),
    );
    const liveCount = webContexts.filter((c) => c.source !== 'fallback').length;
    agentSteps.push({
      step: 'Web scraper agent',
      status: 'completed',
      detail: `Fetched live context for ${liveCount}/${candidates.length} hospitals`,
      durationMs: Date.now() - t2,
    });
  } catch (err) {
    console.error('Web scraper agent failed:', err);
    webContexts = candidates.map((h) => ({
      hospitalName: h.name,
      snippet: `${h.name} is a hospital in ${h.location}, Bangalore providing ICU and emergency services.`,
      source: 'fallback',
      scrapedAt: new Date().toISOString(),
    }));
    agentSteps.push({
      step: 'Web scraper agent',
      status: 'failed',
      detail: 'Fell back to static descriptions',
      durationMs: Date.now() - t2,
    });
  }

  // ── Step 4: LLM Scoring Agent ────────────────────────────────────────
  const t3 = Date.now();
  let llmResults;
  try {
    llmResults = await llmScoreAllHospitals(
      candidates,
      input,
      webContexts,
      deterministicScored.map((h) => h.score),
    );
    agentSteps.push({
      step: 'LLM scoring agent (Mistral)',
      status: 'completed',
      detail: `Mistral scored ${llmResults.length} hospitals with clinical reasoning`,
      durationMs: Date.now() - t3,
    });
  } catch (err) {
    console.error('LLM scoring agent failed:', err);
    llmResults = deterministicScored.map((h) => ({
      hospitalId: h.id,
      llmScore: h.score,
      llmReasoning: '',
      keyFactors: [],
      webContextUsed: false,
    }));
    agentSteps.push({
      step: 'LLM scoring agent (Mistral)',
      status: 'failed',
      detail: 'Fell back to deterministic scores',
      durationMs: Date.now() - t3,
    });
  }

  // ── Step 5: Merge deterministic + LLM scores ─────────────────────────
  const t4 = Date.now();
  const llmMap = new Map(llmResults.map((r) => [r.hospitalId, r]));

  const enrichedHospitals: ScoredHospital[] = deterministicScored.map((h, i) => {
    const llm = llmMap.get(h.id);
    // Blend: 40% deterministic + 60% LLM (LLM has web grounding)
    const blendedScore = llm
      ? Math.min(100, Math.max(0, h.score * 0.4 + llm.llmScore * 0.6))
      : h.score;

    return {
      ...h,
      score: blendedScore,
      llmScore: llm?.llmScore,
      llmReasoning: llm?.llmReasoning,
      keyFactors: llm?.keyFactors,
      webContextUsed: llm?.webContextUsed,
      webSnippet: webContexts[i]?.snippet,
    };
  });

  agentSteps.push({
    step: 'Score blending (deterministic + LLM)',
    status: 'completed',
    detail: '40% rule-based + 60% LLM-enriched composite score',
    durationMs: Date.now() - t4,
  });

  // ── Step 6: Rank and build response ──────────────────────────────────
  const ranked = rankHospitals(enrichedHospitals);

  const confidence =
    ranked.length === 1
      ? 100
      : Math.min(
          100,
          ((ranked[0].score - ranked[1].score) / ranked[0].score) * 100 * 2.5,
        );

  const recommendation = ranked[0];
  const availableICUBeds = Math.round(
    recommendation.icuBeds * (1 - recommendation.occupancy / 100),
  );
  const specialtyMatch = recommendation.specialties.some(
    (s) => s.toLowerCase() === input.emergencyType.toLowerCase(),
  );

  // Use LLM reasoning for the explanation if available
  const explanation = recommendation.llmReasoning
    ? recommendation.llmReasoning
    : `Recommending ${recommendation.name}: ${availableICUBeds} ICU beds available, ` +
      `${recommendation.adjustedETA} min adjusted ETA. ` +
      `Specialty match: ${specialtyMatch ? 'Yes' : 'No'}.`;

  agentSteps.push({
    step: 'Final ranking completed',
    status: 'completed',
    detail: `Top recommendation: ${recommendation.name} (score: ${recommendation.score.toFixed(1)})`,
  });

  return {
    recommendation,
    rankedHospitals: ranked,
    confidence,
    workflow: [
      'Emergency severity analyzed',
      'Hospital availability filtered',
      'Demand prediction calculated',
      'Traffic-adjusted ETA generated',
      'Risk analysis applied',
      'Web context scraped per hospital',
      'LLM clinical scoring applied',
      'Final ranking completed',
    ],
    explanation,
    agenticMode: true,
    agentSteps,
  };
}
