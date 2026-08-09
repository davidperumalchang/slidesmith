"use client";

import { useState } from "react";
import { PageHeader, Card, Field, Textarea, Button, Alert, Segmented } from "@/components/ui";
import { SlidesIcon, DownloadIcon } from "@/components/icons";
import { generateLyricsPp7 } from "@/lib/api";

const EXAMPLE = `Amazing Grace - John Newton

Amazing grace how sweet the sound
that saved a wretch like me

I once was lost, but now am found
was blind, but now I see

'Twas grace that taught my heart to fear,
and grace my fears relieved`;

export default function LyricsPp7Page() {
  const [content, setContent] = useState(EXAMPLE);
  const [template, setTemplate] = useState<"simple" | "theme">("simple");
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const onGenerate = async () => {
    setMessage(null);
    setGenerating(true);
    try {
      const filename = await generateLyricsPp7(content, template === "theme");
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
        icon={<SlidesIcon className="h-6 w-6" />}
        title="Lyrics → ProPresenter 7"
        description="Generate a ProPresenter 7 (.pro) file from song lyrics using a template."
      />

      <Card>
        <div className="space-y-5">
          <Field
            label="Lyrics"
            htmlFor="lyrics"
            hint="First line is the song title. Separate each slide's text with a blank line (typically two lines per slide). No stanza labels are needed."
          >
            <Textarea
              id="lyrics"
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Song Title - Artist&#10;&#10;first slide line one&#10;first slide line two&#10;&#10;second slide line one&#10;second slide line two"
            />
          </Field>

          <Field label="Template" hint="Themed templates include lower-third design elements.">
            <Segmented
              value={template}
              onChange={setTemplate}
              options={[
                { value: "simple", label: "Simple", description: "Plain text on a background" },
                { value: "theme", label: "Themed (lower third)", description: "With design elements" },
              ]}
            />
          </Field>
        </div>

        {message && (
          <div className="mt-4">
            <Alert variant={message.type}>{message.text}</Alert>
          </div>
        )}

        <div className="mt-5">
          <Button onClick={onGenerate} loading={generating}>
            <DownloadIcon className="h-4 w-4" />
            Generate .pro file
          </Button>
        </div>
      </Card>
    </div>
  );
}
