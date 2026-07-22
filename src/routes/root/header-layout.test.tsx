import { render, screen } from "@testing-library/react";
import { HeaderLayout } from "./header-layout";

describe("header slots", () => {
  test("renders structural regions from provided content", () => {
    render(
      <HeaderLayout
        actions={<button>actions slot</button>}
        auth={<div>auth slot</div>}
        logo={<div>logo slot</div>}
        navigation={<nav>navigation slot</nav>}
        search={<input aria-label="search slot" />}
        title={<div>title slot</div>}
      />,
    );

    expect(screen.getByText("logo slot")).toBeInTheDocument();
    expect(screen.getByText("title slot")).toBeInTheDocument();
    expect(screen.getByText("navigation slot")).toBeInTheDocument();
    expect(
      screen.getByText("title slot").compareDocumentPosition(
        screen.getByText("navigation slot"),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "search slot" }))
      .toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "actions slot" }),
    ).toBeInTheDocument();
    expect(screen.getByText("auth slot")).toBeInTheDocument();
  });
});
