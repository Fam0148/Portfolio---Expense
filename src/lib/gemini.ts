import { supabase } from "./supabase";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const PROXY_URL = `${SUPABASE_URL}/functions/v1/gemini-proxy`;

// ─── Core proxy caller ─────────────────────────────────────────────────────
const callGemini = async (prompt: string): Promise<string> => {
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Gemini proxy error");

  return (data.text as string).replace(/```json/g, "").replace(/```/g, "").trim();
};

// ─── Stage 1: Column Mapping ───────────────────────────────────────────────
interface ColumnMap {
  symbol: string | null;
  purchase_date: string | null;
  quantity: string | null;
  avg_price: string | null;
}

export const mapCsvColumns = async (
  columns: string[],
  sampleRows: Record<string, string>[]
): Promise<ColumnMap> => {
  const prompt = `
You are a data extraction engine.

Your task is to map unknown CSV column names to a fixed schema.

TARGET SCHEMA:
* symbol (stock ticker or company name)
* purchase_date (date of buying)
* quantity (number of shares)
* avg_price (price per share)

INPUT:
Columns: ${JSON.stringify(columns)}
Sample Rows: ${JSON.stringify(sampleRows.slice(0, 3))}

RULES:
* Only map if confidence is high
* If unsure, return null
* Do NOT guess
* Ignore irrelevant columns
* Output must be strict JSON only

OUTPUT FORMAT:
{
  "symbol": "<column_name_or_null>",
  "purchase_date": "<column_name_or_null>",
  "quantity": "<column_name_or_null>",
  "avg_price": "<column_name_or_null>"
}`.trim();

  const raw = await callGemini(prompt);
  return JSON.parse(raw) as ColumnMap;
};

// ─── Stage 2: Row Normalization ────────────────────────────────────────────
export interface NormalizedRow {
  symbol: string | null;
  purchase_date: string | null;
  quantity: number | null;
  avg_price: number | null;
}

export const normalizeRow = async (rowData: Record<string, string>): Promise<NormalizedRow> => {
  const prompt = `
You are a financial data normalizer.

Convert the given row into a clean structured format.

TARGET FORMAT:
{
  "symbol": "string",
  "purchase_date": "YYYY-MM-DD",
  "quantity": number,
  "avg_price": number
}

INPUT ROW:
${JSON.stringify(rowData)}

RULES:
* Extract only valid financial data
* Convert dates to YYYY-MM-DD
* Quantity must be a number
* Price must be per-share value
* If data is invalid, return null fields
* Do NOT hallucinate missing values

OUTPUT:
Return strict JSON only.`.trim();

  const raw = await callGemini(prompt);
  return JSON.parse(raw) as NormalizedRow;
};

// ─── Stage 3: Validation ───────────────────────────────────────────────────
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const validateRow = async (structuredData: NormalizedRow): Promise<ValidationResult> => {
  const prompt = `
You are a validation engine.

Check if the extracted financial data is logically correct.

INPUT:
${JSON.stringify(structuredData)}

RULES:
* quantity > 0
* avg_price > 0
* purchase_date must be valid
* symbol must not be empty

OUTPUT:
{
  "valid": true,
  "errors": []
}

Return strict JSON only.`.trim();

  const raw = await callGemini(prompt);
  return JSON.parse(raw) as ValidationResult;
};

// ─── CSV Pipeline (all 3 stages) ───────────────────────────────────────────
export const processCsvWithAI = async (
  rows: Record<string, string>[]
): Promise<NormalizedRow[]> => {
  if (!rows.length) throw new Error("CSV is empty.");

  const columns = Object.keys(rows[0]);
  const colMap = await mapCsvColumns(columns, rows);

  const results: NormalizedRow[] = [];

  for (const row of rows) {
    const mapped: Record<string, string> = {};
    if (colMap.symbol && row[colMap.symbol]) mapped.symbol = row[colMap.symbol];
    if (colMap.purchase_date && row[colMap.purchase_date]) mapped.purchase_date = row[colMap.purchase_date];
    if (colMap.quantity && row[colMap.quantity]) mapped.quantity = row[colMap.quantity];
    if (colMap.avg_price && row[colMap.avg_price]) mapped.avg_price = row[colMap.avg_price];

    const normalized = await normalizeRow(mapped);
    const validation = await validateRow(normalized);

    if (validation.valid) {
      results.push(normalized);
    }
  }

  if (!results.length) throw new Error("No valid rows could be extracted from the CSV.");
  return results;
};

// ─── Original Statement Analyzer (TXT/PDF) ────────────────────────────────
export const analyzeAssetStatement = async (content: string) => {
  const prompt = `
    Analyze the following financial statement content and extract investment assets (Stocks and Bonds).
    Return a JSON array of objects with the following schema:
    {
      "symbol": "Ticker or Name of asset",
      "name": "Full name of the asset",
      "purchase_date": "YYYY-MM-DD",
      "purchase_price": number,
      "quantity": number,
      "asset_type": "STOCK" | "BOND",
      "tenure": "Optional tenure for bonds (e.g. 12 Months)",
      "ytm": "Optional YTM percentage for bonds (e.g. 10.5)"
    }

    Rules:
    - If it's a Stock, identify the ticker (e.g. RELIANCE, TCS).
    - If it's a Bond, set asset_type to "BOND".
    - Try to infer the purchase date. If not found, use today's date: ${new Date().toISOString().split('T')[0]}.
    - Combine duplicate entries if found.
    - Return ONLY a JSON array. No markdown, no explanation.

    Content:
    ${content}
  `.trim();

  try {
    const raw = await callGemini(prompt);
    return JSON.parse(raw);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze statement. Please check your API key and file content.");
  }
};
