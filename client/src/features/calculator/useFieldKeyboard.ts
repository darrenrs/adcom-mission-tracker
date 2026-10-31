import { useEffect, useRef, type RefObject } from 'react';
import { stepOrder, stepValue, tradeCostStep, type StepKind } from '@/domain/inputSteps';

/** What a number field tells the keyboard handler about itself. */
export interface FieldAttributes {
  'data-field': 'count' | 'comrades' | 'comradesPerSecond' | 'tradeCost';
  'data-field-key': string;
  /** Alt+R, Alt+P, Alt+C, Alt+S, or the number row for generators and trade costs. */
  'data-shortcut'?: 'resource' | 'progress' | 'comrades' | 'cps' | 'item';
}

interface Handlers {
  powers: readonly string[];
  /** Replaces a count field's text and saves it. */
  setField(key: string, text: string): void;
  /** Moves a trade cost up or down. Gets the text the field shows now. */
  stepTrade(resourceId: string, delta: number, shown: string): void;
  onCalculate?(): void;
  onImport?(): void;
  onImportAndCalculate?(): void;
}

// Alt+1 to Alt+0, then Alt+- and Alt+=, pick the first twelve fields of the open tab. `code` is used because
// on a Mac Alt+1 types a different character.
const ROW_INDEX: Readonly<Record<string, number>> = {
  Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8, Digit0: 9, Minus: 10, Equal: 11
};
const NAMED_SHORTCUT: Readonly<Record<string, string>> = { KeyR: 'resource', KeyP: 'progress', KeyC: 'comrades', KeyS: 'cps' };

const STEP_KIND: Readonly<Record<string, StepKind>> = { count: 'count', comrades: 'comrades', comradesPerSecond: 'comradesPerSecond' };

/**
 * The keyboard shortcuts of the number fields, in one place: Up and Down with modifiers change a value,
 * Enter calculates, Ctrl+Enter imports and Ctrl+Shift+Enter does both, and Alt with a key jumps to a field.
 * Fields describe themselves with `FieldAttributes`, so no field needs its own handler.
 */
export function useFieldKeyboard(root: RefObject<HTMLElement | null>, handlers: Handlers) {
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const container = root.current;
      if (!container || !container.isConnected) {
        return;
      }
      const { powers, setField, stepTrade, onCalculate, onImport, onImportAndCalculate } = latest.current;
      const target = event.target instanceof HTMLInputElement && container.contains(event.target) ? event.target : null;

      if (target) {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (event.ctrlKey && event.shiftKey) {
            onImportAndCalculate?.();
          } else if (event.ctrlKey) {
            onImport?.();
          } else {
            onCalculate?.();
          }
          return;
        }

        const order = stepOrder(event);
        const kind = target.dataset['field'];
        const key = target.dataset['fieldKey'];
        if (order !== 0 && kind && key) {
          event.preventDefault();
          if (kind === 'tradeCost') {
            stepTrade(key, tradeCostStep(order), target.value);
          } else {
            const next = stepValue(STEP_KIND[kind] ?? 'count', target.value, order, powers);
            if (next !== null) {
              setField(key, next);
            }
          }
          return;
        }
      }

      if (!event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      const panel = container.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])');
      if (!panel) {
        return;
      }
      const fields = [...panel.querySelectorAll<HTMLInputElement>('input[data-field]')];
      const row = ROW_INDEX[event.code];
      const named = NAMED_SHORTCUT[event.code];
      const wanted =
        row !== undefined
          ? fields.filter((field) => field.dataset['shortcut'] === 'item')[row]
          : fields.find((field) => field.dataset['shortcut'] === named);
      if (wanted && !wanted.disabled) {
        event.preventDefault();
        wanted.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [root]);
}
