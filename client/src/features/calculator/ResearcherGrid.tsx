import type { Researcher } from '@/domain/types';
import { PropagandaCard } from './PropagandaCard';
import { ResearcherCard } from './ResearcherCard';

/** Two cards across on a phone, up to six on a wide screen. */
export const GRID_CLASS = 'grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

export function ResearcherGrid({ researchers, propaganda = false, label }: { researchers: readonly Researcher[]; propaganda?: boolean; label: string }) {
  return (
    <ul aria-label={label} className={GRID_CLASS}>
      {researchers.map((researcher) => (
        <ResearcherCard key={researcher.Id} researcher={researcher} />
      ))}
      {propaganda && <PropagandaCard />}
    </ul>
  );
}
