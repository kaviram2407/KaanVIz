export type NavItem = {
  title: string;
  href: string;
  description?: string;
  badge?: string;
  isSecondary?: boolean;
};

export type PhaseStatus = "not_started" | "in_progress" | "completed";
