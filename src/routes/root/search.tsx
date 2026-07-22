import Search from "../../shared/ui/Search";

type Props = {
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  onSubmit?: () => void;
  placeholder?: string;
  value: string;
};

const SEARCH_PLACEHOLDER = "Search transmogs";

function SearchField({
  autoFocus = false,
  onChange,
  onClear,
  onSubmit,
  placeholder = SEARCH_PLACEHOLDER,
  value,
}: Props) {
  return (
    <Search
      autoFocus={autoFocus}
      value={value}
      onChange={onChange}
      onClear={onClear}
      onSubmit={onSubmit}
      placeholder={placeholder}
    />
  );
}

export { SEARCH_PLACEHOLDER, SearchField };
