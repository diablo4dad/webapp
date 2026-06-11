import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../auth/context";
import { Collection } from "../data";

type EditorContextType = {
  activeCollection?: Collection;
  canEditCatalog: boolean;
  closeCollectionItemEditor: () => void;
  isEditMode: boolean;
  openCollectionItemEditor: (collection: Collection) => void;
  setEditMode: (enabled: boolean) => void;
  toggleEditMode: () => void;
};

const defaultContext: EditorContextType = {
  activeCollection: undefined,
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
  const [activeCollection, setActiveCollection] = useState<Collection>();
  const canEditCatalog = user?.isEditor === true;

  useEffect(() => {
    if (!canEditCatalog) {
      setEditMode(false);
      setActiveCollection(undefined);
    }
  }, [canEditCatalog]);

  const contextValue = useMemo(
    () => ({
      activeCollection,
      canEditCatalog,
      closeCollectionItemEditor: () => setActiveCollection(undefined),
      isEditMode: canEditCatalog && isEditMode,
      openCollectionItemEditor: (collection: Collection) => {
        if (canEditCatalog && isEditMode) {
          setActiveCollection(collection);
        }
      },
      setEditMode: (enabled: boolean) => {
        const nextEnabled = canEditCatalog && enabled;
        if (!nextEnabled) {
          setActiveCollection(undefined);
        }
        setEditMode(nextEnabled);
      },
      toggleEditMode: () =>
        setEditMode((enabled) => {
          const nextEnabled = !enabled && canEditCatalog;
          if (!nextEnabled) {
            setActiveCollection(undefined);
          }
          return nextEnabled;
        }),
    }),
    [activeCollection, canEditCatalog, isEditMode],
  );

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}
