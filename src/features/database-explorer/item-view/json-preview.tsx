import {
  Fragment,
  useState,
} from "react";
import styles from "./view.module.css";

type JsonPathSegment = string | number;
type JsonPath = readonly JsonPathSegment[];
type JsonContainerKind = "array" | "object";
type JsonDataType =
  | "array"
  | "boolean"
  | "enum"
  | "metadata"
  | "null"
  | "number"
  | "object"
  | "reference"
  | "string"
  | "unknown";
type JsonExpansionByPath = ReadonlyMap<string, boolean>;

type JsonPreviewState =
  | {
      status: "error";
      message: string;
    }
  | {
      status: "idle";
    }
  | {
      status: "loaded";
      loadingReferencePath?: JsonPath;
      referenceError?: {
        message: string;
        path: JsonPath;
      };
      value: unknown;
    }
  | {
      status: "loading";
    };

type Props = {
  ariaLabel?: string;
  jsonPreview: Extract<JsonPreviewState, { status: "loaded" }>;
  onResolveJsonReference: (
    path: JsonPath,
    targetFileName: string,
  ) => void;
};

type JsonValueProps = {
  containerDepth: number;
  defaultExpansionRootPaths: readonly JsonPath[];
  expansionByPath: JsonExpansionByPath;
  onAddDefaultExpansionRootPath: (path: JsonPath) => void;
  onResolveJsonReference: Props["onResolveJsonReference"];
  onSetContainerExpanded: (path: JsonPath, isExpanded: boolean) => void;
  path: JsonPath;
  propertyName?: string;
  state: Props["jsonPreview"];
  value: unknown;
};

type JsonPropertyNameProps = {
  name: string;
  onAddDefaultExpansionRootPath: JsonValueProps[
    "onAddDefaultExpansionRootPath"
  ];
  onResolveJsonReference: Props["onResolveJsonReference"];
  onSetContainerExpanded: JsonValueProps["onSetContainerExpanded"];
  path: JsonPath;
  state: Props["jsonPreview"];
  value: unknown;
};

type JsonCollapseButtonProps = {
  entryCount: number;
  isExpanded: boolean;
  kind: JsonContainerKind;
  path: JsonPath;
  propertyName?: string;
  onSetContainerExpanded: JsonValueProps["onSetContainerExpanded"];
};

type JsonPropertyTypeRule = {
  prefix: string;
  type: JsonDataType;
};

const JSON_INDENT_SIZE = 2;
const DEFAULT_OPEN_CONTAINER_DEPTH = 2;
const ROOT_JSON_PATH: JsonPath = [];
const PROPERTY_TYPE_RULES: readonly JsonPropertyTypeRule[] = [
  {
    prefix: "sno",
    type: "reference",
  },
  {
    prefix: "ar",
    type: "array",
  },
  {
    prefix: "pt",
    type: "array",
  },
  {
    prefix: "b",
    type: "boolean",
  },
  {
    prefix: "t",
    type: "object",
  },
  {
    prefix: "e",
    type: "enum",
  },
  {
    prefix: "dw",
    type: "number",
  },
  {
    prefix: "fl",
    type: "number",
  },
  {
    prefix: "n",
    type: "number",
  },
  {
    prefix: "h",
    type: "number",
  },
  {
    prefix: "unk",
    type: "unknown",
  },
];

function DataminedJsonPreview({
  ariaLabel = "Datamined file JSON",
  jsonPreview,
  onResolveJsonReference,
}: Props) {
  const [expansionByPath, setExpansionByPath] = useState<
    Map<string, boolean>
  >(() => new Map());
  const [
    referenceDefaultExpansionRootPaths,
    setReferenceDefaultExpansionRootPaths,
  ] = useState<readonly JsonPath[]>([]);
  const defaultExpansionRootPaths = [
    ROOT_JSON_PATH,
    ...referenceDefaultExpansionRootPaths,
  ];

  function setContainerExpanded(path: JsonPath, isExpanded: boolean) {
    setExpansionByPath((currentExpansionByPath) => {
      const nextExpansionByPath = new Map(currentExpansionByPath);

      nextExpansionByPath.set(createPathKey(path), isExpanded);

      return nextExpansionByPath;
    });
  }

  function addDefaultExpansionRootPath(path: JsonPath) {
    setReferenceDefaultExpansionRootPaths(
      (currentDefaultExpansionRootPaths) =>
        currentDefaultExpansionRootPaths.some((currentPath) =>
          pathsEqual(currentPath, path)
        )
          ? currentDefaultExpansionRootPaths
          : [
              ...currentDefaultExpansionRootPaths,
              path,
            ],
    );
  }

  return (
    <pre
      aria-label={ariaLabel}
      className={styles.ViewJsonPreview}
      tabIndex={0}
    >
      <JsonValue
        containerDepth={0}
        defaultExpansionRootPaths={defaultExpansionRootPaths}
        expansionByPath={expansionByPath}
        path={[]}
        state={jsonPreview}
        value={jsonPreview.value}
        onAddDefaultExpansionRootPath={addDefaultExpansionRootPath}
        onResolveJsonReference={onResolveJsonReference}
        onSetContainerExpanded={setContainerExpanded}
      />
    </pre>
  );
}

function JsonValue({
  containerDepth,
  defaultExpansionRootPaths,
  expansionByPath,
  onAddDefaultExpansionRootPath,
  onResolveJsonReference,
  onSetContainerExpanded,
  path,
  propertyName,
  state,
  value,
}: JsonValueProps) {
  if (Array.isArray(value)) {
    return (
      <JsonArray
        containerDepth={containerDepth}
        defaultExpansionRootPaths={defaultExpansionRootPaths}
        expansionByPath={expansionByPath}
        path={path}
        propertyName={propertyName}
        state={state}
        value={value}
        onAddDefaultExpansionRootPath={onAddDefaultExpansionRootPath}
        onResolveJsonReference={onResolveJsonReference}
        onSetContainerExpanded={onSetContainerExpanded}
      />
    );
  }

  if (isRecord(value)) {
    return (
      <JsonObject
        containerDepth={containerDepth}
        defaultExpansionRootPaths={defaultExpansionRootPaths}
        expansionByPath={expansionByPath}
        path={path}
        propertyName={propertyName}
        state={state}
        value={value}
        onAddDefaultExpansionRootPath={onAddDefaultExpansionRootPath}
        onResolveJsonReference={onResolveJsonReference}
        onSetContainerExpanded={onSetContainerExpanded}
      />
    );
  }

  return <JsonPrimitive propertyName={propertyName} value={value} />;
}

function JsonObject({
  containerDepth,
  defaultExpansionRootPaths,
  expansionByPath,
  onAddDefaultExpansionRootPath,
  onResolveJsonReference,
  onSetContainerExpanded,
  path,
  propertyName,
  state,
  value,
}: JsonValueProps & { value: Record<string, unknown> }) {
  const entries = Object.entries(value);

  if (entries.length === 0) {
    return <JsonContainerShell kind="object" />;
  }

  const isExpanded = getContainerExpanded({
    defaultExpansionRootPaths,
    expansionByPath,
    path,
  });

  if (!isExpanded) {
    return (
      <>
        <JsonCollapseButton
          entryCount={entries.length}
          isExpanded={false}
          kind="object"
          path={path}
          propertyName={propertyName}
          onSetContainerExpanded={onSetContainerExpanded}
        />
        <JsonCollapsedContainer entryCount={entries.length} kind="object" />
      </>
    );
  }

  return (
    <>
      <JsonCollapseButton
        entryCount={entries.length}
        isExpanded
        kind="object"
        path={path}
        propertyName={propertyName}
        onSetContainerExpanded={onSetContainerExpanded}
      />
      <span className={styles.ViewJsonObjectDelimiter}>{"{"}</span>
      {"\n"}
      {entries.map(([name, entryValue], index) => {
        const entryPath = [...path, name];

        return (
          <Fragment key={name}>
            {createIndent(containerDepth + JSON_INDENT_SIZE)}
            <JsonPropertyName
              name={name}
              onAddDefaultExpansionRootPath={onAddDefaultExpansionRootPath}
              path={entryPath}
              state={state}
              value={entryValue}
              onResolveJsonReference={onResolveJsonReference}
              onSetContainerExpanded={onSetContainerExpanded}
            />
            <span className={styles.ViewJsonPunctuation}>{": "}</span>
            <JsonValue
              containerDepth={containerDepth + JSON_INDENT_SIZE}
              defaultExpansionRootPaths={defaultExpansionRootPaths}
              expansionByPath={expansionByPath}
              path={entryPath}
              propertyName={name}
              state={state}
              value={entryValue}
              onAddDefaultExpansionRootPath={onAddDefaultExpansionRootPath}
              onResolveJsonReference={onResolveJsonReference}
              onSetContainerExpanded={onSetContainerExpanded}
            />
            {index < entries.length - 1 && (
              <span className={styles.ViewJsonPunctuation}>{","}</span>
            )}
            {"\n"}
          </Fragment>
        );
      })}
      {createIndent(containerDepth)}
      <span className={styles.ViewJsonObjectDelimiter}>{"}"}</span>
    </>
  );
}

function JsonArray({
  containerDepth,
  defaultExpansionRootPaths,
  expansionByPath,
  onAddDefaultExpansionRootPath,
  onResolveJsonReference,
  onSetContainerExpanded,
  path,
  propertyName,
  state,
  value,
}: JsonValueProps & { value: unknown[] }) {
  if (value.length === 0) {
    return <JsonContainerShell kind="array" />;
  }

  const isExpanded = getContainerExpanded({
    defaultExpansionRootPaths,
    expansionByPath,
    path,
  });

  if (!isExpanded) {
    return (
      <>
        <JsonCollapseButton
          entryCount={value.length}
          isExpanded={false}
          kind="array"
          path={path}
          propertyName={propertyName}
          onSetContainerExpanded={onSetContainerExpanded}
        />
        <JsonCollapsedContainer entryCount={value.length} kind="array" />
      </>
    );
  }

  return (
    <>
      <JsonCollapseButton
        entryCount={value.length}
        isExpanded
        kind="array"
        path={path}
        propertyName={propertyName}
        onSetContainerExpanded={onSetContainerExpanded}
      />
      <span className={styles.ViewJsonArrayDelimiter}>{"["}</span>
      {"\n"}
      {value.map((entryValue, index) => {
        const entryPath = [...path, index];

        return (
          <Fragment key={index}>
            {createIndent(containerDepth + JSON_INDENT_SIZE)}
            <JsonValue
              containerDepth={containerDepth + JSON_INDENT_SIZE}
              defaultExpansionRootPaths={defaultExpansionRootPaths}
              expansionByPath={expansionByPath}
              path={entryPath}
              state={state}
              value={entryValue}
              onAddDefaultExpansionRootPath={onAddDefaultExpansionRootPath}
              onResolveJsonReference={onResolveJsonReference}
              onSetContainerExpanded={onSetContainerExpanded}
            />
            {index < value.length - 1 && (
              <span className={styles.ViewJsonPunctuation}>{","}</span>
            )}
            {"\n"}
          </Fragment>
        );
      })}
      {createIndent(containerDepth)}
      <span className={styles.ViewJsonArrayDelimiter}>{"]"}</span>
    </>
  );
}

function JsonCollapseButton({
  entryCount,
  isExpanded,
  kind,
  path,
  propertyName,
  onSetContainerExpanded,
}: JsonCollapseButtonProps) {
  const action = isExpanded ? "Collapse" : "Expand";
  const target = propertyName ?? "root";

  return (
    <button
      aria-label={`${action} ${target} ${kind}`}
      className={styles.ViewJsonCollapseButton}
      data-expanded={isExpanded ? "true" : "false"}
      title={`${action} ${target} ${kind} (${formatEntryCount(
        entryCount,
        kind,
      )})`}
      type="button"
      onClick={() => onSetContainerExpanded(path, !isExpanded)}
    />
  );
}

function JsonPropertyName({
  name,
  onAddDefaultExpansionRootPath,
  onResolveJsonReference,
  onSetContainerExpanded,
  path,
  state,
  value,
}: JsonPropertyNameProps) {
  const targetFileName = getJsonReferenceTargetFileName(name, value);

  if (!targetFileName) {
    return (
      <span>
        {JSON.stringify(name)}
      </span>
    );
  }

  const isLoading = pathsEqual(path, state.loadingReferencePath);
  const error = pathsEqual(path, state.referenceError?.path)
    ? state.referenceError
    : undefined;

  return (
    <>
      <button
        aria-label={`Load ${name} reference ${targetFileName}`}
        className={styles.ViewJsonReferenceButton}
        disabled={isLoading}
        type="button"
        onClick={() => {
          onAddDefaultExpansionRootPath(path);
          onSetContainerExpanded(path, true);
          onResolveJsonReference(path, targetFileName);
        }}
      >
        {JSON.stringify(name)}
      </button>
      {isLoading && (
        <span className={styles.ViewJsonReferenceStatus}> loading</span>
      )}
      {error && (
        <span className={styles.ViewJsonReferenceError}>
          {" "}
          {error.message}
        </span>
      )}
    </>
  );
}

function JsonPrimitive({
  propertyName,
  value,
}: {
  propertyName?: string;
  value: unknown;
}) {
  return (
    <span className={getJsonValueTypeClassName(
      propertyName
        ? getJsonPropertyDataType(propertyName, value)
        : getJsonValueDataType(value),
    )}>
      {formatJsonPrimitive(value)}
    </span>
  );
}

function JsonContainerShell({ kind }: { kind: JsonContainerKind }) {
  return (
    <span
      className={
        kind === "array"
          ? styles.ViewJsonArrayDelimiter
          : styles.ViewJsonObjectDelimiter
      }
    >
      {kind === "array" ? "[]" : "{}"}
    </span>
  );
}

function JsonCollapsedContainer({
  entryCount,
  kind,
}: {
  entryCount: number;
  kind: JsonContainerKind;
}) {
  const openingDelimiter = kind === "array" ? "[" : "{";
  const closingDelimiter = kind === "array" ? "]" : "}";

  return (
    <span
      className={
        kind === "array"
          ? styles.ViewJsonArrayDelimiter
          : styles.ViewJsonObjectDelimiter
      }
    >
      {openingDelimiter}
      <span className={styles.ViewJsonCollapsedSummary}>
        {"... "}
        {formatEntryCount(entryCount, kind)}
      </span>
      {closingDelimiter}
    </span>
  );
}

function getJsonReferenceTargetFileName(
  propertyName: string,
  value: unknown,
): string | undefined {
  if (!propertyName.toLowerCase().startsWith("sno") || !isRecord(value)) {
    return undefined;
  }

  const targetFileName = value["__targetFileName__"];

  return typeof targetFileName === "string" && targetFileName.trim().length > 0
    ? targetFileName
    : undefined;
}

function getContainerExpanded({
  defaultExpansionRootPaths,
  expansionByPath,
  path,
}: {
  defaultExpansionRootPaths: readonly JsonPath[];
  expansionByPath: JsonExpansionByPath;
  path: JsonPath;
}): boolean {
  return expansionByPath.get(createPathKey(path))
    ?? isPathOpenByDefault(path, defaultExpansionRootPaths);
}

function isPathOpenByDefault(
  path: JsonPath,
  defaultExpansionRootPaths: readonly JsonPath[],
): boolean {
  return defaultExpansionRootPaths.some((rootPath) =>
    isPathWithinRoot(path, rootPath) &&
    path.length - rootPath.length <= DEFAULT_OPEN_CONTAINER_DEPTH
  );
}

function isPathWithinRoot(path: JsonPath, rootPath: JsonPath): boolean {
  return (
    rootPath.length <= path.length &&
    rootPath.every((segment, index) => segment === path[index])
  );
}

function getJsonPropertyDataType(
  propertyName: string,
  value: unknown,
): JsonDataType {
  if (propertyName.startsWith("__")) {
    return "metadata";
  }

  const matchedRule = PROPERTY_TYPE_RULES.find((rule) =>
    hasJsonPropertyTypePrefix(propertyName, rule.prefix)
  );

  return matchedRule?.type ?? getJsonValueDataType(value);
}

function getJsonValueDataType(value: unknown): JsonDataType {
  if (Array.isArray(value)) {
    return "array";
  }

  if (value === null) {
    return "null";
  }

  switch (typeof value) {
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "object":
      return "object";
    case "string":
      return "string";
    default:
      return "unknown";
  }
}

function hasJsonPropertyTypePrefix(
  propertyName: string,
  prefix: string,
): boolean {
  if (!propertyName.toLowerCase().startsWith(prefix)) {
    return false;
  }

  return isJsonTypePrefixBoundary(propertyName.charAt(prefix.length));
}

function isJsonTypePrefixBoundary(character: string): boolean {
  return (
    character.length === 0 ||
    character === "_" ||
    isAsciiDigit(character) ||
    isAsciiUppercase(character)
  );
}

function isAsciiDigit(character: string): boolean {
  return character >= "0" && character <= "9";
}

function isAsciiUppercase(character: string): boolean {
  return character >= "A" && character <= "Z";
}

function getJsonValueTypeClassName(dataType: JsonDataType): string {
  switch (dataType) {
    case "boolean":
      return styles.ViewJsonValueBoolean;
    case "enum":
      return styles.ViewJsonValueEnum;
    case "metadata":
      return styles.ViewJsonValueMetadata;
    case "number":
      return styles.ViewJsonValueNumber;
    case "null":
      return styles.ViewJsonValueNull;
    case "string":
      return styles.ViewJsonValueString;
    case "array":
    case "object":
    case "reference":
    case "unknown":
      return styles.ViewJsonValueUnknown;
  }
}

function pathsEqual(
  left: JsonPath | undefined,
  right: JsonPath | undefined,
): boolean {
  return (
    left !== undefined &&
    right !== undefined &&
    left.length === right.length &&
    left.every((segment, index) => segment === right[index])
  );
}

function createPathKey(path: JsonPath): string {
  return JSON.stringify(path);
}

function createIndent(size: number): string {
  return " ".repeat(size);
}

function formatJsonPrimitive(value: unknown): string {
  return JSON.stringify(value) ?? "undefined";
}

function formatEntryCount(
  entryCount: number,
  kind: JsonContainerKind,
): string {
  if (kind === "array") {
    return `${entryCount} item${entryCount === 1 ? "" : "s"}`;
  }

  return `${entryCount} ${entryCount === 1 ? "property" : "properties"}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export { DataminedJsonPreview };
export type { JsonPath, JsonPreviewState };
