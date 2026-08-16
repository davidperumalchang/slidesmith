"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  Field,
  Textarea,
  Input,
  Select,
  Button,
  Alert,
  Segmented,
  StepBadge,
} from "@/components/ui";
import { UploadIcon, DownloadIcon, CheckIcon, EyeIcon } from "@/components/icons";
import { SermonPreviewModal } from "@/components/SermonPreviewModal";
import {
  LookupProgressModal,
  type LookupProgressItem,
} from "@/components/LookupProgressModal";
import {
  getPastors,
  getOfflineBibleVersions,
  extractVerses,
  lookupPassages,
  previewSermon,
  generateSermonPptx,
  generateSermonPp7,
} from "@/lib/api";
import type { BibleVersion, Pastor, SermonPreviewResponse, Slide } from "@/lib/types";

type SourceTab = "notes" | "refs" | "manual";
type Msg = { type: "success" | "error" | "info" | "warning"; text: string } | null;

function parseReferences(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

// Client-side port of the original "parse_verse_list_to_json": title line + verse
// lines per blank-line-separated block.
function parseManualPassages(text: string): Slide[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split("\n");
      const title = lines[0].trim();
      const verses = lines
        .slice(1)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((content) => ({ content }));
      return { title, verses };
    })
    .filter((s) => s.title);
}

const TABS: { id: SourceTab; label: string }[] = [
  { id: "notes", label: "From sermon notes" },
  { id: "refs", label: "Enter references" },
  { id: "manual", label: "Enter passages manually" },
];

const NOTES_ACCEPT = [
  ".doc",
  ".docx",
  ".txt",
  ".md",
  ".pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "application/pdf",
].join(",");

export function SermonWorkflow({ outputType }: { outputType: "ppt" | "pp7" }) {
  const [pastors, setPastors] = useState<Pastor[]>([]);
  const [pastorId, setPastorId] = useState<string>("");
  const [sermonTitle, setSermonTitle] = useState("");
  const [template, setTemplate] = useState<"simple" | "theme">("theme");

  const [tab, setTab] = useState<SourceTab>("notes");
  const [referenceText, setReferenceText] = useState("");
  const [manualText, setManualText] = useState("");
  const [source, setSource] = useState<"offline" | "online">("offline");
  const [offlineVersions, setOfflineVersions] = useState<BibleVersion[]>([]);
  const [offlineVersion, setOfflineVersion] = useState("NKJV");
  const [onlineVersion, setOnlineVersion] = useState("NKJV");

  const [fileName, setFileName] = useState<string>("");
  const [extracting, setExtracting] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SermonPreviewResponse | null>(null);

  const [progressOpen, setProgressOpen] = useState(false);
  const [progressItems, setProgressItems] = useState<LookupProgressItem[]>([]);
  const cancelLookupRef = useRef(false);

  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [notFound, setNotFound] = useState<string[]>([]);
  const [step1Msg, setStep1Msg] = useState<Msg>(null);
  const [genMsg, setGenMsg] = useState<Msg>(null);

  const busy = extracting || lookingUp || generating || previewLoading;

  useEffect(() => {
    getPastors()
      .then(setPastors)
      .catch(() => setPastors([]));
  }, []);

  useEffect(() => {
    getOfflineBibleVersions()
      .then((versions) => {
        setOfflineVersions(versions);
        if (versions.length > 0 && !versions.some((v) => v.id === offlineVersion)) {
          setOfflineVersion(versions[0].id);
        }
      })
      .catch(() => setOfflineVersions([]));
    // Runs once — the bundled translations cannot change while the page is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalVerses = useMemo(
    () => (slides ?? []).reduce((sum, s) => sum + s.verses.length, 0),
    [slides],
  );

  const resetPassages = () => {
    setSlides(null);
    setNotFound([]);
    setGenMsg(null);
  };

  const onFileChange = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setStep1Msg(null);
    resetPassages();
    setExtracting(true);
    try {
      const res = await extractVerses(file);
      setReferenceText(res.text);
      setStep1Msg({
        type: res.count > 0 ? "success" : "warning",
        text:
          res.count > 0
            ? `Extracted ${res.count} reference${res.count === 1 ? "" : "s"}. Review and edit them below, then look them up.`
            : "No Bible references were found in that document. You can type them in manually below.",
      });
    } catch (e) {
      setStep1Msg({ type: "error", text: e instanceof Error ? e.message : "Extraction failed." });
    } finally {
      setExtracting(false);
    }
  };

  const updateProgress = (index: number, patch: Partial<LookupProgressItem>) => {
    setProgressItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  /**
   * BibleGateway is scraped one passage per request, so a single failure used to
   * sink the whole batch. Requesting each reference on its own keeps the good
   * results and shows which references failed.
   */
  const lookupOnlineSequentially = async (references: string[]) => {
    cancelLookupRef.current = false;
    setProgressItems(references.map((reference) => ({ reference, status: "pending" })));
    setProgressOpen(true);

    const found: Slide[] = [];
    const missing: string[] = [];

    for (let i = 0; i < references.length; i += 1) {
      if (cancelLookupRef.current) {
        setProgressItems((prev) =>
          prev.map((item) =>
            item.status === "pending" ? { ...item, status: "skipped", detail: "Skipped" } : item,
          ),
        );
        break;
      }

      const reference = references[i];
      updateProgress(i, { status: "active" });

      try {
        const res = await lookupPassages({
          references: [reference],
          source: "online",
          version: onlineVersion,
        });

        if (res.slides.length > 0) {
          found.push(...res.slides);
          const verses = res.slides.reduce((sum, s) => sum + s.verses.length, 0);
          updateProgress(i, {
            status: "found",
            detail: `${verses} verse${verses === 1 ? "" : "s"}`,
          });
        } else {
          missing.push(reference);
          updateProgress(i, { status: "missing", detail: "Not found" });
        }
      } catch (e) {
        missing.push(reference);
        updateProgress(i, {
          status: "error",
          detail: e instanceof Error ? e.message : "Lookup failed",
        });
      }
    }

    setSlides(found.length > 0 ? found : null);
    setNotFound(missing);
    if (found.length === 0) {
      setStep1Msg({ type: "error", text: "No passages could be found for those references." });
    }
  };

  const onLookup = async () => {
    const references = parseReferences(referenceText);
    if (references.length === 0) {
      setStep1Msg({ type: "error", text: "Please provide at least one Bible reference." });
      return;
    }
    setStep1Msg(null);
    resetPassages();
    setLookingUp(true);
    try {
      if (source === "online") {
        await lookupOnlineSequentially(references);
      } else {
        const res = await lookupPassages({ references, source, version: offlineVersion });
        setSlides(res.slides);
        setNotFound(res.notFound);
        if (res.slides.length === 0) {
          setStep1Msg({ type: "error", text: "No passages could be found for those references." });
        }
      }
    } catch (e) {
      setStep1Msg({ type: "error", text: e instanceof Error ? e.message : "Lookup failed." });
    } finally {
      setLookingUp(false);
    }
  };

  const onUseManual = () => {
    const parsed = parseManualPassages(manualText);
    if (parsed.length === 0) {
      setStep1Msg({ type: "error", text: "Please enter at least one passage (a title line followed by verse lines)." });
      return;
    }
    setStep1Msg(null);
    setNotFound([]);
    setGenMsg(null);
    setSlides(parsed);
  };

  const onPreview = async () => {
    if (!slides || slides.length === 0) return;
    setPreviewError(null);
    setPreview(null);
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const pid = pastorId ? Number(pastorId) : undefined;
      const res = await previewSermon({
        slides,
        format: outputType,
        pastorId: pid,
        sermonTitle: sermonTitle || undefined,
        useTheme: template === "theme",
      });
      setPreview(res);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Preview failed.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const onGenerate = async () => {
    if (!slides || slides.length === 0) return;
    setGenMsg(null);
    setGenerating(true);
    try {
      const pid = pastorId ? Number(pastorId) : undefined;
      const filename =
        outputType === "ppt"
          ? await generateSermonPptx({ slides, pastorId: pid, sermonTitle: sermonTitle || undefined })
          : await generateSermonPp7({ slides, pastorId: pid, useTheme: template === "theme" });
      setGenMsg({ type: "success", text: `Downloaded "${filename}".` });
    } catch (e) {
      setGenMsg({ type: "error", text: e instanceof Error ? e.message : "Generation failed." });
    } finally {
      setGenerating(false);
    }
  };

  const lookupControls = (
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <div className="w-52">
        <Field label="Source">
          <Select
            value={source}
            onChange={(v) => setSource(v as "offline" | "online")}
            options={[
              { value: "offline", label: "Offline" },
              { value: "online", label: "Online (BibleGateway)" },
            ]}
            aria-label="Bible lookup source"
          />
        </Field>
      </div>
      {source === "offline" ? (
        <div className="w-44">
          <Field label="Version">
            <Select
              value={offlineVersion}
              onChange={setOfflineVersion}
              placeholder={offlineVersions.length === 0 ? "Loading…" : "Select version…"}
              disabled={offlineVersions.length === 0}
              options={offlineVersions.map((v) => ({ value: v.id, label: v.id }))}
              aria-label="Offline Bible version"
            />
          </Field>
        </div>
      ) : (
        <div className="w-32">
          <Field label="Version">
            <Input
              value={onlineVersion}
              onChange={(e) => setOnlineVersion(e.target.value)}
              placeholder="NKJV"
            />
          </Field>
        </div>
      )}
      <Button onClick={onLookup} loading={lookingUp} disabled={extracting}>
        <CheckIcon className="h-4 w-4" />
        Look up passages
      </Button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Step 1: acquire passages */}
      <Card>
        <StepBadge n={1} title="Get Bible passages" done={!!slides} />

        <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setStep1Msg(null);
              }}
              className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${tab === t.id ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "notes" && (
          <div className="space-y-4">
            <Field
              label="Sermon notes"
              hint="Upload a .doc, .docx, .txt, .md, or .pdf file to auto-extract Bible references."
            >
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600 transition hover:border-brand-400 hover:bg-brand-50">
                <UploadIcon className="h-5 w-5 text-slate-400" />
                <span>{fileName ? fileName : "Choose a .doc, .docx, .txt, .md, or .pdf file…"}</span>
                <input
                  type="file"
                  accept={NOTES_ACCEPT}
                  className="hidden"
                  onChange={(e) => onFileChange(e.target.files?.[0])}
                  disabled={extracting}
                />
              </label>
            </Field>
            {extracting && <p className="text-sm text-slate-500">Extracting references…</p>}
            <Field label="References" hint="Comma or newline separated, e.g. John 3:16, Romans 8:28-30">
              <Textarea
                rows={5}
                value={referenceText}
                onChange={(e) => setReferenceText(e.target.value)}
                placeholder="John 3:16, Romans 8:28-30"
              />
            </Field>
            {lookupControls}
          </div>
        )}

        {tab === "refs" && (
          <div>
            <Field label="References" hint="Comma or newline separated, e.g. John 3:16, Romans 8:28-30, Psalms 23:1-3">
              <Textarea
                rows={6}
                value={referenceText}
                onChange={(e) => setReferenceText(e.target.value)}
                placeholder="John 3:16&#10;Romans 8:28-30&#10;Psalms 23:1-3"
              />
            </Field>
            {lookupControls}
          </div>
        )}

        {tab === "manual" && (
          <div>
            <Field
              label="Passages"
              hint="One passage per block (separated by a blank line). First line is the reference/title; following lines are the verses shown on slides."
            >
              <Textarea
                rows={10}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder={"John 3:16\n16 For God so loved the world...\n\nPsalm 23:1\n1 The Lord is my shepherd..."}
              />
            </Field>
            <div className="mt-4">
              <Button onClick={onUseManual}>
                <CheckIcon className="h-4 w-4" />
                Use these passages
              </Button>
            </div>
          </div>
        )}

        {step1Msg && (
          <div className="mt-4">
            <Alert variant={step1Msg.type}>{step1Msg.text}</Alert>
          </div>
        )}

        {slides && slides.length > 0 && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-emerald-800">
                {slides.length} passage{slides.length === 1 ? "" : "s"} · {totalVerses} verse
                {totalVerses === 1 ? "" : "s"} ready
              </p>
              <button
                type="button"
                onClick={resetPassages}
                className="text-xs font-medium text-emerald-700 underline-offset-2 hover:underline"
              >
                Clear
              </button>
            </div>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {slides.map((s, i) => (
                <li
                  key={i}
                  className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"
                >
                  {s.title} ({s.verses.length})
                </li>
              ))}
            </ul>
          </div>
        )}

        {notFound.length > 0 && (
          <div className="mt-3">
            <Alert variant="warning">Could not find: {notFound.join(", ")}</Alert>
          </div>
        )}
      </Card>

      {/* Step 2: details + generate */}
      <Card>
        <StepBadge n={2} title="Details & generate" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preacher" hint="Optional — leave as placeholder to fill in later.">
            <Select
              value={pastorId}
              onChange={setPastorId}
              placeholder="Select preacher…"
              options={[
                { value: "", label: "— Select preacher —" },
                ...pastors.map((p) => ({
                  value: String(p.id),
                  label: `${p.name} — ${p.title}, ${p.location}`,
                })),
              ]}
              aria-label="Preacher"
            />
          </Field>

          {outputType === "ppt" ? (
            <Field label="Sermon title" hint="Shown on the title slide.">
              <Input
                value={sermonTitle}
                onChange={(e) => setSermonTitle(e.target.value)}
                placeholder="e.g. Walking in Grace"
              />
            </Field>
          ) : (
            <Field label="Template" hint="Themed templates include lower-third design elements.">
              <Segmented
                value={template}
                onChange={setTemplate}
                options={[
                  { value: "simple", label: "Simple" },
                  { value: "theme", label: "Themed" },
                ]}
              />
            </Field>
          )}
        </div>

        {genMsg && (
          <div className="mt-4">
            <Alert variant={genMsg.type}>{genMsg.text}</Alert>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={onPreview}
            loading={previewLoading}
            disabled={!slides || slides.length === 0 || (busy && !previewLoading)}
          >
            <EyeIcon className="h-4 w-4" />
            Preview
          </Button>
          <Button
            onClick={onGenerate}
            loading={generating}
            disabled={!slides || slides.length === 0 || (busy && !generating)}
          >
            <DownloadIcon className="h-4 w-4" />
            {outputType === "ppt" ? "Generate PowerPoint" : "Generate .pro file"}
          </Button>
          {(!slides || slides.length === 0) && (
            <p className="w-full text-sm text-red-600">Complete step 1 to enable preview and generation.</p>
          )}
        </div>
      </Card>

      <LookupProgressModal
        open={progressOpen}
        items={progressItems}
        running={lookingUp}
        version={onlineVersion}
        onCancel={() => {
          cancelLookupRef.current = true;
        }}
        onClose={() => setProgressOpen(false)}
      />

      <SermonPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        loading={previewLoading}
        error={previewError}
        preview={preview}
      />
    </div>
  );
}
