# Requirements Document

## Introduction

This document defines the requirements for the core backend of an Autonomous ICU Bed Allocation System built on Next.js App Router API routes. The system receives emergency patient intake data and autonomously recommends the most suitable ICU placement by orchestrating hospital availability data, demand prediction, traffic-adjusted ETAs, and risk analytics. The backend is designed for multi-contributor collaboration: shared TypeScript interfaces are exported from a central types module, the API response contract is fixed, and all intelligence is delegated to pre-built utility modules.

## Glossary

- **Recommendation_Engine**: The orchestration layer (`/lib/recommendationEngine.ts`) that coordinates all modules to produce a ranked hospital recommendation.
- **Scoring_Engine**: The module (`/lib/scoring.ts`) that computes a composite score for each hospital candidate.
- **API_Route**: The Next.js App Router POST endpoint at `/app/api/recommend/route.ts`.
- **Hospital_Dataset**: The mock dataset defined in `/lib/hospitalData.ts` representing available ICU facilities.
- **Prediction_Module**: The pre-built utility `prediction.ts` that projects future hospital occupancy.
- **Traffic_Estimator**: The pre-built utility `trafficEstimator.ts` that computes traffic-adjusted ETAs.
- **Analytics_Module**: The pre-built utility `analytics.ts` that calculates hospital risk scores and filters available hospitals.
- **Surge_Simulator**: The pre-built utility `surgeSimulator.ts` that models the impact of simultaneous emergency arrivals.
- **Types_Module**: The shared interface file `/lib/types.ts` consumed by all contributors.
- **Patient_Input**: The JSON body submitted to the API containing `{ age, severity, emergencyType, location, symptoms }`.
- **Recommendation_Response**: The fixed JSON response contract returned by the API.
- **Confidence_Score**: A numeric value (0–100) representing the system's certainty in the top recommendation.
- **Workflow_Log**: An ordered array of strings describing each processing step executed during a recommendation cycle.
- **Specialty_Match**: A boolean or weighted indicator of whether a hospital's declared specialties cover the patient's `emergencyType`.
- **ICU_Availability**: The number of unoccupied ICU beds at a hospital, derived from `icuBeds` and `occupancy`.
- **Emergency_Support_Level**: An integer (1–3) indicating a hospital's capability to handle critical emergencies.

---

## Requirements

### Requirement 1: Hospital Dataset

**User Story:** As a backend developer, I want a mock hospital dataset based on real Bangalore locations, so that the recommendation engine has geographically realistic ICU facility data to operate against during development and testing.

#### Acceptance Criteria

1. THE Hospital_Dataset SHALL define a minimum of eight hospital records representing real or realistic hospitals across distinct Bangalore localities (e.g., Koramangala, Whitefield, Jayanagar, Hebbal, Indiranagar, Electronic City, Rajajinagar, Malleshwaram), each containing the fields: `id`, `name`, `location`, `icuBeds`, `occupancy`, `eta`, `specialties`, and `emergencySupportLevel`.
2. THE Hospital_Dataset SHALL type each hospital record using the `Hospital` interface exported from the Types_Module.
3. WHEN `occupancy` is set in the Hospital_Dataset, THE Hospital_Dataset SHALL express it as a percentage value between 0 and 100 inclusive.
4. WHEN `emergencySupportLevel` is set in the Hospital_Dataset, THE Hospital_Dataset SHALL express it as an integer value of 1, 2, or 3.
5. THE Hospital_Dataset SHALL assign `eta` values (in minutes) that reflect realistic Bangalore road distances between localities, accounting for typical city traffic conditions.
6. THE Hospital_Dataset SHALL include a diverse spread of `specialties` across the dataset, covering at minimum: `cardiac`, `trauma`, `neurology`, `burns`, `pediatric`, and `general`.
7. THE Hospital_Dataset SHALL export the hospital array so that the Recommendation_Engine and other authorised modules can import it.

---

### Requirement 2: Shared TypeScript Interfaces

**User Story:** As a contributor, I want all shared data contracts exported from a single types file, so that I can import consistent interfaces without duplicating type definitions across modules.

#### Acceptance Criteria

1. THE Types_Module SHALL export a `Hospital` interface containing: `id: string`, `name: string`, `location: string`, `icuBeds: number`, `occupancy: number`, `eta: number`, `specialties: string[]`, and `emergencySupportLevel: number`.
2. THE Types_Module SHALL export a `PatientInput` interface containing: `age: number`, `severity: 'low' | 'medium' | 'high' | 'critical'`, `emergencyType: string`, `location: string`, and `symptoms: string[]`.
3. THE Types_Module SHALL export a `ScoredHospital` interface that extends `Hospital` with: `score: number`, `adjustedETA: number`, `projectedOccupancy: number`, and `riskScore: number`.
4. THE Types_Module SHALL export a `RecommendationResponse` interface matching the fixed API response contract: `recommendation: ScoredHospital`, `rankedHospitals: ScoredHospital[]`, `confidence: number`, `workflow: string[]`, and `explanation: string`.
5. THE Types_Module SHALL NOT import from any module other than built-in TypeScript utilities, so that it remains a dependency-free contract file.

---

### Requirement 3: POST API Endpoint

**User Story:** As a client application, I want a POST endpoint that accepts patient intake data and returns a ranked hospital recommendation, so that the frontend can display actionable ICU placement guidance.

#### Acceptance Criteria

1. THE API_Route SHALL accept HTTP POST requests at the path `/api/recommend`.
2. WHEN a POST request is received with a valid `PatientInput` body, THE API_Route SHALL return HTTP 200 with a `RecommendationResponse` JSON payload.
3. IF the request body is missing required fields (`age`, `severity`, `emergencyType`, `location`, `symptoms`), THEN THE API_Route SHALL return HTTP 400 with a JSON error object containing a descriptive `error` string.
4. IF an unhandled exception occurs during recommendation processing, THEN THE API_Route SHALL return HTTP 500 with a JSON error object containing a descriptive `error` string.
5. THE API_Route SHALL delegate all recommendation logic to the Recommendation_Engine and SHALL NOT contain scoring or filtering logic inline.
6. THE API_Route SHALL set the `Content-Type` response header to `application/json`.
7. THE API_Route SHALL return the `workflow` array in the fixed order: `["Emergency severity analyzed", "Hospital availability filtered", "Demand prediction calculated", "Traffic-adjusted ETA generated", "Risk analysis applied", "Final ranking completed"]`.

---

### Requirement 4: Scoring Engine

**User Story:** As a system architect, I want a configurable scoring engine, so that each hospital candidate receives a deterministic composite score that reflects availability, specialty fit, travel time, and predicted load.

#### Acceptance Criteria

1. THE Scoring_Engine SHALL compute a base composite score for each hospital using the following weights: ICU beds available (35%), specialty match (30%), ETA (20%), and current occupancy (15%).
2. THE Scoring_Engine SHALL compute an enhanced composite score for each hospital using the following weights: ICU availability (25%), specialty match (25%), adjusted ETA from the Traffic_Estimator (20%), occupancy prediction from the Prediction_Module (15%), and hospital risk score from the Analytics_Module (15%).
3. WHEN computing the specialty match component, THE Scoring_Engine SHALL award a higher sub-score when the hospital's `specialties` array contains a value that matches the patient's `emergencyType`.
4. WHEN computing the ETA component, THE Scoring_Engine SHALL award a higher sub-score to hospitals with a lower `adjustedETA` value.
5. WHEN computing the occupancy component, THE Scoring_Engine SHALL award a higher sub-score to hospitals with a lower projected occupancy.
6. THE Scoring_Engine SHALL normalise each component sub-score to a 0–100 range before applying weights, so that the final composite score is also in the 0–100 range.
7. THE Scoring_Engine SHALL export a `scoreHospital` function that accepts a hospital record and patient input and returns a `ScoredHospital` object.
8. THE Scoring_Engine SHALL export a `rankHospitals` function that accepts an array of hospitals and patient input and returns the array sorted by descending composite score.

---

### Requirement 5: Recommendation Engine Orchestration

**User Story:** As a backend developer, I want a single orchestration function that coordinates all intelligence modules, so that the API route can produce a complete recommendation with one function call.

#### Acceptance Criteria

1. THE Recommendation_Engine SHALL export a single function `generateRecommendation(input: PatientInput): RecommendationResponse`.
2. WHEN `generateRecommendation` is called, THE Recommendation_Engine SHALL execute the following steps in order: filter available hospitals using the Analytics_Module, predict demand for each candidate using the Prediction_Module, compute traffic-adjusted ETAs using the Traffic_Estimator, calculate risk scores using the Analytics_Module, and rank candidates using the Scoring_Engine.
3. WHEN filtering hospitals, THE Recommendation_Engine SHALL use `filterAvailableHospitals` from the Analytics_Module with a maximum occupancy threshold of 90%.
4. WHEN predicting demand, THE Recommendation_Engine SHALL call `predictHospitalLoad` from the Prediction_Module for each filtered hospital, passing `currentOccupancy`, `timeOfDay` derived from the current UTC hour, `severityTrend` mapped from the patient's `severity`, and `emergencyCount` set to 1.
5. WHEN computing ETAs, THE Recommendation_Engine SHALL call `estimateTrafficDelay` from the Traffic_Estimator for each filtered hospital, passing `distance` derived from the hospital's `eta` field, `cityTrafficMultiplier` set to 1.3, and `emergencyUrgency` mapped from the patient's `severity`.
6. WHEN calculating risk, THE Recommendation_Engine SHALL call `calculateHospitalRisk` from the Analytics_Module for each filtered hospital.
7. THE Recommendation_Engine SHALL set `recommendation` to the highest-scoring `ScoredHospital` in the response.
8. THE Recommendation_Engine SHALL set `rankedHospitals` to the full sorted array of `ScoredHospital` objects in the response.
9. THE Recommendation_Engine SHALL compute `confidence` as a number between 0 and 100 reflecting the margin between the top-ranked hospital's score and the second-ranked hospital's score, capped at 100.
10. THE Recommendation_Engine SHALL set `explanation` to a human-readable string summarising why the top hospital was selected, referencing its name, available ICU beds, adjusted ETA, and specialty match status.
11. IF fewer than one hospital passes the availability filter, THEN THE Recommendation_Engine SHALL throw an error with the message `"No available ICU beds found in the hospital network"`.

---

### Requirement 6: Fixed API Response Contract

**User Story:** As a collaborating team member, I want the API response structure to remain stable, so that my frontend and integration code does not break when the backend is updated.

#### Acceptance Criteria

1. THE API_Route SHALL always return a response body that conforms to the `RecommendationResponse` interface with the top-level keys: `recommendation`, `rankedHospitals`, `confidence`, `workflow`, and `explanation`.
2. THE API_Route SHALL NOT add, remove, or rename top-level keys in the response body without a versioned contract change agreed by all contributors.
3. WHEN `confidence` is returned, THE API_Route SHALL express it as a number between 0 and 100 inclusive.
4. WHEN `rankedHospitals` is returned, THE API_Route SHALL order the array from highest score to lowest score.
5. THE API_Route SHALL include all six workflow step strings in the `workflow` array for every successful response, regardless of which hospitals are available.

---

### Requirement 7: Module Isolation and Reusability

**User Story:** As a contributor, I want each module to have a clearly bounded responsibility, so that I can test, replace, or extend individual components without side effects on other modules.

#### Acceptance Criteria

1. THE Scoring_Engine SHALL NOT import from the API_Route or the Hospital_Dataset directly; it SHALL receive all data through function parameters.
2. THE Recommendation_Engine SHALL NOT contain inline scoring logic; it SHALL delegate all scoring to the Scoring_Engine.
3. THE Hospital_Dataset SHALL NOT import from the Recommendation_Engine or the Scoring_Engine.
4. THE Types_Module SHALL be the single source of truth for all shared interfaces; no module SHALL redefine an interface that is already exported from the Types_Module.
5. WHEN a pre-built utility module (`prediction.ts`, `trafficEstimator.ts`, `analytics.ts`, `surgeSimulator.ts`) is used, THE Recommendation_Engine SHALL import it using its published export and SHALL NOT modify or re-export its internal implementation.
