import { describe, expect, it } from 'vitest';
import { firstGuaranteedText, missionRank, nextLevelCost } from './researcherInfo';
import type { AssetResolver } from './assets';
import type { GameTextContext } from './gameText';
import { researcherCornerIcons } from './researchers';
import type { GameBalance, Mission, Researcher } from './types';

const researcher = { Id: 'r1', Rarity: 'Common' } as Researcher;
const balance = {
  ResearcherRankCosts: [{ Rarity: 'Common', Quantity: [2, 5, 10], Science: [50, 100, 200] }]
} as unknown as GameBalance;

describe('nextLevelCost', () => {
  it('reads the cost of going from level L to L + 1 at index L - 1', () => {
    expect(nextLevelCost(balance, researcher, 1)).toEqual({ cards: 2, science: 50 });
    expect(nextLevelCost(balance, researcher, 3)).toEqual({ cards: 10, science: 200 });
  });

  it('has no next cost at max level (Quantity.length + 1), at level 0 or for an unknown rarity', () => {
    expect(nextLevelCost(balance, researcher, 4)).toBeNull();
    expect(nextLevelCost(balance, researcher, 0)).toBeNull();
    expect(nextLevelCost(balance, { ...researcher, Rarity: 'Epic' }, 1)).toBeNull();
  });
});

describe('first guaranteed copy', () => {
  const mission = { Id: 'M9', Rank: 4 } as Mission;
  const ctx = { mode: 'evergreen', balance } as unknown as GameTextContext;

  it('names the rank of a Motherland mission', () => {
    expect(missionRank(ctx, mission, [])).toBe(4);
    expect(firstGuaranteedText(ctx, { kind: 'mission', mission, text: 'Own Farmers' }, [])).toBe('First guaranteed: Rank 4');
  });

  it('falls back to the mission text without a rank, and handles the other kinds', () => {
    const noRank = { Id: 'M9' } as Mission;
    expect(firstGuaranteedText(ctx, { kind: 'mission', mission: noRank, text: 'Own Farmers' }, [])).toBe('First guaranteed: Own Farmers');
    expect(firstGuaranteedText(ctx, { kind: 'freeCapsule' }, [])).toBe('First guaranteed: First free capsule');
    expect(firstGuaranteedText(ctx, { kind: 'none' }, [])).toBeNull();
  });
});

describe('researcherCornerIcons', () => {
  const assets = { iconUrl: (file: string) => `icon/${file}` } as unknown as AssetResolver;
  const ctx = {
    balance: {
      Industries: [{ Id: 'farming' }, { Id: 'mining' }],
      Resources: [{ Id: 'potato' }, { Id: 'ore' }],
      Generators: [{ Id: 'farmer', IndustryId: 'farming' }]
    }
  } as unknown as GameTextContext;
  const researcher = (ModType: string, TargetIds: string[]) => ({ Id: 'r', ModType, TargetIds }) as unknown as Researcher;

  it('puts the industry top left and the generator top right', () => {
    expect(researcherCornerIcons(ctx, assets, researcher('GenManagerAndSpeedMult', ['farmer']))).toEqual({
      industry: 'icon/potato.png',
      generator: 'icon/farmer.png'
    });
  });

  it('shows only the industry for an industry, a resource (trades) or several industries', () => {
    expect(researcherCornerIcons(ctx, assets, researcher('GeneratorCritChance', ['Mining']))).toEqual({ industry: 'icon/ore.png', generator: null });
    expect(researcherCornerIcons(ctx, assets, researcher('TradePayoutMultiplier', ['potato']))).toEqual({ industry: 'icon/potato.png', generator: null });
    expect(researcherCornerIcons(ctx, assets, researcher('GeneratorPayoutMultiplier', ['Farming, Mining']))).toEqual({
      industry: 'icon/multi-industry.png',
      generator: null
    });
  });
});
