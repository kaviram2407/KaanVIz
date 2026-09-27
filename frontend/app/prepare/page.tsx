import { PlaceholderState } from "@/components/ui/placeholder-state";
import { Wrench } from "lucide-react";

export default function PreparePage() {
  return (
    <PlaceholderState
      title="Data Preparation & Profiling"
      description="Type inference, statistics, null handling, calculated columns, duplicate removal, and versioned Parquet storage."
      icon={Wrench}
      targetPhase="Phase 3 (Profiling) & Phase 4 (Preparation)"
    />
  );
}
