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
import { ItemFilterWidget } from "../../features/settings/ui";
import type { ItemFilterCount } from "../../shared/lib/widget";
import Card from "../../shared/ui/Card";
import { Layout } from "./layout";
import styles from "./view.module.css";

const PROGRESS_CARD_LAYOUT = "expanded" satisfies ProgressLayout;

type Props = {
  catalogError?: string;
  filterControls?: readonly ProgressFilterControl[];
  itemFilterControls?: readonly ItemFilterControl[];
  isLoading: boolean;
  model: ProgressViewModel;
  onSelectNextScope?: () => void;
  onSelectPreviousScope?: () => void;
};

type ItemFilterControl = {
  active: boolean;
  count: ItemFilterCount;
  label: string;
  name: string;
  onClick: () => void;
};

type HeaderProps = {
  filterControls?: readonly ProgressFilterControl[];
  itemFilterControls?: readonly ItemFilterControl[];
  onSelectNextScope?: () => void;
  onSelectPreviousScope?: () => void;
  selectedScope: ProgressViewModel["selectedScope"];
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
  itemFilterControls,
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
        <Header
          filterControls={filterControls}
          itemFilterControls={itemFilterControls}
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

function Header({
  filterControls,
  itemFilterControls = [],
  onSelectNextScope,
  onSelectPreviousScope,
  selectedScope,
}: HeaderProps) {
  return (
    <div className={styles.ViewHeader}>
      <ProgressOverview
        filterControls={filterControls}
        onSelectNextScope={onSelectNextScope}
        onSelectPreviousScope={onSelectPreviousScope}
        selectedScope={selectedScope}
      />
      {itemFilterControls.length > 0 && (
        <Card
          className={styles.ViewItemFilters}
          role="group"
          aria-label="Item filters"
        >
          <div className={styles.ViewItemFilterGrid}>
            {itemFilterControls.map((control) => (
              <ItemFilterWidget
                key={control.name}
                active={control.active}
                count={control.count}
                label={control.label}
                onClick={control.onClick}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
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
