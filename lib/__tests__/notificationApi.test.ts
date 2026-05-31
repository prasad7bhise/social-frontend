import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSession } from "next-auth/react";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/notificationApi";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  (getSession as any).mockResolvedValue({ accessToken: "test-token" });
});

describe("notificationApi", () => {
  it("01_getNotifications_fetches_with_pagination", async () => {
    const data = {
      content: [
        { id: 1, type: "LIKE", read: false },
        { id: 2, type: "FOLLOW", read: true },
      ],
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    });

    const result = await getNotifications(0, 20);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/notifications?page=0&size=20",
      expect.any(Object)
    );
    expect(result.content).toHaveLength(2);
    expect(result.content[0].type).toBe("LIKE");
  });

  it("02_getUnreadCount_returns_count", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ count: 3 }),
    });

    const result = await getUnreadCount();

    expect(result).toBe(3);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/notifications/unread-count",
      expect.any(Object)
    );
  });

  it("03_markNotificationRead_sends_PATCH", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve() });

    await markNotificationRead(5);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/notifications/5/read",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("04_markAllNotificationsRead_sends_PATCH", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve() });

    await markAllNotificationsRead();

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/notifications/read-all",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("05_getNotifications_throws_on_error", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });

    await expect(getNotifications(0, 10)).rejects.toThrow("API Error: 404");
  });
});
