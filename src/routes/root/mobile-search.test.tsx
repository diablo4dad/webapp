import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MobileSearch } from "./mobile-search";

type Props = Parameters<typeof MobileSearch>[0];

type Options = Partial<Props>;

vi.mock("../../components/Search", () => ({
  default: ({
    autoFocus,
    onChange,
    onClear,
    placeholder = "search",
    value,
  }: {
    autoFocus?: boolean;
    onChange: (value: string) => void;
    onClear: () => void;
    placeholder?: string;
    value: string;
  }) => (
    <div>
      <input
        aria-label={placeholder}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      <button onClick={onClear}>clear {placeholder}</button>
    </div>
  ),
}));

function renderOverlay(options: Options = {}) {
  const props: Props = {
    onClearSearch: vi.fn(),
    onClose: vi.fn(),
    onSearchChange: vi.fn(),
    searchTerm: "helm",
    ...options,
  };
  const renderResult = render(<MobileSearch {...props} />);

  return {
    ...renderResult,
    props,
  };
}

describe("search field", () => {
  test("renders the current search term and passes changes through", () => {
    const { props } = renderOverlay();
    const searchField = screen.getByRole("textbox", {
      name: "Search transmogs",
    });

    expect(searchField).toHaveValue("helm");

    fireEvent.change(searchField, {
      target: {
        value: "sword",
      },
    });

    expect(props.onSearchChange).toHaveBeenCalledWith("sword");
  });

  test("passes clear action through", async () => {
    const user = userEvent.setup();
    const { props } = renderOverlay();

    await user.click(
      screen.getByRole("button", { name: "clear Search transmogs" }),
    );

    expect(props.onClearSearch).toHaveBeenCalledTimes(1);
  });
});

describe("closing", () => {
  test("closes from the close and search buttons", async () => {
    const user = userEvent.setup();
    const { props } = renderOverlay();

    await user.click(screen.getByRole("button", { name: "Close search" }));
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(props.onClose).toHaveBeenCalledTimes(2);
  });
});
