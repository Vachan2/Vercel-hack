/**
 * Analytics Utility
 * Provides insights and metrics for hospital network performance
 */

export interface Hospital {
  id: string;
  name: string;
  icuBeds: number;
  occupancy: number; // 0-100 percentage
  specialization?: string[];
  distance?: number;
}

export interface HospitalInsights {
  averageOccupancy: number;
  highestRiskHospital: {
    id: string;
    name: string;
    occupancy: number;
  } | null;
  availableCapacity: number; // Total available beds across network
  totalBeds: number;
  occupiedBeds: number;
  networkUtilization: number; // Overall percentage
}

/**
 * Generates comprehensive insights about hospital network
 */
export function generateHospitalInsights(hospitals: Hospital[]): HospitalInsights {
  if (hospitals.length === 0) {
    return {
      averageOccupancy: 0,
      highestRiskHospital: null,
      availableCapacity: 0,
      totalBeds: 0,
      occupiedBeds: 0,
      networkUtilization: 0,
    };
  }

  // Calculate total beds and occupancy
  const totalBeds = hospitals.reduce((sum, h) => sum + h.icuBeds, 0);
  const totalOccupied = hospitals.reduce(
    (sum, h) => sum + Math.round((h.occupancy / 100) * h.icuBeds),
    0
  );
  const availableCapacity = totalBeds - totalOccupied;

  // Calculate average occupancy
  const averageOccupancy =
    hospitals.reduce((sum, h) => sum + h.occupancy, 0) / hospitals.length;

  // Find highest risk hospital (highest occupancy)
  const highestRiskHospital = hospitals.reduce((highest, current) => {
    if (!highest || current.occupancy > highest.occupancy) {
      return current;
    }
    return highest;
  }, hospitals[0]);

  // Calculate network utilization
  const networkUtilization = (totalOccupied / totalBeds) * 100;

  return {
    averageOccupancy: Math.round(averageOccupancy * 10) / 10,
    highestRiskHospital: {
      id: highestRiskHospital.id,
      name: highestRiskHospital.name,
      occupancy: highestRiskHospital.occupancy,
    },
    availableCapacity,
    totalBeds,
    occupiedBeds: totalOccupied,
    networkUtilization: Math.round(networkUtilization * 10) / 10,
  };
}

/**
 * Calculate risk score for a hospital (0-100, higher = more risk)
 */
export function calculateHospitalRisk(hospital: Hospital): number {
  const occupancyRisk = hospital.occupancy;
  const capacityRisk = hospital.icuBeds < 10 ? 20 : 0; // Small hospitals are riskier
  
  return Math.min(occupancyRisk + capacityRisk, 100);
}

/**
 * Filter hospitals by availability threshold
 */
export function filterAvailableHospitals(
  hospitals: Hospital[],
  maxOccupancy: number = 90
): Hospital[] {
  return hospitals.filter((h) => h.occupancy < maxOccupancy);
}

/**
 * Sort hospitals by best availability
 */
export function sortByAvailability(hospitals: Hospital[]): Hospital[] {
  return [...hospitals].sort((a, b) => a.occupancy - b.occupancy);
}
