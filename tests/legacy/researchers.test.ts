// Compares the researcher and generator helpers (sort order, researcher lists, max levels, icons, value labels,
// details, propaganda boost and generator details) with the legacy functions, on every balance of both titles.
import { afterAll, describe, expect, it } from 'vitest';
import { createAssetResolver, type AssetResolver } from '@/domain/assets';
import { shortBigNum } from '@/domain/format';
import type { GameTextContext } from '@/domain/gameText';
import { parseLocalization } from '@/domain/localization';
import {
  generatorDetails,
  getPropagandaBoost,
  getResearcherTargetIconUrl,
  getResearchersByIndustry,
  getTradeResearchers,
  researcherDetails,
  researcherMaxLevel,
  researcherValueLabel,
  sortResearchers,
  type FirstGuaranteed,
  type ResearcherDetails
} from '@/domain/researchers';
import { TITLES, type TitleKey } from '@/domain/titles';
import type { GameBalance, Researcher, TrackerMode } from '@/domain/types';
import { emptyFormValues, type FormValues } from '@/engine/model';
import { assetsAvailable, createLegacy, loadBalances, loadLocalizationBase64, stripHtml, TITLE_IDS, TITLE_KEYS } from './harness';

const tally = { sorts: 0, lists: 0, maxLevels: 0, icons: 0, labels: 0, details: 0, propaganda: 0, generators: 0 };
const anomalies = new Map<string, number>();

function note(kind: string) {
  anomalies.set(kind, (anomalies.get(kind) ?? 0) + 1);
}

afterAll(() => {
  const total = Object.values(tally).reduce((sum, count) => sum + count, 0);
  console.log(`[researchers] ${total} comparisons against legacy (${JSON.stringify(tally)})`);
  for (const [kind, count] of anomalies) {
    console.log(`[researchers] legacy anomaly x${count}: ${kind}`);
  }
});

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const modeOf = (balanceId: string): TrackerMode => (balanceId === 'evergreen' ? 'main' : 'event');
// Titles with an apostrophe in a resource name break legacy's own markup, so images go before the tags are stripped.
const compact = (text: string) => stripHtml(text.replace(/<img\b[^>]*>/g, '')).replace(/\s+/g, '');

function randomForm(balance: GameBalance, random: () => number): FormValues {
  const form = emptyFormValues();
  for (const researcher of balance.Researchers ?? []) {
    const roll = random();
    const max = researcherMaxLevel(balance, researcher) ?? 5;
    if (roll < 0.1) {
      form.ResearcherLevels[researcher.Id] = -1;
      form.ResearcherOverrides![researcher.Id] = Math.round(random() * 400) / 100 + 0.1;
    } else if (roll < 0.7) {
      form.ResearcherLevels[researcher.Id] = Math.floor(random() * (max + 1));
    }
  }
  form.ResearcherLevels['PropagandaBoost'] = random() < 0.5 ? 1 : 0;
  return form;
}

function detailsText(details: ResearcherDetails): string {
  const first: Record<FirstGuaranteed['kind'], string> = {
    mission: '',
    freeCapsule: 'First guaranteed: First free capsule',
    none: 'No guaranteed copies.'
  };
  const guaranteed = details.firstGuaranteed;
  const tail = guaranteed.kind === 'mission' ? `First guaranteed: ${guaranteed.text}` : first[guaranteed.kind];
  return `${details.description}Unlocks at Rank ${details.unlockRank}${tail}`.replace(/\s+/g, '');
}

describe.skipIf(!assetsAvailable).each(TITLE_KEYS)('researchers match legacy (%s)', (titleKey: TitleKey) => {
  const title = TITLES[titleKey];
  const balances = loadBalances(titleKey);
  const localizationBase64 = loadLocalizationBase64(titleKey);
  const parsed = parseLocalization(localizationBase64);
  const runtimeConfig = {
    titleIds: { adcom: TITLE_IDS.adcom, ages: TITLE_IDS.ages },
    assetBaseByTitleId: { [TITLE_IDS.adcom]: '/assets/6bf5', [TITLE_IDS.ages]: 'https://cdn.test/assets/dc4bb/' }
  };
  const legacy = createLegacy(titleKey, { runtimeConfig });

  function setUp(balanceId: string) {
    const mode = modeOf(balanceId);
    const balance = balances[balanceId] as GameBalance;
    // Legacy sorts the lists it is given and writes into missions, so it gets its own copy.
    legacy.configure({ balances: { ...balances, [balanceId]: structuredClone(balance) }, balanceId, localization: localizationBase64 });
    legacy.run(`
      missionData = { Current: { Remaining: [] }, Completed: { Remaining: [] } };
      var __FORM = null;
      getFormValuesObject = function () { return __FORM; };
      initializeAbTestGroups();
    `);
    const assets: AssetResolver = createAssetResolver({
      assetBaseByTitleId: runtimeConfig.assetBaseByTitleId,
      title,
      mode,
      balanceId: mode === 'event' ? balanceId : null,
      themeId: mode === 'event' ? (balanceId.split('-')[0] ?? null) : null,
      experiments: balance.Experiments,
      titleIds: runtimeConfig.titleIds
    });
    const ctx: GameTextContext = { balance, localization: parsed, title, mode };
    const abGroups = legacy.run<string[]>('getCurrentAbTestGroups()');
    return { balance, ctx, assets, abGroups };
  }

  const ids = (list: readonly Researcher[]) => list.map((researcher) => researcher.Id);

  for (const balanceId of Object.keys(balances)) {
    describe(balanceId, () => {
      it('sorts and lists researchers like legacy', () => {
        const { balance, ctx } = setUp(balanceId);
        const all = balance.Researchers ?? [];

        const random = mulberry32(11);
        for (let round = 0; round < 6; round++) {
          // Legacy's comparator is not consistent for researchers that name several industries,
          // so the result can depend on the order it starts from: try several.
          const order = [...all];
          if (round > 0) order.sort(() => random() - 0.5);
          const expected = legacy.run<string[]>(
            `(() => { const byId = new Map(getData().Researchers.map(r => [r.Id, r])); const list = __ids.map(id => byId.get(id)); sortResearchers(list); return list.map(r => r.Id); })()`,
            { __ids: ids(order) }
          );
          tally.sorts++;
          expect(ids(sortResearchers(ctx, order)), `${balanceId} sort round ${round}`).toEqual(expected);
        }

        const industries: (string | null)[] = [null, ...(balance.Industries ?? []).map((industry) => industry.Id)];
        for (const industryId of industries) {
          const expected = legacy.run<string[]>('getResearchersByIndustry(__industry || undefined).map(r => r.Id)', { __industry: industryId });
          tally.lists++;
          expect(ids(getResearchersByIndustry(ctx, industryId)), `${balanceId} researchers of ${industryId}`).toEqual(expected);

          const sorted = legacy.run<string[]>(
            '(() => { const list = getResearchersByIndustry(__industry || undefined); sortResearchers(list); return list.map(r => r.Id); })()',
            { __industry: industryId }
          );
          tally.sorts++;
          expect(ids(sortResearchers(ctx, getResearchersByIndustry(ctx, industryId))), `${balanceId} sorted ${industryId}`).toEqual(sorted);
        }

        const trades = legacy.run<string[]>(
          `(() => { const list = getData().Researchers.filter(r => r.ModType == 'TradePayoutMultiplier'); sortResearchers(list); return list.map(r => r.Id); })()`
        );
        tally.lists++;
        expect(ids(getTradeResearchers(ctx)), `${balanceId} trade researchers`).toEqual(trades);
      });

      it('has the same max levels and target icons', () => {
        const { balance, ctx, assets } = setUp(balanceId);

        for (const researcher of balance.Researchers ?? []) {
          const label = `${researcher.Id} (${titleKey} ${balanceId})`;

          let maxLevel: number | null = null;
          try {
            maxLevel = legacy.run<number>(
              'getData().ResearcherRankCosts.find(cost => cost.Rarity == __r.Rarity).Quantity.length + 1',
              { __r: researcher }
            );
          } catch {
            note('max level throws for a rarity without costs');
          }
          tally.maxLevels++;
          expect(researcherMaxLevel(balance, researcher), label).toBe(maxLevel);

          let raw: string | undefined;
          try {
            raw = legacy.run<string | undefined>('getResearcherTargetIconUrl(__r)', { __r: researcher });
          } catch {
            note('target icon throws for a target without a resource');
          }
          const resolved = raw === undefined ? null : legacy.call<string>('resolveAssetPathByLegacyPath', raw);
          tally.icons++;
          expect(getResearcherTargetIconUrl(ctx, assets, researcher), label).toBe(resolved);
        }
      });

      it('prints the same level, value and details as legacy', () => {
        const { balance, ctx, abGroups } = setUp(balanceId);
        const random = mulberry32(5);

        for (const researcher of balance.Researchers ?? []) {
          const label = `${researcher.Id} (${titleKey} ${balanceId})`;
          const max = researcherMaxLevel(balance, researcher) ?? 5;
          const form = emptyFormValues();
          form.ResearcherOverrides![researcher.Id] = Math.round(random() * 400) / 100 + 0.1;

          for (const level of [0, 1, 2, 3, max, -1]) {
            form.ResearcherLevels[researcher.Id] = level;
            legacy.run('__FORM = __f', { __f: structuredClone(form) });
            const html = legacy.run<string>('getResearcherCard(__r, __FORM)', { __r: researcher });
            const levelText = />([^<]*)<\/div>\s*<\/div>\s*<\/a>/.exec(html)?.[1];
            const valueHtml = new RegExp(`id="${researcher.Id}-value">(.*?)</span>`, 's').exec(html)?.[1] ?? '';
            const ours = researcherValueLabel(ctx, researcher, level, form.ResearcherOverrides?.[researcher.Id]);
            tally.labels += 2;
            expect(ours.level, label).toBe(levelText);
            expect(ours.value, label).toBe(stripHtml(valueHtml));
            expect(ours.custom, label).toBe(level === -1);
          }

          const legacyDetails = legacy.run<string>('getResearcherFullDetailsHtml(__r)', { __r: researcher });
          tally.details++;
          expect(detailsText(researcherDetails(ctx, researcher, abGroups)), label).toBe(compact(legacyDetails));
        }
      });

      it('describes the propaganda boost like legacy', () => {
        const { ctx, assets } = setUp(balanceId);
        const legacyBoost = legacy.run<{ Id: string; Name: string; Power: number }>('getPropagandaObject()');
        const ours = getPropagandaBoost(ctx, assets);
        tally.propaganda += 3;
        expect(ours?.id).toBe(legacyBoost.Id);
        expect(ours?.name).toBe(legacyBoost.Name);
        expect(ours?.power).toBe(legacyBoost.Power);

        legacy.run('__FORM = __f', { __f: emptyFormValues() });
        const card = legacy.run<string>('getPropagandaBoostCard(__FORM)');
        const content = /data-content="([^"]*)"/.exec(card)?.[1];
        tally.propaganda += 3;
        expect(ours?.description).toBe(content);
        expect(ours?.offIconUrl).toBe(legacy.call<string>('resolveAssetPathByLegacyPath', /url\('([^']*)'\)/.exec(card)?.[1] as string));
        expect(ours?.targetIconUrl).toBe(
          legacy.call<string>('resolveAssetPathByLegacyPath', /researcherIcon float-right" style="background-image: url\('([^']*)'\)/.exec(card)?.[1] as string)
        );
      });

      it('describes every generator like legacy', () => {
        const { balance, ctx, assets, abGroups } = setUp(balanceId);
        const random = mulberry32(21);
        const industryIds = new Set((balance.Industries ?? []).map((industry) => industry.Id));
        const generators = (balance.Generators ?? []).filter((generator) => generator.IndustryId && industryIds.has(generator.IndustryId));
        expect(generators.length).toBeGreaterThan(0);

        for (let round = 0; round < 3; round++) {
          const form = round === 0 ? emptyFormValues() : randomForm(balance, random);
          legacy.run('__FORM = __f', { __f: structuredClone(form) });

          for (const generator of generators) {
            const label = `${generator.Id} round ${round} (${titleKey} ${balanceId})`;
            let html: string;
            try {
              html = legacy.run<string>('describeGenerator(__g, getResearchersByIndustry(__g.IndustryId), __FORM)', { __g: generator });
            } catch {
              note('describeGenerator throws for a generator without an automator');
              continue;
            }
            const details = generatorDetails(ctx, assets, generator, form, abGroups);
            tally.generators++;

            // Legacy prints the per-second figure with toPrecision(3), as text. Compare it as a number.
            const text = compact(html);
            const perSecond = /EachOutputs:(\S+?)\/sec/.exec(text)?.[1] as string;
            const legacyValue = Number(perSecond);
            const ourValue = Number(details.perSecondText.replace(/,/g, ''));
            // (shortBigNum text such as '191 K' only appears from 10,000 up, where the two agree as text.)
            if (perSecond !== details.perSecondText.replace(/\s+/g, '')) {
              note('per second is printed with trailing zeros or an exponent');
            }
            if (/\d[eE]\+/.test(perSecond)) {
              // "1.23e+3" is the same number as 1,230.
              expect(ourValue, label).toBeCloseTo(legacyValue, 6);
            } else if (legacyValue < 1e4) {
              expect(ourValue, label).toBeCloseTo(legacyValue, 8);
            } else {
              expect(details.perSecondText.replace(/\s+/g, ''), label).toBe(perSecond);
            }

            const { powers } = title;
            const unlock = details.unlock ? `Unlocksat:${details.unlock.text}` : '';
            const automator = details.automator ? `Automator:${details.automator.name}${detailsText(details.automator.details)}` : '';
            const expected = [
              `Costs:${details.costs.map((cost) => cost.text).join('')}`,
              `Generates:${details.output.perCycleText}per${details.output.cycleText}`,
              `x${shortBigNum(details.power, powers)}x${shortBigNum(details.discount, powers)}x${shortBigNum(details.speed, powers)}`,
              `${shortBigNum(details.critChance * 100, powers)}%x${shortBigNum(details.critPower, powers)}`,
              `EachOutputs:`,
              `/sec${details.bubble.text}perbubbleearned`,
              unlock,
              automator
            ]
              .join('')
              .replace(/\s+/g, '');
            expect(text.replace(`EachOutputs:${perSecond}/sec`, 'EachOutputs:/sec'), label).toBe(expected);

            // The values themselves, not only their text.
            expect(details.costs.map((cost) => cost.resourceId), label).toEqual(
              (generator.Cost ?? []).map((cost) => cost.Resource.toLowerCase())
            );
          }
        }
      });
    });
  }
});
