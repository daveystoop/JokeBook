import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const profile = await db.profile.findFirst();
  return NextResponse.json(profile ?? null);
}

export async function POST(req: Request) {
  const body = await req.json();
  const existing = await db.profile.findFirst();
  if (existing) {
    const profile = await db.profile.update({
      where: { id: existing.id },
      data: {
        name: body.name,
        address: body.address || null,
        email: body.email || null,
        mortgageBank: body.mortgageBank || null,
        mortgageRate: body.mortgageRate ? parseFloat(body.mortgageRate) : null,
      },
    });
    return NextResponse.json(profile);
  }
  const profile = await db.profile.create({
    data: {
      name: body.name,
      address: body.address || null,
      email: body.email || null,
      mortgageBank: body.mortgageBank || null,
      mortgageRate: body.mortgageRate ? parseFloat(body.mortgageRate) : null,
    },
  });
  return NextResponse.json(profile, { status: 201 });
}
