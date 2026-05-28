import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const bills = await db.bill.findMany({
    orderBy: { monthlyAmount: "desc" },
    include: { deals: { orderBy: { annualSaving: "desc" }, take: 1 }, actions: { where: { status: "pending" } } },
  });
  return NextResponse.json(bills);
}

export async function POST(req: Request) {
  const body = await req.json();
  const bill = await db.bill.create({
    data: {
      name: body.name,
      provider: body.provider,
      category: body.category,
      monthlyAmount: parseFloat(body.monthlyAmount),
      planDetails: body.planDetails || null,
      contractEnds: body.contractEnds ? new Date(body.contractEnds) : null,
      accountNumber: body.accountNumber || null,
      phoneNumber: body.phoneNumber || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(bill, { status: 201 });
}
