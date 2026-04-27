import { Hospital, PatientInput, ScoredHospital } from './types';

/**
 * Computes the composite ICU recommendation score for a single hospital.
 *
 * All sub-scores are normalised to [0, 100] relative to the candidate set
 * (`allCandidates`) so that scoring is fair regardless of which hospitals
 * survived the availability filter.
 */
export function scoreHospital(
  hospital: Hospital,
  patient: PatientInput,
  adjustedETA: number,
  projectedOccupancy: number,
  riskScore: number,
  allCandidates: Hospital[],
): ScoredHospital {
  // --- Derive normalisation denominators from the candidate set ---
  const maxBedsInSet = Math.max(
    ...allCandidates.map((h) => h.icuBeds * (1 - h.occupancy / 100)),
    1, // guard against division-by-zero when the set is empty
  );

  const maxETA = Math.max(...allCandidates.map((h) => h.eta), 1);

  // --- Sub-score 1: ICU Availability ---
  const availableBeds = hospital.icuBeds * (1 - hospital.occupancy / 100);
  const icuAvailabilityScore = Math.min((availableBeds / maxBedsInSet) * 100, 100);

  // --- Sub-score 2: Specialty Match ---
  const emergencyTypeLower = patient.emergencyType.toLowerCase();
  const specialtyMatchScore = hospital.specialties.some(
    (s) => s.toLowerCase() === emergencyTypeLower,
  )
    ? 100
    : 0;

  // --- Sub-score 3: Adjusted ETA (lower is better) ---
  const etaScore = Math.max(0, 100 - (adjustedETA / maxETA) * 100);

  // --- Sub-score 4: Projected Occupancy (lower is better) ---
  // Clamp projectedOccupancy to [0, 100] to handle prediction model overshoot.
  const clampedOccupancy = Math.min(Math.max(projectedOccupancy, 0), 100);
  const occupancyScore = 100 - clampedOccupancy;

  // --- Sub-score 5: Risk (lower risk is better) ---
  const riskScoreInverted = 100 - riskScore;

  // --- Weighted composite score ---
  const rawScore =
    icuAvailabilityScore * 0.25 +
    specialtyMatchScore * 0.25 +
    etaScore * 0.20 +
    occupancyScore * 0.15 +
    riskScoreInverted * 0.15;

  // Clamp to [0, 100]
  const score = Math.min(Math.max(rawScore, 0), 100);

  return {
    ...hospital,
    score,
    adjustedETA,
    projectedOccupancy,
    riskScore,
  };
}

/**
 * Returns a new array of `ScoredHospital` objects sorted by descending `score`.
 * The input array is not mutated.
 */
export function rankHospitals(hospitals: ScoredHospital[]): ScoredHospital[] {
  return [...hospitals].sort((a, b) => b.score - a.score);
}
