import type { Researcher } from '@/domain/types';
import { PropagandaCard } from './PropagandaCard';
import { ResearcherCard } from './ResearcherCard';

/** Compact rows: one column on phones, up to four across on wide screens. */
const GRID_CLASS = 'grid grid-cols-1 items-start gap-2 pointer-fine:gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

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
