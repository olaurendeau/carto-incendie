import { NextResponse } from "next/server";
import { getFirePointsForZone } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const points = await getFirePointsForZone(id);
  return NextResponse.json(points);
}
