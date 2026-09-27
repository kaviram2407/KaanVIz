import { PlaceholderState } from "@/components/ui/placeholder-state";
import { HelpCircle } from "lucide-react";

export default function HelpPage() {
  return (
    <PlaceholderState
      title="Help & Documentation"
      description="Access KaanViz user guides, transformation tutorials, ECharts configuration guides, and AI query tips."
      icon={HelpCircle}
      targetPhase="Phase 1 Setup Foundation"
    />
  );
}
