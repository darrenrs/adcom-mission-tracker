import type { CalculationInput, CalculationResult } from './calculate';
import type { WorkerRequest, WorkerResponse } from './worker';

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve(result: CalculationResult): void; reject(error: Error): void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      const request = pending.get(data.id);
      pending.delete(data.id);
      if ('error' in data) {
        request?.reject(new Error(data.error));
      } else {
        request?.resolve(data.result);
      }
    };
  }
  return worker;
}

/** Resolves with the ETA. Infinity seconds means the mission cannot finish from this state. */
export function requestCalculation(input: CalculationInput): Promise<CalculationResult> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, input } satisfies WorkerRequest);
  });
}
