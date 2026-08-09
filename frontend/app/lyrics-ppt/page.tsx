"use client";

import { useState } from "react";
import { PageHeader, Card, Field, Textarea, Button, Alert } from "@/components/ui";
import { MusicIcon, DownloadIcon, CheckIcon } from "@/components/icons";
import { generateLyricsPptx, validateLyrics } from "@/lib/api";

const EXAMPLE = `Amazing Grace - John Newton

Verse 1
Amazing grace how sweet the sound
That saved a wretch like me
I once was lost but now am found
Was blind but now I see

Chorus
How precious did that grace appear
The hour I first believed`;

export default function LyricsPptPage() {
  const [content, setContent] = useState(EXAMPLE);
  const [validating, setValidating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const onValidate = async () => {
    setMessage(null);
    setValidating(true);
    try {
      const res = await validateLyrics(content);
      setMessage({ type: res.valid ? "success" : "error", text: res.message });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Validation failed." });
    } finally {
      setValidating(false);
    }
  };

  const onGenerate = async () => {
    setMessage(null);
    setGenerating(true);
    try {
      const filename = await generateLyricsPptx(content);
      setMessage({ type: "success", text: `Downloaded "${filename}".` });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Generation failed." });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<MusicIcon className="h-6 w-6" />}
        title="Lyrics → PowerPoint"
        description="Create a PowerPoint presentation from song lyrics — one stanza per slide."
      />

      <Card>
        <Field
          label="Lyrics"
          htmlFor="lyrics"
          hint="First line is the song title. Separate stanzas with a blank line. Each stanza starts with a label (e.g. 'Verse 1', 'Chorus') followed by its lyric lines."
        >
          <Textarea
            id="lyrics"
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Song Title - Artist&#10;&#10;Verse 1&#10;line one&#10;line two"
          />
        </Field>

        {message && (
          <div className="mt-4">
            <Alert variant={message.type}>{message.text}</Alert>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onValidate} loading={validating} disabled={generating}>
            <CheckIcon className="h-4 w-4" />
            Validate format
          </Button>
          <Button onClick={onGenerate} loading={generating} disabled={validating}>
            <DownloadIcon className="h-4 w-4" />
            Generate PowerPoint
          </Button>
        </div>
      </Card>
    </div>
  );
}
