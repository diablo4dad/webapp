import styles from "./MobileCloseButton.module.css";
import { ButtonHTMLAttributes } from "react";
import { Close } from "./components/Icons";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {};

function MobileCloseButton({ ...props }: Props) {
  return (
    <button {...props} className={styles.Button}>
      <Close />
    </button>
  );
}

export default MobileCloseButton;
