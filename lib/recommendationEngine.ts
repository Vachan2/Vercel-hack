import { hospitals } from './hospitalData';
import { filterAvailableHospitals, calculateHospitalRisk, Hospital as AnalyticsHospital } from './analytics';
import { predictHospitalLoad } from './prediction';
import { estimateTrafficDelay } from './trafficEstimator';
import { scoreHospital, rankHospitals } from './scoring';
import { Hospital, PatientInput, RecommendationResponse, ScoredHospital } from './types';
import { ETA_MATRIX } from './distanceCalculator';

export function generateRecommendation(input: PatientInput): RecommendationResponse {
  // Step 1 — Filter available hospitals (max 90% occupancy)
  let candidates = filterAvailableHospitals(hospitals as AnalyticsHospital[], 90) as Hospital[];
  if (candidates.length < 1) {
    throw new Error("No available ICU beds found in the hospital network");
  }

  // Step 1.5 — Prioritize same-location hospitals, but include others
  const sameLocationHospitals = candidates.filter(h => h.location === input.location);
  const otherLocationHospitals = candidates.filter(h => h.location !== input.location);
  
  // If we have hospitals in the same location, prioritize them but keep others as backup
  if (sameLocationHospitals.length > 0) {
    candidates = [...sameLocationHospitals, ...otherLocationHospitals];
  }

  // Steps 2–5: Enrich each candidate and score it
  const scoredCandidates: ScoredHospital[] = candidates.map((hospital) => {
    // Step 2 — Calculate realistic ETA based on patient location
    const patientLocation = input.location;
    const hospitalLocation = hospital.location;
    
    // Get ETA from pre-calculated matrix
    const baseETA = ETA_MATRIX[patientLocation]?.[hospitalLocation] || 30;
    
    // Step 3 — Predict demand
    const { projectedOccupancy } = predictHospitalLoad({
      currentOccupancy: hospital.occupancy,
      timeOfDay: new Date().getUTCHours(),
      severityTrend: input.severity,
      emergencyCount: 1,
    });

    // Step 4 — Compute adjusted ETA with traffic
    const { adjustedETA } = estimateTrafficDelay({
      distance: baseETA / 2, // Rough conversion: ETA in min to distance in km
      cityTrafficMultiplier: 1.3,
      emergencyUrgency: input.severity,
    });

    // Step 5 — Compute risk score
    const riskScore = calculateHospitalRisk(hospital as AnalyticsHospital);

    // Step 6 — Score the hospital
    return scoreHospital(hospital, input, adjustedETA, projectedOccupancy, riskScore, candidates);
  });

  // Step 7 — Rank hospitals by descending score
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
