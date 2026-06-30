import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { RootHeaderLayout, RootLayout } from "./layout";

vi.mock("../../components/DiscordPanel", () => ({
  DiscordInvite: () => <div>discord footer</div>,
}));

vi.mock("../../components/VersionPanel", () => ({
  VersionInfo: () => <div>version footer</div>,
}));

describe("shell slots", () => {
  test("renders header, main, and footer content", () => {
    render(
      <RootLayout
        header={<div>header slot</div>}
        main={<div>main slot</div>}
      />,
    );

    expect(screen.getByText("header slot")).toBeInTheDocument();
    expect(screen.getByText("main slot")).toBeInTheDocument();
    expect(screen.getByText("discord footer")).toBeInTheDocument();
    expect(screen.getByText("version footer")).toBeInTheDocument();
  });
});

describe("header slots", () => {
  test("renders structural regions from provided content", () => {
    render(
      <RootHeaderLayout
        actions={<button>actions slot</button>}
        auth={<div>auth slot</div>}
        logo={<div>logo slot</div>}
        search={<input aria-label="search slot" />}
        title={<div>title slot</div>}
      />,
    );

    expect(screen.getByText("logo slot")).toBeInTheDocument();
    expect(screen.getByText("title slot")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "search slot" }))
      .toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "actions slot" }),
    ).toBeInTheDocument();
    expect(screen.getByText("auth slot")).toBeInTheDocument();
  });
});
