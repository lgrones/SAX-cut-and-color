import '../admin.css';

import { OpeningHours } from '@domain/openingHours';
import { type UseFormReturnType, useForm } from '@mantine/form';
import { useState } from 'react';

import { MinusCircleIcon, PlusCircleIcon } from '../editor/icons';
import { SaveBar, StatusBanner } from '../editor/saveBar';
import { type EditorStatus, saveRequest } from '../editor/saveRequest';
import { useUnsavedWarning } from '../editor/useUnsavedWarning';

interface Values {
  days: OpeningHours[];
}

type HoursForm = UseFormReturnType<Values>;

// Absent times are edited as empty strings, which is also how they are stored
const editable = (day: OpeningHours): OpeningHours => ({
  ...day,
  timeAmStart: day.timeAmStart ?? '',
  timeAmEnd: day.timeAmEnd ?? '',
  timePmStart: day.timePmStart ?? '',
  timePmEnd: day.timePmEnd ?? '',
});

export const OpeningHoursEditor = ({
  openingHours,
}: {
  openingHours: OpeningHours[];
}) => {
  const [status, setStatus] = useState<EditorStatus>({ kind: 'idle' });
  // bumped on discard so rows drop their local "afternoon shown" state
  const [revision, setRevision] = useState(0);

  // Controlled, since the problems show while typing
  const form = useForm<Values>({
    mode: 'controlled',
    initialValues: { days: openingHours.map(editable) },
    onValuesChange: () => setStatus({ kind: 'idle' }),
  });

  const days = form.values.days;

  useUnsavedWarning(form.isDirty());

  // The server stores the times as sent, so they are the new starting point
  const submit = form.onSubmit(async values => {
    const result = await saveRequest(
      '/api/openingHours',
      values.days.map(({ day: _day, index: _index, ...times }) => times),
    );

    if (!result.ok) {
      setStatus(result.status);
      return;
    }

    form.setInitialValues(values);
    form.reset();
    setStatus({ kind: 'saved' });
  });

  const shown: EditorStatus = form.submitting ? { kind: 'saving' } : status;

  return (
    <form onSubmit={submit} autoComplete="off" noValidate>
      <StatusBanner
        status={shown}
        savedText="Öffnungszeiten gespeichert"
        onClose={() => setStatus({ kind: 'idle' })}
      />

      <fieldset className="panel" disabled={form.submitting}>
        <div className="hours">
          {days.map((day, index) => (
            <DayRow
              key={day.index + '-' + revision}
              form={form}
              index={index}
              day={day}
            />
          ))}
        </div>

        <SaveBar
          status={shown}
          dirty={form.isDirty()}
          invalid={days.some(x => OpeningHours.problem(x))}
          onDiscard={() => {
            form.reset();
            setRevision(prev => prev + 1);
          }}
        />
      </fieldset>
    </form>
  );
};

const DayRow = ({
  form,
  index,
  day,
}: {
  form: HoursForm;
  index: number;
  day: OpeningHours;
}) => {
  const [showPm, setShowPm] = useState(!!day.timePmStart || !!day.timePmEnd);
  const problem = OpeningHours.problem(day);
  const problemId = 'day-' + day.index + '-problem';

  const time = (
    name: 'timeAmStart' | 'timeAmEnd' | 'timePmStart' | 'timePmEnd',
  ) => form.getInputProps(`days.${index}.${name}`, { withError: false });

  return (
    <div className="hours-row" data-closed={day.closed}>
      <p className="hours-day">{day.day}</p>

      <div className="hours-ranges">
        <div className="hours-range">
          <TimeRange
            label={day.day + ' Vormittag'}
            start={time('timeAmStart')}
            end={time('timeAmEnd')}
            disabled={day.closed}
            problemId={problem ? problemId : undefined}
          />

          {!showPm && (
            <button
              type="button"
              className="icon-button"
              aria-label={day.day + ': Nachmittag hinzufügen'}
              title="Nachmittag hinzufügen"
              disabled={day.closed}
              onClick={() => setShowPm(true)}
            >
              <PlusCircleIcon />
            </button>
          )}
        </div>

        {showPm && (
          <div className="hours-range">
            <TimeRange
              label={day.day + ' Nachmittag'}
              start={time('timePmStart')}
              end={time('timePmEnd')}
              disabled={day.closed}
              problemId={problem ? problemId : undefined}
            />

            <button
              type="button"
              className="icon-button"
              aria-label={day.day + ': Nachmittag entfernen'}
              title="Nachmittag entfernen"
              disabled={day.closed}
              onClick={() => {
                setShowPm(false);
                form.setFieldValue(`days.${index}.timePmStart`, '');
                form.setFieldValue(`days.${index}.timePmEnd`, '');
              }}
            >
              <MinusCircleIcon />
            </button>
          </div>
        )}
      </div>

      <label className="hours-closed">
        <input
          type="checkbox"
          className="checkbox"
          {...form.getInputProps(`days.${index}.closed`, {
            type: 'checkbox',
            withError: false,
          })}
        />
        Geschlossen
      </label>

      {problem && (
        <p className="hours-problem" id={problemId}>
          {problem}
        </p>
      )}
    </div>
  );
};

const TimeRange = ({
  label,
  start,
  end,
  disabled,
  problemId,
}: {
  label: string;
  /** The input props of the start and end time */
  start: object;
  end: object;
  disabled: boolean;
  problemId: string | undefined;
}) => (
  <>
    <input
      type="time"
      aria-label={label + ' Beginn'}
      aria-describedby={problemId}
      disabled={disabled}
      className="input hours-time"
      {...start}
    />
    <span aria-hidden="true">–</span>
    <input
      type="time"
      aria-label={label + ' Ende'}
      aria-describedby={problemId}
      disabled={disabled}
      className="input hours-time"
      {...end}
    />
  </>
);
