import type { ReactNode } from 'react';

import { CheckCircleIcon, CloseIcon } from './icons';
import type { EditorStatus } from './saveRequest';

/** The outcome of the last save, above the editor */
export const StatusBanner = ({
  status,
  savedText,
  onClose,
}: {
  status: EditorStatus;
  savedText: string;
  onClose: () => void;
}) => {
  if (status.kind === 'saved')
    return (
      <div className="banner success" role="status">
        <CheckCircleIcon />
        <p>{savedText}</p>
        <button
          type="button"
          className="icon-button"
          aria-label="Meldung schließen"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>
    );

  if (status.kind === 'error')
    return (
      <div className="banner error" role="alert">
        <p>{status.message}</p>
      </div>
    );

  return null;
};

/** Discard and save, stuck to the bottom of the editor panel */
export const SaveBar = ({
  status,
  dirty,
  invalid,
  onDiscard,
  children,
}: {
  status: EditorStatus;
  dirty: boolean;
  invalid: boolean;
  onDiscard: () => void;
  /** Replaces the "unsaved changes" note, e.g. with an undo */
  children?: ReactNode;
}) => {
  const saving = status.kind === 'saving';

  return (
    <div className="save-bar">
      <div className="save-bar-status">
        {children ?? (dirty ? 'Ungespeicherte Änderungen' : '')}
      </div>

      <button
        type="button"
        className="button button-secondary"
        disabled={!dirty || saving}
        onClick={onDiscard}
      >
        Verwerfen
      </button>

      <button
        type="submit"
        className="button"
        disabled={!dirty || invalid || saving}
      >
        {saving ? 'Speichern …' : 'Speichern'}
      </button>
    </div>
  );
};
