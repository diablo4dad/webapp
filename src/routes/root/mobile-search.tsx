import Button, { BtnColours } from "../../shared/ui/Button";
import { Close } from "../../shared/ui/Icons";
import { MobileSearchLayout } from "./mobile-search-layout";
import { SearchField } from "./search";
import styles from "./mobile-search.module.css";

type Props = {
  onClearSearch: () => void;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  placeholder: string;
  searchTerm: string;
  title: string;
};

type HeaderProps = {
  onClose: () => void;
  title: string;
};

type BodyProps = {
  onClearSearch: () => void;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  placeholder: string;
  searchTerm: string;
};

type ActionsProps = {
  onClearSearch: () => void;
  onClose: () => void;
};

function MobileSearch({
  onClearSearch,
  onClose,
  onSearchChange,
  placeholder,
  searchTerm,
  title,
}: Props) {
  return (
    <MobileSearchLayout
      onClose={onClose}
      header={
        <Header onClose={onClose} title={title} />
      }
      body={
        <Body
          onClearSearch={onClearSearch}
          onClose={onClose}
          onSearchChange={onSearchChange}
          placeholder={placeholder}
          searchTerm={searchTerm}
        />
      }
      actions={
        <Actions
          onClearSearch={onClearSearch}
          onClose={onClose}
        />
      }
    />
  );
}

function Header({ onClose, title }: HeaderProps) {
  return (
    <>
      <div className={styles.MobileSearchTitle}>
        {title}
      </div>
      <button
        className={styles.MobileSearchClose}
        onClick={onClose}
        aria-label="Close search"
      >
        <Close />
      </button>
    </>
  );
}

function Body({
  onClearSearch,
  onClose,
  onSearchChange,
  placeholder,
  searchTerm,
}: BodyProps) {
  return (
    <div className={styles.MobileSearchField}>
      <SearchField
        value={searchTerm}
        onChange={onSearchChange}
        onClear={onClearSearch}
        onSubmit={onClose}
        placeholder={placeholder}
        autoFocus={true}
      />
    </div>
  );
}

function Actions({
  onClearSearch,
  onClose,
}: ActionsProps) {
  return (
    <>
      <Button
        className={styles.MobileSearchActionPrimary}
        colour={BtnColours.Dark}
        onClick={onClose}
      >
        Search
      </Button>
      <Button
        className={styles.MobileSearchAction}
        colour={BtnColours.Dark}
        onClick={onClearSearch}
      >
        Clear
      </Button>
    </>
  );
}

export { MobileSearch };
