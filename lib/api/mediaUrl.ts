const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export function mediaUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
}
