import { HTMLProps, useId } from "react";
import styles from "./CheckBox.module.css";

type CheckBoxType = HTMLProps<HTMLInputElement> & {
  label: string;
};

export function CheckBox({ label, ...props }: CheckBoxType) {
  const id = useId();

  return (
    <div className={styles.CheckBox}>
      <input
        id={id}
        type={"checkbox"}
        className={styles.CheckBoxInput}
        {...props}
      />
      <label htmlFor={id} className={styles.CheckBoxLabel}>
        {label}
      </label>
    </div>
  );
}
