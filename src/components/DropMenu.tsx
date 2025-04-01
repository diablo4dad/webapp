import styles from "./DropMenu.module.css";
import { HTMLProps, PropsWithChildren } from "react";
import classNames from "classnames";

type DropMenuProps = HTMLProps<HTMLDivElement> & PropsWithChildren;

export function DropMenu({ children, className, ...props }: DropMenuProps) {
  return (
    <div className={classNames(styles.DropMenu, className)} {...props}>
      {children}
    </div>
  );
}

type DropMenuItemProps = HTMLProps<HTMLDivElement> & PropsWithChildren;

export function DropMenuItem({
  children,
  className,
  ...props
}: DropMenuItemProps) {
  return (
    <div className={classNames(styles.DropMenuItem, className)} {...props}>
      {children}
    </div>
  );
}
