import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import { industryName, resourceName } from '@/domain/gameText';
import { getResourceByIndustry } from '@/domain/gameText';
import { generatorDetails, industryGenerators } from '@/domain/researchers';
import type { Generator } from '@/domain/types';
import { GeneratorDetailsView } from '@/features/calculator/GeneratorDetailsView';
import { useSession } from '@/state/store';

function GeneratorRow({ generator }: { generator: Generator }) {
  const { text: ctx, assets, form, abGroups } = useSession();
  const name = String(resourceName(ctx, generator.Id));

  return (
    <Collapsible.Root asChild>
      <li className="group rounded-lg border border-line bg-surface">
        <Collapsible.Trigger className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-raised/60">
          <img src={assets.iconUrl(`${generator.Id}.png`)} alt="" width={32} height={32} loading="lazy" className="size-8 shrink-0 object-contain" />
          <span className="min-w-0 flex-1 text-sm font-medium break-words">
            {name}
            <span className="sr-only"> details</span>
          </span>
          <ChevronDown aria-hidden size={18} className="shrink-0 text-muted transition-transform group-data-[state=open]:rotate-180" />
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div className="border-t border-line p-3">
            <GeneratorDetailsView details={generatorDetails(ctx, assets, generator, form, abGroups)} />
          </div>
        </Collapsible.Content>
      </li>
    </Collapsible.Root>
  );
}

/** Every industry's generators, each opening to what the generator does at the current researcher levels. */
export function AllGenerators() {
  const { text: ctx, assets } = useSession();

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">Tap a generator to see what it costs, makes and needs. The numbers follow your researcher levels.</p>
      {(ctx.balance.Industries ?? []).map((industry) => {
        const resource = getResourceByIndustry(ctx, industry.Id);
        if (!resource) {
          return null;
        }
        const resourceLabel = String(resourceName(ctx, resource.Id));
        const industryLabel = industryName(ctx, industry.Id);
        const showIndustry = industryLabel !== undefined && industryLabel.toLowerCase() !== String(resourceName(ctx, resource.Id, false)).toLowerCase();

        return (
          <section key={industry.Id} aria-labelledby={`industry-${industry.Id}`} className="space-y-2">
            <h2 id={`industry-${industry.Id}`} className="flex items-center gap-2 text-base font-semibold">
              <img src={assets.iconUrl(`${resource.Id}.png`)} alt="" width={28} height={28} className="size-7 object-contain" />
              <span>
                {resourceLabel}
                {showIndustry && <em className="ml-1 font-normal text-muted">({industryLabel})</em>}
              </span>
            </h2>
            <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {industryGenerators(ctx, industry.Id).map((generator) => (
                <GeneratorRow key={generator.Id} generator={generator} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
