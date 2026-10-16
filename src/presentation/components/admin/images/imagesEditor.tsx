import '../admin.css';

import type {
  EditableImage,
  EditableImages,
} from '@business/images/withOriginals';
import { type Focus, type ImageSlot, SiteImage } from '@domain/image';
import { useForm } from '@mantine/form';
import { type PointerEvent, type ReactNode, useRef, useState } from 'react';

import { TrashIcon, UploadIcon } from '../editor/icons';
import { DragHint, ReorderItem } from '../editor/reorderItem';
import { SaveBar, StatusBanner } from '../editor/saveBar';
import { type EditorStatus, saveRequest } from '../editor/saveRequest';
import { useDragReorder } from '../editor/useDragReorder';
import { useUnsavedWarning } from '../editor/useUnsavedWarning';
import { DropZone, useNoFileNavigation } from './dropZone';
import { focusAt, nudge } from './focusAt';
import { uploadPhoto } from './uploadPhoto';

// The shapes a gallery tile takes in the page grid, across breakpoints
const galleryAspects = [1, 2, 1 / 2, 3 / 2];

export const ImagesEditor = ({ images }: { images: EditableImages }) => {
  const [status, setStatus] = useState<EditorStatus>({ kind: 'idle' });
  const [openKey, setOpenKey] = useState<string>();
  const [uploading, setUploading] = useState(0);

  // Controlled, since every row shows its description and crop while editing
  const form = useForm<EditableImages>({
    mode: 'controlled',
    initialValues: images,
    onValuesChange: () => setStatus({ kind: 'idle' }),
  });

  const gallery = form.values.gallery;
  // no new files while uploading, nor while a save runs
  const busy = uploading > 0 || form.submitting;

  useUnsavedWarning(form.isDirty() || uploading > 0);
  useNoFileNavigation();

  const { dragKey, startDrag } = useDragReorder((key, to) =>
    form.reorderListItem('gallery', {
      from: gallery.findIndex(x => x.id === key),
      to,
    }),
  );

  /** Uploads one after another, so a phone on a weak connection keeps up */
  const upload = async (files: File[], add: (image: EditableImage) => void) => {
    setUploading(prev => prev + files.length);

    for (const file of files) {
      const result = await uploadPhoto(file);
      setUploading(prev => prev - 1);

      if (result.ok) add(result.data as EditableImage);
      else setStatus(result.status);
    }
  };

  const addToGallery = (files: File[]) =>
    void upload(files, image => {
      form.insertListItem('gallery', { ...image, alt: '' });
      setOpenKey(image.id);
    });

  // Saving replaces the stored images; the answer is the new starting point
  const submit = form.onSubmit(async values => {
    const result = await saveRequest('/api/images', values);

    if (!result.ok) {
      setStatus(result.status);
      return;
    }

    form.setInitialValues(result.data as EditableImages);
    form.reset();
    setStatus({ kind: 'saved' });
  });

  const shown: EditorStatus = form.submitting ? { kind: 'saving' } : status;

  return (
    <form onSubmit={submit} autoComplete="off" noValidate>
      <StatusBanner
        status={shown}
        savedText="Bilder gespeichert"
        onClose={() => setStatus({ kind: 'idle' })}
      />

      <fieldset className="panel" disabled={form.submitting}>
        <div className="slots">
          {SiteImage.slotNames.map(name => (
            <SlotCard
              key={name}
              slot={name}
              image={form.values[name]}
              busy={busy}
              onFocus={focus => form.setFieldValue(`${name}.focus`, focus)}
              onReplace={file =>
                void upload([file], image => form.setFieldValue(name, image))
              }
              onRemove={() => form.setFieldValue(name, undefined)}
            />
          ))}
        </div>

        <div className="gallery-head">
          <h2>Galerie</h2>
          <p>
            Reihenfolge wie auf der Seite. Jedes Bild braucht eine kurze
            Beschreibung.
          </p>
        </div>

        <DragHint />

        {gallery.length === 0 && (
          <p className="list-empty">Noch keine Bilder in der Galerie.</p>
        )}

        <ol className="reorder-list" data-reorder>
          {gallery.map((image, index) => (
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
              index={index}
              count={gallery.length}
              onMove={to =>
                form.reorderListItem('gallery', { from: index, to })
              }
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
                onChange={focus =>
                  form.setFieldValue(`gallery.${index}.focus`, focus)
                }
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
                  aria-invalid={!!SiteImage.problem(image)}
                  {...form.getInputProps(`gallery.${index}.alt`, {
                    withError: false,
                  })}
                />
              </div>

              <button
                type="button"
                className="button button-secondary button-danger"
                onClick={() => form.removeListItem('gallery', index)}
              >
                <TrashIcon />
                Bild entfernen
              </button>
            </ReorderItem>
          ))}
        </ol>

        <DropZone className="drop-field" disabled={busy} onFiles={addToGallery}>
          <UploadIcon />
          <p className="drop-hint">Bilder hierher ziehen oder</p>
          <FileButton multiple disabled={busy} onFiles={addToGallery}>
            Bilder wählen
          </FileButton>
        </DropZone>

        <SaveBar
          status={shown}
          dirty={form.isDirty()}
          invalid={gallery.some(x => SiteImage.problem(x)) || uploading > 0}
          onDiscard={() => {
            form.reset();
            setOpenKey(undefined);
          }}
        >
          {uploading > 0 && <span>Wird hochgeladen …</span>}
        </SaveBar>
      </fieldset>
    </form>
  );
};

const SlotCard = ({
  slot,
  image,
  busy,
  onFocus,
  onReplace,
  onRemove,
}: {
  slot: ImageSlot;
  image: EditableImage | undefined;
  /** No new file can be taken right now */
  busy: boolean;
  onFocus: (focus: Focus) => void;
  onReplace: (file: File) => void;
  /** Only an optional slot can be left without an image */
  onRemove: () => void;
}) => {
  const { label, aspect, optional } = SiteImage.slots[slot];
  const [editing, setEditing] = useState(false);

  const replace = ([file]: File[]) => {
    if (!file) return;
    onReplace(file);
    setEditing(false);
  };

  return (
    <DropZone className="slot" disabled={busy} onFiles={replace}>
      <h2>
        {label}
        {optional && <span className="slot-optional"> (optional)</span>}
      </h2>

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
        <FileButton disabled={busy} onFiles={replace}>
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

        {image && optional && (
          <button
            type="button"
            className="button button-secondary button-danger"
            onClick={() => {
              setEditing(false);
              onRemove();
            }}
          >
            <TrashIcon />
            Entfernen
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
  image: EditableImage;
  aspects: number[];
  onChange: (focus: Focus) => void;
}) => {
  const pick = (e: PointerEvent<HTMLElement>) => {
    const frame = e.currentTarget.getBoundingClientRect();

    onChange(focusAt(frame, e.clientX, e.clientY));
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
  children: ReactNode;
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
