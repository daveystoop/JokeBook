import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseCSV } from "@/lib/transaction-analyzer";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const text = await file.text();
  const transactions = parseCSV(text);

  if (transactions.length === 0) {
    return NextResponse.json({ error: "No transactions found. Please check your CSV format." }, { status: 422 });
  }

  const upload = await db.upload.create({
    data: {
      filename: file.name,
      rowCount: transactions.length,
      transactions: {
        create: transactions.map((t) => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          rawLine: t.rawLine,
        })),
      },
    },
  });

  const dates = transactions.map((t) => t.date);
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  return NextResponse.json({
    uploadId: upload.id,
    rowCount: transactions.length,
    dateRange: {
      from: minDate.toLocaleDateString("en-AU"),
      to: maxDate.toLocaleDateString("en-AU"),
    },
  });
}
