import classNames from "classnames";
import {
  ProgressSkeleton,
  ProgressView,
  type ProgressLayout,
  type ProgressViewModel,
} from "../../features/progress";
import {
  ProgressOverview,
  ProgressOverviewSkeleton,
  type ProgressFilterControl,
} from "../../features/progress-overview";
import { Layout } from "./layout";
import styles from "./view.module.css";

const PROGRESS_CARD_LAYOUT = "expanded" satisfies ProgressLayout;

type Props = {
  catalogError?: string;
  filterControls?: readonly ProgressFilterControl[];
  isLoading: boolean;
  model: ProgressViewModel;
  onSelectNextScope?: () => void;
  onSelectPreviousScope?: () => void;
};

type ProgressListProps = {
  cards: ProgressViewModel["cards"];
  layout: ProgressLayout;
};

type ProgressSkeletonListProps = {
  count: number;
  layout: ProgressLayout;
};

function View({
  catalogError,
  filterControls,
  isLoading,
  model,
  onSelectNextScope,
  onSelectPreviousScope,
}: Props) {
  if (catalogError) {
    return (
      <Layout
        main={
          <div className={styles.ViewLoadError} role="alert">
            {catalogError}
          </div>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <Layout
        header={<ProgressOverviewSkeleton />}
        isLoading={true}
        main={
          <ProgressSkeletonList
            count={model.cards.length}
            layout={PROGRESS_CARD_LAYOUT}
          />
        }
      />
    );
  }

  return (
    <Layout
      header={
        <ProgressOverview
          filterControls={filterControls}
          onSelectNextScope={onSelectNextScope}
          onSelectPreviousScope={onSelectPreviousScope}
          selectedScope={model.selectedScope}
        />
      }
      labelledBy="progress-title"
      main={
        <ProgressList
          cards={model.cards}
          layout={PROGRESS_CARD_LAYOUT}
        />
      }
      mainLabel="Item type progress"
    />
  );
}

function ProgressList({ cards, layout }: ProgressListProps) {
  const listClassName = classNames(styles.ViewProgressList, {
    [styles.ViewProgressListExpanded]: layout === "expanded",
    [styles.ViewProgressListStacked]: layout === "stacked",
  });

  return (
    <div className={listClassName}>
      {cards.map((card) => (
        <ProgressView key={card.title} {...card} layout={layout} />
      ))}
    </div>
  );
}

function ProgressSkeletonList({
  count,
  layout,
}: ProgressSkeletonListProps) {
  const listClassName = classNames(styles.ViewProgressList, {
    [styles.ViewProgressListExpanded]: layout === "expanded",
    [styles.ViewProgressListStacked]: layout === "stacked",
  });

  return (
    <div className={listClassName}>
      {Array.from({ length: count }, (_, index) => (
        <ProgressSkeleton
          key={`stats-progress-skeleton-${index}`}
          layout={layout}
        />
      ))}
    </div>
  );
}

export { View };
