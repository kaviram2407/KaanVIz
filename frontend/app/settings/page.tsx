import { PlaceholderState } from "@/components/ui/placeholder-state";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <PlaceholderState
      title="Settings & Workspace Preferences"
      description="Configure workspace parameters, local storage paths, theme preferences, and AI provider toggles."
      icon={Settings}
      targetPhase="Phase 1 Setup Foundation / Phase 9 Production Hardening"
    />
  );
}
