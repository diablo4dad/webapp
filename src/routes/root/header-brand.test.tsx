import { render, screen } from "@testing-library/react";
import {
  RootHeaderLogo,
  RootHeaderTitle,
} from "./header-brand";

describe("logo", () => {
  test("renders the game logo", () => {
    render(<RootHeaderLogo />);

    expect(screen.getByRole("img", { name: "Diablo IV" }))
      .toBeInTheDocument();
  });
});

describe("title", () => {
  test("renders the site name and tagline", () => {
    render(<RootHeaderTitle />);

    expect(screen.getByText("Diablo IV")).toBeInTheDocument();
    expect(screen.getByText("Dad")).toBeInTheDocument();
    expect(screen.getByText("Bringing closure to the completionist in you"))
      .toBeInTheDocument();
  });
});
