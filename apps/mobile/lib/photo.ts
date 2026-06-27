const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.11:8787";

export function photoUri(id: number | null | undefined): string | null {
  if (id == null) return null;
  return `${API_URL}/photo/${id}`;
}
