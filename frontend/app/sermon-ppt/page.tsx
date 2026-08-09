import { PageHeader } from "@/components/ui";
import { BookIcon } from "@/components/icons";
import { SermonWorkflow } from "@/components/SermonWorkflow";

export default function SermonPptPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<BookIcon className="h-6 w-6" />}
        title="Sermon → PowerPoint"
        description="Extract Bible references, look up passages, and build a sermon PowerPoint deck."
      />
      <SermonWorkflow outputType="ppt" />
    </div>
  );
}
