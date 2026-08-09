"use client";

import { useState } from "react";
import {
  Card,
  Field,
  Textarea,
  Button,
  Alert,
  Segmented,
  OutputFormatToggle,
  type OutputFormat,
} from "@/components/ui";
import { DownloadIcon, CheckIcon, EyeIcon } from "@/components/icons";
import { LyricsPreviewModal } from "@/components/LyricsPreviewModal";
import {
  generateLyricsPptx,
  generateLyricsPp7,
  validateLyrics,
  previewLyrics,
} from "@/lib/api";
import type { LyricsPreviewResponse } from "@/lib/types";

// Both outputs share the same labelled-stanza format. For ProPresenter, each
// section label becomes its own slide and lyrics are split 2 lines per slide.
const EXAMPLE = `Amazing Grace - John Newton

Verse 1
Amazing grace how sweet the sound
That saved a wretch like me
I once was lost but now am found
Was blind but now I see

Chorus
How precious did that grace appear
The hour I first believed`;

type Msg = { type: "success" | "error" | "info"; text: string } | null;

export function LyricsWorkflow() {
  const [output, setOutput] = useState<OutputFormat>("ppt");
  const [content, setContent] = useState(EXAMPLE);
  const [template, setTemplate] = useState<"simple" | "theme">("simple");
  const [validating, setValidating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<Msg>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<LyricsPreviewResponse | null>(null);

  const busy = validating || generating || previewLoading;

  const switchOutput = (v: OutputFormat) => {
    setOutput(v);
    setMessage(null);
  };

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

  const onPreview = async () => {
    setMessage(null);
    setPreviewError(null);
    setPreview(null);
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const res = await previewLyrics(content, output, template === "theme");
      setPreview(res);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Preview failed.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const onGenerate = async () => {
    setMessage(null);
    setGenerating(true);
    try {
      const filename =
        output === "ppt"
          ? await generateLyricsPptx(content)
          : await generateLyricsPp7(content, template === "theme");
      setMessage({ type: "success", text: `Downloaded "${filename}".` });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Generation failed." });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <Field label="Output format" hint="Choose what to generate.">
          <OutputFormatToggle value={output} onChange={switchOutput} />
        </Field>
      </Card>

      <Card>
        <Field
          label="Lyrics"
          htmlFor="lyrics"
          hint={
            output === "ppt"
              ? "First line is the song title. Separate stanzas with a blank line. Each stanza starts with a label (e.g. 'Verse 1', 'Chorus') followed by its lyric lines — one stanza per PowerPoint slide."
              : "Same format as PowerPoint. On generate: each section label (Verse, Chorus, …) becomes its own slide, then lyrics are split into 2 lines per slide."
          }
        >
          <Textarea
            id="lyrics"
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </Field>

        {output === "pp7" && (
          <div className="mt-5">
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
        )}

        {message && (
          <div className="mt-4">
            <Alert variant={message.type}>{message.text}</Alert>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onValidate} loading={validating} disabled={busy && !validating}>
            <CheckIcon className="h-4 w-4" />
            Validate format
          </Button>
          <Button variant="secondary" onClick={onPreview} loading={previewLoading} disabled={busy && !previewLoading}>
            <EyeIcon className="h-4 w-4" />
            Preview
          </Button>
          <Button onClick={onGenerate} loading={generating} disabled={busy && !generating}>
            <DownloadIcon className="h-4 w-4" />
            {output === "ppt" ? "Generate PowerPoint" : "Generate .pro file"}
          </Button>
        </div>
      </Card>

      <LyricsPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        loading={previewLoading}
        error={previewError}
        preview={preview}
      />
    </div>
  );
}
