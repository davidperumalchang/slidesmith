// Bible book reference data ported from the original Python project.
// Used by the verse extractor (fuzzy reference matching) and the offline
// USX Bible lookup (mapping names -> 3-letter USX book codes).

// Standard book name -> list of accepted abbreviations / alternate spellings.
export const BIBLE_BOOKS = {
  genesis: ["gen", "gn", "ge"],
  exodus: ["exo", "ex", "exod"],
  leviticus: ["lev", "lv", "le"],
  numbers: ["num", "nm", "nu"],
  deuteronomy: ["deut", "dt", "deu"],
  joshua: ["josh", "jos", "jsh"],
  judges: ["judg", "jdg", "jg", "jud"],
  ruth: ["rth", "ru", "rut"],
  "1 samuel": ["1 sam", "1 sm", "1st samuel", "first samuel", "1sa"],
  "2 samuel": ["2 sam", "2 sm", "2nd samuel", "second samuel", "2sa"],
  "1 kings": ["1 kgs", "1 ki", "1st kings", "first kings", "1k"],
  "2 kings": ["2 kgs", "2 ki", "2nd kings", "second kings", "2k"],
  "1 chronicles": ["1 chr", "1 ch", "1st chronicles", "first chronicles", "1chron"],
  "2 chronicles": ["2 chr", "2 ch", "2nd chronicles", "second chronicles", "2chron"],
  ezra: ["ezr", "ez"],
  nehemiah: ["neh", "ne"],
  esther: ["est", "esth", "es"],
  job: ["jb", "job"],
  psalms: ["ps", "psa", "psm", "psalm", "pss"],
  proverbs: ["prov", "prv", "pro"],
  ecclesiastes: ["eccl", "ecc", "ec", "qoh"],
  "song of solomon": ["song", "sos", "song of songs", "canticles", "cant"],
  isaiah: ["isa", "is"],
  jeremiah: ["jer", "jr", "je"],
  lamentations: ["lam", "la"],
  ezekiel: ["ezek", "ez", "eze"],
  daniel: ["dan", "dn", "da"],
  hosea: ["hos", "ho"],
  joel: ["jl", "joe"],
  amos: ["am", "amo"],
  obadiah: ["obad", "ob", "oba"],
  jonah: ["jon", "jnh"],
  micah: ["mic", "mi"],
  nahum: ["nah", "na"],
  habakkuk: ["hab", "hb"],
  zephaniah: ["zeph", "zep", "zp"],
  haggai: ["hag", "hg"],
  zechariah: ["zech", "zec", "zc"],
  malachi: ["mal", "ml"],
  matthew: ["matt", "mt", "mat"],
  mark: ["mk", "mr", "mrk"],
  luke: ["lk", "lu", "luk"],
  john: ["jn", "jhn", "jo"],
  acts: ["act", "ac", "acts of the apostles"],
  romans: ["rom", "rm", "ro"],
  "1 corinthians": ["1 cor", "1 co", "1st corinthians", "first corinthians", "1c"],
  "2 corinthians": ["2 cor", "2 co", "2nd corinthians", "second corinthians", "2c"],
  galatians: ["gal", "ga"],
  ephesians: ["eph", "ep"],
  philippians: ["phil", "php", "phi"],
  colossians: ["col", "co"],
  "1 thessalonians": ["1 thess", "1 th", "1st thessalonians", "first thessalonians", "1thes"],
  "2 thessalonians": ["2 thess", "2 th", "2nd thessalonians", "second thessalonians", "2thes"],
  "1 timothy": ["1 tim", "1 tm", "1st timothy", "first timothy", "1ti"],
  "2 timothy": ["2 tim", "2 tm", "2nd timothy", "second timothy", "2ti"],
  titus: ["tit", "ti"],
  philemon: ["phlm", "phm", "phile"],
  hebrews: ["heb", "he"],
  james: ["jas", "ja", "jm"],
  "1 peter": ["1 pet", "1 pt", "1st peter", "first peter", "1p"],
  "2 peter": ["2 pet", "2 pt", "2nd peter", "second peter", "2p"],
  "1 john": ["1 jn", "1st john", "first john", "1jo"],
  "2 john": ["2 jn", "2nd john", "second john", "2jo"],
  "3 john": ["3 jn", "3rd john", "third john", "3jo"],
  jude: ["jud", "jd"],
  revelation: ["rev", "rv", "apocalypse", "re"],
};

// Maximum number of chapters in each book (validates extracted references).
export const BOOK_MAX_CHAPTERS = {
  genesis: 50, exodus: 40, leviticus: 27, numbers: 36, deuteronomy: 34,
  joshua: 24, judges: 21, ruth: 4, "1 samuel": 31, "2 samuel": 24,
  "1 kings": 22, "2 kings": 25, "1 chronicles": 29, "2 chronicles": 36, ezra: 10,
  nehemiah: 13, esther: 10, job: 42, psalms: 150, proverbs: 31,
  ecclesiastes: 12, "song of solomon": 8, isaiah: 66, jeremiah: 52, lamentations: 5,
  ezekiel: 48, daniel: 12, hosea: 14, joel: 3, amos: 9,
  obadiah: 1, jonah: 4, micah: 7, nahum: 3, habakkuk: 3,
  zephaniah: 3, haggai: 2, zechariah: 14, malachi: 4, matthew: 28,
  mark: 16, luke: 24, john: 21, acts: 28, romans: 16,
  "1 corinthians": 16, "2 corinthians": 13, galatians: 6, ephesians: 6, philippians: 4,
  colossians: 4, "1 thessalonians": 5, "2 thessalonians": 3, "1 timothy": 6, "2 timothy": 4,
  titus: 3, philemon: 1, hebrews: 13, james: 5, "1 peter": 5,
  "2 peter": 3, "1 john": 5, "2 john": 1, "3 john": 1, jude: 1,
  revelation: 22,
};

// Standard book name -> USX 3-letter book code (for offline USX lookup).
export const BOOK_CODES = {
  genesis: "GEN", exodus: "EXO", leviticus: "LEV", numbers: "NUM",
  deuteronomy: "DEU", joshua: "JOS", judges: "JDG", ruth: "RUT",
  "1 samuel": "1SA", "2 samuel": "2SA", "1 kings": "1KI", "2 kings": "2KI",
  "1 chronicles": "1CH", "2 chronicles": "2CH", ezra: "EZR", nehemiah: "NEH",
  esther: "EST", job: "JOB", psalms: "PSA", psalm: "PSA",
  proverbs: "PRO", ecclesiastes: "ECC", "song of solomon": "SNG",
  isaiah: "ISA", jeremiah: "JER", lamentations: "LAM",
  ezekiel: "EZK", daniel: "DAN", hosea: "HOS", joel: "JOL",
  amos: "AMO", obadiah: "OBA", jonah: "JON", micah: "MIC",
  nahum: "NAM", habakkuk: "HAB", zephaniah: "ZEP", haggai: "HAG",
  zechariah: "ZEC", malachi: "MAL", matthew: "MAT", mark: "MRK",
  luke: "LUK", john: "JHN", acts: "ACT", romans: "ROM",
  "1 corinthians": "1CO", "2 corinthians": "2CO", galatians: "GAL",
  ephesians: "EPH", philippians: "PHP", colossians: "COL",
  "1 thessalonians": "1TH", "2 thessalonians": "2TH", "1 timothy": "1TI",
  "2 timothy": "2TI", titus: "TIT", philemon: "PHM", hebrews: "HEB",
  james: "JAS", "1 peter": "1PE", "2 peter": "2PE", "1 john": "1JN",
  "2 john": "2JN", "3 john": "3JN", jude: "JUD", revelation: "REV",
};

// Reverse map: any abbreviation/name (lowercased) -> standard book name.
export const BOOK_NAME_MAP = (() => {
  const map = {};
  for (const [standard, abbrs] of Object.entries(BIBLE_BOOKS)) {
    map[standard.toLowerCase()] = standard;
    for (const abbr of abbrs) map[abbr.toLowerCase()] = standard;
  }
  return map;
})();
