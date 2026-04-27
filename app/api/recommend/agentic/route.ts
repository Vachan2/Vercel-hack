import { NextResponse } from 'next/server';
import { generateAgenticRecommendation } from '../../../../lib/agenticEngine';
import type { PatientInput } from '../../../../lib/types';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();

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
    const result = await generateAgenticRecommendation(input);
    return NextResponse.json(result, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
