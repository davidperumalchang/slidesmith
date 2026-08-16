"use client";

import { useEffect, useState } from "react";
import { SlidePreviewShell } from "@/components/SlidePreviewShell";
import { PptSlideFrame, PptText, pptBox } from "@/components/PptSlideFrame";
import type { LyricsPreviewResponse, LyricsPreviewSlide } from "@/lib/types";

function PptSlideCanvas({
  slide,
  backgroundUrl,
  framed = true,
}: {
  slide: LyricsPreviewSlide;
  backgroundUrl: string | null;
  framed?: boolean;
}) {
  return (
    <PptSlideFrame backgroundUrl={backgroundUrl} framed={framed}>
      <div className="flex items-center justify-center" style={pptBox(0, 0, 16, 8.6)}>
        <PptText points={50} className="whitespace-pre-line">
          {slide.lines.join("\n")}
        </PptText>
      </div>
      <div className="flex items-center justify-center" style={pptBox(0, 8.6, 16, 0.4)}>
        <PptText points={12} className="truncate">
          {slide.label}
        </PptText>
      </div>
    </PptSlideFrame>
  );
}

function Pp7SlideCanvas({
  slide,
  useTheme,
}: {
  slide: LyricsPreviewSlide;
  useTheme: boolean;
}) {
  const isSection = slide.kind === "section";

  if (useTheme) {
    // Lower-third theme: clear upper stage, dark bar + white text in the lower band.
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-800 shadow-lg ring-1 ring-black/30">
        {/* Stage / live-video area (empty, like a lower-third template) */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-700/40 to-neutral-900/60" />
        <div className="pointer-events-none absolute inset-x-0 top-[18%] text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/25 sm:text-xs">
          Stage
        </div>

        {/* Lower third bar */}
        <div className="absolute inset-x-0 bottom-0 h-[28%] border-t border-white/10 bg-black/85 px-[6%] py-[2.5%]">
          <div className="flex h-full items-center justify-center">
            <p
              className={`whitespace-pre-line text-center font-bold leading-snug text-white ${
                isSection ? "tracking-wide" : ""
              }`}
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: isSection
                  ? "clamp(1.25rem, 3.4vw, 2.1rem)"
                  : "clamp(1.05rem, 3vw, 1.85rem)",
              }}
            >
              {slide.text}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Simple template: solid black, centered white Arial text (matches Template_Basic.pro).
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg ring-1 ring-black/30">
      <div className="flex h-full items-center justify-center px-[6%] py-[8%]">
        <p
          className={`whitespace-pre-line text-center font-normal leading-snug text-white ${
            isSection ? "tracking-wide" : ""
          }`}
          style={{
            // RTF uses ArialMT, not bold (\\b0) — match that for simple PP7.
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: isSection
              ? "clamp(1.5rem, 4.2vw, 2.75rem)"
              : "clamp(1.25rem, 3.8vw, 2.4rem)",
          }}
        >
          {slide.text}
        </p>
      </div>
    </div>
  );
}

function SlideCanvas({
  slide,
  preview,
}: {
  slide: LyricsPreviewSlide;
  preview: LyricsPreviewResponse;
}) {
  if (preview.format === "ppt") {
    return <PptSlideCanvas slide={slide} backgroundUrl={preview.backgroundUrl} />;
  }
  return <Pp7SlideCanvas slide={slide} useTheme={preview.useTheme} />;
}

function lyricsRailLabel(slide: LyricsPreviewSlide, index: number): string {
  if (slide.kind === "section" || slide.kind === "stanza") {
    return slide.label || `Slide ${index + 1}`;
  }
  return String(index + 1);
}

export function LyricsPreviewModal({
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
  preview: LyricsPreviewResponse | null;
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
    slide?.kind === "section" ? (
      <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
        Section
      </span>
    ) : slide?.kind === "stanza" && slide.label ? (
      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
        {slide.label}
      </span>
    ) : null;

  return (
    <SlidePreviewShell
      open={open}
      onClose={onClose}
      loading={loading}
      error={error}
      titleId="lyrics-preview-title"
      subtitle={
        preview
          ? `${preview.title || "Untitled"} · ${formatLabel} · ${total} slide${total === 1 ? "" : "s"}`
          : null
      }
      index={index}
      onIndexChange={setIndex}
      total={total}
      items={(preview?.slides ?? []).map((s, i) => ({
        label: lyricsRailLabel(s, i),
        previewText: s.text || s.label || `Slide ${i + 1}`,
        thumbnail:
          preview?.format === "ppt" ? (
            <PptSlideCanvas slide={s} backgroundUrl={preview.backgroundUrl} framed={false} />
          ) : undefined,
      }))}
      badge={badge}
    >
      {preview && slide && <SlideCanvas slide={slide} preview={preview} />}
    </SlidePreviewShell>
  );
}
