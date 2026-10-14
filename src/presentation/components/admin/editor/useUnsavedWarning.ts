import { useEffect } from 'preact/hooks';

/** Asks before leaving the page while there are unsaved changes */
export const useUnsavedWarning = (dirty: boolean) => {
  useEffect(() => {
    if (!dirty) return undefined;

    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
};
