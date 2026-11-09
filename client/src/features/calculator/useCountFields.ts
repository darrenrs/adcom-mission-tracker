import { useCallback, useEffect, useRef, useState } from 'react';
import { amountValue } from '@/domain/inputSteps';
import { useSession, useTracker } from '@/state/store';
import { amountText, applyCount, CPS_KEY, isInvalidAmount, PROGRESS_KEY, savedTexts } from './fields';

interface Options {
  resourceId: string;
  generatorIds: readonly string[];
  /** The mission whose progress the progress field shows, shared with Game View. */
  missionId: string;
}

/**
 * The text of the Generators tab's fields. Every valid change is saved to the form straight away, so nothing is
 * lost by leaving the page, and the fields start with what was saved.
 */
export function useCountFields({ resourceId, generatorIds, missionId }: Options) {
  const session = useSession();
  const updateForm = useTracker((state) => state.updateForm);
  const { powers } = session.title;
  const setMissionProgress = useTracker((state) => state.setMissionProgress);
  const [texts, setTexts] = useState(() => {
    const saved = savedTexts(session.form, resourceId, generatorIds, powers);
    const progress = session.missionProgress[missionId];
    return progress === undefined ? saved : { ...saved, [PROGRESS_KEY]: amountText(progress, powers) };
  });
  const latest = useRef(texts);
  latest.current = texts;

  const save = useCallback(
    (key: string, text: string) => {
      // Saved rounded to the number format, so the form always holds what the field will show.
      const value = amountValue(text, powers);
      if (!isInvalidAmount(text, powers, key === PROGRESS_KEY)) {
        updateForm((form) => applyCount(form, resourceId, key, value, Date.now()));
        if (key === PROGRESS_KEY) {
          setMissionProgress(missionId, value);
        }
      }
    },
    [missionId, powers, resourceId, setMissionProgress, updateForm]
  );

  const setText = useCallback(
    (key: string, text: string) => {
      setTexts((previous) => ({ ...previous, [key]: text }));
      save(key, text);
    },
    [save]
  );

  /** Replaces several fields at once and saves them together, as Import does. */
  const setMany = useCallback(
    (next: Record<string, string>) => {
      setTexts((previous) => ({ ...previous, ...next }));
      for (const [key, text] of Object.entries(next)) {
        save(key, text);
      }
    },
    [save]
  );

  // The Trades tab works out comrades per second and writes it over this field, as it did in legacy.
  const total = session.form.Trades.TotalComrades;
  useEffect(() => {
    if (amountValue(latest.current[CPS_KEY] ?? '', powers) !== total) {
      setTexts((previous) => ({ ...previous, [CPS_KEY]: amountText(total, powers) }));
    }
  }, [total, powers]);

  const invalid = useCallback((key: string) => isInvalidAmount(texts[key] ?? '', powers, key === PROGRESS_KEY), [texts, powers]);

  return { texts, latest, setText, setMany, invalid };
}

export type CountFields = ReturnType<typeof useCountFields>;
