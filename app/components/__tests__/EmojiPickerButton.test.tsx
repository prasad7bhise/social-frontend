import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmojiPickerButton } from "@/app/components/EmojiPickerButton";

// Mock emoji-picker-react
vi.mock("emoji-picker-react", () => ({
  default: ({ onEmojiClick }: { onEmojiClick: (data: { emoji: string }) => void }) => (
    <div data-testid="emoji-picker">
      <button data-testid="mock-emoji" onClick={() => onEmojiClick({ emoji: "👍" })}>
        👍
      </button>
    </div>
  ),
}));

describe("EmojiPickerButton", () => {
  it("01_renders_emoji_button", () => {
    render(<EmojiPickerButton onSelect={() => {}} />);
    const btn = screen.getByRole("button");
    expect(btn).toBeInTheDocument();
  });

  it("02_shows_emoji_picker_on_click", async () => {
    const user = userEvent.setup();
    render(<EmojiPickerButton onSelect={() => {}} />);

    const btn = screen.getByRole("button");
    await user.click(btn);

    expect(screen.getByTestId("emoji-picker")).toBeInTheDocument();
  });

  it("03_calls_onSelect_with_emoji_when_selected", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<EmojiPickerButton onSelect={onSelect} />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByTestId("mock-emoji"));

    expect(onSelect).toHaveBeenCalledWith("👍");
  });

  it("04_closes_picker_after_selecting_emoji", async () => {
    const user = userEvent.setup();
    render(<EmojiPickerButton onSelect={() => {}} />);

    await user.click(screen.getByRole("button"));
    expect(screen.getByTestId("emoji-picker")).toBeInTheDocument();

    await user.click(screen.getByTestId("mock-emoji"));
    expect(screen.queryByTestId("emoji-picker")).not.toBeInTheDocument();
  });
});
