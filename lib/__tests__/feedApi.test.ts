import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSession } from "next-auth/react";
import {
  getFeed,
  getPost,
  createPost,
  deletePost,
  toggleLike,
  addComment,
  deleteComment,
  getExplore,
  followUser,
  unfollowUser,
  getFollowStatus,
  updateComment,
  uploadFile,
} from "@/lib/api/feedApi";

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
  (getSession as any).mockResolvedValue({ accessToken: "test-token" });
});

describe("feedApi", () => {
  it("01_getFeed_fetches_paginated_feed", async () => {
    const data = { content: [{ id: 1, content: "Post 1" }] };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    });

    const result = await getFeed(0, 10);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/feed?page=0&size=10",
      expect.any(Object)
    );
    expect(result).toHaveLength(1);
  });

  it("02_getPost_fetches_single_post", async () => {
    const post = { id: 1, content: "Test" };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(post),
    });

    const result = await getPost(1);

    expect(result).toEqual(post);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/posts/1",
      expect.any(Object)
    );
  });

  it("03_createPost_sends_POST_with_body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    });

    await createPost({ content: "New post", media: [] });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/posts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ content: "New post", media: [] }),
      })
    );
  });

  it("04_deletePost_sends_DELETE", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve() });

    await deletePost(1);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/posts/1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("05_toggleLike_sends_POST", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve() });

    await toggleLike(1);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/posts/1/like",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("06_addComment_sends_POST_with_body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, content: "Nice!" }),
    });

    const result = await addComment(1, { content: "Nice!" });

    expect(result.content).toBe("Nice!");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/posts/1/comments",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ content: "Nice!" }),
      })
    );
  });

  it("07_deleteComment_sends_DELETE", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve() });

    await deleteComment(1);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/comments/1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("08_getExplore_fetches_paginated_explore", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ content: [{ id: 1 }, { id: 2 }] }),
    });

    const result = await getExplore(0, 20);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/explore?page=0&size=20",
      expect.any(Object)
    );
    expect(result).toHaveLength(2);
  });

  it("09_followUser_sends_POST", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve() });

    await followUser(2);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/follow/2",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("10_unfollowUser_sends_DELETE", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve() });

    await unfollowUser(2);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/follow/2",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("11_getFollowStatus_returns_boolean", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ following: true }),
    });

    const result = await getFollowStatus(2);

    expect(result).toBe(true);
  });

  it("12_updateComment_sends_PATCH", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, content: "Updated" }),
    });

    const result = await updateComment(1, "Updated");

    expect(result.content).toBe("Updated");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/comments/1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ content: "Updated" }),
      })
    );
  });

  it("13_uploadFile_sends_FormData", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "/uploads/test.jpg", filename: "test.jpg" }),
    });

    const file = new File(["data"], "test.jpg", { type: "image/jpeg" });
    const result = await uploadFile(file);

    expect(result.filename).toBe("test.jpg");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/upload",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      })
    );
  });

  it("14_uploadFile_throws_on_failure", async () => {
    mockFetch.mockResolvedValue({ ok: false });

    const file = new File(["data"], "test.jpg", { type: "image/jpeg" });

    await expect(uploadFile(file)).rejects.toThrow("Upload failed");
  });
});
