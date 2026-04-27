/**
 * LLM Scoring Agent
 * Uses Mistral AI to produce an enriched score and clinical reasoning
 * for each hospital candidate, grounded by live web context.
 */

import type { Hospital, PatientInput } from './types';
import type { HospitalWebContext } from './webScraper';

export interface LLMScoredHospital {
  hospitalId: string;
  llmScore: number;          // 0–100, LLM-derived composite score
  llmReasoning: string;      // 2–3 sentence clinical justification
  keyFactors: string[];      // bullet-point factors the LLM identified
  webContextUsed: boolean;   // whether live web data influenced the score
}

interface MistralMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface MistralResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MODEL = 'mistral-small-latest';

/**
 * Calls Mistral to score a single hospital given patient context and
 * optional live web data. Returns a structured LLMScoredHospital.
 */
export async function llmScoreHospital(
  hospital: Hospital,
  patient: PatientInput,
  webContext: HospitalWebContext,
  deterministicScore: number,
): Promise<LLMScoredHospital> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return fallbackLLMScore(hospital, deterministicScore);
  }

  const availableBeds = Math.round(hospital.icuBeds * (1 - hospital.occupancy / 100));

  const systemPrompt = `You are a clinical AI assistant helping route emergency patients to the best ICU.
You will be given a hospital's data, a patient's emergency profile, and optionally live web context about the hospital.
Your job is to produce a JSON scoring object. Be concise and clinically accurate.
Always respond with ONLY valid JSON — no markdown, no explanation outside the JSON.`;

  const userPrompt = `Score this hospital for the given patient emergency.

PATIENT:
- Age: ${patient.age}
- Emergency: ${patient.emergencyType}
- Severity: ${patient.severity}
- Location: ${patient.location}
- Symptoms: ${patient.symptoms.join(', ')}

HOSPITAL:
- Name: ${hospital.name}
- Location: ${hospital.location}, Bangalore
- ICU Beds: ${hospital.icuBeds} total, ~${availableBeds} available (${hospital.occupancy}% occupied)
- Specialties: ${hospital.specialties.join(', ')}
- Emergency Support Level: ${hospital.emergencySupportLevel}/3
- Base ETA: ${hospital.eta} minutes

LIVE WEB CONTEXT (scraped):
${webContext.snippet}
Source: ${webContext.source}

DETERMINISTIC SCORE (from rule-based engine): ${deterministicScore.toFixed(1)}/100

Produce a JSON object with exactly these fields:
{
  "llmScore": <number 0-100, your adjusted composite score>,
  "llmReasoning": "<2-3 sentence clinical justification for your score>",
  "keyFactors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "webContextUsed": <true if web context influenced your score, false otherwise>
}

Rules:
- llmScore should be close to the deterministic score unless web context reveals important new information
- keyFactors must be specific to this hospital+patient combination
- llmReasoning must mention the emergency type and at least one hospital-specific detail`;

  const messages: MistralMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const res = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.2,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Mistral API error ${res.status}:`, errText);
      return fallbackLLMScore(hospital, deterministicScore);
    }

    const data: MistralResponse = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '';

    const parsed = JSON.parse(raw);

    return {
      hospitalId: hospital.id,
      llmScore: Math.min(100, Math.max(0, Number(parsed.llmScore) || deterministicScore)),
      llmReasoning: String(parsed.llmReasoning ?? ''),
      keyFactors: Array.isArray(parsed.keyFactors) ? parsed.keyFactors.slice(0, 4) : [],
      webContextUsed: Boolean(parsed.webContextUsed),
    };
  } catch (err) {
    console.error('LLM scoring failed for', hospital.name, err);
    return fallbackLLMScore(hospital, deterministicScore);
  }
}

/**
 * Scores all hospitals in parallel (with a concurrency cap of 3
 * to avoid rate-limiting on free Mistral tiers).
 */
export async function llmScoreAllHospitals(
  hospitals: Hospital[],
  patient: PatientInput,
  webContexts: HospitalWebContext[],
  deterministicScores: number[],
): Promise<LLMScoredHospital[]> {
  const CONCURRENCY = 3;
  const results: LLMScoredHospital[] = [];

  for (let i = 0; i < hospitals.length; i += CONCURRENCY) {
    const batch = hospitals.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((h, j) =>
        llmScoreHospital(
          h,
          patient,
          webContexts[i + j],
          deterministicScores[i + j],
        ),
      ),
    );
    results.push(...batchResults);
  }

  return results;
}

function fallbackLLMScore(hospital: Hospital, deterministicScore: number): LLMScoredHospital {
  const availableBeds = Math.round(hospital.icuBeds * (1 - hospital.occupancy / 100));
  return {
    hospitalId: hospital.id,
    llmScore: deterministicScore,
    llmReasoning: `${hospital.name} has ${availableBeds} ICU beds available at ${hospital.occupancy}% occupancy with specialties in ${hospital.specialties.join(', ')}.`,
    keyFactors: [
      `${availableBeds} ICU beds available`,
      `${hospital.specialties.join(', ')} specialties`,
      `Emergency support level ${hospital.emergencySupportLevel}/3`,
    ],
    webContextUsed: false,
  };
}
