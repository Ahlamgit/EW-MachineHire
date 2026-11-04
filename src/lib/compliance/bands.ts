/**
 * Confirmed compliance bands from actual document Date (not entry time).
 * Mirrors SQL public.compliance_band_from_document_date.
 *
 * Green: under 9 months
 * Yellow: from 9 months up to under 10 months
 * Red: from 10 months onward
 */
import type { ComplianceBand, ComplianceDocumentType } from "@/types";

export const COMPLIANCE_DOCUMENT_TYPES: ComplianceDocumentType[] = [
  "insurance",
  "fitness",
  "road_tracks",
];

export const COMPLIANCE_DOCUMENT_LABELS: Record<
  ComplianceDocumentType,
  string
> = {
  insurance: "Insurance",
  fitness: "Fitness",
  road_tracks: "Road tracks",
};

/** Add calendar months to a UTC date (day-clamped). */
export function addCalendarMonths(date: Date, months: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const target = new Date(Date.UTC(y, m + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target;
}

function parseUtcDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) {
    throw new Error(`Invalid document date: ${value}`);
  }
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function complianceBandFromDocumentDate(
  documentDate: string | Date | null | undefined,
  asOf: string | Date = new Date(),
): ComplianceBand {
  if (!documentDate) return "missing";
  const doc = parseUtcDateOnly(documentDate);
  const today = parseUtcDateOnly(asOf);
  const nine = addCalendarMonths(doc, 9);
  const ten = addCalendarMonths(doc, 10);
  if (today < nine) return "green";
  if (today < ten) return "yellow";
  return "red";
}

export function allComplianceGreen(
  bands: Partial<Record<ComplianceDocumentType, ComplianceBand>>,
): boolean {
  return COMPLIANCE_DOCUMENT_TYPES.every((t) => bands[t] === "green");
}

export function bandTone(
  band: ComplianceBand,
): "green" | "yellow" | "red" | "neutral" {
  if (band === "green") return "green";
  if (band === "yellow") return "yellow";
  if (band === "red") return "red";
  return "neutral";
}
