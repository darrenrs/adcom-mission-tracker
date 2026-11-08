// Per-title constants, copied from public/config_adcom.js and public/config_ages.js.

export type TitleKey = 'adcom' | 'ages';

export interface TitleConfig {
  key: TitleKey;
  titleId: string;
  isAges: boolean;
  /** Suffixes for large numbers: `powers[0]` is thousands. */
  powers: readonly string[];
  /**
   * Short event names (top-left button and mode menu) for themes whose id reads poorly. Started from
   * legacy's config files; the owner renamed some on 8 November 2026 (see tests/legacy/harness.ts).
   */
  themeIdTitleOverrides: Record<string, string>;
  /** Themes that share another theme's image folder. */
  themeDuplicateOverrides: Record<string, string>;
  /** Theme id differs from the balance id (Ages only in practice). */
  themeIdOverrides: Record<string, string>;
  /** Version of the last balance change, by balance id. */
  balanceUpdateVersion: Record<string, string>;
  socialHelpUrls: { faq: string; discord: string; reddit: string; discord_old?: string };
  /** Prefix of saved keys, so both games can share one origin. */
  gameSaveKeyPrefix: string;
  /** Show the datamining warning for Motherland ranks from here on. */
  datamineWarningMinRank?: number;
  /** Show the datamining warning for this event theme. */
  datamineWarningThemeId?: string;
}

export const TITLES: Record<TitleKey, TitleConfig> = {
  adcom: {
    key: 'adcom',
    titleId: '6bf5',
    isAges: false,
    powers: [
      'K', 'M', 'B', 'T', 'AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'GG', 'HH', 'II', 'JJ', 'KK', 'LL', 'MM', 'NN', 'OO',
      'PP', 'QQ', 'RR', 'SS', 'TT', 'UU', 'VV', 'WW', 'XX', 'YY', 'ZZ', 'AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF',
      'GGG', 'HHH', 'III', 'JJJ', 'KFC', 'LLL', 'MMM', 'NNN', 'OOO', 'PPP', 'QQQ', 'RRR', 'SSS', 'TTT', 'UUU', 'VVV',
      'WWW', 'XXX', 'YYY', 'ZZZ', 'AAAA', 'BBBB', 'CCCC', 'DDDD', 'EEEE', 'FFFF', 'GGGG', 'HHHH', 'IIII', 'JJJJ',
      'KKKK', 'LLLL', 'MMMM', 'NNNN', 'OOOO', 'PPPP', 'QQQQ', 'RRRR', 'SSSS', 'TTTT', 'UUUU', 'VVVV', 'WWWW', 'XXXX',
      'YYYY', 'ZZZZ', 'AAAAA', 'BBBBB', 'CCCCC', 'DDDDD', 'EEEEE', 'FFFFF', 'GGGGG', 'HHHHH', 'IIIII', 'JJJJJ',
      'KKKKK', 'LLLLL', 'MMMMM', 'NNNNN', 'OOOOO', 'PPPPP', 'QQQQQ', 'RRRRR', 'SSSSS', 'TTTTT'
    ],
    themeIdTitleOverrides: {
      main: 'Motherland',
      attack: 'Oil',
      defense: 'Shield',
      potatofactory: 'Potato Factory',
      bamboo: 'Vacation',
      fusfarm: 'Farm to Table',
      fusscience: 'State Science',
      fuspet: 'Pet Show',
      fusvehicle: 'Vehicle Show',
      hexathlon: 'Motherland Games',
      minicockatrice: 'Mini Cockatrice',
      minipotatofactory: 'Mini Potato Factory',
      minisanta: 'Mini Santa',
      minisports: 'Mini MLG',
      minivacation: 'Mini Vacation',
      minivillain: 'Mini Villains'
    },
    themeDuplicateOverrides: {
      fusfarm: 'fusion',
      fusscience: 'fusion',
      fuspet: 'fusion',
      fusvehicle: 'fusion',
      minicockatrice: 'cockatrice',
      minipotatofactory: 'potatofactory',
      minisanta: 'santa',
      minivacation: 'bamboo',
      minivillain: 'supervillain'
    },
    themeIdOverrides: {},
    balanceUpdateVersion: {
      'atlantis-bal-3': '6.47',
      'attack-bal-20': '6.51',
      'bamboo-bal-10': '6.15',
      'cockatrice-bal-10': '6.48',
      'cowboy-bal-2': '6.47',
      'crusade-bal-1': '6.14',
      'defense-bal-21': '6.50',
      'export-bal-21': '6.50',
      'fusfarm-bal-30': '6.30',
      'fuspet-bal-32': '6.57',
      'fusscience-bal-31': '6.30',
      'fusvehicle-bal-32': '6.18',
      'hexathlon-bal-13': '6.19',
      'minicockatrice-bal-1': '6.43',
      'minipotatofactory-bal-13': '6.46',
      'minisanta-bal-1': '6.47',
      'minisports-bal-1': '6.56',
      'minivacation-bal-1': '6.49',
      'minivillain-bal-1': '6.49',
      'ninja-bal-1': '6.14',
      'potatofactory-bal-13': '6.38',
      'power-bal-20': '6.51',
      'santa-bal-10': '6.14',
      'space-bal-2': '6.14',
      'spooky-bal-10': '6.14',
      'stone-bal-4': '6.29',
      'supervillain-bal-17': '6.46',
      'winter-bal-3': '6.14',
      'zombie-bal-5': '6.14',
      main: '6.46'
    },
    socialHelpUrls: {
      faq: 'https://docs.google.com/document/d/1lCa0GNHjXOSpeCgMtqESU7i1UA8LUmObh1s0EfuUPHU/',
      discord: 'https://discord.gg/XMeABQzk3C',
      discord_old: 'https://discord.gg/hxPRpZME54',
      reddit: 'https://reddit.com/r/AdventureCommunist/'
    },
    gameSaveKeyPrefix: '',
    datamineWarningMinRank: 188,
    datamineWarningThemeId: undefined
  },
  ages: {
    key: 'ages',
    titleId: 'dc4bb',
    isAges: true,
    powers: [
      'K', 'M', 'B', 'T', 'AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'GG', 'HH', 'II', 'JJ', 'KK', 'LL', 'MM', 'NN', 'OO',
      'PP', 'QQ', 'RR', 'SS', 'TT', 'UU', 'VV', 'WW', 'XX', 'YY', 'ZZ', 'AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF',
      'GGG', 'HHH', 'III', 'JJJ', 'KFC', 'LLL', 'MMM', 'NNN', 'OOO', 'PPP', 'QQQ', 'RRR', 'SSS', 'TTT', 'UUU', 'VVV',
      'WWW', 'XXX', 'YYY', 'ZZZ', 'AAAA', 'BBBB', 'CCCC', 'DDDD', 'EEEE', 'FFFF', 'GGGG', 'HHHH', 'IIII', 'JJJJ',
      'KKKK', 'LLLL', 'MMMM', 'NNNN', 'OOOO', 'PPPP', 'QQQQ', 'RRRR', 'SSSS', 'TTTT', 'UUUU', 'VVVV', 'WWWW', 'XXXX',
      'YYYY', 'ZZZZ', 'AAAAA', 'BBBBB', 'CCCCC', 'DDDDD', 'EEEEE', 'FFFFF', 'GGGGG', 'HHHHH', 'IIIII', 'JJJJJ',
      'KKKKK', 'LLLLL', 'MMMMM', 'NNNNN', 'OOOOO', 'PPPPP', 'QQQQQ', 'RRRRR', 'SSSSS', 'TTTTT'
    ],
    themeIdTitleOverrides: {
      main: 'Ages',
      aliens: 'First Contact',
      fusionarchitecture: 'Architecture',
      fusioncareers: 'Careers',
      fusioninfrastructure: 'Infrastructure',
      fusioninnovation: 'Innovation',
      halloween: 'Monster Hunt',
      timetravel: 'Anniversary',
      mexico: 'Aztec',
      minidino: 'Mini Dino',
      minisanta: 'Mini Christmas',
      nature: 'New World'
    },
    themeDuplicateOverrides: {
      fusionarchitecture: 'fusion',
      fusioncareers: 'fusion',
      fusioninfrastructure: 'fusion',
      fusioninnovation: 'fusion'
    },
    themeIdOverrides: {
      architecture: 'fusionarchitecture',
      careers: 'fusioncareers',
      infrastructure: 'fusioninfrastructure',
      innovation: 'fusioninnovation',
      monster: 'halloween'
    },
    balanceUpdateVersion: {
      main: '1.22',
      'aliens-bal-1': '1.35',
      'architecture-bal-18': '1.22',
      'careers-bal-1': '1.15',
      'christmas-bal-13': '1.14',
      'dino-bal-10': '1.26',
      'egypt-bal-1': '1.22',
      'infrastructure-bal-17': '1.14',
      'innovation-bal-1': '1.22',
      'japan-bal-2': '1.15',
      'mexico-bal-2': '1.26',
      'minidino-bal-1': '1.35',
      'minisanta-bal-1': '1.35',
      'monster-bal-13': '1.12',
      'music-bal-6': '1.17',
      'nature-bal-1': '1.35',
      'scandinavia-bal-21': '1.17',
      'timetravel-bal-15': '1.16'
    },
    socialHelpUrls: {
      faq: 'https://docs.google.com/document/d/1ioNAqUrwWRGMuPFyctSU7dP5lT-H0h4iBtoigi7fgwg/',
      discord: 'https://discord.gg/XCnZKvBdVf',
      reddit: 'https://reddit.com/r/AdventureAges/'
    },
    gameSaveKeyPrefix: 'Ages-',
    datamineWarningMinRank: undefined,
    datamineWarningThemeId: undefined
  }
};
