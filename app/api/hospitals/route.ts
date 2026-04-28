import { NextResponse } from 'next/server';
import { fetchRealTimeHospitals } from '@/lib/realTimeHospitalData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') || 'Bangalore';
  const useRealTime = searchParams.get('realtime') === 'true';

  try {
    const data = await fetchRealTimeHospitals(location, useRealTime);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
