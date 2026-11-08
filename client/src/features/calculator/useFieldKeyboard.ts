import { useEffect, useRef, type RefObject } from 'react';
import { stepAmount, stepDirection } from '@/domain/inputSteps';

/** What a number field tells the keyboard handler about itself. */
export interface FieldAttributes {
  'data-field': 'count' | 'comrades' | 'comradesPerSecond' | 'tradeCost';
  'data-field-key': string;
}

interface Handlers {
  powers: readonly string[];
  /** Replaces a count field's text and saves it. */
  setField(key: string, text: string): void;
  /** Moves a trade cost up or down. Gets the text the field shows now. */
  stepTrade(resourceId: string, delta: number, shown: string): void;
}

/** Plain Up and Down change a number field. Fields describe themselves with `FieldAttributes`, so none needs its own handler. */
export function useFieldKeyboard(root: RefObject<HTMLElement | null>, handlers: Handlers) {
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const container = root.current;
      if (!container?.isConnected || !(event.target instanceof HTMLInputElement) || !container.contains(event.target)) {
        return;
      }
      const { powers, setField, stepTrade } = latest.current;
      const target = event.target;
      const direction = stepDirection(event);
      const kind = target.dataset['field'];
      const key = target.dataset['fieldKey'];
      if (direction === 0 || !kind || !key) {
        return;
      }

      event.preventDefault();
      if (kind === 'tradeCost') {
        stepTrade(key, direction, target.value);
      } else {
        const next = stepAmount(target.value, direction, powers);
        if (next !== null) {
          setField(key, next);
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [root]);
}
