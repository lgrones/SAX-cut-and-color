import '../admin.css';

import {
  type Focus,
  type ImageSlot,
  SiteImage,
  type SiteImages,
} from '@domain/image';
import type { ComponentChildren } from 'preact';
import { useRef, useState } from 'preact/hooks';

import { moveItem } from '../editor/dragTarget';
import { TrashIcon, UploadIcon } from '../editor/icons';
import { DragHint, ReorderItem } from '../editor/reorderItem';
import { SaveBar, StatusBanner, UndoNote } from '../editor/saveBar';
import { type EditorStatus, saveRequest } from '../editor/saveRequest';
import { useDragReorder } from '../editor/useDragReorder';
import { useUnsavedWarning } from '../editor/useUnsavedWarning';
import { DropZone, useNoFileNavigation } from './dropZone';
import { focusAt, nudge } from './focusAt';
import { type UploadedImage, uploadPhoto } from './uploadPhoto';

type GalleryDraft = UploadedImage & { alt: string };

export interface EditorImages {
  hero?: UploadedImage;
  portrait?: UploadedImage;
  gallery: GalleryDraft[];
}

interface Removed {
  draft: GalleryDraft;
  index: number;
}

// The shapes a gallery tile takes in the page grid, across breakpoints
const galleryAspects = [1, 2, 1 / 2, 3 / 2];

const payload = ({ hero, portrait, gallery }: EditorImages) => ({
  hero: hero ? { id: hero.id, focus: hero.focus } : null,
  portrait: portrait ? { id: portrait.id, focus: portrait.focus } : null,
  gallery: gallery.map(({ id, focus, alt }) => ({ id, focus, alt })),
});

export const ImagesEditor = ({ images }: { images: EditorImages }) => {
  const [saved, setSaved] = useState(images);
  const [draft, setDraft] = useState(images);
  const [removed, setRemoved] = useState<Removed[]>([]);
  const [openKey, setOpenKey] = useState<string>();
  const [uploading, setUploading] = useState(0);
  const [status, setStatus] = useState<EditorStatus>({ kind: 'idle' });

  const dirty =
    removed.length > 0 ||
    JSON.stringify(payload(draft)) !== JSON.stringify(payload(saved));
  const invalid = draft.gallery.some(x => SiteImage.problem(x));

  useUnsavedWarning(dirty || uploading > 0);
  useNoFileNavigation();

  const edit = (update: (prev: EditorImages) => EditorImages) => {
    setDraft(update);
    setStatus({ kind: 'idle' });
  };

  const changeGallery = (id: string, patch: Partial<GalleryDraft>) =>
    edit(prev => ({
      ...prev,
      gallery: prev.gallery.map(x => (x.id === id ? { ...x, ...patch } : x)),
    }));

  const move = (id: string, to: (from: number) => number) =>
    edit(prev => {
      const from = prev.gallery.findIndex(x => x.id === id);
      return { ...prev, gallery: moveItem(prev.gallery, from, to(from)) };
    });

  const { dragKey, startDrag } = useDragReorder((key, to) =>
    move(key, () => to),
  );

  /** Uploads one after another, so a phone on a weak connection keeps up */
  const upload = async (files: File[], add: (image: UploadedImage) => void) => {
    setUploading(prev => prev + files.length);

    for (const file of files) {
      const result = await uploadPhoto(file);
      setUploading(prev => prev - 1);

      if (result.ok) add(result.data as UploadedImage);
      else setStatus(result.status);
    }
  };

  const addToGallery = (files: File[]) =>
    void upload(files, image => {
      edit(prev => ({
        ...prev,
        gallery: [...prev.gallery, { ...image, alt: '' }],
      }));
      setOpenKey(image.id);
    });

  const remove = (id: string) => {
    const index = draft.gallery.findIndex(x => x.id === id);
    const image = draft.gallery[index];
    if (!image) return;

    setRemoved(prev => [...prev, { draft: image, index }]);
    edit(prev => ({ ...prev, gallery: prev.gallery.toSpliced(index, 1) }));
  };

  const undo = () => {
    const last = removed.at(-1);
    if (!last) return;

    setRemoved(prev => prev.slice(0, -1));
    edit(prev => ({
      ...prev,
      gallery: prev.gallery.toSpliced(last.index, 0, last.draft),
    }));
  };

  const submit = async (e: Event) => {
    e.preventDefault();
    setStatus({ kind: 'saving' });

    const result = await saveRequest('/api/images', payload(draft));
    if (!result.ok) {
      setStatus(result.status);
      return;
    }

    // the server answers with the stored images; their originals are known
    const stored = result.data as SiteImages;
    const src = new Map(
      [draft.hero, draft.portrait, ...draft.gallery].flatMap(x =>
        x ? [[x.id, x.src] as const] : [],
      ),
    );
    const withSrc = <T extends SiteImage>(image: T) => ({
      ...image,
      src: src.get(image.id) ?? '',
    });
    const next: EditorImages = {
      ...(stored.hero && { hero: withSrc(stored.hero) }),
      ...(stored.portrait && { portrait: withSrc(stored.portrait) }),
      gallery: stored.gallery.map(withSrc),
    };

    setSaved(next);
    setDraft(next);
    setRemoved([]);
    setStatus({ kind: 'saved' });
  };

  const lastRemoved = removed.at(-1);
  const slot = (name: ImageSlot) => (
    <SlotCard
      slot={name}
      image={draft[name]}
      uploading={uploading > 0}
      onFocus={focus =>
        edit(prev => {
          const image = prev[name];
          return image ? { ...prev, [name]: { ...image, focus } } : prev;
        })
      }
      onReplace={file =>
        void upload([file], image => edit(prev => ({ ...prev, [name]: image })))
      }
    />
  );

  return (
    <form onSubmit={e => void submit(e)} autocomplete="off" noValidate>
      <StatusBanner
        status={status}
        savedText="Bilder gespeichert"
        onClose={() => setStatus({ kind: 'idle' })}
      />

      <div className="panel">
        <div className="slots">
          {slot('hero')}
          {slot('portrait')}
        </div>

        <div className="gallery-head">
          <h2>Galerie</h2>
          <p>
            Reihenfolge wie auf der Seite. Jedes Bild braucht eine kurze
            Beschreibung.
          </p>
        </div>

        <DragHint />

        {draft.gallery.length === 0 && (
          <p className="list-empty">Noch keine Bilder in der Galerie.</p>
        )}

        <ol className="reorder-list" data-reorder>
          {draft.gallery.map(image => (
            <ReorderItem
              key={image.id}
              itemKey={image.id}
              title={image.alt}
              preview={`${image.width} × ${image.height}`}
              problem={SiteImage.problem(image)}
              open={openKey === image.id}
              dragging={dragKey === image.id}
              onToggle={() =>
                setOpenKey(prev => (prev === image.id ? undefined : image.id))
              }
              onDragStart={e => startDrag(image.id, e)}
              onStep={by => move(image.id, from => from + by)}
              media={
                <img
                  className="thumb"
                  src={image.src}
                  alt=""
                  style={{
                    objectPosition: SiteImage.objectPosition(image.focus),
                  }}
                />
              }
            >
              <FocusPicker
                image={image}
                aspects={galleryAspects}
                onChange={focus => changeGallery(image.id, { focus })}
              />

              <div>
                <label className="label" htmlFor={'alt-' + image.id}>
                  Bildbeschreibung
                </label>
                <textarea
                  id={'alt-' + image.id}
                  className="input"
                  rows={2}
                  placeholder="z. B. Zwei Frisierplätze mit Pop-Art-Bildern"
                  value={image.alt}
                  aria-invalid={!!SiteImage.problem(image)}
                  onInput={e =>
                    changeGallery(image.id, { alt: e.currentTarget.value })
                  }
                />
              </div>

              <button
                type="button"
                className="button button-secondary button-danger"
                onClick={() => remove(image.id)}
              >
                <TrashIcon />
                Bild entfernen
              </button>
            </ReorderItem>
          ))}
        </ol>

        <DropZone
          className="drop-field"
          disabled={uploading > 0}
          onFiles={addToGallery}
        >
          <UploadIcon />
          <p className="drop-hint">Bilder hierher ziehen oder</p>
          <FileButton multiple disabled={uploading > 0} onFiles={addToGallery}>
            Bilder wählen
          </FileButton>
        </DropZone>

        <SaveBar
          status={status}
          dirty={dirty}
          invalid={invalid || uploading > 0}
          onDiscard={() => {
            setDraft(saved);
            setRemoved([]);
            setOpenKey(undefined);
            setStatus({ kind: 'idle' });
          }}
        >
          {uploading > 0 ? (
            <span>Wird hochgeladen …</span>
          ) : (
            lastRemoved && (
              <UndoNote label={lastRemoved.draft.alt} onUndo={undo} />
            )
          )}
        </SaveBar>
      </div>
    </form>
  );
};

const SlotCard = ({
  slot,
  image,
  uploading,
  onFocus,
  onReplace,
}: {
  slot: ImageSlot;
  image: UploadedImage | undefined;
  uploading: boolean;
  onFocus: (focus: Focus) => void;
  onReplace: (file: File) => void;
}) => {
  const { label, aspect } = SiteImage.slots[slot];
  const [editing, setEditing] = useState(false);

  const replace = ([file]: File[]) => {
    if (!file) return;
    onReplace(file);
    setEditing(false);
  };

  return (
    <DropZone className="slot" disabled={uploading} onFiles={replace}>
      <h2>{label}</h2>

      {image ? (
        editing ? (
          <FocusPicker image={image} aspects={[aspect]} onChange={onFocus} />
        ) : (
          <img
            className="slot-preview"
            src={image.src}
            alt=""
            style={{
              aspectRatio: String(aspect),
              objectPosition: SiteImage.objectPosition(image.focus),
            }}
          />
        )
      ) : (
        <div className="slot-empty" style={{ aspectRatio: String(aspect) }}>
          <UploadIcon />
          <span>
            Noch kein Bild
            <span className="drop-hint"> – hierher ziehen</span>
          </span>
        </div>
      )}

      <div className="slot-actions">
        <FileButton disabled={uploading} onFiles={replace}>
          {image ? 'Ersetzen' : 'Bild wählen'}
        </FileButton>

        {image && (
          <button
            type="button"
            className="button button-secondary"
            aria-pressed={editing}
            onClick={() => setEditing(prev => !prev)}
          >
            {editing ? 'Fertig' : 'Ausschnitt'}
          </button>
        )}
      </div>
    </DropZone>
  );
};

/** Tap or drag on the photo to set what must stay visible when it's cropped */
const FocusPicker = ({
  image,
  aspects,
  onChange,
}: {
  image: UploadedImage;
  aspects: number[];
  onChange: (focus: Focus) => void;
}) => {
  const pick = (e: PointerEvent) => {
    const frame = e.currentTarget as HTMLElement;
    onChange(focusAt(frame.getBoundingClientRect(), e.clientX, e.clientY));
  };

  return (
    <div className="focus-picker">
      <div
        className="focus-frame"
        role="group"
        tabIndex={0}
        aria-label={`Bildausschnitt, Mitte bei ${Math.round(image.focus.x * 100)} % / ${Math.round(image.focus.y * 100)} %. Mit den Pfeiltasten verschieben.`}
        style={{ aspectRatio: `${image.width} / ${image.height}` }}
        onPointerDown={e => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e);
        }}
        onPointerMove={e => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e);
        }}
        onKeyDown={e => {
          const steps: Record<string, [number, number]> = {
            ArrowLeft: [-0.05, 0],
            ArrowRight: [0.05, 0],
            ArrowUp: [0, -0.05],
            ArrowDown: [0, 0.05],
          };
          const step = steps[e.key];
          if (!step) return;
          e.preventDefault();
          onChange(nudge(image.focus, ...step));
        }}
      >
        <img src={image.src} alt="" draggable={false} />
        <span
          className="focus-dot"
          style={{
            left: `${image.focus.x * 100}%`,
            top: `${image.focus.y * 100}%`,
          }}
        />
      </div>

      <p className="focus-hint">
        Tippen oder ziehen Sie auf das Wichtigste im Bild. Die Vorschau zeigt,
        wie es auf der Seite zugeschnitten wird.
      </p>

      <div className="focus-previews">
        {aspects.map(aspect => (
          <img
            key={aspect}
            className="focus-preview"
            src={image.src}
            alt=""
            style={{
              aspectRatio: String(aspect),
              objectPosition: SiteImage.objectPosition(image.focus),
            }}
          />
        ))}
      </div>
    </div>
  );
};

/** A button that opens the photo picker; on phones it offers the camera too */
const FileButton = ({
  multiple = false,
  disabled,
  onFiles,
  children,
}: {
  multiple?: boolean;
  disabled: boolean;
  onFiles: (files: File[]) => void;
  children: ComponentChildren;
}) => {
  const input = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={e => {
          onFiles([...(e.currentTarget.files ?? [])]);
          e.currentTarget.value = '';
        }}
      />
      <button
        type="button"
        className="button button-secondary"
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        {children}
      </button>
    </>
  );
};
