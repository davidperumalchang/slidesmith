import { PageHeader } from "@/components/ui";
import { MusicIcon } from "@/components/icons";
import { LyricsWorkflow } from "@/components/LyricsWorkflow";

export default function LyricsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<MusicIcon className="h-6 w-6" />}
        title="Lyrics"
        description="Turn song lyrics into PowerPoint slides or a ProPresenter 7 file."
      />
      <LyricsWorkflow />
    </div>
  );
}
