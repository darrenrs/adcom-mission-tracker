﻿// This is the configuration data for ADVENTURE AGES

var POWERS = ['K', 'M', 'B', 'T', 'AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'GG', 'HH', 'II', 'JJ', 'KK', 'LL', 'MM', 'NN', 'OO', 'PP', 'QQ', 'RR', 'SS', 'TT', 'UU', 'VV', 'WW', 'XX', 'YY', 'ZZ', 'AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF', 'GGG', 'HHH', 'III', 'JJJ', 'KFC', 'LLL', 'MMM', 'NNN', 'OOO', 'PPP', 'QQQ', 'RRR', 'SSS', 'TTT', 'UUU', 'VVV', 'WWW', 'XXX', 'YYY', 'ZZZ', 'AAAA', 'BBBB', 'CCCC', 'DDDD', 'EEEE', 'FFFF', 'GGGG', 'HHHH', 'IIII', 'JJJJ', 'KKKK', 'LLLL', 'MMMM', 'NNNN', 'OOOO', 'PPPP', 'QQQQ', 'RRRR', 'SSSS', 'TTTT', 'UUUU', 'VVVV', 'WWWW', 'XXXX', 'YYYY', 'ZZZZ', 'AAAAA', 'BBBBB', 'CCCCC', 'DDDDD', 'EEEEE', 'FFFFF', 'GGGGG', 'HHHHH', 'IIIII', 'JJJJJ', 'KKKKK', 'LLLLL', 'MMMMM', 'NNNNN', 'OOOOO', 'PPPPP', 'QQQQQ', 'RRRRR', 'SSSSS', 'TTTTT', 'UUUUU', 'VVVVV', 'WWWWW', 'XXXXX', 'YYYYY', 'ZZZZZ'];

// These are used for the event's title in the top-left nav menu.
// Typically, the ThemeId is used directly, but some themes are poorly-named.
var THEME_ID_TITLE_OVERRIDES = {
  "main": "Ages",
  "fusionarchitecture": "Architecture",
  "fusioncareers": "Careers",
  "fusioninfrastructure": "Infrastructure",
  "fusioninnovation": "Innovation",
  "timetravel": "Anniversary",
  "mexico": "Aztec"
};

// For balances that use the same theme, provide a value that corresponds with the folder found in the "img" folder.
// Examples: All fusions can use the "fusion" theme folder
const THEME_DUPLICATE_OVERRIDES = {
  "fusionarchitecture": "fusion",
  "fusioncareers": "fusion",
  "fusioninfrastructure": "fusion",
  "fusioninnovation": "fusion"
}

// Theme ID != Balance ID
// This is exclusively seen in Ages for now.
var THEME_ID_OVERRIDES = {
  "architecture": "fusionarchitecture",
  "careers": "fusioncareers",
  "infrastructure": "fusioninfrastructure",
  "innovation": "fusioninnovation",
  "monster": "halloween"
};

// Version for last balance update
var BALANCE_UPDATE_VERSION = {
  "main": "1.22",
  "architecture-bal-18": "1.22",
  "careers-bal-1": "1.15",
  "christmas-bal-13": "1.14",
  "dino-bal-10": "1.26",
  "egypt-bal-1": "1.22",
  "infrastructure-bal-17": "1.14",
  "innovation-bal-1": "1.22",
  "japan-bal-2": "1.15",
  "mexico-bal-2": "1.26",
  "monster-bal-13": "1.12",
  "music-bal-6": "1.17",
  "scandinavia-bal-21": "1.17",
  "timetravel-bal-15": "1.16"
};

// For game-specific documentation and social channels
var SOCIAL_HELP_URLS = {
  "faq": "https://docs.google.com/document/d/1ioNAqUrwWRGMuPFyctSU7dP5lT-H0h4iBtoigi7fgwg/",
  "discord": "https://discord.gg/XCnZKvBdVf",
  "discord_old": "https://discord.gg/hxPRpZME54",
  "reddit": "https://reddit.com/r/AdventureAges/"
}

// So that AdCom can have "CurrentMode" and Ages can have "Ages-CurrentMode"
var GAME_SAVE_KEY_PREFIX = "Ages-";

// If not undefined, will show a datamining warning at the top of the Tracker
var DATAMINE_WARNING_MIN_RANK = undefined; // For motherland
var DATAMINE_WARNING_THEME_ID = undefined; // For events