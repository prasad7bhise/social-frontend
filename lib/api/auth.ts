import type { CreateUserDTO, LogUserDTO } from "../types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
// Update these paths when your backend routes are ready
const SIGNUP_PATH = "/api/auth/register";
const LOGIN_PATH = "/api/auth/login";

async function request<T>(path: string, body: T): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const message =
      (await response.json().catch(() => ({})))?.message ?? response.statusText;
    throw new Error(message || `Request failed: ${response.status}`);
  }
  return response;
}

export async function signup(data: CreateUserDTO): Promise<Response> {
  return request(SIGNUP_PATH, data);
}

export async function login(data: LogUserDTO): Promise<Response> {
  return request(LOGIN_PATH, data);
}
