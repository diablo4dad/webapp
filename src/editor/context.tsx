import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../auth/context";
import { Collection, CollectionItem } from "../data";

export type CollectionItemEditorMode = "add" | "edit";

export type CollectionItemEditorSession = {
  collection: Collection;
  collectionItem?: CollectionItem;
  mode: CollectionItemEditorMode;
};

export type CollectionEditorMode = "add" | "edit";

export type CollectionEditorSession = {
  category?: string;
  collection?: Collection;
  mode: CollectionEditorMode;
  parentCollection?: Collection;
};

type EditorContextType = {
  activeCollection?: Collection;
  activeCollectionEditor?: CollectionEditorSession;
  activeCollectionItemEditor?: CollectionItemEditorSession;
  canEditCatalog: boolean;
  closeCollectionEditor: () => void;
  closeCollectionItemEditor: () => void;
  isEditMode: boolean;
  openCollectionCreator: (
    parentCollection: Collection | undefined,
    category: string,
  ) => void;
  openCollectionEditor: (
    collection: Collection,
    parentCollection?: Collection,
  ) => void;
  openCollectionItemEditor: (
    collection: Collection,
    collectionItem?: CollectionItem,
  ) => void;
  setEditMode: (enabled: boolean) => void;
  toggleEditMode: () => void;
};

const defaultContext: EditorContextType = {
  activeCollection: undefined,
  activeCollectionEditor: undefined,
  activeCollectionItemEditor: undefined,
  canEditCatalog: false,
  closeCollectionEditor: () => undefined,
  closeCollectionItemEditor: () => undefined,
  isEditMode: false,
  openCollectionCreator: () => undefined,
  openCollectionEditor: () => undefined,
  openCollectionItemEditor: () => undefined,
  setEditMode: () => undefined,
  toggleEditMode: () => undefined,
};

const EditorContext = createContext<EditorContextType>(defaultContext);

export function useEditor() {
  return useContext(EditorContext);
}

export function EditorProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [isEditMode, setEditMode] = useState(false);
  const [activeCollectionEditor, setActiveCollectionEditor] =
    useState<CollectionEditorSession>();
  const [activeCollectionItemEditor, setActiveCollectionItemEditor] =
    useState<CollectionItemEditorSession>();
  const canEditCatalog = user?.isEditor === true;

  useEffect(() => {
    if (!canEditCatalog) {
      setEditMode(false);
      setActiveCollectionEditor(undefined);
      setActiveCollectionItemEditor(undefined);
    }
  }, [canEditCatalog]);

  const contextValue = useMemo(
    () => ({
      activeCollection: activeCollectionItemEditor?.collection,
      activeCollectionEditor,
      activeCollectionItemEditor,
      canEditCatalog,
      closeCollectionEditor: () => setActiveCollectionEditor(undefined),
      closeCollectionItemEditor: () => setActiveCollectionItemEditor(undefined),
      isEditMode: canEditCatalog && isEditMode,
      openCollectionCreator: (
        parentCollection: Collection | undefined,
        category: string,
      ) => {
        if (canEditCatalog && isEditMode) {
          setActiveCollectionItemEditor(undefined);
          setActiveCollectionEditor({
            category,
            mode: "add",
            parentCollection,
          });
        }
      },
      openCollectionEditor: (
        collection: Collection,
        parentCollection?: Collection,
      ) => {
        if (canEditCatalog && isEditMode) {
          setActiveCollectionItemEditor(undefined);
          setActiveCollectionEditor({
            collection,
            mode: "edit",
            parentCollection,
          });
        }
      },
      openCollectionItemEditor: (
        collection: Collection,
        collectionItem?: CollectionItem,
      ) => {
        if (canEditCatalog && isEditMode) {
          setActiveCollectionEditor(undefined);
          setActiveCollectionItemEditor({
            collection,
            collectionItem,
            mode: collectionItem ? "edit" : "add",
          });
        }
      },
      setEditMode: (enabled: boolean) => {
        const nextEnabled = canEditCatalog && enabled;
        if (!nextEnabled) {
          setActiveCollectionEditor(undefined);
          setActiveCollectionItemEditor(undefined);
        }
        setEditMode(nextEnabled);
      },
      toggleEditMode: () =>
        setEditMode((enabled) => {
          const nextEnabled = !enabled && canEditCatalog;
          if (!nextEnabled) {
            setActiveCollectionEditor(undefined);
            setActiveCollectionItemEditor(undefined);
          }
          return nextEnabled;
        }),
    }),
    [
      activeCollectionEditor,
      activeCollectionItemEditor,
      canEditCatalog,
      isEditMode,
    ],
  );

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}
