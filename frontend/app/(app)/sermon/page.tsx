"use client";

import { useState } from "react";
import { PageHeader, Card, Field, OutputFormatToggle, type OutputFormat } from "@/components/ui";
import { BookIcon } from "@/components/icons";
import { SermonWorkflow } from "@/components/SermonWorkflow";

export default function SermonPage() {
  const [output, setOutput] = useState<OutputFormat>("ppt");

  return (
    <div className="animate-fade-in">
      <PageHeader
        icon={<BookIcon className="h-6 w-6" />}
        title="Sermon"
        description="Extract references, look up passages, then generate a PowerPoint deck or a ProPresenter 7 file."
      />
      <div className="space-y-5">
        <Card>
          <Field label="Output format" hint="Choose what to generate. Your passages are kept if you switch.">
            <OutputFormatToggle value={output} onChange={setOutput} />
          </Field>
        </Card>
        <SermonWorkflow outputType={output} />
      </div>
    </div>
  );
}
