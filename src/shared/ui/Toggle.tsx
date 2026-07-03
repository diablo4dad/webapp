import { ChangeEventHandler, useId } from "react";
import styles from "./Toggle.module.css";
import classNames from "classnames";

type ToggleProps = {
  name: string;
  checked?: boolean;
  disabled?: boolean;
  flip?: boolean;
  label?: string;
  className?: string;
  color?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

function Toggle({
  className,
  name,
  onChange,
  disabled,
  flip,
  label,
  color,
  checked = false,
}: ToggleProps) {
  const id = useId();
  const classes = classNames({
    [styles.toggle]: true,
    [styles.flip]: flip,
    [className ?? ""]: true,
    [styles.red]: color === "red",
  });

  return (
    <div className={classes}>
      <input
        type="checkbox"
        name={name}
        id={id}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      {label && <label htmlFor={id}>{label}</label>}
    </div>
  );
}

export default Toggle;
