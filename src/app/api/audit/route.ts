import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeTransactions } from "@/lib/transaction-analyzer";
import { findDealsForBill } from "@/lib/ai-deal-finder";

export async function POST(req: Request) {
  const { uploadId } = await req.json();
  if (!uploadId) return NextResponse.json({ error: "uploadId required" }, { status: 400 });

  const upload = await db.upload.findUnique({
    where: { id: uploadId },
    include: { transactions: { orderBy: { date: "desc" } } },
  });
  if (!upload) return NextResponse.json({ error: "Upload not found" }, { status: 404 });

  // Step 1: AI analysis of transactions
  const detectedBills = await analyzeTransactions(upload.transactions);

  // Step 2: Upsert detected bills (match by name+provider to avoid duplicates)
  const billRecords = [];
  for (const detected of detectedBills) {
    const existing = await db.bill.findFirst({
      where: { name: detected.name, provider: detected.provider },
    });

    const bill = existing
      ? await db.bill.update({
          where: { id: existing.id },
          data: {
            monthlyAmount: detected.monthlyAmount,
            planDetails: detected.planDetails,
            source: "detected",
          },
        })
      : await db.bill.create({
          data: {
            name: detected.name,
            provider: detected.provider,
            category: detected.category,
            monthlyAmount: detected.monthlyAmount,
            planDetails: detected.planDetails,
            source: "detected",
          },
        });

    billRecords.push({ bill, detected });
  }

  // Step 3: Find deals for each detected bill
  const dealsMap: Record<string, Awaited<ReturnType<typeof findDealsForBill>>> = {};
  for (const { bill } of billRecords) {
    // Clear old deals first
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
    }
    dealsMap[bill.id] = deals;
  }

  // Step 4: Build audit summary
  const totalMonthlyCost = billRecords.reduce((s, { bill }) => s + bill.monthlyAmount, 0);
  const totalAnnualOpportunity = Object.values(dealsMap)
    .flat()
    .reduce((s, d) => s + d.annualSaving, 0);

  // Reload bills with deals for response
  const billsWithDeals = await db.bill.findMany({
    where: { id: { in: billRecords.map(({ bill }) => bill.id) } },
    include: { deals: { orderBy: { annualSaving: "desc" } } },
  });

  return NextResponse.json({
    uploadId,
    bills: billsWithDeals,
    totalMonthlyCost,
    totalAnnualOpportunity,
    detectedCount: detectedBills.length,
    summary: `Analysed ${upload.rowCount} transactions and found ${detectedBills.length} recurring bill${detectedBills.length !== 1 ? "s" : ""} totalling $${totalMonthlyCost.toFixed(0)}/month.`,
  });
}
