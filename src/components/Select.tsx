import { ChangeEventHandler } from "react";
import styles from "./Select.module.css";

type Props = {
  label: string;
  options: [string | number, string][];
  defaultValue?: string | number;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
};

function Select({ label, defaultValue, onChange, options = [] }: Props) {
  return (
    <div className={styles.Block}>
      <label className={styles.Label}>{label}</label>
      <div>
        <select
          className={styles.Select}
          onChange={onChange}
          defaultValue={defaultValue}
        >
          {options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default Select;
