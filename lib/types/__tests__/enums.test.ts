import { describe, it, expect } from "vitest";
import {
  MediaType,
  NotificationType,
  MessageRequestStatus,
} from "@/lib/types/enums";

describe("MediaType", () => {
  it("01_has_IMAGE_value", () => {
    expect(MediaType.IMAGE).toBe("IMAGE");
  });

  it("02_has_VIDEO_value", () => {
    expect(MediaType.VIDEO).toBe("VIDEO");
  });
});

describe("NotificationType", () => {
  it("01_has_LIKE_value", () => {
    expect(NotificationType.LIKE).toBe("LIKE");
  });

  it("02_has_COMMENT_value", () => {
    expect(NotificationType.COMMENT).toBe("COMMENT");
  });

  it("03_has_FOLLOW_value", () => {
    expect(NotificationType.FOLLOW).toBe("FOLLOW");
  });

  it("04_has_MESSAGE_REQUEST_value", () => {
    expect(NotificationType.MESSAGE_REQUEST).toBe("MESSAGE_REQUEST");
  });

  it("05_has_MESSAGE_ACCEPTED_value", () => {
    expect(NotificationType.MESSAGE_ACCEPTED).toBe("MESSAGE_ACCEPTED");
  });

  it("06_has_MESSAGE_value", () => {
    expect(NotificationType.MESSAGE).toBe("MESSAGE");
  });
});

describe("MessageRequestStatus", () => {
  it("01_has_PENDING_value", () => {
    expect(MessageRequestStatus.PENDING).toBe("PENDING");
  });

  it("02_has_ACCEPTED_value", () => {
    expect(MessageRequestStatus.ACCEPTED).toBe("ACCEPTED");
  });

  it("03_has_DECLINED_value", () => {
    expect(MessageRequestStatus.DECLINED).toBe("DECLINED");
  });
});
