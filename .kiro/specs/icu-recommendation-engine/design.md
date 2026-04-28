# Design Document: ICU Recommendation Engine

## Overview

The ICU Recommendation Engine is a Next.js App Router backend that autonomously recommends the most suitable ICU placement for an incoming emergency patient. Given a `PatientInput` payload, the system filters available hospitals, enriches each candidate with demand predictions, traffic-adjusted ETAs, and risk scores, then ranks them using a weighted composite scoring formula. The top-ranked hospital, the full ranked list, a confidence score, a fixed workflow log, and a human-readable explanation are returned as a single `RecommendationResponse`.

The design is intentionally modular: four pre-built utility modules (`prediction.ts`, `trafficEstimator.ts`, `analytics.ts`, `surgeSimulator.ts`) handle all domain intelligence. New files (`types.ts`, `hospitalData.ts`, `scoring.ts`, `recommendationEngine.ts`, and the API route) wire those utilities together without duplicating logic.

### Key Design Goals

- **Single source of truth for types** — `types.ts` is dependency-free and consumed by every other module.
- **Deterministic scoring** — given the same inputs, `scoring.ts` always produces the same ranked output.
- **Thin API route** — the route handler validates input, delegates to `recommendationEngine.ts`, and serialises the response. No business logic lives in the route.
- **Module isolation** — each module receives all data through function parameters; no module reaches into another module's internals.

---

## Architecture

```mermaid
flowchart TD
    Client["Client (POST /api/recommend)"]
    Route["app/api/recommend/route.ts\n(Input validation, HTTP handling)"]
    Engine["lib/recommendationEngine.ts\n(Orchestration)"]
    Scoring["lib/scoring.ts\n(Composite scoring & ranking)"]
    HospitalData["lib/hospitalData.ts\n(Mock Bangalore dataset)"]
    Types["lib/types.ts\n(Shared interfaces)"]

    Analytics["lib/analytics.ts\n(calculateHospitalRisk,\nfilterAvailableHospitals)"]
    Prediction["lib/prediction.ts\n(predictHospitalLoad)"]
    Traffic["lib/trafficEstimator.ts\n(estimateTrafficDelay)"]
    Surge["lib/surgeSimulator.ts\n(simulateEmergencyRush)"]

    Client -->|PatientInput JSON| Route
    Route -->|PatientInput| Engine
    Engine -->|hospitals array| Analytics
    Engine -->|per-hospital| Prediction
    Engine -->|per-hospital| Traffic
    Engine -->|per-hospital| Analytics
    Engine -->|scored hospitals| Scoring
    Engine -->|RecommendationResponse| Route
    Route -->|JSON 200| Client

    HospitalData -->|Hospital[]| Engine
    Types -.->|interfaces| Route
    Types -.->|interfaces| Engine
    Types -.->|interfaces| Scoring
    Types -.->|interfaces| HospitalData
```

### Request Lifecycle

1. `POST /api/recommend` receives a JSON body.
2. The route validates required fields; returns HTTP 400 on missing fields.
3. The route calls `generateRecommendation(input)` from `recommendationEngine.ts`.
4. The engine filters hospitals (`filterAvailableHospitals`, max 90% occupancy).
5. For each candidate the engine calls `predictHospitalLoad`, `estimateTrafficDelay`, and `calculateHospitalRisk`.
6. The engine calls `rankHospitals` from `scoring.ts` with the enriched candidates.
7. The engine assembles and returns a `RecommendationResponse`.
8. The route serialises the response as JSON with `Content-Type: application/json`.

---

## Components and Interfaces

### `lib/types.ts`

Dependency-free contract file. Exports four interfaces consumed by all other modules.

```typescript
export interface Hospital {
  id: string;
  name: string;
  location: string;
  icuBeds: number;
  occupancy: number;       // 0–100 percentage
  eta: number;             // base ETA in minutes from a central reference point
  specialties: string[];
  emergencySupportLevel: number; // 1 | 2 | 3
}

export interface PatientInput {
  age: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  emergencyType: string;
  location: string;
  symptoms: string[];
}

export interface ScoredHospital extends Hospital {
  score: number;
  adjustedETA: number;
  projectedOccupancy: number;
  riskScore: number;
}

export interface RecommendationResponse {
  recommendation: ScoredHospital;
  rankedHospitals: ScoredHospital[];
  confidence: number;   // 0–100
  workflow: string[];
  explanation: string;
}
```

### `lib/hospitalData.ts`

Exports a typed `Hospital[]` array. No imports from other project modules (only from `types.ts`).

### `lib/scoring.ts`

Exports two pure functions:

| Function | Signature | Description |
|---|---|---|
| `scoreHospital` | `(hospital: Hospital, patient: PatientInput, adjustedETA: number, projectedOccupancy: number, riskScore: number) => ScoredHospital` | Computes the enhanced composite score for one hospital |
| `rankHospitals` | `(hospitals: ScoredHospital[]) => ScoredHospital[]` | Returns a new array sorted by descending `score` |

`scoreHospital` receives all enrichment data as parameters — it never imports `hospitalData.ts` or the API route.

### `lib/recommendationEngine.ts`

Exports one function:

```typescript
export function generateRecommendation(input: PatientInput): RecommendationResponse
```

Orchestration steps (in order):
1. Import `hospitals` from `hospitalData.ts`.
2. `filterAvailableHospitals(hospitals, 90)` → `candidates`.
3. Throw `"No available ICU beds found in the hospital network"` if `candidates.length < 1`.
4. For each candidate: call `predictHospitalLoad`, `estimateTrafficDelay`, `calculateHospitalRisk`.
5. Call `scoreHospital` for each enriched candidate.
6. Call `rankHospitals` to sort.
7. Compute `confidence` and `explanation`.
8. Return `RecommendationResponse`.

### `app/api/recommend/route.ts`

Next.js App Router route handler. Responsibilities:
- Parse request body with `request.json()`.
- Validate presence of `age`, `severity`, `emergencyType`, `location`, `symptoms`.
- Call `generateRecommendation`.
- Return `NextResponse.json(result, { status: 200 })`.
- Return HTTP 400 on validation failure; HTTP 500 on unhandled exception.
- Always set `Content-Type: application/json` (handled automatically by `NextResponse.json`).

---

## Data Models

### Hospital Dataset — Bangalore Localities

Eight hospitals spread across distinct Bangalore localities. ETAs are expressed in minutes from a central reference point (MG Road / Brigade Road area) under typical city traffic.

| ID | Name | Locality | ICU Beds | Occupancy | Base ETA (min) | Specialties | Support Level |
|---|---|---|---|---|---|---|---|
| `hosp-001` | Manipal Hospital Whitefield | Whitefield | 32 | 72% | 42 | cardiac, neurology, general | 3 |
| `hosp-002` | Fortis Hospital Bannerghatta | Koramangala | 28 | 65% | 18 | cardiac, trauma, general | 3 |
| `hosp-003` | Apollo Hospital Jayanagar | Jayanagar | 24 | 58% | 22 | cardiac, pediatric, general | 3 |
| `hosp-004` | Aster CMI Hospital Hebbal | Hebbal | 36 | 78% | 28 | trauma, neurology, burns | 3 |
| `hosp-005` | Manipal Hospital Indiranagar | Indiranagar | 20 | 55% | 15 | general, pediatric, cardiac | 2 |
| `hosp-006` | Narayana Health City Electronic City | Electronic City | 40 | 82% | 38 | cardiac, trauma, burns | 3 |
| `hosp-007` | Columbia Asia Rajajinagar | Rajajinagar | 16 | 48% | 25 | general, neurology, pediatric | 2 |
| `hosp-008` | Mallya Hospital Malleshwaram | Malleshwaram | 12 | 62% | 20 | burns, general, trauma | 2 |

**ETA rationale**: Whitefield is ~35–45 min from central Bangalore in traffic (mapped to 42 min). Indiranagar and Koramangala are closer (15–18 min). Electronic City is ~35–40 min south (38 min). All values reflect realistic Bangalore road distances.

### Scoring Formula

The enhanced composite score is computed from five normalised sub-scores (each 0–100), then weighted:

```
score = (icuAvailabilityScore × 0.25)
      + (specialtyMatchScore  × 0.25)
      + (etaScore             × 0.20)
      + (occupancyScore       × 0.15)
      + (riskScore_inverted   × 0.15)
```

#### Sub-score Normalisation

| Component | Raw value | Normalisation |
|---|---|---|
| **ICU Availability** | `availableBeds = icuBeds × (1 − occupancy/100)` | `min(availableBeds / maxBedsInDataset × 100, 100)` |
| **Specialty Match** | Boolean: hospital specialties contain `emergencyType` | `100` if match, `0` if no match |
| **Adjusted ETA** | `adjustedETA` (minutes, from `estimateTrafficDelay`) | `max(0, 100 − (adjustedETA / maxETA × 100))` — lower ETA → higher score |
| **Projected Occupancy** | `projectedOccupancy` (0–100, from `predictHospitalLoad`) | `100 − projectedOccupancy` — lower occupancy → higher score |
| **Risk Score** | `riskScore` (0–100, from `calculateHospitalRisk`) | `100 − riskScore` — lower risk → higher score |

`maxBedsInDataset` and `maxETA` are computed from the candidate array passed to `scoreHospital` to ensure normalisation is relative to the current filtered set.

### Confidence Score

```
confidence = min(100, (topScore − secondScore) / topScore × 100 × scalingFactor)
```

Where `scalingFactor = 2.5` to spread the confidence across the 0–100 range meaningfully. If only one hospital is available, `confidence = 100`.

### Severity → Utility Mappings

| Patient `severity` | `severityTrend` (Prediction) | `emergencyUrgency` (Traffic) |
|---|---|---|
| `low` | `'low'` | `'low'` |
| `medium` | `'medium'` | `'medium'` |
| `high` | `'high'` | `'high'` |
| `critical` | `'critical'` | `'critical'` |

### `timeOfDay` Derivation

```typescript
const timeOfDay = new Date().getUTCHours(); // 0–23
```

### `distance` Derivation for Traffic Estimator

The `eta` field in the `Hospital` record represents a base ETA in minutes at 60 km/h. To recover the distance in km:

```typescript
const distance = (hospital.eta / 60) * 60; // eta_minutes / 60 * baseSpeed_kmh = km
```

This is equivalent to `hospital.eta` km (since base speed is 60 km/h), which is passed as `distance` to `estimateTrafficDelay`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Score Range Invariant

*For any* hospital record, patient input, adjusted ETA, projected occupancy, and risk score, the composite score produced by `scoreHospital` SHALL be in the range [0, 100] inclusive.

**Validates: Requirements 4.1, 4.2, 4.6**

---

### Property 2: Scoring Monotonicity

*For any* two otherwise identical hospital records differing on a single dimension, the hospital with the better value on that dimension SHALL receive a higher or equal composite score:
- A hospital whose `specialties` contains the patient's `emergencyType` SHALL score ≥ the same hospital without that specialty.
- A hospital with a lower `adjustedETA` SHALL score ≥ the same hospital with a higher `adjustedETA`.
- A hospital with a lower `projectedOccupancy` SHALL score ≥ the same hospital with a higher `projectedOccupancy`.

**Validates: Requirements 4.3, 4.4, 4.5**

---

### Property 3: Ranking Produces Descending Order

*For any* non-empty array of `ScoredHospital` objects, `rankHospitals` SHALL return a new array where every element's `score` is greater than or equal to the score of the element that follows it.

**Validates: Requirements 4.8**

---

### Property 4: Recommendation Equals Top-Ranked Hospital

*For any* valid `PatientInput`, the `recommendation` field in the `RecommendationResponse` returned by `generateRecommendation` SHALL be identical to `rankedHospitals[0]`.

**Validates: Requirements 5.7**

---

### Property 5: Confidence Range Invariant

*For any* valid `PatientInput`, the `confidence` value in the `RecommendationResponse` SHALL be a number in the range [0, 100] inclusive.

**Validates: Requirements 5.9, 6.3**

---

### Property 6: Explanation References Top Hospital

*For any* valid `PatientInput`, the `explanation` string in the `RecommendationResponse` SHALL contain the `name` of the top-ranked hospital (`recommendation.name`).

**Validates: Requirements 5.10**

---

### Property 7: Valid Input Yields Well-Formed Response

*For any* valid `PatientInput` (all required fields present with valid values), the API route SHALL return HTTP 200 and a response body whose top-level keys are exactly `recommendation`, `rankedHospitals`, `confidence`, `workflow`, and `explanation`, with `rankedHospitals` being a non-empty array sorted in descending score order.

**Validates: Requirements 3.2, 6.1, 6.4**

---

### Property 8: Missing Fields Yield HTTP 400

*For any* `PatientInput` with one or more required fields (`age`, `severity`, `emergencyType`, `location`, `symptoms`) removed or set to `null`/`undefined`, the API route SHALL return HTTP 400 with a JSON body containing an `error` string.

**Validates: Requirements 3.3**

---

### Property 9: Workflow Array Is Always Fixed

*For any* valid `PatientInput` that produces a successful response, the `workflow` array SHALL contain exactly the six strings in the fixed order:
1. `"Emergency severity analyzed"`
2. `"Hospital availability filtered"`
3. `"Demand prediction calculated"`
4. `"Traffic-adjusted ETA generated"`
5. `"Risk analysis applied"`
6. `"Final ranking completed"`

**Validates: Requirements 3.7, 6.5**

---

## Error Handling

### Input Validation (API Route)

The route handler validates the request body before calling the engine. Missing or null values for any of the five required fields (`age`, `severity`, `emergencyType`, `location`, `symptoms`) result in an immediate HTTP 400 response:

```json
{ "error": "Missing required fields: age, severity, emergencyType, location, symptoms" }
```

### No Available Hospitals (Recommendation Engine)

If `filterAvailableHospitals` returns an empty array (all hospitals at ≥ 90% occupancy), the engine throws:

```
Error: "No available ICU beds found in the hospital network"
```

The API route catches this and returns HTTP 500 with:

```json
{ "error": "No available ICU beds found in the hospital network" }
```

### Unhandled Exceptions (API Route)

Any other exception thrown during `generateRecommendation` is caught by the route's top-level try/catch and returned as HTTP 500:

```json
{ "error": "<exception message>" }
```

### Scoring Edge Cases

- If the candidate array has only one hospital, `rankHospitals` returns a single-element array and `confidence` is set to `100`.
- If `adjustedETA` is 0 (hospital co-located), the ETA sub-score is capped at 100.
- If `projectedOccupancy` exceeds 100 (due to prediction model), it is clamped to 100 before normalisation.

---

## Testing Strategy

### Dual Testing Approach

Both unit/example-based tests and property-based tests are used. Unit tests cover specific scenarios, integration points, and error conditions. Property tests verify universal invariants across a wide input space.

### Property-Based Testing Library

**[fast-check](https://github.com/dubzzz/fast-check)** — TypeScript-native, well-maintained, integrates with Jest/Vitest.

Each property test runs a minimum of **100 iterations**.

Tag format for each property test:
```
// Feature: icu-recommendation-engine, Property <N>: <property_text>
```

### Property Tests

| Property | Module Under Test | Arbitraries |
|---|---|---|
| P1: Score Range Invariant | `scoring.ts` | `fc.record({ icuBeds: fc.integer(8,40), occupancy: fc.float(0,100), ... })` |
| P2: Scoring Monotonicity | `scoring.ts` | Pairs of hospitals differing on one dimension |
| P3: Ranking Descending Order | `scoring.ts` | `fc.array(fc.record({ score: fc.float(0,100), ... }))` |
| P4: Recommendation = Top Ranked | `recommendationEngine.ts` | `fc.record` for PatientInput with mocked utilities |
| P5: Confidence Range | `recommendationEngine.ts` | `fc.record` for PatientInput with mocked utilities |
| P6: Explanation Contains Name | `recommendationEngine.ts` | `fc.record` for PatientInput with mocked utilities |
| P7: Valid Input → 200 + Shape | `route.ts` | `fc.record` for valid PatientInput |
| P8: Missing Fields → 400 | `route.ts` | Subsets of required fields |
| P9: Workflow Fixed Array | `route.ts` | `fc.record` for valid PatientInput |

### Unit / Example Tests

| Scenario | Module | Type |
|---|---|---|
| Dataset has ≥ 8 records with all required fields | `hospitalData.ts` | Example |
| All occupancy values in [0, 100] | `hospitalData.ts` | Example |
| All emergencySupportLevel values in {1, 2, 3} | `hospitalData.ts` | Example |
| All required specialties present across dataset | `hospitalData.ts` | Example |
| HTTP 500 on unhandled engine exception | `route.ts` | Example |
| Content-Type header is application/json | `route.ts` | Example |
| Engine throws correct message when no hospitals available | `recommendationEngine.ts` | Example |
| filterAvailableHospitals called with maxOccupancy=90 | `recommendationEngine.ts` | Example (mock) |
| estimateTrafficDelay called with cityTrafficMultiplier=1.3 | `recommendationEngine.ts` | Example (mock) |
| predictHospitalLoad called with emergencyCount=1 | `recommendationEngine.ts` | Example (mock) |

### Integration Tests

No external services are involved. The pre-built utility modules are pure functions and can be called directly in tests without mocking. An end-to-end integration test calls the route handler with a real `PatientInput` and asserts the full `RecommendationResponse` shape and content.

### Test File Structure

```
__tests__/
  types.test.ts           — compile-time shape checks
  hospitalData.test.ts    — dataset invariants
  scoring.test.ts         — unit + property tests for scoring engine
  recommendationEngine.test.ts — unit + property tests for orchestration
  route.test.ts           — unit + property tests for API route
```
