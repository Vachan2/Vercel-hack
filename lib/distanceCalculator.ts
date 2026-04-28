/**
 * Distance and ETA Calculator
 * Calculates realistic distances and ETAs between Bangalore locations
 */

interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Bangalore location coordinates - matches dropdown locations
 */
export const LOCATION_COORDS: Record<string, Coordinates> = {
  'Whitefield': { lat: 12.9698, lng: 77.7499 },
  'Koramangala': { lat: 12.9352, lng: 77.6245 },
  'Jayanagar': { lat: 12.9250, lng: 77.5838 },
  'Hebbal': { lat: 13.0358, lng: 77.5970 },
  'Indiranagar': { lat: 12.9716, lng: 77.6412 },
  'Electronic City': { lat: 12.8456, lng: 77.6603 },
  'Rajajinagar': { lat: 12.9916, lng: 77.5520 },
  'Malleshwaram': { lat: 13.0039, lng: 77.5710 },
  'MG Road': { lat: 12.9716, lng: 77.6040 },
  'Brigade Road': { lat: 12.9716, lng: 77.6070 },
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const R = 6371; // Earth radius in km
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate ETA in minutes based on distance and Bangalore traffic conditions
 * Average speed: 20-25 km/h in traffic, 40 km/h for emergency vehicles
 */
export function calculateETA(
  fromLocation: string,
  toLocation: string,
  isEmergency: boolean = true
): number {
  const from = LOCATION_COORDS[fromLocation];
  const to = LOCATION_COORDS[toLocation];
  
  if (!from || !to) {
    console.warn(`Unknown location: ${fromLocation} or ${toLocation}`);
    return 30; // Default fallback
  }
  
  // Same location - nearby hospital
  if (fromLocation === toLocation) {
    return Math.floor(Math.random() * 5) + 3; // 3-8 minutes
  }
  
  const distance = calculateDistance(from, to);
  
  // Emergency vehicles can go faster
  const avgSpeed = isEmergency ? 35 : 22; // km/h
  
  // Base ETA
  let eta = (distance / avgSpeed) * 60; // Convert to minutes
  
  // Add traffic factor based on distance
  if (distance > 15) {
    eta *= 1.3; // Long distance = more traffic
  } else if (distance > 8) {
    eta *= 1.2; // Medium distance
  } else {
    eta *= 1.1; // Short distance
  }
  
  return Math.round(eta);
}

/**
 * Get distance matrix for all locations (for reference)
 */
export function getDistanceMatrix(): Record<string, Record<string, number>> {
  const locations = Object.keys(LOCATION_COORDS);
  const matrix: Record<string, Record<string, number>> = {};
  
  locations.forEach(from => {
    matrix[from] = {};
    locations.forEach(to => {
      matrix[from][to] = calculateETA(from, to);
    });
  });
  
  return matrix;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Pre-calculated distance matrix for quick reference (in minutes)
 * Based on emergency vehicle speeds with traffic
 */
export const ETA_MATRIX: Record<string, Record<string, number>> = {
  'Hebbal': {
    'Hebbal': 5,
    'Malleshwaram': 8,
    'Rajajinagar': 10,
    'MG Road': 25,
    'Brigade Road': 26,
    'Indiranagar': 22,
    'Whitefield': 35,
    'Koramangala': 28,
    'Jayanagar': 30,
    'Electronic City': 40,
  },
  'Whitefield': {
    'Whitefield': 5,
    'Indiranagar': 15,
    'Koramangala': 20,
    'MG Road': 28,
    'Brigade Road': 29,
    'Jayanagar': 25,
    'Electronic City': 30,
    'Hebbal': 35,
    'Malleshwaram': 38,
    'Rajajinagar': 40,
  },
  'Koramangala': {
    'Koramangala': 5,
    'Jayanagar': 8,
    'Indiranagar': 10,
    'MG Road': 12,
    'Brigade Road': 13,
    'Electronic City': 18,
    'Whitefield': 20,
    'Rajajinagar': 22,
    'Malleshwaram': 24,
    'Hebbal': 28,
  },
  'Indiranagar': {
    'Indiranagar': 5,
    'MG Road': 8,
    'Brigade Road': 9,
    'Koramangala': 10,
    'Whitefield': 15,
    'Jayanagar': 12,
    'Malleshwaram': 18,
    'Rajajinagar': 20,
    'Hebbal': 22,
    'Electronic City': 25,
  },
  'Jayanagar': {
    'Jayanagar': 5,
    'Koramangala': 8,
    'MG Road': 10,
    'Brigade Road': 11,
    'Indiranagar': 12,
    'Electronic City': 15,
    'Rajajinagar': 18,
    'Malleshwaram': 20,
    'Whitefield': 25,
    'Hebbal': 30,
  },
  'Electronic City': {
    'Electronic City': 5,
    'Koramangala': 18,
    'Jayanagar': 15,
    'Indiranagar': 25,
    'MG Road': 22,
    'Brigade Road': 23,
    'Whitefield': 30,
    'Rajajinagar': 32,
    'Malleshwaram': 35,
    'Hebbal': 40,
  },
  'Rajajinagar': {
    'Rajajinagar': 5,
    'Malleshwaram': 6,
    'Hebbal': 10,
    'MG Road': 15,
    'Brigade Road': 16,
    'Indiranagar': 20,
    'Koramangala': 22,
    'Jayanagar': 18,
    'Whitefield': 40,
    'Electronic City': 32,
  },
  'Malleshwaram': {
    'Malleshwaram': 5,
    'Rajajinagar': 6,
    'Hebbal': 8,
    'MG Road': 12,
    'Brigade Road': 13,
    'Indiranagar': 18,
    'Koramangala': 24,
    'Jayanagar': 20,
    'Whitefield': 38,
    'Electronic City': 35,
  },
  'MG Road': {
    'MG Road': 5,
    'Brigade Road': 3,
    'Indiranagar': 8,
    'Koramangala': 12,
    'Jayanagar': 10,
    'Malleshwaram': 12,
    'Rajajinagar': 15,
    'Hebbal': 25,
    'Electronic City': 22,
    'Whitefield': 28,
  },
  'Brigade Road': {
    'Brigade Road': 5,
    'MG Road': 3,
    'Indiranagar': 9,
    'Koramangala': 13,
    'Jayanagar': 11,
    'Malleshwaram': 13,
    'Rajajinagar': 16,
    'Hebbal': 26,
    'Electronic City': 23,
    'Whitefield': 29,
  },
};
