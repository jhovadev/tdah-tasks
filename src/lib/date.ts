// Utilidades de fecha. Formato interno de los items: ISO "YYYY-MM-DD".

const MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

const WEEKDAYS_ES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Abreviatura minimalista tipo iOS: "11 feb". */
export function shortLabel(date: Date): string {
  return `${date.getDate()} ${MONTHS_ES[date.getMonth()]}`;
}

/** Nombre del día corto: "lun". */
export function weekdayLabel(date: Date): string {
  return WEEKDAYS_ES[date.getDay()];
}

/** Encabezado completo del mes: "octubre 2026". */
export function monthLabel(date: Date): string {
  const full = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  return `${full[date.getMonth()]} ${date.getFullYear()}`;
}

/** Etiqueta legible para un ISO, usada en el historial. */
export function readableDate(iso: string): string {
  const date = parseISODate(iso);
  return `${weekdayLabel(date)} ${shortLabel(date)}`;
}
