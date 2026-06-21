// SQLite guarda fechas como "YYYY-MM-DD" o "YYYY-MM-DD HH:MM:SS" (sin T ni Z);
// los schemas del front con z.iso.datetime() las rechazan -> normalizamos a ISO.
// Compartido por products y transactions.
export function toIso(value: string): string {
  if (value.includes("T")) return new Date(value).toISOString();
  const withT = value.includes(" ")
    ? value.replace(" ", "T")
    : `${value}T00:00:00`;
  return new Date(`${withT}Z`).toISOString();
}
