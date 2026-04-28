/**
 * Emergency Surge Simulator
 * Simulates the impact of multiple incoming emergencies on hospital capacity
 */

export interface Hospital {
  id: string;
  name: string;
  icuBeds: number;
  occupancy: number; // 0-100 percentage
  specialization?: string[];
}

export interface SurgeInput {
  incomingEmergencies: number;
  hospitals: Hospital[];
}

export interface SurgeOutput {
  overloadedHospitals: string[]; // Hospital IDs
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Simulates emergency rush impact on hospital network
 */
export function simulateEmergencyRush(input: SurgeInput): SurgeOutput {
  const { incomingEmergencies, hospitals } = input;

  const bedsNeeded = incomingEmergencies;
  const totalCapacity = hospitals.reduce((sum, h) => sum + h.icuBeds, 0);
  const totalOccupied = hospitals.reduce(
    (sum, h) => sum + Math.round((h.occupancy / 100) * h.icuBeds),
    0
  );
  const totalAvailable = totalCapacity - totalOccupied;

  const overloadedHospitals: string[] = [];

  hospitals.forEach((hospital) => {
    const currentOccupiedBeds = Math.round((hospital.occupancy / 100) * hospital.icuBeds);
    const hospitalShare = hospital.icuBeds / totalCapacity;
    const expectedIncoming = Math.ceil(bedsNeeded * hospitalShare);
    const projectedOccupancy =
      ((currentOccupiedBeds + expectedIncoming) / hospital.icuBeds) * 100;

    if (projectedOccupancy >= 95) {
      overloadedHospitals.push(hospital.id);
    }
  });

  const capacityRatio = bedsNeeded / totalAvailable;
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';

  if (capacityRatio < 0.5) {
    riskLevel = 'low';
  } else if (capacityRatio < 0.75) {
    riskLevel = 'medium';
  } else if (capacityRatio < 1.0) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }

  return {
    overloadedHospitals,
    riskLevel,
  };
}
