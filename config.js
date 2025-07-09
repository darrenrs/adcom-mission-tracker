// This is the configuration data for ADVENTURE COMMUNIST

var POWERS = ['K', 'M', 'B', 'T', 'AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'GG', 'HH', 'II', 'JJ', 'KK', 'LL', 'MM', 'NN', 'OO', 'PP', 'QQ', 'RR', 'SS', 'TT', 'UU', 'VV', 'WW', 'XX', 'YY', 'ZZ', 'AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF', 'GGG', 'HHH', 'III', 'JJJ', 'KFC', 'LLL', 'MMM', 'NNN', 'OOO', 'PPP', 'QQQ', 'RRR', 'SSS', 'TTT', 'UUU', 'VVV', 'WWW', 'XXX', 'YYY', 'ZZZ', 'AAAA', 'BBBB', 'CCCC', 'DDDD', 'EEEE', 'FFFF', 'GGGG', 'HHHH', 'IIII', 'JJJJ', 'KKKK', 'LLLL', 'MMMM', 'NNNN', 'OOOO', 'PPPP', 'QQQQ', 'RRRR', 'SSSS', 'TTTT', 'UUUU', 'VVVV', 'WWWW', 'XXXX', 'YYYY', 'ZZZZ', 'AAAAA', 'BBBBB', 'CCCCC', 'DDDDD', 'EEEEE', 'FFFFF', 'GGGGG', 'HHHHH', 'IIIII', 'JJJJJ', 'KKKKK', 'LLLLL', 'MMMMM', 'NNNNN', 'OOOOO', 'PPPPP', 'QQQQQ', 'RRRRR', 'SSSSS', 'TTTTT', 'UUUUU', 'VVVVV', 'WWWWW', 'XXXXX', 'YYYYY', 'ZZZZZ'];

// These are used for the event's title in the top-left nav menu.
// Typically, the ThemeId is used directly, but some themes are poorly-named.
const THEME_ID_TITLE_OVERRIDES = {
  "main": "Motherland",
  "attack": "Oil",
  "defense": "Shield",
  "potatofactory": "Potato Factory",
  "bamboo": "Vacation",
  "fusfarm": "Farm to Table",
  "fusscience": "State Science",
  "fuspet": "Pet Show",
  "fusvehicle": "Vehicle Show",
  "hexathlon": "Motherland Games",
  "minicockatrice": "Mini Cockatrice",
  "minipotatofactory": "Mini Potatofactory",
  "minisanta": "Mini Santa"
};

// For balances that use the same theme, provide a value that corresponds with the folder found in the "img" folder.
// Examples: All fusions can use the "fusion" theme folder
const THEME_DUPLICATE_OVERRIDES = {
  "fusfarm": "fusion",
  "fusscience": "fusion",
  "fuspet": "fusion",
  "fusvehicle": "fusion",
  "minicockatrice": "cockatrice",
  "minipotatofactory": "potatofactory",
  "minisanta": "santa"
};

// Theme ID != Balance ID
// This is exclusively seen in Ages for now.
const THEME_ID_OVERRIDES = {};

// Version for last balance update
// Only includes changes to the actual balance, per the interests of the community.
const BALANCE_UPDATE_VERSION = {
  "atlantis-bal-3": "6.47",
  "attack-bal-20": "6.14",
  "bamboo-bal-10": "6.15",
  "cockatrice-bal-10": "6.23",
  "cowboy-bal-2": "6.14",
  "crusade-bal-1": "6.14",
  "defense-bal-21": "6.14",
  "export-bal-21": "6.29",
  "fusfarm-bal-30": "6.30",
  "fuspet-bal-32": "6.30",
  "fusscience-bal-31": "6.30",
  "fusvehicle-bal-32": "6.18",
  "hexathlon-bal-13": "6.19",
  "minicockatrice-bal-1": "6.43",
  "minipotatofactory-bal-13": "6.46",
  "minisanta-bal-1": "6.47",
  "ninja-bal-1": "6.14",
  "potatofactory-bal-13": "6.38",
  "power-bal-20": "6.14",
  "santa-bal-10": "6.14",
  "space-bal-2": "6.14",
  "spooky-bal-10": "6.14",
  "stone-bal-4": "6.29",
  "supervillain-bal-17": "6.46",
  "winter-bal-3": "6.14",
  "zombie-bal-5": "6.14",
  "main": "6.46"
};

// For game-specific documentation and social channels
const SOCIAL_HELP_URLS = {
  "faq": "https://docs.google.com/document/d/1lCa0GNHjXOSpeCgMtqESU7i1UA8LUmObh1s0EfuUPHU/",
  "discord": "https://discord.gg/XMeABQzk3C",
  "discord_old": "https://discord.gg/hxPRpZME54",
  "reddit": "https://reddit.com/r/AdventureCommunist/"
}

// So that AdCom can have "CurrentMode" and Ages can have "Ages-CurrentMode"
const GAME_SAVE_KEY_PREFIX = "";

// If not undefined, will show a datamining warning at the top of the Tracker
var DATAMINE_WARNING_MIN_RANK = undefined; // For motherland
var DATAMINE_WARNING_THEME_ID = undefined; // For events

//var GS_SURVEY_URL = 'https://docs.google.com/forms/d/1Xcd8llOV7bElIz0slsPk9WmV6JtFIxMyQ1Y1dLvvPrs/'
