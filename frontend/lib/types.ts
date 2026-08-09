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
