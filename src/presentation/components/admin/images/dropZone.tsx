import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';

const hasFiles = (e: DragEvent) =>
  e.dataTransfer?.types.includes('Files') ?? false;

// some systems report no type for photos the browser can't name, like HEIC;
// the upload tells those apart
const isImage = (file: File) => !file.type || file.type.startsWith('image/');

/**
 * An area photos can be dropped on from the desktop. Marked with `data-over`
 * while files are dragged over it.
 */
export const DropZone = ({
  className,
  disabled,
  onFiles,
  children,
}: {
  className?: string;
  disabled: boolean;
  onFiles: (files: File[]) => void;
  children: ComponentChildren;
}) => {
  const [over, setOver] = useState(false);

  return (
    <div
      className={className}
      data-over={over}
      onDragOver={e => {
        if (!hasFiles(e)) return;

        e.preventDefault();
        if (e.dataTransfer)
          e.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
        setOver(!disabled);
      }}
      onDragLeave={e => {
        // leaving into a child still counts as over
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOver(false);
        }
      }}
      onDrop={e => {
        if (!hasFiles(e)) return;

        e.preventDefault();
        setOver(false);

        const files = [...(e.dataTransfer?.files ?? [])].filter(isImage);
        if (!disabled && files.length > 0) onFiles(files);
      }}
    >
      {children}
    </div>
  );
};

/**
 * Keeps a photo dropped next to a drop zone from replacing the page, which
 * would throw away unsaved changes
 */
export const useNoFileNavigation = () => {
  useEffect(() => {
    // a drop zone handled it already on the way up
    const refuse = (e: DragEvent) => {
      if (!hasFiles(e) || e.defaultPrevented) return;

      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'none';
    };
    const stop = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };

    window.addEventListener('dragover', refuse);
    window.addEventListener('drop', stop);
    return () => {
      window.removeEventListener('dragover', refuse);
      window.removeEventListener('drop', stop);
    };
  }, []);
};
