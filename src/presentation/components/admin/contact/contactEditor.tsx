import '../admin.css';

import { Contact } from '@domain/contact';
import { useState } from 'preact/hooks';

import { SaveBar, StatusBanner } from '../editor/saveBar';
import { type EditorStatus, saveRequest } from '../editor/saveRequest';
import { useUnsavedWarning } from '../editor/useUnsavedWarning';

type Field = keyof ReturnType<typeof Contact.problems>;

// `inputMode` rather than `type` picks the phone keyboard, the checks are our own
const fields = [
  { field: 'phone', label: 'Telefon', inputMode: 'tel', autocomplete: 'tel' },
  {
    field: 'email',
    label: 'E-Mail',
    inputMode: 'email',
    autocomplete: 'email',
  },
  {
    field: 'street',
    label: 'Straße und Hausnummer',
    inputMode: 'text',
    autocomplete: 'address-line1',
  },
  {
    field: 'town',
    label: 'PLZ und Ort',
    inputMode: 'text',
    autocomplete: 'address-level2',
  },
] as const satisfies {
  field: Field;
  label: string;
  inputMode: string;
  autocomplete: string;
}[];

const content = (contact: Contact) => JSON.stringify(contact);

export const ContactEditor = ({ contact }: { contact: Contact }) => {
  const [saved, setSaved] = useState(contact);
  const [draft, setDraft] = useState(contact);
  const [status, setStatus] = useState<EditorStatus>({ kind: 'idle' });

  const dirty = content(draft) !== content(saved);
  const problems = Contact.problems(draft);
  const invalid = Object.keys(problems).length > 0;

  useUnsavedWarning(dirty);

  const change = (patch: Partial<Contact>) => {
    setDraft(prev => ({ ...prev, ...patch }));
    setStatus({ kind: 'idle' });
  };

  const submit = async (e: Event) => {
    e.preventDefault();
    setStatus({ kind: 'saving' });

    const result = await saveRequest('/api/contact', draft);

    if (!result.ok) {
      setStatus(result.status);
      return;
    }

    // stored trimmed, so take it as stored
    const next = result.data as Contact;
    setSaved(next);
    setDraft(next);
    setStatus({ kind: 'saved' });
  };

  return (
    <form onSubmit={e => void submit(e)} noValidate>
      <StatusBanner
        status={status}
        savedText="Kontakt gespeichert"
        onClose={() => setStatus({ kind: 'idle' })}
      />

      <div className="panel">
        <div className="panel-body contact-fields">
          {fields.map(({ field, label, inputMode, autocomplete }) => {
            const id = 'contact-' + field;
            const problem = problems[field];

            return (
              <div key={field} className="contact-field" data-field={field}>
                <label className="label" htmlFor={id}>
                  {label}
                </label>
                <input
                  id={id}
                  inputMode={inputMode}
                  autocomplete={autocomplete}
                  className="input"
                  value={draft[field]}
                  aria-invalid={!!problem}
                  aria-describedby={problem ? id + '-problem' : undefined}
                  onInput={e => change({ [field]: e.currentTarget.value })}
                />
                {problem && (
                  <p id={id + '-problem'} className="field-problem">
                    {problem}
                  </p>
                )}
                {field === 'phone' && (
                  <label className="checkbox-row contact-whatsapp">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={draft.whatsapp}
                      onChange={e =>
                        change({ whatsapp: e.currentTarget.checked })
                      }
                    />
                    Auch per WhatsApp erreichbar
                  </label>
                )}
              </div>
            );
          })}
        </div>

        <SaveBar
          status={status}
          dirty={dirty}
          invalid={invalid}
          onDiscard={() => {
            setDraft(saved);
            setStatus({ kind: 'idle' });
          }}
        />
      </div>
    </form>
  );
};
