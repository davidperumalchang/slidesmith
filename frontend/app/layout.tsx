import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "SlideSmith — Church Multimedia Automation",
  description:
    "Generate PowerPoint presentations and ProPresenter 7 files for lyrics and sermons.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden">
            <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-12">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
