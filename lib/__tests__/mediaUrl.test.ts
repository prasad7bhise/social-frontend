import { describe, it, expect, beforeEach } from "vitest";
import { mediaUrl } from "@/lib/api/mediaUrl";

describe("mediaUrl", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8080";
  });

  it("01_returns_empty_string_for_null", () => {
    expect(mediaUrl(null)).toBe("");
  });

  it("02_returns_empty_string_for_undefined", () => {
    expect(mediaUrl(undefined)).toBe("");
  });

  it("03_returns_empty_string_for_empty_string", () => {
    expect(mediaUrl("")).toBe("");
  });

  it("04_returns_absolute_url_as_is", () => {
    expect(mediaUrl("https://cdn.example.com/image.jpg")).toBe(
      "https://cdn.example.com/image.jpg"
    );
  });

  it("05_prefixes_relative_url_with_api_base", () => {
    expect(mediaUrl("/uploads/test.jpg")).toBe(
      "http://localhost:8080/uploads/test.jpg"
    );
  });

  it("06_returns_http_prefix_as_is", () => {
    expect(mediaUrl("http://")).toBe("http://");
  });
});
