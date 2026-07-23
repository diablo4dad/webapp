import classNames from "classnames";
import type {
  ReactNode,
  RefObject,
} from "react";
import styles from "./layout.module.css";

type Props = {
  children: ReactNode;
  isListPaneVisible: boolean;
  viewRef?: RefObject<HTMLElement | null>;
};

function Layout({
  children,
  isListPaneVisible,
  viewRef,
}: Props) {
  return (
    <main ref={viewRef} className={styles.Layout}>
      <section
        className={classNames(styles.LayoutBody, {
          [styles.LayoutBodyListMode]: isListPaneVisible,
        })}
      >
        {children}
      </section>
    </main>
  );
}

export { Layout };
