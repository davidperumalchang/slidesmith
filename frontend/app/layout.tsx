import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SlideSmith — Church Multimedia Automation",
  description:
    "Generate PowerPoint presentations and ProPresenter 7 files for lyrics and sermons.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
