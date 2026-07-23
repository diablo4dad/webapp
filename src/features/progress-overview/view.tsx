import type {
  ProgressScopeViewModel,
} from "../progress";
import { ChevronLeft, ChevronRight } from "../../shared/ui/Icons";
import Toggle from "../../shared/ui/Toggle";
import styles from "./view.module.css";

type ProgressFilterControl = {
  checked: boolean;
  label: string;
  name: string;
  onChange: (checked: boolean) => void;
};

type Props = {
  filterControls?: readonly ProgressFilterControl[];
  onSelectNextScope?: () => void;
  onSelectPreviousScope?: () => void;
  selectedScope: ProgressScopeViewModel;
};

function ProgressOverview({
  filterControls = [],
  onSelectNextScope,
  onSelectPreviousScope,
  selectedScope,
}: Props) {
  return (
    <header className={styles.View}>
      <div className={styles.ViewContent}>
        <div className={styles.ViewHeading}>
          <div className={styles.ViewMeta}>
            {selectedScope.iconSrc && (
              <span className={styles.ViewScopeIcon} aria-hidden="true">
                <img src={selectedScope.iconSrc} alt="" />
              </span>
            )}
            <div className={styles.ViewMetaText}>
              <p className={styles.ViewEyebrow}>Collection Progress</p>
              <div className={styles.ViewScopePosition}>
                {selectedScope.positionLabel}
              </div>
            </div>
            <div className={styles.ViewScopeControls}>
              <button
                className={styles.ViewScopeControl}
                type="button"
                aria-label="Previous collection group"
                onClick={onSelectPreviousScope}
              >
                <ChevronLeft />
              </button>
              <button
                className={styles.ViewScopeControl}
                type="button"
                aria-label="Next collection group"
                onClick={onSelectNextScope}
              >
                <ChevronRight />
              </button>
            </div>
          </div>
          <div className={styles.ViewScope}>
            <h1 id="progress-title">{selectedScope.title}</h1>
          </div>
        </div>
        <div className={styles.ViewSummary}>
          <div className={styles.ViewMeter}>
            <span>Overall</span>
            <strong>{formatPercent(selectedScope.percent)}</strong>
            <span>Complete</span>
          </div>
          <div className={styles.ViewScopeStats}>
            <div className={styles.ViewScopeStatGrid}>
              <div>
                <strong>{formatNumber(selectedScope.collected)}</strong>
                <span>Collected</span>
              </div>
              <div>
                <strong>{formatNumber(selectedScope.total)}</strong>
                <span>Total</span>
              </div>
              <div>
                <strong>{formatNumber(selectedScope.remaining)}</strong>
                <span>Remaining</span>
              </div>
            </div>
          </div>
        </div>
        {filterControls.length > 0 && (
          <div
            className={styles.ViewFilters}
            aria-label="Collection progress filters"
          >
            {filterControls.map((filterControl) => (
              <Toggle
                key={filterControl.name}
                className={styles.ViewFilter}
                name={filterControl.name}
                label={filterControl.label}
                checked={filterControl.checked}
                onChange={(event) =>
                  filterControl.onChange(event.target.checked)
                }
              />
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export { ProgressOverview };
export type { ProgressFilterControl };
