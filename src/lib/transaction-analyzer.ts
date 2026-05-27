import { GoogleGenAI } from "@google/genai";
import type { BillCategory } from "@/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  rawLine?: string | null;
}

export interface DetectedBill {
  name: string;
  provider: string;
  category: BillCategory;
  monthlyAmount: number;
  planDetails: string;
  confidence: number;
  transactionDescriptions: string[];
}

export function parseCSV(csvText: string): ParsedTransaction[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
    // Skip obvious header lines
    if (/date|description|transaction|balance|debit|credit/i.test(line) && transactions.length === 0) continue;

    const cols = splitCSVLine(line);
    if (cols.length < 2) continue;

    // Try to find a date column (first or last col matching date pattern)
    const dateStr = findDate(cols);
    if (!dateStr) continue;

    const date = parseDate(dateStr);
    if (!date) continue;

    // Find description (longest non-numeric, non-date string)
    const description = findDescription(cols, dateStr);
    if (!description) continue;

    // Find debit amount (money out — positive number in a debit column or negative in signed amount)
    const amount = findDebitAmount(cols);
    if (amount === null || amount <= 0) continue;

    transactions.push({ date, description, amount, rawLine: line });
  }

  return transactions;
}

function splitCSVLine(line: string): string[] {
  const cols: string[] = [];
  let inQuotes = false;
  let current = "";
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { cols.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  cols.push(current.trim());
  return cols;
}

function findDate(cols: string[]): string | null {
  const dateRe = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$|^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/;
  return cols.find((c) => dateRe.test(c.trim())) ?? null;
}

function parseDate(s: string): Date | null {
  // Handle DD/MM/YYYY and YYYY-MM-DD
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
    return new Date(year, parseInt(m) - 1, parseInt(d));
  }
  const iso = new Date(s);
  return isNaN(iso.getTime()) ? null : iso;
}

function findDescription(cols: string[], excludeDate: string): string | null {
  const candidates = cols.filter((c) => {
    if (c === excludeDate) return false;
    if (/^[\d\.\-\+\s]+$/.test(c)) return false;
    return c.length > 2;
  });
  return candidates.sort((a, b) => b.length - a.length)[0] ?? null;
}

function findDebitAmount(cols: string[]): number | null {
  const numbers = cols
    .map((c) => parseFloat(c.replace(/[,$]/g, "")))
    .filter((n) => !isNaN(n));

  // Look for a positive debit value (most bank CSVs have separate debit/credit cols)
  const positives = numbers.filter((n) => n > 0 && n < 50000);
  if (positives.length > 0) return Math.max(...positives);

  return null;
}

export async function analyzeTransactions(transactions: ParsedTransaction[]): Promise<DetectedBill[]> {
  if (transactions.length === 0) return [];

  // Limit to last 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const recent = transactions.filter((t) => t.date >= cutoff);
  const sample = recent.slice(0, 200); // cap to avoid huge prompts

  const txLines = sample
    .map((t) => `${t.date.toISOString().slice(0, 10)} | ${t.description} | $${t.amount.toFixed(2)}`)
    .join("\n");

  const prompt = `You are a financial analyst reviewing an Australian consumer's bank transactions to identify recurring bills and subscriptions.

Here are their recent transactions (date | description | amount):
${txLines}

Identify all recurring bills, subscriptions, and regular service payments. Look for:
- Same or similar descriptions appearing monthly/weekly/quarterly
- Regular amounts (internet, phone, insurance, streaming, energy, gym, etc.)
- Direct debits and recurring charges

Return ONLY a valid JSON array (no markdown, no code blocks):
[
  {
    "name": "Human readable bill name, e.g. NBN Internet",
    "provider": "Provider company name extracted from transaction description",
    "category": "one of: internet|phone|energy|insurance|streaming|mortgage|gym|other",
    "monthlyAmount": <estimated monthly cost as a number>,
    "planDetails": "brief description inferred from transaction data",
    "confidence": <0.0 to 1.0, how confident you are this is a recurring bill>,
    "transactionDescriptions": ["exact description strings from the transactions that support this"]
  }
]

Only include items with confidence >= 0.6. If nothing recurring is found, return [].`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: prompt,
    });

    const text = response.text ?? "";
    const cleaned = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    const bills: DetectedBill[] = JSON.parse(cleaned);
    return Array.isArray(bills) ? bills : [];
  } catch {
    return [];
  }
}
