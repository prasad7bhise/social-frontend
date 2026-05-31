import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiFetch } from "@/lib/api/client";
import { getSession } from "next-auth/react";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("apiFetch", () => {
  it("01_adds_authorization_header_from_session", async () => {
    (getSession as any).mockResolvedValue({ accessToken: "test-token" });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: "ok" }),
    });

    await apiFetch("/api/test");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
  });

  it("02_sets_content_type_json", async () => {
    (getSession as any).mockResolvedValue({ accessToken: "token" });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiFetch("/api/test");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("03_throws_on_non_ok_response", async () => {
    (getSession as any).mockResolvedValue({ accessToken: "token" });
    mockFetch.mockResolvedValue({ ok: false });

    await expect(apiFetch("/api/test")).rejects.toThrow("API Error");
  });

  it("04_returns_json_on_success", async () => {
    (getSession as any).mockResolvedValue({ accessToken: "token" });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, name: "test" }),
    });

    const result = await apiFetch("/api/test");

    expect(result).toEqual({ id: 1, name: "test" });
  });

  it("05_passes_custom_headers", async () => {
    (getSession as any).mockResolvedValue({ accessToken: "token" });
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await apiFetch("/api/test", {
      headers: { "X-Custom": "value" },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Custom": "value",
        }),
      })
    );
  });
});
