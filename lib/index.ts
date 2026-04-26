/**
 * Extended Intelligence Layer
 * Modular utilities for ICU Bed Allocation System
 */

// Demand Prediction
export {
  predictHospitalLoad,
  type PredictionInput,
  type PredictionOutput,
} from './prediction';

// Traffic Estimation
export {
  estimateTrafficDelay,
  type TrafficInput,
  type TrafficOutput,
} from './trafficEstimator';

// Emergency Surge Simulation
export {
  simulateEmergencyRush,
  type SurgeInput,
  type SurgeOutput,
} from './surgeSimulator';

// Analytics
export {
  generateHospitalInsights,
  calculateHospitalRisk,
  filterAvailableHospitals,
  sortByAvailability,
  type HospitalInsights,
} from './analytics';

// Shared types
export type { Hospital } from './analytics';
