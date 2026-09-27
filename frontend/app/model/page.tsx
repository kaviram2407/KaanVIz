import { PlaceholderState } from "@/components/ui/placeholder-state";
import { GitFork } from "lucide-react";

export default function ModelPage() {
  return (
    <PlaceholderState
      title="Data Modeling Workspace"
      description="Table relationship configuration, cardinality verification, key matching, and relationship validation."
      icon={GitFork}
      targetPhase="Phase 5 — Modeling"
    />
  );
}
