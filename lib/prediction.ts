/**
 * Demand Prediction Utility
 * Predicts hospital load based on current conditions and trends
 */

export interface PredictionInput {
  currentOccupancy: number; // 0-100 percentage
  timeOfDay: number; // 0-23 hours
  severityTrend: 'low' | 'medium' | 'high' | 'critical';
  emergencyCount: number;
}

export interface PredictionOutput {
  projectedOccupancy: number;
  demandRisk: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Predicts hospital load based on multiple factors
 */
export function predictHospitalLoad(input: PredictionInput): PredictionOutput {
  const { currentOccupancy, timeOfDay, severityTrend, emergencyCount } = input;

  // Time-based multiplier (peak hours: 8-12, 18-22)
  const isPeakHour = (timeOfDay >= 8 && timeOfDay <= 12) || (timeOfDay >= 18 && timeOfDay <= 22);
  const timeMultiplier = isPeakHour ? 1.15 : 1.0;

  // Severity impact
  const severityImpact = {
    low: 1.05,
    medium: 1.1,
    high: 1.2,
    critical: 1.3,
  }[severityTrend];

  // Emergency count impact (each emergency adds ~3% load)
  const emergencyImpact = emergencyCount * 3;

  let projectedOccupancy = currentOccupancy * timeMultiplier * severityImpact + emergencyImpact;
  projectedOccupancy = Math.min(projectedOccupancy, 100);

  let demandRisk: 'low' | 'medium' | 'high' | 'critical';
  if (projectedOccupancy < 60) {
    demandRisk = 'low';
  } else if (projectedOccupancy < 75) {
    demandRisk = 'medium';
  } else if (projectedOccupancy < 90) {
    demandRisk = 'high';
  } else {
    demandRisk = 'critical';
  }

  return {
    projectedOccupancy: Math.round(projectedOccupancy * 10) / 10,
    demandRisk,
  };
}
