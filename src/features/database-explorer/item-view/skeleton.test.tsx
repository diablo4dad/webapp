import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import styles from "./skeleton.module.css";
import { ItemViewSkeleton } from "./skeleton";

describe("database item view skeleton", () => {
  test("matches the item view summary layout", () => {
    const { container } = render(<ItemViewSkeleton />);

    const summaryRow = container.querySelector(
      `.${styles.SkeletonSummaryRow}`,
    );
    const overviewCard = container.querySelector(
      `.${styles.SkeletonOverviewCard}`,
    );
    const classCard = container.querySelector(
      `.${styles.SkeletonClassCard}`,
    );
    const classChips = classCard?.querySelectorAll(
      `.${styles.SkeletonClassChip}`,
    );

    expect(summaryRow).not.toBeNull();
    expect(overviewCard?.parentElement).toBe(summaryRow);
    expect(classCard?.parentElement).toBe(summaryRow);
    expect(classChips).toHaveLength(5);
  });
});
