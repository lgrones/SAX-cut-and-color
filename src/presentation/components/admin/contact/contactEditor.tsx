import '../admin.css';

import { Contact } from '@domain/contact';
import { useForm } from '@mantine/form';
import { useState } from 'react';

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

export const ContactEditor = ({ contact }: { contact: Contact }) => {
  const [status, setStatus] = useState<EditorStatus>({ kind: 'idle' });

  // Controlled, since the problems show while typing
  const form = useForm<Contact>({
    mode: 'controlled',
    initialValues: contact,
    onValuesChange: () => setStatus({ kind: 'idle' }),
  });

  const problems = Contact.problems(form.values);

  useUnsavedWarning(form.isDirty());

  // Stored trimmed, so the stored contact is the new starting point
  const submit = form.onSubmit(async values => {
    const result = await saveRequest('/api/contact', values);

    if (!result.ok) {
      setStatus(result.status);
      return;
    }

    form.setInitialValues(result.data as Contact);
    form.reset();
    setStatus({ kind: 'saved' });
  });

  const shown: EditorStatus = form.submitting ? { kind: 'saving' } : status;

  return (
    <form onSubmit={submit} noValidate>
      <StatusBanner
        status={shown}
        savedText="Kontakt gespeichert"
        onClose={() => setStatus({ kind: 'idle' })}
      />

      <fieldset className="panel" disabled={form.submitting}>
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
                  autoComplete={autocomplete}
                  className="input"
                  aria-invalid={!!problem}
                  aria-describedby={problem ? id + '-problem' : undefined}
                  {...form.getInputProps(field, { withError: false })}
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
                      {...form.getInputProps('whatsapp', {
                        type: 'checkbox',
                        withError: false,
                      })}
                    />
                    Auch per WhatsApp erreichbar
                  </label>
                )}
              </div>
            );
          })}
        </div>

        <SaveBar
          status={shown}
          dirty={form.isDirty()}
          invalid={Object.keys(problems).length > 0}
          onDiscard={form.reset}
        />
      </fieldset>
    </form>
  );
};
