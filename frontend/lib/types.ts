export type Pastor = {
  id: number;
  name: string;
  title: string;
  location: string;
};

export type Verse = { content: string };

export type Slide = {
  title: string;
  verses: Verse[];
};

export type VerseExtractResponse = {
  verses: string[];
  text: string;
  count: number;
};

export type LookupResponse = {
  slides: Slide[];
  notFound: string[];
  source: "offline" | "online";
  count: number;
};

export type ValidateResponse = {
  valid: boolean;
  message: string;
};

export type LyricsPreviewSlide = {
  kind: "stanza" | "section" | "lyrics";
  label: string | null;
  lines: string[];
  text: string;
};

export type LyricsPreviewResponse = {
  format: "ppt" | "pp7";
  useTheme: boolean;
  backgroundUrl: string | null;
  title: string;
  slideCount: number;
  slides: LyricsPreviewSlide[];
};

export type SermonPreviewSlide = {
  kind: "title" | "blank" | "verse" | "pastor";
  reference: string | null;
  lines: string[];
  text: string;
  title: string | null;
  pastorName: string | null;
  pastorInfo: string | null;
};

export type SermonPreviewResponse = {
  format: "ppt" | "pp7";
  useTheme: boolean;
  backgroundUrl: string | null;
  title: string;
  slideCount: number;
  slides: SermonPreviewSlide[];
};
