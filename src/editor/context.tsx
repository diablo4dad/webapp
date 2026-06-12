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

type EditorContextType = {
  activeCollection?: Collection;
  activeCollectionItemEditor?: CollectionItemEditorSession;
  canEditCatalog: boolean;
  closeCollectionItemEditor: () => void;
  isEditMode: boolean;
  openCollectionItemEditor: (
    collection: Collection,
    collectionItem?: CollectionItem,
  ) => void;
  setEditMode: (enabled: boolean) => void;
  toggleEditMode: () => void;
};

const defaultContext: EditorContextType = {
  activeCollection: undefined,
  activeCollectionItemEditor: undefined,
  canEditCatalog: false,
  closeCollectionItemEditor: () => undefined,
  isEditMode: false,
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
  const [activeCollectionItemEditor, setActiveCollectionItemEditor] =
    useState<CollectionItemEditorSession>();
  const canEditCatalog = user?.isEditor === true;

  useEffect(() => {
    if (!canEditCatalog) {
      setEditMode(false);
      setActiveCollectionItemEditor(undefined);
    }
  }, [canEditCatalog]);

  const contextValue = useMemo(
    () => ({
      activeCollection: activeCollectionItemEditor?.collection,
      activeCollectionItemEditor,
      canEditCatalog,
      closeCollectionItemEditor: () => setActiveCollectionItemEditor(undefined),
      isEditMode: canEditCatalog && isEditMode,
      openCollectionItemEditor: (
        collection: Collection,
        collectionItem?: CollectionItem,
      ) => {
        if (canEditCatalog && isEditMode) {
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
          setActiveCollectionItemEditor(undefined);
        }
        setEditMode(nextEnabled);
      },
      toggleEditMode: () =>
        setEditMode((enabled) => {
          const nextEnabled = !enabled && canEditCatalog;
          if (!nextEnabled) {
            setActiveCollectionItemEditor(undefined);
          }
          return nextEnabled;
        }),
    }),
    [activeCollectionItemEditor, canEditCatalog, isEditMode],
  );

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}
