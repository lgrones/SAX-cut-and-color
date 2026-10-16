import '../admin.css';

import type { PageSection } from '@domain/pageSection';
import { useState } from 'preact/hooks';

import { type EditorStatus, saveRequest } from '../editor/saveRequest';

/**
 * Puts a section on the start page or takes it off, saved right away. The
 * editor below keeps working either way.
 */
export const SectionToggle = ({
  section,
  shown: initial,
}: {
  section: PageSection;
  shown: boolean;
}) => {
  const [shown, setShown] = useState(initial);
  const [status, setStatus] = useState<EditorStatus>({ kind: 'idle' });
  const id = 'section-toggle-' + section;

  const toggle = async (next: boolean) => {
    setShown(next);
    setStatus({ kind: 'saving' });

    const result = await saveRequest('/api/pageSections', {
      section,
      shown: next,
    });

    if (!result.ok) setShown(!next);
    setStatus(result.ok ? { kind: 'idle' } : result.status);
  };

  return (
    <div className="panel section-toggle" data-shown={shown}>
      <label className="section-toggle-row" htmlFor={id}>
        <span className="section-toggle-text">
          <span className="section-toggle-title">Auf der Website anzeigen</span>
          {!shown && (
            <span className="section-toggle-note">
              Dieser Bereich ist auf der Startseite ausgeblendet.
            </span>
          )}
        </span>

        <input
          id={id}
          type="checkbox"
          role="switch"
          className="switch"
          checked={shown}
          disabled={status.kind === 'saving'}
          onChange={e => void toggle(e.currentTarget.checked)}
        />
      </label>

      {status.kind === 'error' && (
        <p className="section-toggle-error" role="alert">
          {status.message}
        </p>
      )}
    </div>
  );
};
