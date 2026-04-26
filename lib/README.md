# Extended Intelligence Layer

Modular utilities for the Autonomous ICU Bed Allocation System.

## Modules

### 1. Demand Prediction (`prediction.ts`)

Predicts hospital load based on current conditions and trends.

```typescript
import { predictHospitalLoad } from './lib/prediction';

const result = predictHospitalLoad({
  currentOccupancy: 75,
  timeOfDay: 20, // 8 PM
  severityTrend: 'high',
  emergencyCount: 3
});

// Returns: { projectedOccupancy: 92.5, demandRisk: 'critical' }
```

### 2. Traffic Estimator (`trafficEstimator.ts`)

Estimates traffic delays based on distance, city conditions, and urgency.

```typescript
import { estimateTrafficDelay } from './lib/trafficEstimator';

const result = estimateTrafficDelay({
  distance: 15, // km
  cityTrafficMultiplier: 1.5, // heavy traffic
  emergencyUrgency: 'critical'
});

// Returns: { adjustedETA: 18, trafficRisk: 'low' }
```

### 3. Surge Simulator (`surgeSimulator.ts`)

Simulates the impact of multiple incoming emergencies on hospital capacity.

```typescript
import { simulateEmergencyRush } from './lib/surgeSimulator';

const result = simulateEmergencyRush({
  incomingEmergencies: 10,
  hospitals: [
    { id: 'h1', name: 'City Hospital', icuBeds: 20, occupancy: 80 },
    { id: 'h2', name: 'Metro Hospital', icuBeds: 30, occupancy: 60 }
  ]
});

// Returns: { overloadedHospitals: ['h1'], riskLevel: 'medium' }
```

### 4. Analytics (`analytics.ts`)

Provides insights and metrics for hospital network performance.

```typescript
import { generateHospitalInsights } from './lib/analytics';

const insights = generateHospitalInsights(hospitals);

// Returns: {
//   averageOccupancy: 70,
//   highestRiskHospital: { id: 'h1', name: 'City Hospital', occupancy: 80 },
//   availableCapacity: 15,
//   totalBeds: 50,
//   occupiedBeds: 35,
//   networkUtilization: 70
// }
```

## Usage in Recommendation API

These utilities are designed to be imported by other team members into the recommendation logic:

```typescript
// In /api/recommend or scoring.ts
import {
  predictHospitalLoad,
  estimateTrafficDelay,
  simulateEmergencyRush,
  generateHospitalInsights
} from '@/lib';

// Use in your ranking algorithm
const prediction = predictHospitalLoad({...});
const traffic = estimateTrafficDelay({...});
const insights = generateHospitalInsights(hospitals);
```

## Key Features

- ✅ Fully typed with TypeScript
- ✅ Modular and reusable
- ✅ No side effects
- ✅ Clean exports via index.ts
- ✅ Does not modify API routes
- ✅ Does not change response schemas
- ✅ Ready for team integration

## Collaboration Notes

- These utilities are **isolated intelligence modules**
- They do NOT connect directly to API routes
- Another team member will import these into recommendation logic
- Do NOT modify `/api/recommend`, hospital dataset, or `scoring.ts`
