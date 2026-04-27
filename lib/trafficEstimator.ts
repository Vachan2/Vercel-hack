/**
 * Traffic Estimation Utility
 * Estimates traffic delays based on distance, city conditions, and urgency
 */

export interface TrafficInput {
  distance: number; // in kilometers
  cityTrafficMultiplier: number; // 1.0 = normal, 1.5 = heavy, 2.0 = severe
  emergencyUrgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface TrafficOutput {
  adjustedETA: number; // in minutes
  trafficRisk: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Estimates traffic delay and adjusted ETA
 */
export function estimateTrafficDelay(input: TrafficInput): TrafficOutput {
  const { distance, cityTrafficMultiplier, emergencyUrgency } = input;

  // Base speed: 60 km/h for emergency vehicles
  const baseSpeed = 60;

  // Critical emergencies can bypass more traffic
  const urgencyBypassFactor = {
    low: 1.0,
    medium: 0.85,
    high: 0.7,
    critical: 0.5,
  }[emergencyUrgency];

  const effectiveTrafficMultiplier = 1 + (cityTrafficMultiplier - 1) * urgencyBypassFactor;

  const baseETA = (distance / baseSpeed) * 60; // Convert to minutes
  const adjustedETA = Math.round(baseETA * effectiveTrafficMultiplier);

  const delayPercentage = ((adjustedETA - baseETA) / baseETA) * 100;
  let trafficRisk: 'low' | 'medium' | 'high' | 'critical';

  if (delayPercentage < 15) {
    trafficRisk = 'low';
  } else if (delayPercentage < 30) {
    trafficRisk = 'medium';
  } else if (delayPercentage < 50) {
    trafficRisk = 'high';
  } else {
    trafficRisk = 'critical';
  }

  return {
    adjustedETA,
    trafficRisk,
  };
}
