import type { FormEvent } from "react";
import classNames from "classnames";
import styles from "./Search.module.css";
import { Close, SearchIcon } from "./Icons";

type Props = {
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  onSubmit?: () => void;
  placeholder?: string;
  value: string;
};

function Search({
  autoFocus = false,
  onChange,
  onClear,
  onSubmit,
  placeholder,
  value,
}: Props) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit?.();
  }

  return (
    <form
      className={styles.Search}
      onSubmit={handleSubmit}
    >
      <input
        className={styles.Input}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <span
        className={classNames({
          [styles.Icon]: true,
          [styles.IconClose]: value,
        })}
        onClick={onClear}
      >
        {!value && <SearchIcon />}
        {value && <Close />}
      </span>
    </form>
  );
}

export default Search;
