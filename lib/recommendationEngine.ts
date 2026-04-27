import { hospitals } from './hospitalData';
import { filterAvailableHospitals, calculateHospitalRisk, Hospital as AnalyticsHospital } from './analytics';
import { predictHospitalLoad } from './prediction';
import { estimateTrafficDelay } from './trafficEstimator';
import { scoreHospital, rankHospitals } from './scoring';
import { Hospital, PatientInput, RecommendationResponse, ScoredHospital } from './types';

export function generateRecommendation(input: PatientInput): RecommendationResponse {
  // Step 1 — Filter available hospitals (max 90% occupancy)
  const candidates = filterAvailableHospitals(hospitals as AnalyticsHospital[], 90) as Hospital[];
  if (candidates.length < 1) {
    throw new Error("No available ICU beds found in the hospital network");
  }

  // Steps 2–5: Enrich each candidate and score it
  const scoredCandidates: ScoredHospital[] = candidates.map((hospital) => {
    // Step 2 — Predict demand
    const { projectedOccupancy } = predictHospitalLoad({
      currentOccupancy: hospital.occupancy,
      timeOfDay: new Date().getUTCHours(),
      severityTrend: input.severity,
      emergencyCount: 1,
    });

    // Step 3 — Compute adjusted ETA
    const { adjustedETA } = estimateTrafficDelay({
      distance: hospital.eta, // hospital.eta km (base speed 60 km/h → eta_min = eta_km)
      cityTrafficMultiplier: 1.3,
      emergencyUrgency: input.severity,
    });

    // Step 4 — Compute risk score
    const riskScore = calculateHospitalRisk(hospital as AnalyticsHospital);

    // Step 5 — Score the hospital
    return scoreHospital(hospital, input, adjustedETA, projectedOccupancy, riskScore, candidates);
  });

  // Step 6 — Rank hospitals by descending score
  const ranked = rankHospitals(scoredCandidates);

  // Confidence computation
  const confidence =
    ranked.length === 1
      ? 100
      : Math.min(
          100,
          ((ranked[0].score - ranked[1].score) / ranked[0].score) * 100 * 2.5,
        );

  // Build human-readable explanation
  const recommendation = ranked[0];
  const availableICUBeds = Math.round(
    recommendation.icuBeds * (1 - recommendation.occupancy / 100),
  );
  const specialtyMatch = recommendation.specialties.some(
    (s) => s.toLowerCase() === input.emergencyType.toLowerCase(),
  );

  const explanation =
    `Recommending ${recommendation.name}: ${availableICUBeds} ICU beds available, ` +
    `${recommendation.adjustedETA} min adjusted ETA. ` +
    `Specialty match: ${specialtyMatch ? 'Yes' : 'No'}.`;

  return {
    recommendation,
    rankedHospitals: ranked,
    confidence,
    workflow: [
      "Emergency severity analyzed",
      "Hospital availability filtered",
      "Demand prediction calculated",
      "Traffic-adjusted ETA generated",
      "Risk analysis applied",
      "Final ranking completed",
    ],
    explanation,
  };
}
