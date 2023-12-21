import {ChangeEventHandler, PropsWithChildren, useId} from "react";
import styles from "./Toggle.module.css"

type ToggleProps = {
  name: string,
  checked?: boolean,
  disabled?: boolean,
  flip?: boolean,
  onChange?: ChangeEventHandler,
}

function Toggle({name, children, onChange, disabled, flip, checked = false}: PropsWithChildren<ToggleProps>) {
  const id = useId();

  const classes = [
      styles.toggle,
      flip ? styles.flip : '',
  ].filter(x => x !== '').join(' ')

  return (
    <div className={classes}>
      <input type="checkbox" name={name} id={id} checked={checked} disabled={disabled} onChange={onChange}/>
      <label htmlFor={id}>{children}</label>
    </div>
  );
}

export default Toggle
