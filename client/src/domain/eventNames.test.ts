import { describe, expect, it } from 'vitest';
import { getBasicLteName } from './schedule';
import { TITLES } from './titles';

// Every event's short name (top-left button and mode menu), as the owner approved on 8 November 2026.
// Keys are theme ids, except Ages' `monster` balance, which reads through `themeIdOverrides`.
const ADCOM: Record<string, string> = {
  main: 'Motherland',
  evergreen: 'Motherland',
  atlantis: 'Atlantis',
  minicockatrice: 'Mini Cockatrice',
  crusade: 'Crusade',
  cowboy: 'Cowboy',
  bamboo: 'Vacation',
  minivacation: 'Mini Vacation',
  cockatrice: 'Cockatrice',
  fusfarm: 'Farm to Table',
  potatofactory: 'Potato Factory',
  fuspet: 'Pet Show',
  minisports: 'Mini MLG',
  minisanta: 'Mini Santa',
  minipotatofactory: 'Mini Potato Factory',
  minivillain: 'Mini Villains',
  ninja: 'Ninja',
  export: 'Export',
  power: 'Power',
  attack: 'Oil',
  defense: 'Shield',
  space: 'Space',
  spooky: 'Spooky',
  fusscience: 'State Science',
  stone: 'Stone',
  santa: 'Santa',
  supervillain: 'Supervillain',
  fusvehicle: 'Vehicle Show',
  hexathlon: 'Motherland Games',
  winter: 'Winter',
  zombie: 'Zombie'
};

const AGES: Record<string, string> = {
  main: 'Ages',
  evergreen: 'Ages',
  nature: 'New World',
  minisanta: 'Mini Christmas',
  timetravel: 'Anniversary',
  fusionarchitecture: 'Architecture',
  architecture: 'Architecture',
  mexico: 'Aztec',
  fusioncareers: 'Careers',
  careers: 'Careers',
  dino: 'Dino',
  egypt: 'Egypt',
  aliens: 'First Contact',
  fusioninfrastructure: 'Infrastructure',
  infrastructure: 'Infrastructure',
  fusioninnovation: 'Innovation',
  innovation: 'Innovation',
  japan: 'Japan',
  minidino: 'Mini Dino',
  music: 'Music',
  halloween: 'Monster Hunt',
  monster: 'Monster Hunt',
  scandinavia: 'Scandinavia',
  christmas: 'Christmas'
};

describe('event short names', () => {
  for (const [key, names] of [['adcom', ADCOM], ['ages', AGES]] as const) {
    it(`${key}: every event has its approved short name`, () => {
      for (const [themeId, name] of Object.entries(names)) {
        expect(getBasicLteName(themeId, TITLES[key]), themeId).toBe(name);
      }
    });
  }

  it('strips the balance suffix and ignores case', () => {
    expect(getBasicLteName('fuspet-bal-32', TITLES.adcom)).toBe('Pet Show');
    expect(getBasicLteName('MONSTER-bal-13', TITLES.ages)).toBe('Monster Hunt');
  });

  it('capitalises an unknown theme id', () => {
    expect(getBasicLteName('newtheme', TITLES.adcom)).toBe('Newtheme');
  });
});
