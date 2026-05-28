import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bill = await db.bill.findUnique({
    where: { id },
    include: {
      deals: { orderBy: { annualSaving: "desc" } },
      actions: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(bill);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const bill = await db.bill.update({
    where: { id },
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
  return NextResponse.json(bill);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.bill.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
