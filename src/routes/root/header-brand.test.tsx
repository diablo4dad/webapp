import { render, screen } from "@testing-library/react";
import {
  HeaderLogo,
  HeaderTitle,
} from "./header-brand";

describe("logo", () => {
  test("renders the game logo", () => {
    render(<HeaderLogo />);

    expect(screen.getByRole("img", { name: "Diablo IV" }))
      .toBeInTheDocument();
  });
});

describe("title", () => {
  test("renders the site name and tagline", () => {
    render(<HeaderTitle />);

    expect(screen.getByText("Diablo IV")).toBeInTheDocument();
    expect(screen.getByText("Dad")).toBeInTheDocument();
    expect(screen.getByText("Bringing closure to the completionist in you"))
      .toBeInTheDocument();
  });
});
