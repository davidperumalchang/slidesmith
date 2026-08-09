import { PageHeader } from "@/components/ui";
import { ProjectorIcon } from "@/components/icons";
import { SermonWorkflow } from "@/components/SermonWorkflow";

export default function SermonPp7Page() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<ProjectorIcon className="h-6 w-6" />}
        title="Sermon → ProPresenter 7"
        description="Extract Bible references, look up passages, and build a sermon ProPresenter 7 file."
      />
      <SermonWorkflow outputType="pp7" />
    </div>
  );
}
