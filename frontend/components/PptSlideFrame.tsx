import type { CSSProperties, ReactNode } from "react";

/** 16×9 inches — same layout as generateLyricsPptx / generateSermonPptx. */
export const PPT_SLIDE_W = 16;
export const PPT_SLIDE_H = 9;

/** pptxgenjs fill transparency 20% → 80% opaque black. */
export const PPT_OVERLAY = "rgba(0,0,0,0.8)";
export const PPT_FONT = "Arial, Helvetica, sans-serif";

/** PowerPoint default text-frame inset when pptxgenjs does not set margin. */
const PPT_INSET_IN = 0.1;

export function pptFontSize(points: number): string {
  return `${(points / (PPT_SLIDE_W * 72)) * 100}cqw`;
}

export function pptBox(x: number, y: number, w: number, h: number): CSSProperties {
  return {
    position: "absolute",
    left: `${(x / PPT_SLIDE_W) * 100}%`,
    top: `${(y / PPT_SLIDE_H) * 100}%`,
    width: `${(w / PPT_SLIDE_W) * 100}%`,
    height: `${(h / PPT_SLIDE_H) * 100}%`,
    padding: `${(PPT_INSET_IN / PPT_SLIDE_H) * 100}% ${(PPT_INSET_IN / PPT_SLIDE_W) * 100}%`,
    boxSizing: "border-box",
    backgroundColor: PPT_OVERLAY,
  };
}

export function PptText({
  points,
  align = "center",
  className = "",
  children,
}: {
  points: number;
  align?: "center" | "left";
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={`font-bold text-white ${align === "left" ? "text-left" : "text-center"} ${className}`}
      style={{
        fontFamily: PPT_FONT,
        fontSize: pptFontSize(points),
        lineHeight: 1.15,
      }}
    >
      {children}
    </p>
  );
}

export function PptSlideFrame({
  backgroundUrl,
  framed = true,
  children,
}: {
  backgroundUrl: string | null;
  framed?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={`relative aspect-video w-full overflow-hidden bg-black ${
        framed ? "rounded-xl shadow-lg ring-1 ring-black/30" : ""
      }`}
      style={{ containerType: "inline-size" }}
    >
      {backgroundUrl && (
        // Stretch like pptxgenjs addImage (w/h without cover crop).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-fill"
        />
      )}
      {children}
    </div>
  );
}
