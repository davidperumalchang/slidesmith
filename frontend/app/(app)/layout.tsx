import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden pt-16 md:pt-0">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:py-12">{children}</div>
      </main>
    </div>
  );
}
