import { apiFetch } from "./client";

export async function fetchCurrentUser() {
  return apiFetch("/api/test");
}
