import { NextResponse } from "next/server";
import { getEconomicData } from "@/lib/economic-data";

export const revalidate = 3600;

export async function GET() {
  const data = await getEconomicData();
  return NextResponse.json(data);
}
