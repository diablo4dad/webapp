import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import {
  DataminedJsonPreview,
  type JsonPath,
  type JsonPreviewState,
} from "./json-preview";
import styles from "./view.module.css";

function renderPreview(value: unknown) {
  const onResolveJsonReference = vi.fn();

  render(
    <DataminedJsonPreview
      jsonPreview={loaded(value)}
      onResolveJsonReference={onResolveJsonReference}
    />,
  );

  return {
    onResolveJsonReference,
  };
}

function loaded(
  value: unknown,
): Extract<JsonPreviewState, { status: "loaded" }> {
  return {
    status: "loaded",
    value,
  };
}

function ReferenceLoadHarness({
  onResolveJsonReference,
}: {
  onResolveJsonReference: (path: JsonPath, targetFileName: string) => void;
}) {
  const [value, setValue] = useState<unknown>({
    item: {
      tWrapper: {
        snoActor: {
          __targetFileName__: "base/meta/Actor/Azure_Actor.acr",
          groupName: "Actor",
        },
      },
    },
  });

  function resolveReference(path: JsonPath, targetFileName: string) {
    onResolveJsonReference(path, targetFileName);
    setValue({
      item: {
        tWrapper: {
          snoActor: {
            displayName: "Azure Actor",
            tPower: {
              tNested: {
                nNested: 99,
              },
              tTooDeep: {
                tHidden: {
                  nHidden: 1,
                },
              },
            },
          },
        },
      },
    });
  }

  return (
    <DataminedJsonPreview
      jsonPreview={loaded(value)}
      onResolveJsonReference={resolveReference}
    />
  );
}

describe("datamined json preview", () => {
  test("opens two levels deep and toggles nested containers", async () => {
    const user = userEvent.setup();

    renderPreview({
      item: {
        arTags: [
          "weapon",
        ],
        name: "Azure Blade",
        tStats: {
          nPower: 99,
        },
      },
    });

    const preview = screen.getByLabelText("Datamined file JSON");

    expect(preview).toHaveTextContent('"item"');
    expect(preview).toHaveTextContent('"name": "Azure Blade"');
    expect(screen.getByText('"weapon"')).toBeInTheDocument();
    expect(screen.getByText('"nPower"')).toBeInTheDocument();

    await user.click(screen.getByRole("button", {
      name: "Collapse tStats object",
    }));

    expect(screen.queryByText('"nPower"')).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", {
      name: "Collapse item object",
    }));

    expect(screen.queryByText('"name"')).not.toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Expand item object",
    })).toBeInTheDocument();
  });

  test("colours values and reference links", async () => {
    const user = userEvent.setup();
    const { onResolveJsonReference } = renderPreview({
      item: {
        arTags: [
          "weapon",
        ],
        bEnabled: true,
        eMagicType: 3,
        nLevel: 12,
        name: "Azure Blade",
        snoActor: {
          __targetFileName__: "base/meta/Actor/Azure_Actor.acr",
          groupName: "Actor",
        },
        tStats: {
          nPower: 99,
        },
        unk_def75bc: false,
      },
    });

    expect(screen.getByText('"arTags"')).not.toHaveAttribute("class");
    expect(screen.getByText('"bEnabled"')).not.toHaveAttribute("class");
    expect(screen.getByText('"eMagicType"')).not.toHaveAttribute("class");
    expect(screen.getByText('"nLevel"')).not.toHaveAttribute("class");
    expect(screen.getByText('"tStats"')).not.toHaveAttribute("class");
    expect(screen.getByText('"unk_def75bc"')).not.toHaveAttribute("class");
    expect(screen.getByText('"Azure Blade"'))
      .toHaveClass(styles.ViewJsonValueString);
    expect(screen.getByText("12"))
      .toHaveClass(styles.ViewJsonValueNumber);
    expect(screen.getByText("3"))
      .toHaveClass(styles.ViewJsonValueEnum);
    expect(screen.getByText("true"))
      .toHaveClass(styles.ViewJsonValueBoolean);
    expect(screen.getByText("false"))
      .toHaveClass(styles.ViewJsonValueUnknown);

    const referenceButton = screen.getByRole("button", {
      name: "Load snoActor reference base/meta/Actor/Azure_Actor.acr",
    });

    expect(referenceButton)
      .toHaveClass(styles.ViewJsonReferenceButton);

    await user.click(referenceButton);

    expect(onResolveJsonReference).toHaveBeenCalledWith(
      [
        "item",
        "snoActor",
      ],
      "base/meta/Actor/Azure_Actor.acr",
    );
    expect(screen.getByText('"__targetFileName__"'))
      .not.toHaveAttribute("class");
    expect(screen.getByText('"base/meta/Actor/Azure_Actor.acr"'))
      .toHaveClass(styles.ViewJsonValueMetadata);
  });

  test("opens loaded references relative to the embedded node", async () => {
    const user = userEvent.setup();
    const onResolveJsonReference = vi.fn();

    render(
      <ReferenceLoadHarness
        onResolveJsonReference={onResolveJsonReference}
      />,
    );

    expect(screen.queryByText('"displayName"')).not.toBeInTheDocument();
    expect(screen.queryByText('"nNested"')).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", {
      name: "Load snoActor reference base/meta/Actor/Azure_Actor.acr",
    }));

    expect(onResolveJsonReference).toHaveBeenCalledWith(
      [
        "item",
        "tWrapper",
        "snoActor",
      ],
      "base/meta/Actor/Azure_Actor.acr",
    );
    expect(await screen.findByText('"displayName"')).toBeInTheDocument();
    expect(screen.getByText('"nNested"')).toBeInTheDocument();
    expect(screen.queryByText('"nHidden"')).not.toBeInTheDocument();
  });
});
