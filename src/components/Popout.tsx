import { HTMLProps, ReactElement, useEffect, useRef, useState } from "react";
import classNames from "classnames";
import styles from "./Popout.module.css";

type MenuProps = HTMLProps<HTMLDivElement> & {
  trigger: (onClick: () => void) => ReactElement;
  renderContent: (onClick: () => void) => ReactElement;
  align?: "left" | "right";
};

export function Popout({
  className,
  trigger,
  align = "left",
  renderContent,
  ...props
}: MenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(!open);
      }
    }

    document.addEventListener("mousedown", onMouseDown, !open);

    return () => {
      document.removeEventListener("mousedown", onMouseDown, !open);
    };
  }, [ref, setOpen, open]);

  return (
    <div ref={ref} className={classNames(styles.Popout, className)} {...props}>
      {trigger(() => setOpen(!open))}
      <div
        className={classNames(
          styles.PopoutContent,
          align === "right" && styles.PopoutContentRight,
        )}
        hidden={!open}
      >
        {renderContent(() => setOpen(!open))}
      </div>
    </div>
  );
}
