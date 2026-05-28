import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateSwitchEmail } from "@/lib/email-generator";

export async function GET() {
  const actions = await db.action.findMany({
    orderBy: { createdAt: "desc" },
    include: { bill: true },
  });
  return NextResponse.json(actions);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { billId, dealId, monthlySaving, annualSaving, method, commitBy } = body;

  const bill = await db.bill.findUnique({ where: { id: billId } });
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

  let draftEmail: string | null = null;

  if (method === "email" && dealId) {
    const deal = await db.deal.findUnique({ where: { id: dealId } });
    if (deal) {
      const profile = await db.profile.findFirst();
      if (profile) {
        const { subject, body: emailBody } = generateSwitchEmail({
          profile,
          currentBill: bill,
          deal,
        });
        draftEmail = `Subject: ${subject}\n\n${emailBody}`;
      }
    }
  }

  const action = await db.action.create({
    data: {
      billId,
      dealId: dealId ?? null,
      monthlySaving,
      annualSaving,
      method: method ?? null,
      commitBy: commitBy ? new Date(commitBy) : null,
      draftEmail,
    },
    include: { bill: true },
  });

  return NextResponse.json(action, { status: 201 });
}
