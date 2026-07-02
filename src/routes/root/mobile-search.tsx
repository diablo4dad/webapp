import Button, { BtnColours } from "../../components/Button";
import { Close } from "../../components/Icons";
import { MobileSearchLayout } from "./mobile-search-layout";
import { SearchField } from "./search";
import styles from "./mobile-search.module.css";

type Props = {
  onClearSearch: () => void;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  searchTerm: string;
};

type HeaderProps = {
  onClose: () => void;
};

type BodyProps = {
  onClearSearch: () => void;
  onClose: () => void;
  onSearchChange: (value: string) => void;
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
  searchTerm,
}: Props) {
  return (
    <MobileSearchLayout
      onClose={onClose}
      header={
        <Header onClose={onClose} />
      }
      body={
        <Body
          onClearSearch={onClearSearch}
          onClose={onClose}
          onSearchChange={onSearchChange}
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

function Header({ onClose }: HeaderProps) {
  return (
    <>
      <div className={styles.MobileSearchTitle}>
        Transmog Search
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
  searchTerm,
}: BodyProps) {
  return (
    <div className={styles.MobileSearchField}>
      <SearchField
        value={searchTerm}
        onChange={onSearchChange}
        onClear={onClearSearch}
        onSubmit={onClose}
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
