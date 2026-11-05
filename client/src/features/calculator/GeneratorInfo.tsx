import { generatorDetails } from '@/domain/researchers';
import type { Generator } from '@/domain/types';
import { useSession } from '@/state/store';
import { GeneratorDetailsView } from './GeneratorDetailsView';

/** Everything about one generator at the current researcher levels. Game View and Production both show this. */
export function GeneratorInfo({ generator }: { generator: Generator }) {
  const { text: ctx, assets, form, abGroups } = useSession();
  return <GeneratorDetailsView details={generatorDetails(ctx, assets, generator, form, abGroups)} />;
}
