import { DetailsHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import classNames from "classnames";
import styles from "./Accordion.module.css";

type AccordionProps = PropsWithChildren &
  DetailsHTMLAttributes<HTMLDetailsElement> & {
    summary: ReactNode;
    summaryClass?: string;
  };

function Accordion({
  summary,
  summaryClass,
  children,
  className,
  ...props
}: AccordionProps) {
  const detailsCss = classNames({
    [styles.details]: true,
    [className ?? ""]: true,
  });

  const summaryCss = classNames({
    [styles.summary]: true,
    [summaryClass ?? ""]: true,
  });

  return (
    <details {...props} className={detailsCss}>
      <summary className={summaryCss}>{summary}</summary>
      {children}
    </details>
  );
}

export default Accordion;
