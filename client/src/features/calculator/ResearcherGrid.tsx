import type { Researcher } from '@/domain/types';
import { useSession } from '@/state/store';
import { PropagandaCard } from './PropagandaCard';
import { ResearcherCard } from './ResearcherCard';

/** AdCom cards carry a quote, so they are wider: up to six across. Ages cards stay compact, up to eight. */
export const GRID_CLASS = 'grid grid-cols-2 items-start gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
export const AGES_GRID_CLASS = 'grid grid-cols-2 items-start gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8';

export function ResearcherGrid({ researchers, propaganda = false, label }: { researchers: readonly Researcher[]; propaganda?: boolean; label: string }) {
  const { title } = useSession();
  return (
    <ul aria-label={label} className={title.isAges ? AGES_GRID_CLASS : GRID_CLASS}>
      {researchers.map((researcher) => (
        <ResearcherCard key={researcher.Id} researcher={researcher} />
      ))}
      {propaganda && <PropagandaCard />}
    </ul>
  );
}
