import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import { industryName, resourceName } from '@/domain/gameText';
import { getResourceByIndustry } from '@/domain/gameText';
import { industryGenerators } from '@/domain/researchers';
import type { Generator } from '@/domain/types';
import { GeneratorInfo } from '@/features/calculator/GeneratorInfo';
import { useSession } from '@/state/store';

function GeneratorRow({ generator }: { generator: Generator }) {
  const { text: ctx, assets } = useSession();
  const name = String(resourceName(ctx, generator.Id));

  return (
    <Collapsible.Root asChild>
      <li className="group rounded-lg border border-line bg-canvas">
        <Collapsible.Trigger className="flex min-h-control w-full items-center gap-2 rounded-lg px-2 py-1 text-left hover:bg-raised/60">
          <img src={assets.iconUrl(`${generator.Id}.png`)} alt="" width={28} height={28} loading="lazy" className="size-7 shrink-0 object-contain" />
          <span className="min-w-0 flex-1 text-sm font-medium break-words">
            {name}
            <span className="sr-only"> details</span>
          </span>
          <ChevronDown aria-hidden size={18} className="shrink-0 text-muted transition-transform group-data-[state=open]:rotate-180" />
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div className="border-t border-line p-3">
            <GeneratorInfo generator={generator} />
          </div>
        </Collapsible.Content>
      </li>
    </Collapsible.Root>
  );
}

/** Every industry's generators in its own column, each opening to what the generator does at the current researcher levels. */
export function AllGenerators() {
  const { text: ctx, assets } = useSession();

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">Tap a generator to see what it costs, makes and needs. The numbers follow your researcher levels.</p>
      <div className="space-y-2 md:flex md:items-start md:gap-2 md:space-y-0 md:overflow-x-auto md:pb-2">
        {(ctx.balance.Industries ?? []).map((industry) => {
          const resource = getResourceByIndustry(ctx, industry.Id);
          if (!resource) {
            return null;
          }
          const resourceLabel = String(resourceName(ctx, resource.Id));
          const industryLabel = industryName(ctx, industry.Id);
          const showIndustry = industryLabel !== undefined && industryLabel.toLowerCase() !== String(resourceName(ctx, resource.Id, false)).toLowerCase();

          return (
            <section key={industry.Id} aria-labelledby={`industry-${industry.Id}`} className="space-y-1.5 rounded-xl border border-line bg-surface p-2 md:min-w-56 md:flex-1">
              <h2 id={`industry-${industry.Id}`} className="flex items-center gap-2 text-base font-semibold">
                <img src={assets.iconUrl(`${resource.Id}.png`)} alt="" width={28} height={28} className="size-7 object-contain" />
                <span>
                  {resourceLabel}
                  {showIndustry && <em className="ml-1 font-normal text-muted">({industryLabel})</em>}
                </span>
              </h2>
              <ul className="grid gap-1.5">
                {industryGenerators(ctx, industry.Id).map((generator) => (
                  <GeneratorRow key={generator.Id} generator={generator} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
