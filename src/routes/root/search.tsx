import Search from "../../components/Search";

type Props = {
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  onSubmit?: () => void;
  value: string;
};

const SEARCH_PLACEHOLDER = "Search transmogs";

function SearchField({
  autoFocus = false,
  onChange,
  onClear,
  onSubmit,
  value,
}: Props) {
  return (
    <Search
      autoFocus={autoFocus}
      value={value}
      onChange={onChange}
      onClear={onClear}
      onSubmit={onSubmit}
      placeholder={SEARCH_PLACEHOLDER}
    />
  );
}

export { SEARCH_PLACEHOLDER, SearchField };
