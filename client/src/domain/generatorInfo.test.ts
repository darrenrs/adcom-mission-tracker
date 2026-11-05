import { describe, expect, it } from 'vitest';
import {
  expectedCritFactor,
  formatAmount,
  formatCycleTime,
  generatesFigures,
  hasActiveResearcher,
  researcherLevelValues
} from './generatorInfo';
import type { GameTextContext } from './gameText';
import type { GameBalance, Researcher } from './types';

const powers = ['K', 'M', 'B'];

describe('formatCycleTime', () => {
  it('prints three significant figures for milliseconds', () => {
    expect(formatCycleTime(0.25, powers)).toBe('250ms');
    expect(formatCycleTime(0.025, powers)).toBe('25.0ms');
    expect(formatCycleTime(0.0025, powers)).toBe('2.50ms');
    expect(formatCycleTime(0.1234, powers)).toBe('123ms');
  });

  it('prints three significant figures for microseconds', () => {
    expect(formatCycleTime(0.00025, powers)).toBe('250μs');
    expect(formatCycleTime(0.000025, powers)).toBe('25.0μs');
    expect(formatCycleTime(0.0000025, powers)).toBe('2.50μs');
  });

  it('rolls over at the unit edges instead of printing 1000ms', () => {
    expect(formatCycleTime(0.9996, powers)).toBe('1s');
    expect(formatCycleTime(0.0009996, powers)).toBe('1.00ms');
  });

  it('uses the countdown text from one second', () => {
    expect(formatCycleTime(1, powers)).toBe('1s');
    expect(formatCycleTime(65, powers)).toBe('1m 05s');
  });

  it('has no time for a generator that does not run', () => {
    expect(formatCycleTime(Infinity, powers)).toBe('-');
  });
});

describe('formatAmount', () => {
  it('keeps three significant figures below 10,000', () => {
    expect(formatAmount(1234.5, powers)).toBe('1,230');
    expect(formatAmount(1.2345, powers)).toBe('1.23');
  });

  it('uses game notation from 10,000', () => {
    expect(formatAmount(12_345_678, powers)).toBe('12.3 M');
  });
});

describe('generatesFigures', () => {
  it('counts crits in the averages only', () => {
    expect(expectedCritFactor(0.5, 3)).toBe(2);
    expect(generatesFigures(10, 2, 0.5, 3)).toEqual({ basePerCycle: 10, averagePerCycle: 20, basePerSecond: 5, averagePerSecond: 10 });
  });

  it('matches the base when there are no crits', () => {
    expect(generatesFigures(10, 2, 0, 1).averagePerSecond).toBe(5);
  });
});

const researcher = (id: string, extra: Partial<Researcher> = {}): Researcher =>
  ({
    Id: id,
    Rarity: 'Common',
    ModType: 'GenManagerAndSpeedMult',
    TargetIds: ['farmer'],
    ExpoMultiplier: 2,
    ExpoGrowth: 1,
    BasePower: 0,
    CurveModifier: 0,
    UpgradePower: 0,
    PlayerRankUnlock: 1,
    ...extra
  }) as unknown as Researcher;

const speed = researcher('RS1');
const balance = {
  Industries: [{ Id: 'Farming' }],
  Resources: [{ Id: 'veg' }],
  Generators: [{ Id: 'farmer', IndustryId: 'Farming' }],
  Researchers: [speed],
  ResearcherRankCosts: [{ Rarity: 'Common', Quantity: [1, 2] }]
} as unknown as GameBalance;
const ctx = { balance, localization: {}, title: { powers }, mode: 'evergreen' } as unknown as GameTextContext;

describe('researcherLevelValues', () => {
  it('lists the multiplier of every level up to the maximum', () => {
    expect(researcherLevelValues(ctx, speed)).toEqual([
      { level: 1, text: 'x2' },
      { level: 2, text: 'x2' },
      { level: 3, text: 'x2' }
    ]);
  });
});

describe('hasActiveResearcher', () => {
  it('needs a researcher of the industry at level 1 or more', () => {
    expect(hasActiveResearcher(ctx, 'Farming', {})).toBe(false);
    expect(hasActiveResearcher(ctx, 'Farming', { RS1: 0 })).toBe(false);
    expect(hasActiveResearcher(ctx, 'Farming', { RS1: 1 })).toBe(true);
    expect(hasActiveResearcher(ctx, 'Farming', { other: 5 })).toBe(false);
  });
});
