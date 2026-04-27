# Implementation Plan: ICU Recommendation Engine

## Overview

Implement the ICU Recommendation Engine as a Next.js App Router backend. The work proceeds in dependency order: shared types first, then the hospital dataset, then the scoring engine, then the orchestration layer, and finally the API route. Each step is self-contained and builds directly on the previous one. All code is TypeScript; property-based tests use fast-check (≥ 100 iterations each).

## Tasks

- [x] 1. Create shared TypeScript interfaces (`lib/types.ts`)
  - Export `Hospital`, `PatientInput`, `ScoredHospital`, and `RecommendationResponse` interfaces exactly as specified in the design.
  - The file must have zero imports from other project modules — only built-in TypeScript utilities are allowed.
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2. Create mock Bangalore hospital dataset (`lib/hospitalData.ts`)
  - [x] 2.1 Implement the hospital array
    - Import `Hospital` from `./types`.
    - Define exactly 8 hospital records using the IDs, names, localities, ICU bed counts, occupancy values, ETAs, specialties, and support levels from the design data model table.
    - Export the array as `hospitals: Hospital[]`.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 2.2 Write unit tests for hospital dataset (`__tests__/hospitalData.test.ts`)
    - Assert the array has ≥ 8 records.
    - Assert every record has all required fields (`id`, `name`, `location`, `icuBeds`, `occupancy`, `eta`, `specialties`, `emergencySupportLevel`).
    - Assert all `occupancy` values are in [0, 100].
    - Assert all `emergencySupportLevel` values are in {1, 2, 3}.
    - Assert the union of all `specialties` arrays covers at minimum: `cardiac`, `trauma`, `neurology`, `burns`, `pediatric`, `general`.
    - _Requirements: 1.1, 1.3, 1.4, 1.6_

- [ ] 3. Implement the scoring engine (`lib/scoring.ts`)
  - [x] 3.1 Implement `scoreHospital`
    - Import `Hospital`, `PatientInput`, `ScoredHospital` from `./types`.
    - Accept `(hospital: Hospital, patient: PatientInput, adjustedETA: number, projectedOccupancy: number, riskScore: number, allCandidates: Hospital[])` — `allCandidates` is used to derive `maxBedsInSet` and `maxETA` for normalisation.
    - Compute the five sub-scores using the normalisation rules from the design:
      - `icuAvailabilityScore = min(availableBeds / maxBedsInSet × 100, 100)`
      - `specialtyMatchScore = 100` if `hospital.specialties` contains `patient.emergencyType` (case-insensitive), else `0`
      - `etaScore = max(0, 100 − (adjustedETA / maxETA × 100))`
      - `occupancyScore = 100 − projectedOccupancy`
      - `riskScore_inverted = 100 − riskScore`
    - Apply weights: `score = icuAvailabilityScore×0.25 + specialtyMatchScore×0.25 + etaScore×0.20 + occupancyScore×0.15 + riskScore_inverted×0.15`
    - Clamp final score to [0, 100].
    - Return a `ScoredHospital` with all original `Hospital` fields plus `score`, `adjustedETA`, `projectedOccupancy`, `riskScore`.
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 7.1_

  - [ ] 3.2 Implement `rankHospitals`
    - Accept `(hospitals: ScoredHospital[]): ScoredHospital[]`.
    - Return a new array sorted by descending `score` (do not mutate the input).
    - _Requirements: 4.8_

  - [ ]* 3.3 Write property test P1 — Score Range Invariant (`__tests__/scoring.test.ts`)
    - **Property 1: scoreHospital output is in [0, 100]**
    - **Validates: Requirements 4.1, 4.2, 4.6**
    - Use `fc.record` to generate arbitrary hospital records, patient inputs, ETAs, occupancy values, and risk scores; assert `score >= 0 && score <= 100` for every generated input.
    - Tag: `// Feature: icu-recommendation-engine, Property 1: scoreHospital output is in [0, 100]`
    - Minimum 100 iterations.

  - [ ]* 3.4 Write property test P2 — Scoring Monotonicity (`__tests__/scoring.test.ts`)
    - **Property 2: Scoring monotonicity (specialty match, ETA, occupancy)**
    - **Validates: Requirements 4.3, 4.4, 4.5**
    - Generate a base hospital and patient; produce three pairs where only one dimension differs (specialty match vs. no match; lower ETA vs. higher ETA; lower occupancy vs. higher occupancy); assert the better-dimension hospital scores ≥ the worse-dimension hospital.
    - Tag: `// Feature: icu-recommendation-engine, Property 2: Scoring monotonicity (specialty match, ETA, occupancy)`
    - Minimum 100 iterations.

  - [ ]* 3.5 Write property test P3 — Ranking Descending Order (`__tests__/scoring.test.ts`)
    - **Property 3: rankHospitals returns descending order**
    - **Validates: Requirements 4.8**
    - Generate an arbitrary non-empty array of `ScoredHospital` objects with random `score` values; call `rankHospitals`; assert every consecutive pair satisfies `arr[i].score >= arr[i+1].score`.
    - Tag: `// Feature: icu-recommendation-engine, Property 3: rankHospitals returns descending order`
    - Minimum 100 iterations.

- [ ] 4. Checkpoint — Ensure all scoring tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement the recommendation engine orchestration (`lib/recommendationEngine.ts`)
  - [x] 5.1 Implement `generateRecommendation`
    - Import `hospitals` from `./hospitalData`.
    - Import `filterAvailableHospitals`, `calculateHospitalRisk` from `./analytics`.
    - Import `predictHospitalLoad` from `./prediction`.
    - Import `estimateTrafficDelay` from `./trafficEstimator`.
    - Import `scoreHospital`, `rankHospitals` from `./scoring`.
    - Import `PatientInput`, `RecommendationResponse`, `ScoredHospital` from `./types`.
    - Step 1 — Filter: `const candidates = filterAvailableHospitals(hospitals, 90)`.
    - Throw `new Error("No available ICU beds found in the hospital network")` if `candidates.length < 1`.
    - Step 2 — Predict demand: for each candidate call `predictHospitalLoad({ currentOccupancy: h.occupancy, timeOfDay: new Date().getUTCHours(), severityTrend: input.severity, emergencyCount: 1 })`.
    - Step 3 — Compute ETAs: for each candidate call `estimateTrafficDelay({ distance: hospital.eta, cityTrafficMultiplier: 1.3, emergencyUrgency: input.severity })` and extract `adjustedETA`.
    - Step 4 — Compute risk: for each candidate call `calculateHospitalRisk(hospital)`.
    - Step 5 — Score: call `scoreHospital` for each enriched candidate, passing `candidates` as `allCandidates`.
    - Step 6 — Rank: call `rankHospitals(scoredCandidates)`.
    - Compute `confidence`: if only one hospital, `confidence = 100`; otherwise `confidence = min(100, (topScore − secondScore) / topScore × 100 × 2.5)`.
    - Build `explanation` as a human-readable string referencing `recommendation.name`, available ICU beds, `adjustedETA`, and specialty match status.
    - Return `{ recommendation: ranked[0], rankedHospitals: ranked, confidence, workflow: [...fixed 6-step array...], explanation }`.
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 7.2, 7.5_

  - [ ]* 5.2 Write unit tests for recommendation engine (`__tests__/recommendationEngine.test.ts`)
    - Test that the engine throws `"No available ICU beds found in the hospital network"` when all hospitals are filtered out (mock `filterAvailableHospitals` to return `[]`).
    - Test that `filterAvailableHospitals` is called with `maxOccupancy = 90` (spy/mock).
    - Test that `estimateTrafficDelay` is called with `cityTrafficMultiplier = 1.3` for each candidate (spy/mock).
    - Test that `predictHospitalLoad` is called with `emergencyCount = 1` for each candidate (spy/mock).
    - _Requirements: 5.3, 5.4, 5.5, 5.11_

  - [ ]* 5.3 Write property test P4 — Recommendation Equals Top-Ranked Hospital (`__tests__/recommendationEngine.test.ts`)
    - **Property 4: recommendation === rankedHospitals[0]**
    - **Validates: Requirements 5.7**
    - Generate valid `PatientInput` objects; call `generateRecommendation`; assert `result.recommendation === result.rankedHospitals[0]` (deep equality).
    - Tag: `// Feature: icu-recommendation-engine, Property 4: recommendation === rankedHospitals[0]`
    - Minimum 100 iterations.

  - [ ]* 5.4 Write property test P5 — Confidence Range Invariant (`__tests__/recommendationEngine.test.ts`)
    - **Property 5: confidence in [0, 100]**
    - **Validates: Requirements 5.9, 6.3**
    - Generate valid `PatientInput` objects; call `generateRecommendation`; assert `result.confidence >= 0 && result.confidence <= 100`.
    - Tag: `// Feature: icu-recommendation-engine, Property 5: confidence in [0, 100]`
    - Minimum 100 iterations.

  - [ ]* 5.5 Write property test P6 — Explanation References Top Hospital (`__tests__/recommendationEngine.test.ts`)
    - **Property 6: explanation contains top hospital name**
    - **Validates: Requirements 5.10**
    - Generate valid `PatientInput` objects; call `generateRecommendation`; assert `result.explanation.includes(result.recommendation.name)`.
    - Tag: `// Feature: icu-recommendation-engine, Property 6: explanation contains top hospital name`
    - Minimum 100 iterations.

- [ ] 6. Checkpoint — Ensure all recommendation engine tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement the API route (`app/api/recommend/route.ts`)
  - [x] 7.1 Implement the POST handler
    - Use Next.js App Router conventions: export an async `POST(request: Request)` function.
    - Parse the body with `request.json()`.
    - Validate that `age`, `severity`, `emergencyType`, `location`, and `symptoms` are all present and non-null; return `NextResponse.json({ error: "Missing required fields: age, severity, emergencyType, location, symptoms" }, { status: 400 })` on failure.
    - Call `generateRecommendation(input)` inside a try/catch.
    - On success return `NextResponse.json(result, { status: 200 })`.
    - On any caught exception return `NextResponse.json({ error: e.message }, { status: 500 })`.
    - Do not include any scoring or filtering logic inline.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 7.2 Write unit tests for the API route (`__tests__/route.test.ts`)
    - Test HTTP 500 is returned when `generateRecommendation` throws an unhandled exception.
    - Test that the `Content-Type` response header is `application/json`.
    - _Requirements: 3.4, 3.6_

  - [ ]* 7.3 Write property test P7 — Valid Input Yields Well-Formed Response (`__tests__/route.test.ts`)
    - **Property 7: valid input → HTTP 200 + well-formed response shape**
    - **Validates: Requirements 3.2, 6.1, 6.4**
    - Generate valid `PatientInput` objects; POST to the route handler; assert status 200 and that the response body has exactly the keys `recommendation`, `rankedHospitals`, `confidence`, `workflow`, `explanation`, with `rankedHospitals` being a non-empty array in descending score order.
    - Tag: `// Feature: icu-recommendation-engine, Property 7: valid input → HTTP 200 + well-formed response shape`
    - Minimum 100 iterations.

  - [ ]* 7.4 Write property test P8 — Missing Fields Yield HTTP 400 (`__tests__/route.test.ts`)
    - **Property 8: missing required fields → HTTP 400**
    - **Validates: Requirements 3.3**
    - Generate `PatientInput` objects with one or more required fields removed or set to `null`/`undefined`; POST to the route handler; assert status 400 and that the response body contains an `error` string.
    - Tag: `// Feature: icu-recommendation-engine, Property 8: missing required fields → HTTP 400`
    - Minimum 100 iterations.

  - [ ]* 7.5 Write property test P9 — Workflow Array Is Always Fixed (`__tests__/route.test.ts`)
    - **Property 9: workflow array is always the fixed 6-step array**
    - **Validates: Requirements 3.7, 6.5**
    - Generate valid `PatientInput` objects; POST to the route handler; assert `workflow` deep-equals `["Emergency severity analyzed", "Hospital availability filtered", "Demand prediction calculated", "Traffic-adjusted ETA generated", "Risk analysis applied", "Final ranking completed"]`.
    - Tag: `// Feature: icu-recommendation-engine, Property 9: workflow array is always the fixed 6-step array`
    - Minimum 100 iterations.

- [ ] 8. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- Checkpoints ensure incremental validation after each major layer.
- Property tests validate universal correctness invariants; unit tests cover specific scenarios and error conditions.
- Do not modify `prediction.ts`, `trafficEstimator.ts`, `surgeSimulator.ts`, or `analytics.ts`.
- The `allCandidates` parameter passed to `scoreHospital` must be the filtered candidate array (not the full dataset) so that `maxBedsInSet` and `maxETA` are relative to the current working set.
- `distance` passed to `estimateTrafficDelay` equals `hospital.eta` (km), because the base speed is 60 km/h and `eta` is in minutes, so `(eta_min / 60) * 60 km/h = eta km`.
