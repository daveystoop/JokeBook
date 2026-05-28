import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findDealsForBill } from "@/lib/ai-deal-finder";

export async function POST(req: Request) {
  const body = await req.json();
  const billId: string | undefined = body.billId;

  const bills = billId
    ? await db.bill.findMany({ where: { id: billId } })
    : await db.bill.findMany();

  let totalSavingFound = 0;
  let dealsFound = 0;

  for (const bill of bills) {
    // Clear old unactioned deals for this bill
    await db.deal.deleteMany({ where: { billId: bill.id } });

    const deals = await findDealsForBill(bill);
    for (const deal of deals) {
      await db.deal.create({
        data: {
          billId: bill.id,
          provider: deal.provider,
          planDetails: deal.planDetails,
          monthlyAmount: deal.monthlyAmount,
          promoAmount: deal.promoAmount ?? null,
          promoDuration: deal.promoDuration ?? null,
          annualSaving: deal.annualSaving,
          sourceNote: deal.sourceNote ?? null,
        },
      });
      totalSavingFound += deal.annualSaving;
      dealsFound++;
    }
  }

  const review = await db.review.create({
    data: { totalSavingFound, dealsFound, summary: `Reviewed ${bills.length} bill(s), found ${dealsFound} deal(s).` },
  });

  return NextResponse.json({ review, dealsFound, totalSavingFound });
}
