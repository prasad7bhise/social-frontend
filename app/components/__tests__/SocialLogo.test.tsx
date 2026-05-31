import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SocialLogo } from "@/app/components/SocialLogo";

describe("SocialLogo", () => {
  it("01_renders_logo_text", () => {
    render(<SocialLogo />);
    expect(screen.getByText("Social")).toBeInTheDocument();
  });

  it("02_renders_svg", () => {
    const { container } = render(<SocialLogo />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("h-8 w-8");
  });

  it("03_applies_custom_className", () => {
    const { container } = render(<SocialLogo className="mx-auto" />);
    const div = container.firstElementChild;
    expect(div).toHaveClass("mx-auto");
  });
});
