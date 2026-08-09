"use client";

import { useEffect, useState } from "react";
import { SlidePreviewShell } from "@/components/SlidePreviewShell";
import type { SermonPreviewResponse, SermonPreviewSlide } from "@/lib/types";

/** Mirrors pptxgenjs fill transparency 20% → 80% opaque black overlay. */
const PPT_OVERLAY = "rgba(0,0,0,0.8)";

function PptBackground({ backgroundUrl }: { backgroundUrl: string | null }) {
  if (!backgroundUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={backgroundUrl}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

function PptSlideCanvas({
  slide,
  backgroundUrl,
}: {
  slide: SermonPreviewSlide;
  backgroundUrl: string | null;
}) {
  if (slide.kind === "blank") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg ring-1 ring-black/30">
        <PptBackground backgroundUrl={backgroundUrl} />
      </div>
    );
  }

  if (slide.kind === "title") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg ring-1 ring-black/30">
        <PptBackground backgroundUrl={backgroundUrl} />
        <div className="absolute inset-[6.25%] flex items-center justify-center">
          <div
            className="w-full px-[4%] py-[6%] text-center"
            style={{ backgroundColor: PPT_OVERLAY }}
          >
            <p
              className="font-bold leading-tight text-white"
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "clamp(1.35rem, 3.8vw, 2.5rem)",
              }}
            >
              {slide.title}
            </p>
            <div className="h-[0.6em]" />
            <p
              className="font-bold leading-tight text-white"
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "clamp(1.1rem, 3.2vw, 2rem)",
              }}
            >
              {slide.pastorName}
            </p>
            <p
              className="mt-1 font-bold leading-snug text-white"
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "clamp(0.85rem, 2.4vw, 1.55rem)",
              }}
            >
              {slide.pastorInfo}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Verse slide — reference strip + body (ratios from generateSermonPptx).
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg ring-1 ring-black/30">
      <PptBackground backgroundUrl={backgroundUrl} />
      <div
        className="absolute left-[3.125%] right-[3.125%] top-[5.55%] flex items-center justify-center px-3"
        style={{ height: "16.67%", backgroundColor: PPT_OVERLAY }}
      >
        <p
          className="text-center font-bold leading-tight text-white"
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "clamp(1.15rem, 3.4vw, 2.2rem)",
          }}
        >
          {slide.reference}
        </p>
      </div>
      <div
        className="absolute bottom-[11%] left-[3.125%] right-[3.125%] top-[27.8%] overflow-hidden px-[3%] py-[2.5%]"
        style={{ backgroundColor: PPT_OVERLAY }}
      >
        <p
          className="whitespace-pre-line text-left font-bold leading-snug text-white"
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "clamp(1rem, 3vw, 1.95rem)",
          }}
        >
          {slide.text}
        </p>
      </div>
    </div>
  );
}

function Pp7SlideCanvas({
  slide,
  useTheme,
}: {
  slide: SermonPreviewSlide;
  useTheme: boolean;
}) {
  const isPastor = slide.kind === "pastor";
  const body = isPastor ? slide.text : slide.text;
  const reference = isPastor ? null : slide.reference;

  if (useTheme) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-800 shadow-lg ring-1 ring-black/30">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-700/40 to-neutral-900/60" />
        <div className="pointer-events-none absolute inset-x-0 top-[18%] text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/25 sm:text-xs">
          Stage
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[32%] border-t border-white/10 bg-black/85 px-[5%] py-[2%]">
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            {reference && (
              <p
                className="font-bold text-white/90"
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "clamp(0.75rem, 1.8vw, 1.1rem)",
                }}
              >
                {reference}
              </p>
            )}
            <p
              className="whitespace-pre-line font-bold leading-snug text-white"
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: isPastor
                  ? "clamp(0.95rem, 2.6vw, 1.55rem)"
                  : "clamp(1rem, 2.8vw, 1.7rem)",
              }}
            >
              {body}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg ring-1 ring-black/30">
      <div className="flex h-full flex-col items-center justify-center gap-3 px-[6%] py-[8%] text-center">
        {reference && (
          <p
            className="font-normal text-white/80"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "clamp(0.95rem, 2.6vw, 1.6rem)",
            }}
          >
            {reference}
          </p>
        )}
        <p
          className="whitespace-pre-line font-normal leading-snug text-white"
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: isPastor
              ? "clamp(1.1rem, 3.2vw, 2rem)"
              : "clamp(1.15rem, 3.4vw, 2.15rem)",
          }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}

function SlideCanvas({
  slide,
  preview,
}: {
  slide: SermonPreviewSlide;
  preview: SermonPreviewResponse;
}) {
  if (preview.format === "ppt") {
    return <PptSlideCanvas slide={slide} backgroundUrl={preview.backgroundUrl} />;
  }
  return <Pp7SlideCanvas slide={slide} useTheme={preview.useTheme} />;
}

function sermonRailLabel(slide: SermonPreviewSlide, index: number): string {
  if (slide.kind === "title") return "Title";
  if (slide.kind === "blank") return "Blank";
  if (slide.kind === "pastor") return "Pastor";
  return slide.reference || `Slide ${index + 1}`;
}

function sermonRailPreview(slide: SermonPreviewSlide): string {
  if (slide.kind === "blank") return "";
  if (slide.kind === "title") {
    return [slide.title, slide.pastorName].filter(Boolean).join("\n");
  }
  if (slide.kind === "pastor") return slide.text;
  return [slide.reference, slide.text].filter(Boolean).join("\n");
}

export function SermonPreviewModal({
  open,
  onClose,
  loading,
  error,
  preview,
}: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  preview: SermonPreviewResponse | null;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, preview]);

  const slide = preview?.slides[index];
  const total = preview?.slideCount ?? 0;
  const formatLabel =
    preview?.format === "pp7"
      ? `ProPresenter 7 · ${preview.useTheme ? "Themed" : "Simple"}`
      : "PowerPoint";

  const badge =
    slide?.kind === "title" ? (
      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
        Title
      </span>
    ) : slide?.kind === "blank" ? (
      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
        Blank
      </span>
    ) : slide?.kind === "pastor" ? (
      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
        Pastor
      </span>
    ) : slide?.kind === "verse" && slide.reference ? (
      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
        {slide.reference}
      </span>
    ) : null;

  return (
    <SlidePreviewShell
      open={open}
      onClose={onClose}
      loading={loading}
      error={error}
      titleId="sermon-preview-title"
      subtitle={
        preview
          ? `${preview.title || "Sermon"} · ${formatLabel} · ${total} slide${total === 1 ? "" : "s"}`
          : null
      }
      index={index}
      onIndexChange={setIndex}
      total={total}
      items={(preview?.slides ?? []).map((s, i) => ({
        label: sermonRailLabel(s, i),
        previewText: sermonRailPreview(s),
      }))}
      badge={badge}
    >
      {preview && slide && <SlideCanvas slide={slide} preview={preview} />}
    </SlidePreviewShell>
  );
}
