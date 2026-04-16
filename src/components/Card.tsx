import classNames from "classnames";
import { HTMLProps, ReactNode } from "react";
import styles from "./Card.module.css";

type Props = HTMLProps<HTMLDivElement> & {
  children?: ReactNode;
};

function Card({ children, className, ...props }: Props) {
  return (
    <div {...props} className={classNames(styles.Card, className)}>
      {children}
    </div>
  );
}

export default Card;
