import { render, screen } from "@testing-library/react";
import { RootHeaderLayout } from "./header-layout";

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
