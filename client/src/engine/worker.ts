// Runs calculations off the main thread, so the page never freezes during a long one.
import { calculate, type CalculationInput, type CalculationResult } from './calculate';

export interface WorkerRequest {
  id: number;
  input: CalculationInput;
}

export type WorkerResponse = { id: number; result: CalculationResult } | { id: number; error: string };

self.onmessage = ({ data }: MessageEvent<WorkerRequest>) => {
  try {
    self.postMessage({ id: data.id, result: calculate(data.input) } satisfies WorkerResponse);
  } catch (error) {
    self.postMessage({ id: data.id, error: error instanceof Error ? error.message : String(error) } satisfies WorkerResponse);
  }
};
