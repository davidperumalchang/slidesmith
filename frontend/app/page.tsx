import Link from "next/link";
import { MusicIcon, BookIcon, ArrowRightIcon, SparklesIcon } from "@/components/icons";

const tools = [
  {
    href: "/lyrics",
    title: "Lyrics",
    description: "Turn song lyrics into presentation slides for your worship set.",
    icon: MusicIcon,
  },
  {
    href: "/sermon",
    title: "Sermon",
    description: "Extract Bible references, look up passages, and build sermon slides.",
    icon: BookIcon,
  },
];

const FORMATS = ["PowerPoint", "ProPresenter 7"];

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
          <SparklesIcon className="h-3.5 w-3.5" />
          Church multimedia automation
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Welcome to <span className="text-brand-600">SlideSmith</span>
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600">
          Generate PowerPoint presentations and ProPresenter&nbsp;7 files for your services in
          seconds. Pick a tool, then choose your output format.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group card p-6 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/30">
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{t.title}</h2>
              <p className="mt-1.5 text-sm text-slate-500">{t.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {FORMATS.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                  >
                    {f}
                  </span>
                ))}
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                Open tool
                <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-semibold">About ProPresenter 7 files</p>
        <p className="mt-1 text-amber-800">
          ProPresenter&nbsp;7 (.pro) generation relies on community reverse-engineered file
          definitions. These files are not created, endorsed or supported by Renewed Vision. Please
          do not contact them for support.
        </p>
      </div>
    </div>
  );
}
