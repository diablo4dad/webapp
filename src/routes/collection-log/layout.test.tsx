import { render, screen } from "@testing-library/react";
import { CollectionLogLayout } from "./layout";
import styles from "./layout.module.css";

type LayoutOptions = {
  leftSidebar?: boolean;
  rightSidebar?: boolean;
};

function renderLayout({
  leftSidebar = false,
  rightSidebar = false,
}: LayoutOptions = {}) {
  render(
    <CollectionLogLayout
      hero={<div>hero</div>}
      leftSidebar={leftSidebar ? <div>left</div> : undefined}
      main={<div>main</div>}
      rightSidebar={rightSidebar ? <div>right</div> : undefined}
    />,
  );

  return screen.getByRole("main");
}

describe("main column", () => {
  test.each([
    ["full width", {}, styles.LayoutMainFullWidth],
    [
      "left sidebar",
      { leftSidebar: true },
      styles.LayoutMainWithLeftSidebar,
    ],
    [
      "right sidebar",
      { rightSidebar: true },
      styles.LayoutMainWithRightSidebar,
    ],
    [
      "both sidebars",
      { leftSidebar: true, rightSidebar: true },
      styles.LayoutMainWithBothSidebars,
    ],
  ])("uses %s", (_label, options, className) => {
    expect(renderLayout(options)).toHaveClass(
      styles.LayoutMain,
      className,
    );
  });
});

describe("sidebars", () => {
  test("renders provided slots", () => {
    renderLayout({ leftSidebar: true, rightSidebar: true });

    expect(screen.getAllByRole("complementary")).toHaveLength(2);
  });
});
