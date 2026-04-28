import { NextResponse } from 'next/server';
import { generateRecommendation } from '../../../lib/recommendationEngine';
import { PatientInput } from '../../../lib/types';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();

  // Validate required fields
  const { age, severity, emergencyType, location, symptoms } = body ?? {};
  if (
    age == null ||
    severity == null ||
    emergencyType == null ||
    location == null ||
    symptoms == null
  ) {
    return NextResponse.json(
      { error: 'Missing required fields: age, severity, emergencyType, location, symptoms' },
      { status: 400 },
    );
  }

  const input: PatientInput = { age, severity, emergencyType, location, symptoms };

  try {
    const result = generateRecommendation(input);
    return NextResponse.json(result, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
