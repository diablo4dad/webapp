import classNames from "classnames";
import Card from "../../shared/ui/Card";
import Toggle from "../../shared/ui/Toggle";
import { ChevronLeft, ChevronRight, Star } from "../../shared/ui/Icons";
import type {
  ProgressCardViewModel,
  ProgressViewModel,
} from "./view-model";
import styles from "./view.module.css";

type Props = {
  className?: string;
  filterControls?: readonly ProgressFilterControl[];
  layout?: "expanded" | "stacked";
  model: ProgressViewModel;
  onSelectNextScope?: () => void;
  onSelectPreviousScope?: () => void;
  variant?: "cards" | "dashboard";
};

type ProgressFilterControl = {
  checked: boolean;
  label: string;
  name: string;
  onChange: (checked: boolean) => void;
};

type ProgressCardListProps = {
  cards: readonly ProgressCardViewModel[];
  className?: string;
  layout: NonNullable<Props["layout"]>;
};

function ProgressView({
  className,
  filterControls,
  layout = "expanded",
  model,
  onSelectNextScope,
  onSelectPreviousScope,
  variant = "cards",
}: Props) {
  if (variant === "dashboard") {
    return (
      <ProgressDashboard
        className={className}
        filterControls={filterControls}
        layout={layout}
        model={model}
        onSelectNextScope={onSelectNextScope}
        onSelectPreviousScope={onSelectPreviousScope}
      />
    );
  }

  return (
    <ProgressCardList
      cards={model.cards}
      className={className}
      layout={layout}
    />
  );
}

function ProgressDashboard({
  className,
  filterControls = [],
  layout,
  model,
  onSelectNextScope,
  onSelectPreviousScope,
}: Required<Pick<Props, "layout" | "model">> &
  Pick<
    Props,
    | "className"
    | "filterControls"
    | "onSelectNextScope"
    | "onSelectPreviousScope"
  >) {
  return (
    <section
      className={classNames(styles.ProgressDashboard, className)}
      aria-labelledby="progress-title"
    >
      <header className={styles.ProgressDashboardHeader}>
        <div className={styles.ProgressDashboardContent}>
          <div className={styles.ProgressDashboardHeading}>
            <div className={styles.ProgressDashboardMeta}>
              {model.selectedScope.iconSrc && (
                <span
                  className={styles.ProgressDashboardScopeIcon}
                  aria-hidden="true"
                >
                  <img src={model.selectedScope.iconSrc} alt="" />
                </span>
              )}
              <div className={styles.ProgressDashboardMetaText}>
                <p className={styles.ProgressDashboardEyebrow}>
                  Collection Progress
                </p>
                <div className={styles.ProgressDashboardScopePosition}>
                  {model.selectedScope.positionLabel}
                </div>
              </div>
              <div className={styles.ProgressDashboardScopeControls}>
                <button
                  className={styles.ProgressDashboardScopeControl}
                  type="button"
                  aria-label="Previous collection group"
                  onClick={onSelectPreviousScope}
                >
                  <ChevronLeft />
                </button>
                <button
                  className={styles.ProgressDashboardScopeControl}
                  type="button"
                  aria-label="Next collection group"
                  onClick={onSelectNextScope}
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
            <div className={styles.ProgressDashboardScope}>
              <h1 id="progress-title">{model.selectedScope.title}</h1>
            </div>
          </div>
          <div className={styles.ProgressDashboardSummary}>
            <div className={styles.ProgressDashboardMeter}>
              <span>Overall</span>
              <strong>{formatPercent(model.selectedScope.percent)}</strong>
              <span>Complete</span>
            </div>
            <div className={styles.ProgressDashboardScopeStats}>
              <div className={styles.ProgressDashboardScopeStatGrid}>
                <div>
                  <strong>
                    {formatNumber(model.selectedScope.collected)}
                  </strong>
                  <span>Collected</span>
                </div>
                <div>
                  <strong>{formatNumber(model.selectedScope.total)}</strong>
                  <span>Total</span>
                </div>
                <div>
                  <strong>
                    {formatNumber(model.selectedScope.remaining)}
                  </strong>
                  <span>Remaining</span>
                </div>
              </div>
            </div>
          </div>
          {filterControls.length > 0 && (
            <div
              className={styles.ProgressDashboardFilters}
              aria-label="Collection progress filters"
            >
              {filterControls.map((filterControl) => (
                <Toggle
                  key={filterControl.name}
                  className={styles.ProgressDashboardFilter}
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

      <section
        className={styles.ProgressSection}
        aria-label="Item type progress"
      >
        <ProgressCardList cards={model.cards} layout={layout} />
      </section>
    </section>
  );
}

function ProgressCardList({
  cards,
  className,
  layout,
}: ProgressCardListProps) {
  const progressClassName = classNames(styles.ProgressList, className, {
    [styles.ProgressListExpanded]: layout === "expanded",
    [styles.ProgressListStacked]: layout === "stacked",
  });

  return (
    <div className={progressClassName}>
      {cards.map((card) => (
        <ProgressCard key={card.title} {...card} />
      ))}
    </div>
  );
}

function ProgressCard({
  title,
  iconSrc,
  collected,
  total,
  percent,
  isComplete,
}: ProgressCardViewModel) {
  return (
    <Card className={styles.ProgressCard}>
      <div className={styles.ProgressCardIcon}>
        <img src={iconSrc} alt="" />
      </div>
      <div className={styles.ProgressCardLabel}>Collection</div>
      <div className={styles.ProgressCardSummary}>
        <div className={styles.ProgressCardTitle}>{title}</div>
        <div className={styles.ProgressCardStats}>
          <span className={styles.ProgressCardCurrent}>
            {formatNumber(collected)}
          </span>
          <span className={styles.ProgressCardDivider}>/</span>
          <span>{formatNumber(total)}</span>
        </div>
      </div>
      <div className={styles.ProgressCardBar}>
        <span
          className={styles.ProgressCardBarFill}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className={styles.ProgressCardDetail}>
        <span>
          {formatNumber(collected)} collected from {formatNumber(total)} total
        </span>
        {isComplete && (
          <span className={styles.ProgressCardComplete}>
            <Star />
          </span>
        )}
      </p>
    </Card>
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export { ProgressView };
export type {
  ProgressFilterControl,
  Props as ProgressViewProps,
};
