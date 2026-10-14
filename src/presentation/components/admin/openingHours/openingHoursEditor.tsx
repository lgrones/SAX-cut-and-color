import '../admin.css';

import { OpeningHours } from '@domain/openingHours';
import { useState } from 'preact/hooks';

import { MinusCircleIcon, PlusCircleIcon } from '../editor/icons';
import { SaveBar, StatusBanner } from '../editor/saveBar';
import { type EditorStatus, saveRequest } from '../editor/saveRequest';
import { useUnsavedWarning } from '../editor/useUnsavedWarning';

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
  const [saved, setSaved] = useState(() => openingHours.map(editable));
  const [days, setDays] = useState(saved);
  const [status, setStatus] = useState<EditorStatus>({ kind: 'idle' });
  // bumped on discard so rows drop their local "afternoon shown" state
  const [revision, setRevision] = useState(0);

  const dirty = JSON.stringify(days) !== JSON.stringify(saved);
  const invalid = days.some(x => OpeningHours.problem(x));

  useUnsavedWarning(dirty);

  const change = (index: number, patch: Partial<OpeningHours>) => {
    setDays(prev =>
      prev.map(x => (x.index === index ? { ...x, ...patch } : x)),
    );
    setStatus({ kind: 'idle' });
  };

  const submit = async (e: Event) => {
    e.preventDefault();
    setStatus({ kind: 'saving' });

    const result = await saveRequest(
      '/api/openingHours',
      days.map(({ day: _day, index: _index, ...times }) => times),
    );
    if (result.ok) setSaved(days);
    setStatus(result.ok ? { kind: 'saved' } : result.status);
  };

  return (
    <form onSubmit={e => void submit(e)} autocomplete="off" noValidate>
      <StatusBanner
        status={status}
        savedText="Öffnungszeiten gespeichert"
        onClose={() => setStatus({ kind: 'idle' })}
      />

      <div className="panel">
        <div className="hours">
          {days.map(day => (
            <DayRow
              key={day.index + '-' + revision}
              day={day}
              onChange={patch => change(day.index, patch)}
            />
          ))}
        </div>

        <SaveBar
          status={status}
          dirty={dirty}
          invalid={invalid}
          onDiscard={() => {
            setDays(saved);
            setRevision(prev => prev + 1);
            setStatus({ kind: 'idle' });
          }}
        />
      </div>
    </form>
  );
};

const DayRow = ({
  day,
  onChange,
}: {
  day: OpeningHours;
  onChange: (patch: Partial<OpeningHours>) => void;
}) => {
  const [showPm, setShowPm] = useState(!!day.timePmStart || !!day.timePmEnd);
  const problem = OpeningHours.problem(day);
  const problemId = 'day-' + day.index + '-problem';

  return (
    <div className="hours-row" data-closed={day.closed}>
      <p className="hours-day">{day.day}</p>

      <div className="hours-ranges">
        <div className="hours-range">
          <TimeRange
            label={day.day + ' Vormittag'}
            start={day.timeAmStart ?? ''}
            end={day.timeAmEnd ?? ''}
            disabled={day.closed}
            problemId={problem ? problemId : undefined}
            onChange={(timeAmStart, timeAmEnd) =>
              onChange({ timeAmStart, timeAmEnd })
            }
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
              start={day.timePmStart ?? ''}
              end={day.timePmEnd ?? ''}
              disabled={day.closed}
              problemId={problem ? problemId : undefined}
              onChange={(timePmStart, timePmEnd) =>
                onChange({ timePmStart, timePmEnd })
              }
            />

            <button
              type="button"
              className="icon-button"
              aria-label={day.day + ': Nachmittag entfernen'}
              title="Nachmittag entfernen"
              disabled={day.closed}
              onClick={() => {
                setShowPm(false);
                onChange({ timePmStart: '', timePmEnd: '' });
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
          checked={day.closed}
          onChange={e => onChange({ closed: e.currentTarget.checked })}
          className="checkbox"
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
  onChange,
}: {
  label: string;
  start: string;
  end: string;
  disabled: boolean;
  problemId: string | undefined;
  onChange: (start: string, end: string) => void;
}) => (
  <>
    <input
      type="time"
      aria-label={label + ' Beginn'}
      aria-describedby={problemId}
      value={start}
      disabled={disabled}
      onInput={e => onChange(e.currentTarget.value, end)}
      className="input hours-time"
    />
    <span aria-hidden="true">–</span>
    <input
      type="time"
      aria-label={label + ' Ende'}
      aria-describedby={problemId}
      value={end}
      disabled={disabled}
      onInput={e => onChange(start, e.currentTarget.value)}
      className="input hours-time"
    />
  </>
);
