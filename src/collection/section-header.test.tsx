import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { Collection } from "../data";
import { SectionHeader } from "./section-header";

vi.mock("../components/Tooltip", () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
  TooltipTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const collection: Collection = {
  id: "alpha",
  name: "Alpha",
  collectionItems: [],
  subcollections: [],
};

function renderHeader({
  canEdit = true,
  canReorder = true,
  isComplete = false,
  onEdit = vi.fn(),
  onStartReorder = vi.fn(),
  onToggle = vi.fn(),
}: {
  canEdit?: boolean;
  canReorder?: boolean;
  isComplete?: boolean;
  onEdit?: () => void;
  onStartReorder?: () => void;
  onToggle?: () => void;
} = {}) {
  render(
    <SectionHeader
      canEdit={canEdit}
      canReorder={canReorder}
      collection={collection}
      counterLabel="[1/3]"
      descriptionLabel="Parent"
      headingLabel="Alpha"
      isComplete={isComplete}
      onEdit={onEdit}
      onStartReorder={onStartReorder}
      onToggle={onToggle}
    />,
  );

  return {
    onEdit,
    onStartReorder,
    onToggle,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("section header", () => {
  test("renders collection labels and actions", () => {
    renderHeader();

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("[1/3]")).toBeInTheDocument();
    expect(screen.getByText("Parent")).toBeInTheDocument();
    expect(screen.getByLabelText("Edit collection")).toBeInTheDocument();
    expect(screen.getByLabelText("Reorder Alpha")).toBeInTheDocument();
    expect(screen.getByLabelText("Toggle collection")).toBeInTheDocument();
  });

  test("forwards edit and reorder actions", () => {
    const { onEdit, onStartReorder } = renderHeader();

    fireEvent.click(screen.getByLabelText("Edit collection"));
    fireEvent.pointerDown(screen.getByLabelText("Reorder Alpha"));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onStartReorder).toHaveBeenCalledOnce();
  });

  test("requires hold before toggling", () => {
    vi.useFakeTimers();
    const { onToggle } = renderHeader();
    const toggle = screen.getByLabelText("Toggle collection");

    fireEvent.mouseDown(toggle);
    vi.advanceTimersByTime(499);

    expect(onToggle).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(onToggle).toHaveBeenCalledOnce();

    fireEvent.mouseDown(toggle);
    fireEvent.mouseUp(toggle);
    vi.advanceTimersByTime(500);

    expect(onToggle).toHaveBeenCalledOnce();
  });
});
