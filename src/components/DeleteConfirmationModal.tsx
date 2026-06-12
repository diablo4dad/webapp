import React, { useEffect, useState } from "react";
import styles from "./DeleteConfirmationModal.module.css";

type Props = {
  description?: string;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  subject: string;
  title: string;
};

function DeleteConfirmationModal({
  description,
  isDeleting = false,
  onCancel,
  onConfirm,
  subject,
  title,
}: Props) {
  const [countdown, setCountdown] = useState(3);
  const canDelete = countdown === 0 && !isDeleting;

  useEffect(() => {
    setCountdown(3);
  }, [subject, title]);

  useEffect(() => {
    if (countdown === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [countdown]);

  return (
    <div
      className={styles.Overlay}
      role="presentation"
      onClick={(event) => event.stopPropagation()}
    >
      <div
        className={styles.Modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
      >
        <div className={styles.Header}>
          <h2 id="delete-confirmation-title" className={styles.Title}>
            {title}
          </h2>
          {description && <p className={styles.Description}>{description}</p>}
        </div>
        <div className={styles.Subject}>{subject}</div>
        <div className={styles.Actions}>
          <button
            type="button"
            className={styles.CancelButton}
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.DeleteButton}
            onClick={onConfirm}
            disabled={!canDelete}
          >
            {isDeleting
              ? "Deleting"
              : countdown > 0
                ? `Delete ${countdown}`
                : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;
