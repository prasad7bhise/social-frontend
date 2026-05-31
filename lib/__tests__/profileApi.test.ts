import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSession } from "next-auth/react";
import {
  getProfile,
  updateProfile,
  getUserProfile,
  getFollowCounts,
  followUser,
  unfollowUser,
  searchUsers,
  getMessageSuggestions,
  getFollowStatus,
} from "@/lib/api/profileApi";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  (getSession as any).mockResolvedValue({ accessToken: "test-token" });
});

describe("profileApi", () => {
  it("01_getProfile_fetches_and_returns_profile", async () => {
    const profile = { id: 1, firstName: "John" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(profile),
    });

    const result = await getProfile();

    expect(result).toEqual(profile);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/profile",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );
  });

  it("02_updateProfile_sends_PUT_with_body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, lastName: "Smith" }),
    });

    const result = await updateProfile({ lastName: "Smith" });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/profile",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ lastName: "Smith" }),
      })
    );
    expect(result.lastName).toBe("Smith");
  });

  it("03_getUserProfile_fetches_by_id", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 2 }),
    });

    await getUserProfile(2);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/profile/2",
      expect.any(Object)
    );
  });

  it("04_getFollowCounts_returns_counts", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ followers: 5, following: 3 }),
    });

    const result = await getFollowCounts(1);

    expect(result).toEqual({ followers: 5, following: 3 });
  });

  it("05_followUser_sends_POST", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve() });

    await followUser(2);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/follow/2",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("06_unfollowUser_sends_DELETE", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve() });

    await unfollowUser(2);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/follow/2",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("07_searchUsers_sends_query_param", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 3, firstName: "Alice" }]),
    });

    const result = await searchUsers("Ali");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/profile/search?q=Ali",
      expect.any(Object)
    );
    expect(result).toHaveLength(1);
  });

  it("08_getMessageSuggestions_returns_list", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 4 }]),
    });

    const result = await getMessageSuggestions();

    expect(result).toHaveLength(1);
  });

  it("09_getFollowStatus_returns_following_state", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ following: true }),
    });

    const result = await getFollowStatus(2);

    expect(result).toBe(true);
  });
});
